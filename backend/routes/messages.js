const express = require('express');
const Message = require('../models/Message');
const router = express.Router();

// Send Message
router.post('/', async (req, res) => {
    const { senderId, receiverId, postId, content } = req.body;

    try {
        const message = new Message({ sender: senderId, receiver: receiverId, post: postId, content });
        await message.save();
        res.status(201).json(message);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Messages for a Post
router.get('/:postId', async (req, res) => {
    const { postId } = req.params;

    try {
        const messages = await Message.find({ post: postId }).populate('sender', 'username').populate('receiver', 'username');
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
