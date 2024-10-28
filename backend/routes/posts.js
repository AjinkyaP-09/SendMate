const express = require('express');
const Post = require('../models/Post');
const router = express.Router();

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

module.exports = router;
