const express = require('express');
const router = express.Router();
const validateJWT = require("./api").validateJWT;
const cookieParser = require("cookie-parser");
const {userSchema, postSchema} = require('../schema');
const mongoose = require('mongoose');
const User = mongoose.model('users', userSchema);
const Post = mongoose.model('posts', postSchema);

router.use(cookieParser());
router.use(express.static(__dirname + '/public'));
//main feed, get most recent post of all users your following
//not very efficient but it works for now
router.get('/', validateJWT, async (req, res) => {
    const user = await User.findById(req.user.id, "-_id -password");
    //I have no idea why I have to do this here it just works
    //I thought validating the token would be enough but for some reason
    // This needs to also be checked or it gets weird
    //Think cause sometimes token will get validated with invalid users cause I deleted some
    //This seems to be a local host issue so yeah, COME BACK HERE AFTER FINAL PROJECT
    if (user){
        const following = user.following;
        let posts = [];

        for (let i = 0; i < following.length; i++){
            const followedPosts = await User.findById(following[i], "-_id posts name");
            let postId = "";
            if (followedPosts.posts.length > 0){
                postId = followedPosts.posts[followedPosts.posts.length - 1];
                let foundPost = await Post.findById(postId, "-_id -author ");
                let post = {};
                post.entries = foundPost.entries;
                post.title = foundPost.title;
                post.identifier = foundPost.identifier;
                post.name = followedPosts.name;
                posts.push(post);
            }
        }
        res.render("index", {name: req.user.name, posts: JSON.stringify(posts)});
    } else {
        res.redirect("/login");
    }
    
})


router.get('/createPost', validateJWT, (req, res) => {
    res.render("createPost");
});


router.get('/login', (req, res) => {
    res.render("login");
});

router.get('/register', (req, res) => {
    res.render("register");
});

router.get('/post/:id', validateJWT, async (req, res)=> {
    const postId = req.params.id;
    const post = await Post.findOne({identifier: postId});
    if (post) {
        const points = JSON.stringify(post.entries)
        res.render("post", {points});    
    } else {
        res.render("error"); 
    }
});


router.get('/user/:name', validateJWT, async (req, res)=> {
    const name = req.params.name;
    const user = await User.findOne({name: name});
    if (user){
        let trails = [];
        //switch to find by author???
        for(let i = 0; i < user.posts.length; i++){
            let post = {};
            let x = await Post.findOne({_id: user.posts[i]});
            post.title = x.title;
            post.identifier = x.identifier;
            post.entries = x.entries;
            trails.push(post);
        }
        let posts = JSON.stringify(trails);
        const followingCount = user.following.length;
        const followerCount = user.followers.length;
        const following = user.followers.includes(req.user.id)
        const isUser = (req.user.name === name);
        res.render("user", {name, posts, followingCount, followerCount, following, isUser});
    } else {
        res.render("error"); 

    }
});

module.exports = router;