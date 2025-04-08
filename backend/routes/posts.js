const express = require('express');
const Post = require('../models/Post');
const router = express.Router();
const upload = require('../middleware/uploads3');

// Create Post
router.post('/posts', async (req, res) => {
    try {
        const newPost = new Post({
            userId: req.session.user.id,
            role: req.body.role,
            description: req.body.description,
            source: req.body.source,
            destination: req.body.destination
        });

        await newPost.save();
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.render('dashboard', { error: 'Failed to create post.' });
    }
});




// Get Posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().populate('user', 'username role');
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/posts

router.post('/create', upload.single('image'), async (req, res) => {
    try {
        const { role, source, destination, description } = req.body;

        const newPost = new Post({
            user: req.user._id, // assuming user is authenticated
            role,
            source,
            destination,
            description,
            imageUrl: req.file.location, // S3 URL
            createdAt: new Date()
        });

        await newPost.save();

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to create post');
    }
});

module.exports = router;
