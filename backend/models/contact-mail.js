const mongoose = require("mongoose");

// Define the contact-mail schema
const ContactMailSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
});

// Create the model
const ContactMail = mongoose.model("ContactMail", ContactMailSchema);
module.exports = ContactMail;