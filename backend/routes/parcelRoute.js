const express = require("express");
const Parcel = require("../models/Parcel"); // Make sure this points to your Parcel model
const router = express.Router();

// Render the parcel registration page
router.get("/registerParcel", (req, res) => {
  res.render("registerParcel.ejs", { error: null }); // Pass null initially for error
});

// Handle parcel registration
router.post("/registerParcel", async (req, res) => {
  const {
    senderName,
    senderEmail,
    weight,
    dimensions,
    destination,
    specialInstructions,
  } = req.body;
  try {
    const newParcel = new Parcel({
      senderName,
      senderEmail,
      weight,
      dimensions,
      destination,
      specialInstructions,
    });
    await newParcel.save();
    res.redirect("/success"); // Redirect to a success page after registration
  } catch (err) {
    console.error(err);
    // Pass the error message to the view
    res.render("registerParcel", {
      error: "Error registering the parcel. Please try again.",
    });
  }
});

module.exports = router;
