const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        // Required only for regular registration
        required: function() { return this.googleId == null; }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows for unique constraint without enforcing for every user
    },
    // role: {
    //     type: String,
    //     enum: ['sender', 'traveler'], // Ensure valid roles
    //     required: false // Optional, depending on your requirements
    // }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
