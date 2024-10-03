const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth'); // Authentication routes
const postRoutes = require('./routes/posts'); // Post routes
const messageRoutes = require('./routes/messages'); // Message routes
const path = require('path');

const app = express();
dotenv.config();
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.set('view engine', 'ejs');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/auth', authRoutes); // User authentication routes
app.use('/api/posts', postRoutes); // Post management routes
app.use('/api/messages', messageRoutes); // Message management routes

// Basic Route
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login');
});

// Render the user dashboard
app.get('/dashboard', (req, res) => {
    // Replace this with actual user information when you have authentication set up
    const username = 'User'; // Example placeholder, replace with actual logged-in user
    res.render('dashboard', { username });
});

// Render the posts page
app.get('/posts', async (req, res) => {
    // Fetch posts from the database (replace with actual data fetching)
    const posts = await Post.find(); // Assuming you have a Post model defined
    res.render('posts', { posts });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
