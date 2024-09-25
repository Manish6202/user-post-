const express = require('express');
const app = express();
const userModel = require('./model/user');
const postModel = require('./model/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');


app.set("view engine", 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.get('/', (req, res)=>{
    res.render("index");
})

app.get('/login', (req, res ) => {
    res.render("login")
})

app.get('/profile', isLoggedIn, async (req, res ) => {
    let user = await userModel.findOne({email: req.user.email}).populate("post");;
    
    res.render("profile", {user})
})

app.post('/post', isLoggedIn, async (req, res ) => {
    let user = await userModel.findOne({email: req.user.email});
    let {content} = req.body;
    let post = await postModel.create({
        user: user._id,
        content
    });

    user.post.push(post._id);
    await user.save();
    res.redirect("/profile");
});

app.post('/register', async (req, res)=>{
    let {name, email, username, password, age} = req.body;

    let user = await userModel.findOne({email}); // [email pahle se present hai ya nai]
    if(user) return res.status(500).send("user already registered"); //[check for usr register or not]

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {                // bcrypt.hash(req.body.password, salt), we extract the password already at top that why we write bcrypt.hash(password, salt).
           let user = await userModel.create({
                username,
                email,
                name,
                age,
                password: hash
            })

            let token = jwt.sign({email: email, userid: user._id}, "secretkey");
            res.cookie("token", token);
            res.redirect("/profile")

        })
    })
    
})

app.post('/login', async (req, res)=> {
    let {email, password} = req.body;

    let user = await userModel.findOne({email});
    if(!user) return res.status(500).redirect('login');

    bcrypt.compare(password, user.password, (err, result) => {
        if(result){
            let token = jwt.sign({email: email, userid: user._id}, "secretkey");
            res.cookie("token", token);
            res.status(200).redirect("/profile");
        }
        else res.redirect('/login');
    })

});

app.get('/logout', (req, res)=> {
    res.cookie('token', "");
    res.redirect('/login');
})

function isLoggedIn(req, res, next) {
    if(req.cookies.token === "") res.send("you must need to login");
    else{
        let data = jwt.verify(req.cookies.token, "secretkey");
            req.user = data ;
            next();
    }
    
}
app.listen(3000);