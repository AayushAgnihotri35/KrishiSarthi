const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { 
    type: String,
    match: /^[0-9]{10}$/,
    sparse: true // allows null/undefined values
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);