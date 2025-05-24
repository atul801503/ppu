const express = require('express');
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require('../utils/wrapAsync.js');
const passport = require('passport');

router.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

router.post('/signup', 
    wrapAsync(async(req, res) => {
        try {
            let {username, email, password, confirmPassword} = req.body;
            const newUser = new User({email, username});
            const registerUser = await User.register(newUser, password);
            console.log(registerUser);
            req.flash("success", "New Admin Added Successfully");
            res.redirect("/ppulistings");
        } catch (e) {
            req.flash("error", e.message);
            res.redirect("/signup");
        }
    })
);

router.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

// Fixed this line - changed 'route' to 'router'
router.post(
    "/login", 
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
    }),
    async(req, res) => {
        req.flash("success", "Admin login Successfully");
        res.redirect("/ppulistings");
    }
);

module.exports = router;