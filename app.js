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
            res.send("registered")

        })
    })


    
})

app.listen(3000);