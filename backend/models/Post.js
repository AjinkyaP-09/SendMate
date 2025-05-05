const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['sender', 'traveler'], required: true },
    source: { type: String, required: true },
    destination: { type: String, required: true },
    description: { type: String },
    status: { type: String, default: 'active' },
    createdAt: { type: Date, default: Date.now },
    
    
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
