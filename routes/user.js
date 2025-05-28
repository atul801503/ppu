const express = require('express');
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require('../utils/wrapAsync.js');
const passport = require('passport');

router.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

router.post('/signup', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Create a user instance with username, email, accountType defaults to 'user'
    const user = new User({ username, email });

    // passport-local-mongoose register method handles hashing & saving user
    const registeredUser = await User.register(user, password);

    // Automatically log the user in after signup (optional)
    req.login(registeredUser, err => {
      if (err) return next(err);
      res.status(201).json({ message: 'User registered successfully', user: { username: registeredUser.username, email: registeredUser.email } });
    });

  } catch (e) {
    // Handle errors (like duplicate username/email)
    res.status(400).json({ error: e.message });
  }
});

// Fixed this line - changed 'route' to 'router'
router.post(
    "/login",
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
        successRedirect: "/ppulistings", // No need for custom function
        successFlash: "Admin login successfully", // <-- You can set this if using connect-flash-middleware
    })
);

router.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

router.get("/login", (req, res) => {
    res.render("users/signup.ejs");
});

router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if(err) {
           return next(err);
        }
        req.flash("Amdin Logout Successfully");
        res.redirect("/ppulistings");
    });
});

module.exports = router;