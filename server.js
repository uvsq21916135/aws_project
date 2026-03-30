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
const uri = "mongodb://thibault971:kyrCo4-gibseg-nebsoh@ac-ggrzodb-shard-00-00.gpzde5z.mongodb.net:27017,ac-ggrzodb-shard-00-01.gpzde5z.mongodb.net:27017,ac-ggrzodb-shard-00-02.gpzde5z.mongodb.net:27017/?ssl=true&replicaSet=atlas-juz2qs-shard-0&authSource=admin&appName=AWS";

mongoose.connect(uri)
    .then(() => {
        console.log("Connected to MongoDB");
    }).catch((err) => {
        console.log(err);
    });

app.use(express.static(path.join(__dirname, "frontEnd")));

app.use("/backEnd", express.static(path.join(__dirname, "backEnd")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontEnd", "Plate.html"));
});

app.post("/api/register", async (req, res) => {
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
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

app.post("/api/login", async (req, res) => {
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

const DamesPointcom = https.createServer(credentials, app);

DamesPointcom.listen(PORT, () => {
    console.log(`https server started on port ${PORT}`);
});

const wss = new WebSocket.Server({ server: DamesPointcom });
wss.on("connection", (ws) => {
    console.log("Bienvenue sur DamesPoint.com");
});
