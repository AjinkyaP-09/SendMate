const mongoose = require("mongoose");

const deliveryPostSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  productName: { type: String, required: true },
  productWeight: { type: Number, required: true },
  length: { type: Number, required: true },
  breadth: { type: Number, required: true },
  height: { type: Number, required: true },
  isFragile: { type: String, required: true },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  receiverDetails: { type: String, required: true },
  expectedTime: { type: Date, required: true },
  paymentMin: { type: Number, required: true },
  paymentMax: { type: Number, required: true },
  category: { type: String, required: true },
  additionalDetails: { type: String },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  imageUrl: { type: String, required: false },
  postType: { type: String, default: "senderPost" },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
});

module.exports = mongoose.model("DeliveryPost", deliveryPostSchema);
