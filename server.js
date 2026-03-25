const path = require("path");
const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "frontEnd")));

app.use("/backEnd", express.static(path.join(__dirname, "backEnd")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontEnd", "Plate.html"));
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
