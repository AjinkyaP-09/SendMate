const express = require('express');
const Post = require('../models/Post');
const router = express.Router();

// Create Post
router.post('/', async (req, res) => {
    const { userId, role, source, destination, description } = req.body;

    try {
        const post = new Post({ user: userId, role, source, destination, description });
        await post.save();
        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
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
