const mongoose = require("mongoose");

// models/Message.js
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPost' },
  message: String,
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }  // ← NEW
});



const Message = mongoose.model("Message", messageSchema)

module.exports= Message;
