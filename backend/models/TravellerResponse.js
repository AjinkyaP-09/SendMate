const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "postType", // dynamic reference
  },
  postType: {
    type: String,
    required: true,
    enum: ["senderPost", "travellerPost"], // or your collection names
  },
  travellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // assuming you have a User model
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  estimatedDelivery: {
    type: Date,
    required: true,
  },
  priceOffer: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Response", responseSchema);
