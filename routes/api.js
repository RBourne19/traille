const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const {userSchema, postSchema} = require('../schema');
const cookieParser = require("cookie-parser");
const mongoose = require('mongoose');
const { MongoCursorInUseError } = require('mongodb');
const { name } = require('ejs');
const User = mongoose.model('users', userSchema);
const Post = mongoose.model('posts', postSchema);

const JWT_SECRET = process.env.JWT_SECRET; 

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
router.use(cookieParser());

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({name: username});
    if (user) {
        const valid = await bcrypt.compare(password, user.password);
        if (valid){
            //GIVE JWT
            res.cookie("token", generateToken(user), {maxAge:7*86400000});
            const url = req.query.redirect ? req.query.redirect : "/";
            res.json({url: url})
        } else {
            res.status(401);
            res.json({error: "Either the name or password is incorrect"});
        }
    } else {
        res.status(401);
        res.json({error: "Either the name or password is incorrect"});
    }
    
});

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    bcrypt.hash(password, 10, async (err, hash) => {
        if (err){
            res.status(500);
            res.json({error: "There has been an issue with the server, try again later"});
        }        
        const user = await User.findOne({name: username});
        if (user) {
            res.status(401);
            res.json({error: "This user already exists."});
        } else {
            
            const newUser = new User({
                name: username,
                password: hash,
                followers: [],
                following: [],
                posts: []
            });
            //GIVE JWT
            await newUser.save();
            res.cookie("token", generateToken(newUser), { maxAge: 7*86400000, httpOnly: true });
            res.json({url:"/"});
        }
    });
    
});

router.post('/post', validateJWT, async (req, res) => {
    //probably should do some info validation but oh well
    let points = req.body.points;
    if (points && points.length > 0 && points.length <= 8){
        //allow titles
        const newPost = new Post({
            identifier: Math.random().toString(16).slice(2),
            title: "Default",
            author: req.user.id, 
            entries: req.body.points
        });
        await newPost.save();
        const user = await User.findOne({name: req.user.name});
        user.posts.push(newPost.id);
        await user.save();
        res.json({postId: newPost.identifier});
    } else {
        res.status(401);
        res.json({error: "Invalid data."});
    }

});

router.get("/user/query/:name",validateJWT, async(req, res) => {
    const name = req.params.name;
    const users = await User.find({name: {$regex: `${name}.*`}}, "-_id name").limit(10);
    res.json(users);
})


router.post('/follow', validateJWT, async (req, res) => {
    //probably should do some info validation but oh well
    let sourceName = req.user.name;
    let targetName = req.body.name;
    const source = await User.findOne({name: sourceName});
    const target = await User.findOne({name: targetName});
    if (!source || !target || sourceName === target || target.followers.includes(source.id)){
        res.status(401);
        res.json({error: "Invalid data."});
    } else {
        target.followers.push(source.id);
        source.following.push(target.id);
        await target.save();
        await source.save();
        res.json({messgae: "Success"})
    }

});

router.post('/unfollow', validateJWT, async (req, res) => {
    //probably should do some info validation but oh well
    let sourceName = req.user.name;
    let targetName = req.body.name;
    const source = await User.findOne({name: sourceName});
    const target = await User.findOne({name: targetName});
    if (!source || !target || sourceName === target || !target.followers.includes(source.id)){
        res.status(401);
        res.json({error: "Invalid data."});
    } else {
        target.followers.pull(source.id);
        source.following.pull(target.id);
        await target.save();
        await source.save();
        res.json({messgae: "Success"})
    }

});

router.get('/signout', validateJWT, async (req, res) => {
    //probably should do some info validation but oh well
    res.clearCookie("token");
    res.redirect("/login");
});



//generate JWT token with a 7 day expiration 
function generateToken(user){
    return jwt.sign({id: user._id, name: user.name}, JWT_SECRET, {expiresIn: "7d"});
}

function validateJWT(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect(`/login?redirect=${req.path}`);
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        } else {
            req.user = decoded;
            next();
        }
    });
}


module.exports = {router, validateJWT};