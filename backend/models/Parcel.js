const mongoose = require("mongoose");

const parcelSchema = new mongoose.Schema({
  senderName: { type: String, required: true },
  senderEmail: { type: String, required: true },
  weight: { type: Number, required: true },
  dimensions: { type: String, required: true },
  destination: { type: String, required: true },
  specialInstructions: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Parcel", parcelSchema);
