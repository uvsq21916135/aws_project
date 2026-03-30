const mongoose = require("mongoose");
const argon2 = require("argon2");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    ratio: { type: Number, default: 0 },
});

userSchema.pre("save", async function () {
    if (this.isModified("password")) {
        this.password = await argon2.hash(this.password);
    }
});

userSchema.methods.verifyPassword = async function (password) {
    return await argon2.verify(this.password, password);
};

module.exports = mongoose.model("User", userSchema);