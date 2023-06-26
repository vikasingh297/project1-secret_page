require('dotenv').config();

const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose =require("mongoose");
//const encrypt = require("mongoose-encryption");
//const md5 = require("md5");
const session = require('express-session');
const passport= require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app=express();

app.use(express.static("public"));
app.set('view engine','ejs');

app.use(bodyParser.urlencoded({
    extended : true
}));

app.use(session({
    secret : "our little secret",
    resave : false,
    saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser : true});

const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    secret : String
});

userSchema.plugin(passportLocalMongoose);

//userSchema.plugin(encrypt, { secret: process.env.SECRET,encryptedFields: ["password"] });
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.get("/",function(req,res){
   res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
 });

app.get("/register",function(req,res){
    res.render("register");
 });

app.get("/secrets",function(req,res){
  User.find({"secret" : {$ne :null}},function(err,foundusers){
    if(err){
        console.log(err);
    }
    else{
         if(foundusers){
            res.render("secrets" , {userwithsecrets : foundusers});
         }
    }
  });
});

app.get("/logout",function(req,res){
    req.logout(function(err) {
        if (err) { 
            console.log(err); 
        }
      });
    
    res.redirect("/");
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
});

app.post("/submit",function(req,res){
    const submittedSecrect = req.body.secret;

    User.findById(req.user.id,function(err,founduser){
        if(err){
            console.log(err);
        }
        else{
            if(founduser){
                founduser.secret=submittedSecrect;
                founduser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }
    });
});

 app.post("/register",function(req,res){
    User.register({username : req.body.username}, req.body.password, function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
          passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
          });
        }
    });
 });

 app.post("/login",function(req,res){

    const user = new User({
         username : req.body.username,
         password : req.body.password
    });

    req.login(user,function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
              });
        }
    });
 });
 // code for md5
/*app.post("/register", function(req,res){
    const newUser= new User(
        {
            email : req.body.username,
            password : md5(req.body.password)
        }
    );

    newUser.save(function(err){
                 if(err){
                    console.log(err);
                 }
                 else{
                    res.render("secrets");
                 }
    });
}); */

/*app.post("/login",function(req,res){
    const username= req.body.username;
    const password= md5(req.body.password);

    User.findOne({email : username},function(err,foundUser){
        if(err){
            console.log(err);
        }
        else{
            if(foundUser){
                if(foundUser.password===password){
                    res.render("secrets");
                }
            }
        }
    });
}); */

app.listen(3000,function(){
    console.log("server started at 3000 port");
});