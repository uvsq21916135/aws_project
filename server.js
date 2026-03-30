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
const uri = "mongodb+srv://tibo:rigwi0-dArzoq-nigbyr@aws.gpzde5z.mongodb.net/?appName=AWS";

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

    ws.on("message", (message) => {
        const data = JSON.parse(message);
        if (data.type === "IDENTIFY") {
            onlinePlayers.set(data.username, ws);

            //debug
            //console.log("Joueur connecté : ", data.username);

        }
    });
});
