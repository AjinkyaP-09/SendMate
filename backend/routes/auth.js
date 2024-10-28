const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const saltRounds = 10;
const passport = require("passport");
const router = express.Router();

// Password validation function
const passwordValidation = (password) => {
  const minLength = 8;
  const maxLength = 20;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigits = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*]/.test(password);

  return (
    password.length >= minLength &&
    password.length <= maxLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasDigits &&
    hasSpecialChars
  );
};

// Register User Route
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.redirect("/register?error=User already exists");
    }

    if (!passwordValidation(password)) {
      return res.redirect(
        "/register?error=Password must be between 8 and 20 characters and include at least one uppercase letter, one lowercase letter, one digit, and one special character."
      );
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    user = new User({
      username,
      email,
      password: hashedPassword,
    });
    await user.save();

    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
    };

    res.redirect("/login");
  } catch (err) {
    console.error("Registration Error:", err);
    res.redirect("/register?error=Something went wrong. Please try again.");
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.redirect("/login?error=Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      req.session.user = {
        id: user._id,
        username: user.username,
        email: user.email,
      };
      res.redirect("/home");
    } else {
      return res.redirect("/login?error=Invalid email or password");
    }
  } catch (err) {
    console.error("Login Error:", err);
    res.redirect("/login?error=Something went wrong. Please try again.");
  }
});

// Google Authentication Route
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    try {
      const userProfile = req.user.toObject(); // Convert Mongoose document to plain object
      const { username, email, googleId } = userProfile;

      if (!email) {
        console.log("No email found, redirecting to login.");
        return res.redirect("/login?error=No email found from Google.");
      }

      let existingUser = await User.findOne({ email });
      if (!existingUser) {
        existingUser = new User({ googleId, username, email });
        await existingUser.save();
        console.log("New user created:", existingUser);
      } else {
        console.log("Existing user found:", existingUser);
      }

      req.session.user = {
        id: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
      };
      console.log("Session user data set:", req.session.user);

      res.redirect("/home");
    } catch (error) {
      console.error("Error during Google login callback:", error);
      res.redirect("/login?error=Google login failed. Please try again.");
    }
  }
);


// Logout Route
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.redirect("/home");
    }
    res.redirect("/");
  });
});

module.exports = router;
