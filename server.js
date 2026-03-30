const path = require("path");
const express = require("express");
const fs = require("fs");
const app = express();
const mongoose = require("mongoose");

const PORT = 3000;
const https = require("https");

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

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(PORT, () => {
    console.log(`https server started on port ${PORT}`);
});
