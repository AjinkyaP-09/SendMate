const mongoose = require("mongoose");

const travellerPostSchema = new mongoose.Schema({
  modeOfTravel: {
    type: String,
    required: true,
    enum: ["Bus", "Train", "Airplane", "Car", "Bike", "Other"], // Updated "Flight" to "Airplane" to match your form
    trim: true,
  },
  source: {
    type: String,
    required: true,
    trim: true,
  },
  destination: {
    type: String,
    required: true,
    trim: true,
  },
  expectedTime: {
    type: Date,
    required: true,
  },
  parcelSize: {
    type: String,
    required: true,
    enum: ["Small", "Medium", "Large", "Extra Large"],
    trim: true,
  },
  busRouteDetails: {
    type: String,
    trim: true,
    default: "",
  },
  trainTicketDetails: {
    type: String,
    trim: true,
    default: "",
  },
  flightDetails: {
    // Added for airplane travel
    type: String,
    trim: true,
    default: "",
  },
  carDetails: {
    // Added for car travel
    type: String,
    trim: true,
    default: "",
  },
  bikeDetails: {
    // Added for bike travel
    type: String,
    trim: true,
    default: "",
  },
  expectedAmount: {
    type: Number,
    required: true,
  },
  additionalDetails: {
    type: String,
    trim: true,
  },
  agreeTerms: {
    type: Boolean,
    required: true,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true, // Ensure the email is stored in lowercase
  },
  postType: { type: String, default: "travellerPost" },
  createdAt: { type: Date, default: Date.now },
});

const TravellerPost = mongoose.model("TravellerPost", travellerPostSchema);

module.exports = TravellerPost;
