const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name: { type: String, unique: true,required: true },
    password: { type: String, required: true },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'posts' }],
    createdAt: { type: Date, default: Date.now }
}, {
    collection: "users"
});


const postSchema = new mongoose.Schema({
    identifier: {
        type: String,
        //NOT CHECKING FOR COLLISIONS IDC, IF IT CRASHES IT WAS GODS WILL
        default: Math.random().toString(16).slice(2),
        required: true,
        unique: true
    },
    title:{
        type: String,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users', 
        required: true
    },
    entries: mongoose.Schema.Types.Array,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    collection: "posts"
});

module.exports = {userSchema, postSchema};