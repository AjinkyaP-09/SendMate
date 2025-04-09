const express = require("express");
const Parcel = require("../models/Parcel"); // Make sure this points to your Parcel model
const router = express.Router();
const upload = require("../middleware/uploads3"); // <-- your multer-s3 middleware

// Render the parcel registration page
router.get("/registerParcel", (req, res) => {
  res.render("registerParcel.ejs", { error: null, user: req.user  }); // Pass null initially for error
});

// Handle parcel registration
router.post("/registerParcel", upload.single('imageupload'), async (req, res) => {
  const {
    productName,
    productWeight,
    length,
    breadth,
    height,
    isFragile,
    source,
    destination,
    receiverDetails,
    expectedTime,
    paymentMin,
    paymentMax,
    category,
    additionalDetails,
    userId,
    username,
    email,
  } = req.body;
  try {
    console.log("Received form data:", req.body);
    console.log("Uploaded file:", req.file);
    const imageUrl = req.file?.location || null;

    const newParcel = new Parcel({
      productName,
      productWeight,
      length,
      breadth,
      height,
      isFragile,
      source,
      destination,
      receiverDetails,
      expectedTime,
      paymentMin,
      paymentMax,
      category,
      additionalDetails,
      userId,
      username,
      email,
      imageUrl,
    });

    console.log("Saving parcel:", newParcel);

    await newParcel.save();

    console.log("Parcel saved successfully");

    res.redirect("/dashboard"); // Redirect to a success page after registration
  } catch (err) {
    console.error("❌ Parcel creation error:",err);

    res.status(500).send("❌ Error creating post: " + err.message);
    console.log("req.file = ", req.file);

    // Pass the error message to the view
    res.render("registerParcel", {
      error: "Error registering the parcel. Please try again.",
      user: req.user,
    });
  }
});

module.exports = router;
