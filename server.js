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
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const { isValidMove, isAEatMove, hasPossibleJump, hasPossibleMove, arrivingAtLastRow } = require("./backEnd/rules");
const { removePiece, becomeEldenLord } = require("./backEnd/utils");

const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 tentatives max
    message: { error: "Trop de tentatives. Veuillez réessayer plus tard." }
});

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

app.post("/register", authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: "Format invalide" });
        }
        if (username.length > 20 || password.length > 100) {
            return res.status(400).json({ error: "Pseudo ou mot de passe trop long" });
        }

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

app.post("/login", authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: "Format invalide" });
        }
        if (username.length > 20 || password.length > 100) {
            return res.status(400).json({ error: "Pseudo ou mot de passe erroné" }); // On ne dit pas "trop long" pour ne pas aider le pirate
        }

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(400).json({ error: "Utilisateur ou mot de passe incorrect" });
        }

        const isMatch = await user.verifyPassword(password);

        if (!isMatch) {
            return res.status(400).json({ error: "Utilisateur ou mot de passe incorrect" });
        }

        const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: "4h" });

        res.status(200).json({ message: "Connexion réussie", username: user.username, token });
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
const activeGames = new Map();

function createInitialBoard() {
    let b = Array(10).fill(0).map(() => Array(10).fill(0));
    for (let r=0; r<4; r++) for(let c=0; c<10; c++) if((r+c)%2!==0) b[r][c] = 2;
    for (let r=6; r<10; r++) for(let c=0; c<10; c++) if((r+c)%2!==0) b[r][c] = 1;
    return b;
}

async function finalizeGame(winnerName, loserName) {
    try {
        const winner = await User.findOne({ username: winnerName });
        const loser = await User.findOne({ username: loserName });
        if (winner && loser) {
            winner.wins += 1;
            loser.losses += 1;
            winner.ratio = winner.wins / (winner.wins + loser.losses);
            loser.ratio = loser.losses / (winner.wins + loser.losses);
            await winner.save();
            await loser.save();
            const w1 = onlinePlayers.get(winnerName);
            if (w1) w1.opponentUsername = null;
            const w2 = onlinePlayers.get(loserName);
            if (w2) w2.opponentUsername = null;
        }
    } catch(e) {}
}

wss.on("connection", (ws) => {
    //debug
    //console.log("Bienvenue sur DamesPoint.com");

    ws.on("message", async (message) => {
        const data = JSON.parse(message);
        
        if (data.type === "IDENTIFY") {
            try {
                if (!data.token) throw new Error("Jeton manquant");
                
                const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
                if (decoded.username !== data.username) throw new Error("Usurpation de Pseudo bloquée");

                onlinePlayers.set(data.username, ws);
                ws.myUsername = data.username;
            } catch (err) {
                console.error("Alerte de Sécurité WebSockets:", err.message);
                ws.close();
            }

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
                ws.opponentUsername = data.to;
                opponentWs.opponentUsername = data.from;
                
                const gameId = [data.from, data.to].sort().join('-');
                activeGames.set(gameId, {
                    player1: data.to,
                    player2: data.from,
                    board: createInitialBoard(),
                    currentPlayer: 1,
                    currentRaflePiece: null
                });

                opponentWs.send(JSON.stringify({ type: "CHALLENGE_ACCEPTED", from: data.from }));

                ws.send(JSON.stringify({ type: "GAME_START", role: 2, opponent: data.to }));
                opponentWs.send(JSON.stringify({ type: "GAME_START", role: 1, opponent: data.from }));
            }

        } else if (data.type === "DECLINE_CHALLENGE") {
            const opponentWs = onlinePlayers.get(data.to);
            if (opponentWs) opponentWs.send(JSON.stringify({ type: "CHALLENGE_DECLINED", from: data.from }));

        } else if (data.type === "MOVE") {
            const opponentWs = onlinePlayers.get(data.to);
            if (!opponentWs) return;

            const gameId = [ws.myUsername, data.to].sort().join('-');
            const game = activeGames.get(gameId);
            if (!game) return;

            const playerRole = (game.player1 === ws.myUsername) ? 1 : 2;
            
            // ANTI CHEAT 1: Tour du joueur ?
            if (game.currentPlayer !== playerRole) return;

            // ANTI CHEAT 2: Mouvement impossible selon les règles ?
            if (!isValidMove(game.board, data.startRow, data.startCol, data.endRow, data.endCol, playerRole, game.currentRaflePiece)) {
                return;
            }

            // Exécution du coup validé
            const piece = game.board[data.startRow][data.startCol];
            game.board[data.startRow][data.startCol] = 0;
            game.board[data.endRow][data.endCol] = piece;

            let eatMove = isAEatMove(game.board, data.startRow, data.startCol, data.endRow, data.endCol, playerRole);
            if (eatMove) {
                removePiece(game.board, eatMove.row, eatMove.col);
                game.currentRaflePiece = { row: data.endRow, col: data.endCol };
                if (!hasPossibleJump(game.board, playerRole, data.endRow, data.endCol)) {
                    game.currentRaflePiece = null;
                }
            } else {
                game.currentRaflePiece = null;
            }

            if (arrivingAtLastRow(data.endRow, playerRole)) {
                becomeEldenLord(game.board, data.endRow, data.endCol, playerRole);
                game.currentRaflePiece = null;
            }

            if (!game.currentRaflePiece) {
                game.currentPlayer = (game.currentPlayer === 1) ? 2 : 1;
            }

            opponentWs.send(JSON.stringify({
                type: "OPPONENT_MOVE",
                startRow: data.startRow,
                startCol: data.startCol,
                endRow: data.endRow,
                endCol: data.endCol
            }));

            // Auto-check Fin de Partie
            if (!hasPossibleMove(game.board, game.currentPlayer)) {
                const winnerRole = (game.currentPlayer === 1) ? 2 : 1;
                const winnerName = (winnerRole === 1) ? game.player1 : game.player2;
                const loserName = (winnerRole === 1) ? game.player2 : game.player1;
                await finalizeGame(winnerName, loserName);
                activeGames.delete(gameId);
            }
            
        } else if (data.type === "GAME_OVER") {
            // ANTI CHEAT 3: Usurpation de victoire
            if (data.loserUsername !== ws.myUsername) return; // Le joueur qui abandonne doit être le joueur actuel
            
            const gameId = [data.winnerUsername, data.loserUsername].sort().join('-');
            if (activeGames.has(gameId)) {
                await finalizeGame(data.winnerUsername, data.loserUsername);
                activeGames.delete(gameId);
            }

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
                
                const gameId = [ws.myUsername, ws.opponentUsername].sort().join('-');
                if (activeGames.has(gameId)) {
                    await finalizeGame(ws.opponentUsername, ws.myUsername);
                    activeGames.delete(gameId);
                }
                await updatePlayerStats(ws.opponentUsername, ws.myUsername);
            }
        }
    });
});
