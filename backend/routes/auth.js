const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');


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
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Check if the user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.render('/login', { error: 'User already exists' });
        }

        if (!passwordValidation(password)) {
            return res.render('register', {
                error: 'Password must be between 8 and 20 characters and include at least one uppercase letter, one lowercase letter, one digit, and one special character.',
            });
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

        res.redirect('/login'); // Redirect to login after successful registration
    } catch (err) {
        console.error("Registration Error:", err);
        res.render('register', { error: 'Something went wrong. Please try again.' });
    }
});

//Hashing Of Password is done

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

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

  


module.exports = router;
