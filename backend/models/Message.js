const mongoose = require("mongoose");

// models/Message.js
const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  encryptedMessage: { type: String, required: true },
  iv: { type: String, required: true }, // store IV for decryption
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }, // ← NEW
});



const Message = mongoose.model("Message", messageSchema)

module.exports= Message;
