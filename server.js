require("dotenv").config();
const express = require("express");
const app = express();

const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 3000;
const http = require("http");
const https = require("https");
const User = require("./backEnd/models/user");

app.use(express.json());

let credentials;
try {
    const privateKey = fs.readFileSync("key.pem");
    const certificate = fs.readFileSync("cert.pem");
    credentials = { key: privateKey, cert: certificate };
} catch (e) {
    console.log("Aucun certificat SSL trouvé (normal si hébergé sur Render). Serveur configuré en HTTP.");
}

const uri = process.env.MONGO_URI;

async function updatePlayerStats(winnerUsername, loserUsername) {
    try {
        const winner = await User.findOne({ username: winnerUsername });
        const loser = await User.findOne({ username: loserUsername });
        if (winner && loser) {
            winner.wins += 1;
            loser.losses += 1;
            winner.ratio = winner.wins / (winner.wins + winner.losses);
            loser.ratio = loser.wins / (loser.wins + loser.losses);
            await winner.save();
            await loser.save();
        }
    } catch (e) {
        console.error("Erreur stats:", e);
    }
}

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

const DamesPointcom = credentials ? https.createServer(credentials, app) : http.createServer(app);

DamesPointcom.listen(PORT, () => {
    console.log(`Server started on port ${PORT} (${credentials ? "HTTPS" : "HTTP"})`);
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
            await updatePlayerStats(data.winnerUsername, data.loserUsername);
            
            ws.opponentUsername = null;
            const winnerWs = onlinePlayers.get(data.winnerUsername);
            if (winnerWs) {
                winnerWs.send(JSON.stringify({ type: "OPPONENT_QUIT" }));
                winnerWs.opponentUsername = null;
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
                
                await updatePlayerStats(ws.opponentUsername, ws.myUsername);
            }
        }
    });
});
