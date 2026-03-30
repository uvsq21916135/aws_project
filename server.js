const path = require("path");
const express = require("express");
const fs = require("fs");
const app = express();

const PORT = 3000;
const https = require("https");

const privateKey = fs.readFileSync("key.pem");
const certificate = fs.readFileSync("cert.pem");

const credentials = { key: privateKey, cert: certificate };

app.use(express.static(path.join(__dirname, "frontEnd")));

app.use("/backEnd", express.static(path.join(__dirname, "backEnd")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontEnd", "Plate.html"));
});

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(PORT, () => {
    console.log(`https server started on port ${PORT}`);
});
