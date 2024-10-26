const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const TravellerPost = require("./models/travellerPost");
const DeliveryPost = require("./models/Parcel.js");
const bcrypt = require("bcryptjs");
const methodOverride = require("method-override");
const User = require("./models/User");
const ContactMail = require("./models/contact-mail");
const passport = require("passport");
// Initialize the app
const app = express();
dotenv.config();
const saltRounds = 10;

require("./config/passport");

// Connect to the database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(
  session({
    secret: "pame",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true when using HTTPS
  })
);

// Set view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from public folder
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/fonts",
  express.static(path.join(__dirname, "node_modules/font-awesome/fonts"))
);
app.use(
  "/css",
  express.static(path.join(__dirname, "node_modules/font-awesome/css"))
);

// Routes
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const messageRoute = require("./routes/messages");
const parcelRoute = require("./routes/parcelRoute");

app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);
app.use("/api/messages", messageRoute);
app.use("/api/parcel", parcelRoute);
app.use(authRoute);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  if (req.session.user) {
    res.locals.user = req.session.user;
  } else {
    res.locals.user = null;
  }
  next();
});

function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect("/login"); // Redirect to login if not authenticated
}

// Serve the homepage
app.get("/", (req, res) => {
  const user = req.session.user;
  res.render("index", { user });
});

// Serve the login page
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/information", (req, res) => {
  const user = req.session.user;
  res.render("information.ejs", { user });
});

app.get("/dashboard", async (req, res) => {
  try {
    // Check if the user is logged in
    if (!req.session.user) {
      return res.redirect("/login"); // Redirect to login if not logged in
    }

    const posts = await DeliveryPost.find({ userId: req.session.user.id });
    // console.log(posts);

    // Render the dashboard and pass both user and posts data
    res.render("dashboard", { user: req.session.user, posts });
  } catch (err) {
    console.error(err);
    res.redirect("/login");
  }
});

// Example: Fetch posts by type
app.get("/posts/:type", async (req, res) => {
  try {
    const postType = req.params.type;
    // const userId = req.session.userId;

    const username = req.session.user.username;
    let posts;

    if (postType === "senderPost") {
      posts = await DeliveryPost.find({ username });
    } else if (postType === "travellerPost") {
      posts = await TravellerPost.find({ username });
    } else {
      return res.status(400).send("Invalid post type");
    }

    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).send("Server error");
  }
});

app.post("/submit-travel-post", async (req, res) => {
  try {
    // Destructure the data from the request body
    const {
      modeOfTravel,
      source,
      destination,
      expectedTime,
      parcelSizeCanCarry,
      expectedAmount,
      additionalDetails,
      busRouteDetails,
      trainTicketDetails,
      flightDetails,
      carDetails,
      bikeDetails,
      userId,
      username,
      email,
      agreeTerms, // Get the checkbox value here
    } = req.body;

    // Input validation
    if (
      !modeOfTravel ||
      !source ||
      !destination ||
      !expectedTime ||
      !parcelSizeCanCarry ||
      !expectedAmount
    ) {
      return res.status(400).render({
        error: "All fields except additional details are required.",
      });
    }

    // Convert agreeTerms to boolean (true if checked, false otherwise)
    const termsAgreed = agreeTerms === "on"; // 'on' means the checkbox is checked

    // Create a new travel post
    const newPost = new TravellerPost({
      modeOfTravel,
      source,
      destination,
      expectedTime,
      parcelSize: parcelSizeCanCarry,
      expectedAmount,
      additionalDetails,
      agreeTerms: termsAgreed, // Use the boolean value here
      busRouteDetails,
      trainTicketDetails,
      flightDetails,
      carDetails,
      bikeDetails,
      userId,
      username,
      email,
    });

    // Save the new post to the database
    await newPost.save();

    // Respond with success
    res.status(201).redirect("/dashboard");
  } catch (error) {
    console.error("Error creating travel post:", error);
    res.status(500).send({ error: "Internal server error." });
  }
});

// -----------------------------------------------------------------------------------

app.get("/contact", (req, res) => {
  const user = req.session.user;
  res.render("contactUs.ejs", { user });
});

app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const newContact = new ContactMail({ name, email, message });
    await newContact.save();
    res.redirect("/?message=success");
  } catch (error) {
    res.redirect("/?message=error");
  }
});

// Serve individual post page
app.get("/posts/:id", (req, res) => {
  const postId = req.params.id;
  const mockPostData = {
    title: "Post Title",
    description: "Detailed description",
  }; // Replace with real data
  res.render("post", { post: mockPostData });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/register-parcel", (req, res) => {
  const user = req.session.user;
  // console.log(user);
  res.render("registerParcel.ejs", { user, error: null });
});

app.get("/travellerPost", (req, res) => {
  const user = req.session.user;
  // console.log(user);
  res.render("travellerPostForm.ejs", { user, error: null });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      return res.redirect("/dashboard"); // Redirect to dashboard on error
    }
    res.clearCookie("connect.sid"); // Clear cookie
    res.redirect("/"); // Redirect to homepage after logout
  });
});

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      return res.redirect("/dashboard"); // Redirect to dashboard on error
    }
    res.clearCookie("connect.sid"); // Clear cookie
    res.redirect("/"); // Redirect to homepage after logout
  });
});

app.post("/sender-post", async (req, res) => {
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
  // console.log(userId, username, email);

  try {
    const newPost = new DeliveryPost({
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
    });

    await newPost.save();
    res.status(200).redirect("/dashboard");
  } catch (error) {
    res.status(500).send("Error creating post: " + error.message);
  }
});

// Route to get all delivery posts
app.get("/MyPosts", (req, res) => {
  DeliveryPost.find()
    .then((posts) => {
      res.render("/MyPosts", { posts }); // Render a view called 'posts' and pass the posts data
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error retrieving posts");
    });
});

app.delete("/travellerPost/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id; // Ensure that user ID is available in session

    // Find the post with the matching user ID and post ID
    const post = await TravellerPost.findOne({ _id: id, userId: userId });

    if (!post) {
      return res
        .status(404)
        .json({ error: "No post found or permission denied." });
    }

    // Delete the post
    await TravellerPost.deleteOne({ _id: id });
    return res.status(200).send({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(`Error deleting post: ${error.message}`);
    res
      .status(500)
      .json({ error: "An error occurred while trying to delete the post." });
  }
});

app.get("/travellerPost/:id/editForm", async (req, res) => {
  const { id } = req.params;
  // console.log(id);

  try {
    // Retrieve the post from the database by its ID and make sure it belongs to the logged-in user
    const post = await TravellerPost.findOne({
      _id: id,
      userId: req.session.user.id,
    });
    const postType = "travellerPost";

    if (!post) {
      return res
        .status(404)
        .send(
          "Post not found or you do not have permission to edit this post."
        );
    }

    // Render the edit form with the post data
    res.render("travellerEditForm", { post, postType });
  } catch (error) {
    console.error(`Error retrieving post for edit: ${error.message}`);
    res
      .status(500)
      .send("An error occurred while fetching the post for editing.");
  }
});

app.patch("/travellerPost/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body; // Data from the form

    // Find and update the post
    const post = await TravellerPost.findOneAndUpdate(
      { _id: id, userId: req.session.user.id }, // Ensure the post belongs to the logged-in user
      { $set: updatedData }, // Update the fields with form data
      { new: true } // Return the updated document
    );

    if (!post) {
      return res
        .status(404)
        .send(
          "Post not found or you do not have permission to update this post."
        );
    }

    res.redirect("/dashboard"); // Redirect to the dashboard or a confirmation page
  } catch (error) {
    console.error(`Error updating post: ${error.message}`);
    res.status(500).send("An error occurred while updating the post.");
  }
});

app.delete("/senderPost/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id; // Ensure that user ID is available in session

    // Find the post with the matching user ID and post ID
    const post = await DeliveryPost.findOne({ _id: id, userId: userId });

    if (!post) {
      return res
        .status(404)
        .json({ error: "No post found or permission denied." });
    }

    // Delete the post
    await DeliveryPost.deleteOne({ _id: id });
    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(`Error deleting post: ${error.message}`);
    res
      .status(500)
      .json({ error: "An error occurred while trying to delete the post." });
  }
});

app.get("/senderPost/:id/editForm", async (req, res) => {
  const { id } = req.params;
  // console.log(id);

  try {
    // Retrieve the post from the database by its ID and make sure it belongs to the logged-in user
    const post = await DeliveryPost.findOne({
      _id: id,
      userId: req.session.user.id,
    });
    const postType = "senderPost";

    if (!post) {
      return res
        .status(404)
        .send(
          "Post not found or you do not have permission to edit this post."
        );
    }

    // Render the edit form with the post data
    res.render("editForm", { post, postType });
  } catch (error) {
    console.error(`Error retrieving post for edit: ${error.message}`);
    res
      .status(500)
      .send("An error occurred while fetching the post for editing.");
  }
});

app.patch("/senderPost/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body; // Data from the form

    // Find and update the post
    const post = await DeliveryPost.findOneAndUpdate(
      { _id: id, userId: req.session.user.id }, // Ensure the post belongs to the logged-in user
      { $set: updatedData }, // Update the fields with form data
      { new: true } // Return the updated document
    );

    if (!post) {
      return res
        .status(404)
        .send(
          "Post not found or you do not have permission to update this post."
        );
    }

    res.redirect("/dashboard"); // Redirect to the dashboard or a confirmation page
  } catch (error) {
    console.error(`Error updating post: ${error.message}`);
    res.status(500).send("An error occurred while updating the post.");
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
