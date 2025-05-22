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
const http = require("http");
const socketio = require("socket.io");

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

const server = http.createServer(app);
const io = socketio(server);

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
const TravellerResponse = require("./models/TravellerResponse.js");
const Message = require("./models/Message.js");

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

//Websocket Connection
io.on("connection", (socket) => {
  console.log("A user connected");

  // User joins their private room by userId string
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their private room`);
  });

  // Listen for chat messages from clients
  socket.on("chatMessage", async (data) => {
    try {
      // Convert to ObjectId if needed
      const senderId = mongoose.Types.ObjectId(data.senderId);
      const receiverId = mongoose.Types.ObjectId(data.receiverId);
      const postId = mongoose.Types.ObjectId(data.postId);

      const newMsg = await Message.create({
        senderId,
        receiverId,
        postId,
        message: data.message,
      });

      // Emit the saved message to sender and receiver rooms
      io.to(data.senderId).emit("chatMessage", newMsg);
      io.to(data.receiverId).emit("chatMessage", newMsg);
    } catch (err) {
      console.error("DB Save Error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
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

// Route to fetch all sender posts for the traveler's home page
app.get("/home", async (req, res) => {
  const {
    search,
    postType,
    paymentMin,
    paymentMax,
    startDate,
    endDate,
    msg = null,
  } = req.query;

  const filter = {};

  // Search fields
  if (search) {
    filter.$or = [
      { productName: { $regex: search, $options: "i" } },
      { modeOfTravel: { $regex: search, $options: "i" } },
      { source: { $regex: search, $options: "i" } },
      { destination: { $regex: search, $options: "i" } },
    ];
  }

  // Post Type
  if (postType) {
    filter.postType = postType;
  }

  // Payment Range
  const min = parseInt(paymentMin);
  const max = parseInt(paymentMax);

  if (!isNaN(min) && !isNaN(max)) {
    filter.$and = [
      { paymentMin: { $lte: max } },
      { paymentMax: { $gte: min } },
    ];
  } else if (!isNaN(min)) {
    filter.paymentMin = { $gte: min }; // Handle case where only min is provided
  } else if (!isNaN(max)) {
    filter.paymentMax = { $lte: max }; // Handle case where only max is provided
  }

  // Date Range
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end >= start) {
      filter.expectedTime = { $gte: start, $lte: end };
    }
  } else if (startDate) {
    filter.expectedTime = { $gte: new Date(startDate) };
  } else if (endDate) {
    filter.expectedTime = { $lte: new Date(endDate) };
  }

  try {
    const posts = await DeliveryPost.find({ status: "pending" }).sort({
      createdAt: -1,
    });
    // console.log(posts);
    res.render("travellerHomePage", { posts, msg });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).send("Error loading posts");
  }
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
    const responses = await TravellerResponse.find({
      userId: req.session.user.id,
    })
      .populate("postId") // assuming postId is a ref to DeliveryPost
      .sort({ createdAt: -1 }); // latest responses first

    // Render the dashboard and pass both user and posts data
    res.render("dashboard", { user: req.session.user, posts, responses });
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

app.get("/home/posts/:type", async (req, res) => {
  try {
    const postType = req.params.type;
    const { paymentMin, paymentMax, startDate, endDate, source, destination } =
      req.query;

    let filter = {};

    // Payment filter
    if (paymentMin || paymentMax) {
      filter.paymentMin = {};
      if (paymentMin) filter.paymentMin.$gte = Number(paymentMin);
      if (paymentMax) filter.paymentMin.$lte = Number(paymentMax);
    }

    // Date range filter
    if (startDate || endDate) {
      filter.expectedTime = {};
      if (startDate) filter.expectedTime.$gte = new Date(startDate);
      if (endDate) filter.expectedTime.$lte = new Date(endDate);
    }

    // Optional: add source and destination filters if needed
    if (source) filter.source = source;
    if (destination) filter.destination = destination;

    let posts;
    if (postType === "senderPost") {
      posts = await DeliveryPost.find({ status: "pending" }).sort({
        createdAt: -1,
      });
      // console.log(posts);
      // console.log(filter);
    } else if (postType === "travellerPost") {
      posts = await TravellerPost.find(filter).sort({ createdAt: -1 });
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
    res.status(500).redirect(`/dashboard?error=Error creating post: ${error}`);
    console.log(error);
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
      res.status(500).redirect("/dashboard?error=Error retrieving posts");
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
        .redirect("/dashboard?error=No post found or permission denied.");
    }

    // Delete the post
    await TravellerPost.deleteOne({ _id: id });
    return res
      .status(200)
      .redirect("/dashboard?error=Post deleted successfully");
  } catch (error) {
    console.error(`Error deleting post: ${error.message}`);
    console.log(error + "   " + error.message);

    res
      .status(500)
      .redirect(
        "/dashboard?error=An error occurred while trying to delete the post."
      );
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
        .redirect(
          "/dashboard?error=Post not found or you do not have permission to edit this post."
        );
    }

    // Render the edit form with the post data
    res.render("travellerEditForm", { post, postType });
  } catch (error) {
    console.error(`Error retrieving post for edit: ${error.message}`);
    res
      .status(500)
      .redirect(
        "/dashboard?error=An error occurred while fetching the post for editing."
      );
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
        .redirect(
          "/dashboard?error=Post not found or you do not have permission to update this post."
        );
    }

    res.redirect("/dashboard"); // Redirect to the dashboard or a confirmation page
  } catch (error) {
    console.error(`Error updating post: ${error.message}`);
    res
      .status(500)
      .redirect("/dashboard?error=An error occurred while updating the post.");
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
        .redirect("/dashboard?error=No post found or permission denied.");
    }

    // Delete the post
    await DeliveryPost.deleteOne({ _id: id });
    return res
      .status(200)
      .redirect("/dashboard?error=Post deleted successfully");
  } catch (error) {
    console.error(`Error deleting post: ${error.message}`);
    console.log(error + "   " + error.message);
    res
      .status(500)
      .redirect(
        "/dashboard?error=An error occurred while trying to delete the post."
      );
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
        .redirect(
          "/dashboard?error=Post not found or you do not have permission to edit this post."
        );
    }

    // Render the edit form with the post data
    res.render("editForm", { post, postType });
  } catch (error) {
    console.error(`Error retrieving post for edit: ${error.message}`);
    res
      .status(500)
      .redirect(
        "/dashboard?error=An error occurred while fetching the post for editing."
      );
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
        .redirect(
          "/dashboard?error=Post not found or you do not have permission to update this post."
        );
    }

    res.redirect("/dashboard?error= Post Updated Sucessfully"); // Redirect to the dashboard or a confirmation page
  } catch (error) {
    console.error(`Error updating post: ${error.message}`);
    res
      .status(500)
      .redirect("/dashboard?error=An error occurred while updating the post.");
  }
});

app.get("/post/:postType/:id", async (req, res) => {
  const { id, postType } = req.params;
  if (postType === "senderPost") {
    const post = await DeliveryPost.findById(id);
    // console.log(post);

    res.render("viewPost.ejs", { post });
  } else {
    const post = await TravellerPost.findById(id);
    res.render("viewPost.ejs", { post });
  }
});

//Load responses in Dashboard

const postTypeToModel = {
  senderPost: DeliveryPost,
  travellerPost: TravellerPost,
};

app.get("/responses", ensureAuthenticated, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.session.user.id);
    // console.log(userId);

    // Get all responses made by the current user
    const responses = await TravellerResponse.find({ travellerId: userId })
      .sort({ createdAt: -1 })
      .lean();
    // console.log(responses);

    // Manually populate postId based on postType
    const populatedResponses = await Promise.all(
      responses.map(async (response) => {
        const Model = postTypeToModel[response.postType];
        if (!Model) return response;

        const postDetails = await Model.findById(response.postId).lean();
        return {
          ...response,
          postDetails,
        };
      })
    );
    // console.log(populatedResponses);

    res.json(populatedResponses);
  } catch (error) {
    console.error("Error fetching responses:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/responseForm/:postType/:id", async (req, res) => {
  const { id, postType } = req.params;

  try {
    let post;
    if (postType === "senderPost") {
      post = await DeliveryPost.findById(id);
    } else if (postType === "travellerPost") {
      post = await TravellerPost.findById(id);
    } else {
      return res.status(400).send("Invalid post type");
    }

    if (!post) {
      return res.status(404).send("Post not found");
    }

    res.render("travellerResponseForm", { post, postType }); // assuming responseForm.ejs
  } catch (err) {
    console.error("Error loading post for response form:", err);
    res.status(500).send("Server error");
  }
});
app.post("/submitResponse/:postType/:id", async (req, res) => {
  try {
    const { postType, id } = req.params;
    const { message, estimatedDelivery, priceOffer } = req.body;

    if (!req.session.user || !req.session.user.id) {
      return res.status(401).redirect("/login");
    }

    let post;
    if (postType === "senderPost") {
      post = await DeliveryPost.findById(id);
    } else if (postType === "travellerPost") {
      post = await TravellerPost.findById(id);
    } else {
      return res.status(400).send("Invalid post type");
    }

    if (!post) {
      return res.status(404).send("Post not found");
    }

    // Check if the post is already accepted, and prevent further responses
    if (post.status === "accepted") {
      return res
        .status(400)
        .send(
          "This post has already been accepted, no further responses allowed."
        );
    }

    const newResponse = new TravellerResponse({
      postId: id,
      postType,
      travellerId: req.session.user.id,
      message,
      estimatedDelivery,
      priceOffer,
    });

    await newResponse.save();

    res.redirect("/home?msg=Response submitted successfully");
  } catch (err) {
    console.error("Error submitting response:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/dashboard/:postId/responses", async (req, res) => {
  const { postId } = req.params;

  try {
    // Optional: Check if the current user owns this post (for security)
    const post = await DeliveryPost.findOne({
      _id: postId,
      userId: req.session.user.id,
    });
    if (!post) {
      return res
        .status(403)
        .send("You are not authorized to view responses for this post");
    }

    // Fetch only responses for the specific post
    const responses = await TravellerResponse.find({ postId }).populate(
      "travellerId",
      "username email"
    );

    res.render("viewResponses.ejs", { responses, postId });
  } catch (error) {
    console.error("Error fetching responses:", error);
    res.status(500).send("Server Error");
  }
});

//Accept the response of any traveller
app.post("/acceptResponse/:postId/:responseId", async (req, res) => {
  try {
    const { postId, responseId } = req.params;

    // Set the selected response to accepted
    const acceptedResponse = await TravellerResponse.findByIdAndUpdate(
      responseId,
      {
        status: "accepted",
      }
    ).populate("travellerId");

    // Find the corresponding post
    const post = await DeliveryPost.findById(acceptedResponse.postId);

    // If the post has already been accepted, prevent further changes
    if (post.status === "accepted") {
      return res
        .status(400)
        .send(
          "This post has already been accepted, no further changes can be made."
        );
    }

    // Mark the post as accepted
    post.status = "accepted";
    await post.save();

    // Reject other responses to the same post
    await TravellerResponse.updateMany(
      { postId: acceptedResponse.postId, _id: { $ne: responseId } },
      { status: "rejected" }
    );

    res.redirect("/dashboard?msg=Traveller accepted");
  } catch (error) {
    console.error("Error updating response status:", error);
    res.status(500).send("Server Error");
  }
});

//Message Between Users

// GET /messages — list of all conversations
// GET /messages

app.get("/messages", async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.session.user.id); // ✅ Convert to ObjectId
  const rawConvos = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: userId }, { receiverId: userId }],
      },
    },
    { $sort: { createdAt: -1 } }, // Sort messages newest first
    {
      $group: {
        _id: {
          postId: "$postId",
          otherUser: {
            $cond: [{ $eq: ["$senderId", userId] }, "$receiverId", "$senderId"],
          },
        },
        lastMessage: { $first: "$message" },
        at: { $first: "$createdAt" },
      },
    },
    {
      $sort: { at: -1 }, // Sort conversations by last message time descending
    },
  ]);

  // console.log(rawConvos);

  const convos = rawConvos.map((c) => ({
    postId: c._id.postId,
    otherId: c._id.otherUser,
    lastMessage: c.lastMessage,
    at: c.at,
  }));

  const userIds = convos.map((c) => new mongoose.Types.ObjectId(c.otherId)); // ✅ Convert to ObjectId
  const users = await User.find({ _id: { $in: userIds } });
  const nameMap = {};
  users.forEach((u) => (nameMap[u._id.toString()] = u.username));
  // console.log(nameMap);

  res.render("conversations", {
    convos,
    nameMap,
    messages: [],
    currentUserId: userId.toString(),
  });
});

// GET /messages/chat/:postId/:otherUserId
// GET /messages/chat/:postId/:otherId
app.get("/messages/chat/:postId/:otherId", async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.session.user.id);
  const { postId, otherId } = req.params;

  // Fetch all messages between the user and the other user
  const messages = await Message.find({
    postId,
    $or: [
      { senderId: userId, receiverId: otherId },
      { senderId: otherId, receiverId: userId },
    ],
  }).sort({ createdAt: 1 });
  await Message.updateMany(
    {
      postId,
      senderId: otherId,
      receiverId: userId,
      read: false,
    },
    { $set: { read: true } }
  );

  // If there are no messages, initialize a conversation by saving the first message
  if (messages.length === 0) {
    // Optionally, fetch the sender's post details (assuming you have a Post model)
    const senderPost = await DeliveryPost.findById(postId);

    // Construct the message content with the sender's post details
    const initialMessage = new Message({
      postId,
      senderId: userId,
      receiverId: otherId,
      message: "Hello, this is the Post you want to accept", // The actual message content
      postDetails: {
        postId: senderPost._id,
        postTitle: senderPost.productName,
        postSource: senderPost.source,
        postDestination: senderPost.destination, // Or any other fields from the Post model
      },
      createdAt: new Date(),
    });

    await initialMessage.save();
  }

  // Fetch all conversations for the left panel (user's conversations)
  const rawConvos = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: userId }, { receiverId: userId }],
      },
    },
    { $sort: { createdAt: -1 } }, // Sort messages newest first
    {
      $group: {
        _id: {
          postId: "$postId",
          otherUser: {
            $cond: [{ $eq: ["$senderId", userId] }, "$receiverId", "$senderId"],
          },
        },
        lastMessage: { $first: "$message" },
        at: { $first: "$createdAt" },
      },
    },
    {
      $lookup: {
        from: "messages",
        let: { postId: "$_id.postId", otherUser: "$_id.otherUser" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$postId", "$$postId"] },
                  { $eq: ["$senderId", "$$otherUser"] },
                  { $eq: ["$receiverId", userId] },
                  { $eq: ["$read", false] },
                ],
              },
            },
          },
        ],
        as: "unreadMessages",
      },
    },
    {
      $addFields: {
        unreadCount: { $size: "$unreadMessages" },
      },
    },
    {
      $sort: { at: -1 }, // Sort conversations by last message time descending
    },
  ]);

  const convos = rawConvos.map((c) => ({
    postId: c._id.postId,
    otherId: c._id.otherUser,
    lastMessage: c.lastMessage,
    at: c.at,
    unreadCount: c.unreadCount || 0,
  }));

  // Fetch user details (names) for all participants in the conversations
  const userIds = convos.map((c) => new mongoose.Types.ObjectId(c.otherId));
  const users = await User.find({ _id: { $in: userIds } });
  const nameMap = {};
  users.forEach((u) => (nameMap[u._id.toString()] = u.username));

  // Render the conversation page
  res.render("conversations", {
    convos,
    nameMap,
    messages,
    currentUserId: userId,
    otherId,
    postId,
    showInputBox: messages.length === 0, // Show input box if no previous messages exist
  });
});

// POST /messages/send
app.post("/messages/send", async (req, res) => {
  try {
    const senderId = req.session.user.id; // Assumes logged in user session
    const { receiverId, postId, message } = req.body;

    const newMessage = new Message({
      senderId: new mongoose.Types.ObjectId(senderId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      postId: new mongoose.Types.ObjectId(postId),
      message,
    });
    await newMessage.save();
    res.redirect(`/messages/chat/${postId}/${receiverId}`);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//Email trial

// // Send email/notification here
// const traveller = acceptedResponse.travellerId;

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER, // e.g., sendmate.noreply@gmail.com
//     pass: process.env.EMAIL_PASS,
//   },
// });

// const mailOptions = {
//   from: process.env.EMAIL_USER,
//   to: traveller.email,
//   subject: "Your delivery offer has been accepted!",
//   text: `Hi ${traveller.username},\n\nYour offer to deliver the parcel has been accepted by the sender.\n\nThank you!\n\n- Sendmate Team`,
// };

// await transporter.sendMail(mailOptions);
