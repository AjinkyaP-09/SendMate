const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
  message: { type: String, required: true },
  postDetails: { type: Object, required: false }, // New field for post details
  createdAt: { type: Date, default: Date.now },
});


const Message = mongoose.model("Message", messageSchema)

module.exports= Message;
