require("dotenv").config();
const express = require("express");
const app = express();

const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const PORT = 3000;
const https = require("https");
const User = require("./backEnd/models/user");

app.use(express.json());

const privateKey = fs.readFileSync("key.pem");
const certificate = fs.readFileSync("cert.pem");

const credentials = { key: privateKey, cert: certificate };
const uri = process.env.MONGO_URI;

mongoose.connect(uri)
    .then(() => {
        console.log("Connected to MongoDB");
    }).catch((err) => {
        console.log(err);
    });

app.use(express.static(path.join(__dirname, "frontEnd")));

app.use("/backEnd", express.static(path.join(__dirname, "backEnd")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontEnd", "lobby.html"));
});

app.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(400).json({ error: "Cet utilisateur existe déjà" });
        }

        const user = new User({ username, password });
        await user.save();
        res.status(201).json({ message: "Utilisateur créé avec succès" });

    } catch (error) {
        console.error("Erreur Inscription:", error);
        res.status(500).json({ error: error.message || "Erreur interne du serveur" });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(400).json({ error: "Utilisateur ou mot de passe incorrect" });
        }

        const isMatch = await user.verifyPassword(password);

        if (!isMatch) {
            return res.status(400).json({ error: "Utilisateur ou mot de passe incorrect" });
        }

        res.status(200).json({ message: "Connexion réussie", username: user.username });
    } catch (error) {
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

app.get("/users", async (req, res) => {
    try {
        const users = await User.find({}).select("username wins losses ratio");
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

const DamesPointcom = https.createServer(credentials, app);

DamesPointcom.listen(PORT, () => {
    console.log(`https server started on port ${PORT}`);
});

const wss = new WebSocket.Server({ server: DamesPointcom });
const onlinePlayers = new Map();

wss.on("connection", (ws) => {
    //debug
    //console.log("Bienvenue sur DamesPoint.com");

    ws.on("message", async (message) => {
        const data = JSON.parse(message);
        
        if (data.type === "IDENTIFY") {
            onlinePlayers.set(data.username, ws);
            ws.myUsername = data.username;

            //debug
            //console.log("Joueur connecté : ", data.username);

        } else if (data.type === "CHALLENGE") {
            const targetWs = onlinePlayers.get(data.to);

            if (targetWs) {
                targetWs.send(JSON.stringify({ type: "INCOMING_CHALLENGE",from: data.from }));
            }

        } else if (data.type === "ACCEPT_CHALLENGE") {
            const opponentWs = onlinePlayers.get(data.to);

            if (opponentWs) {
                opponentWs.send(JSON.stringify({ type: "CHALLENGE_ACCEPTED", from: data.from }));

                ws.send(JSON.stringify({ type: "GAME_START", role: 2, opponent: data.to }));
                opponentWs.send(JSON.stringify({ type: "GAME_START", role: 1, opponent: data.from }));
            }

        } else if (data.type === "DECLINE_CHALLENGE") {
            const opponentWs = onlinePlayers.get(data.to);

            if (opponentWs) {
                opponentWs.send(JSON.stringify({ type: "CHALLENGE_DECLINED", from: data.from }));
            }

        } else if (data.type === "MOVE") {
            const opponentWs = onlinePlayers.get(data.to);

            if (opponentWs) {
                opponentWs.send(JSON.stringify({
                    type: "OPPONENT_MOVE",
                    startRow: data.startRow,
                    startCol: data.startCol,
                    endRow: data.endRow,
                    endCol: data.endCol
                }));
            }
            
        } else if (data.type === "GAME_OVER") {
            try {
                const winner = await User.findOne({ username: data.winnerUsername });
                const loser = await User.findOne({ username: data.loserUsername });
                
                if (winner && loser) {
                    winner.wins += 1;
                    loser.losses += 1;
                    
                    winner.ratio = winner.wins / (winner.wins + loser.losses);
                    loser.ratio = loser.losses / (winner.wins + loser.losses);
                    
                    await winner.save();
                    await loser.save();
                    
                    ws.opponentUsername = null;
                    const opponentWs = onlinePlayers.get(data.loserUsername) || onlinePlayers.get(data.winnerUsername);
                    if (opponentWs) opponentWs.opponentUsername = null;
                }
            } catch (err) {
                console.error("Erreur mise à jour score:", err);
            }
        }
    });

    ws.on("close", async () => {
        if (ws.myUsername) {
            onlinePlayers.delete(ws.myUsername);
            
            if (ws.opponentUsername) {
                const opponentWs = onlinePlayers.get(ws.opponentUsername);
                if (opponentWs) {
                    opponentWs.send(JSON.stringify({ type: "OPPONENT_QUIT" }));
                    opponentWs.opponentUsername = null;
                }
                
                try {
                    const loser = await User.findOne({ username: ws.myUsername });
                    const winner = await User.findOne({ username: ws.opponentUsername });
                    if (winner && loser) {
                        winner.wins += 1;
                        loser.losses += 1;
                        winner.ratio = winner.wins / (winner.wins + loser.losses);
                        loser.ratio = loser.losses / (winner.wins + loser.losses);
                        await winner.save();
                        await loser.save();
                    }
                } catch (e) {
                    console.error("Erreur forfait:", e);
                }
            }
        }
    });
});
