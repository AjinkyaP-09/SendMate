const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const passport = require('passport');
const router = express.Router();

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
// Register User Route
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

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
      password: hashedPassword, // Store the hashed password
    });
    // Save user to the database
    await user.save();

    // Store user data in session
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
    };

    res.redirect("/login"); // Redirect to login after successful registration
  } catch (err) {
    console.error("Registration Error:", err);
    res.redirect("/register?error=Something went wrong. Please try again.");
  }
});


//Hashing Of Password is done

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    req.session.userId = user._id;

    if (!user) {
      return res.render("login", { error: "Invalid email or password." });
    }

    // Compare the plain-text password with the hashed password from the database
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // Passwords match, store user data in session
      req.session.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        // role: user.role,
      };
      res.redirect("/dashboard"); // Redirect to the dashboard on success
    } else {
      // Passwords do not match
      return res.render("login", { error: "Invalid email or password." });
    }
  } catch (err) {
    console.error("Login Error:", err);
    res.render("login", { error: "Something went wrong. Please try again." });
  }
});

  
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
      try {
          console.log(req.user); // Log user info for debugging

          // Directly access the email property instead of the array
          const displayName = req.user.displayName;
          const email = req.user.email; // Change this line to access the email directly

          if (!email) {
              return res.status(400).send("No email found.");
          }

          // Check if user exists by email
          let existingUser = await User.findOne({ email });

          if (!existingUser) {
              // Create a new user if not found
              existingUser = new User({
                  googleId: req.user.id,
                  username: displayName,
                  email: email,
              });
              await existingUser.save();
          }

          // Store user data in session
          req.session.user = {
              id: existingUser._id,
              username: existingUser.username,
              email: existingUser.email,
          };

          // Redirect to dashboard
          res.redirect('/dashboard');
      } catch (error) {
          console.error("Error during Google login callback:", error);
          res.redirect('/login'); // Redirect to login in case of error
      }
  }
);



router.get('/logout', (req, res) => {
  req.session.destroy(err => {
      if (err) {
          console.error("Logout error:", err);
          return res.redirect('/dashboard'); // Redirect to dashboard if logout fails
      }
      res.redirect('/'); // Redirect to homepage after successful logout
  });
});


module.exports = router;
