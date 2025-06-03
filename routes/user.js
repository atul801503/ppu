const express = require('express');
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require('../utils/wrapAsync.js');
const passport = require('passport');
const { isAdmin } = require('../middleware/auth.js');
const { isLoggedIn } = require('../middleware.js');
// const { User } = require('../user/resetpassword'); // Assuming you have a User model


router.get("/signup", isLoggedIn, isAdmin, async(req, res) => {
    const users = await User.find({});
    res.render("users/signup.ejs", { 
        users,
        success: req.flash('success'),
        error: req.flash('error') 
    });
});

router.post('/signup', isLoggedIn, isAdmin, async (req, res, next) => {
    try {
        const { username, email, password, accountType } = req.body;
        
        // Validate accountType if provided
        const validRoles = ['user', 'admin', 'moderator']; // adjust as needed
        const role = validRoles.includes(accountType) ? accountType : 'user';
        
        const user = new User({ username, email, role });
        const registeredUser = await User.register(user, password);
        
        req.flash('success', `User ${username} created successfully!`);
        res.redirect('/signup');
        
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/signup');
    }
});

// Fixed this line - changed 'route' to 'router'
router.post(
    "/login",
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
        successRedirect: "/ppulists", // No need for custom function
        successFlash: "Admin login successfully", // <-- You can set this if using connect-flash-middleware
    })
);

router.get("/login", (req, res) => {
    res.render("users/login.ejs", {
        error: req.flash('error')[0],       // Show the first error flash message
        success: req.flash('success')[0],    // Show the first success flash message
        info: req.flash('info')[0]           // Optional: For informational messages
    });
});



// router.get("/login", (req, res) => {
//     res.render("users/signup.ejs");
// });

router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if(err) {
           return next(err);
        }
        req.flash("Amdin Logout Successfully");
        res.redirect("/ppulists");
    });
});

router.post('/delete-user', async (req, res) => {
    try {
        const userId = req.body.userId;
        
        // Verify the user is an admin
        if (!req.user || req.user.role !== 'admin') {
            req.flash('error', 'Unauthorized action');
            return res.redirect('/dashboard');
        }

        // Delete the user from the database
        await User.findByIdAndDelete(userId);
        
        req.flash('success', 'User deleted successfully');
        res.redirect('/signup'); // Redirect back to dashboard
    } catch (error) {
        console.error('Error deleting user:', error);
        req.flash('error', 'Failed to delete user');
        res.redirect('/signup');
    }
});

// In your controller/route file
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Current page (default: 1)
        const limit = 10; // Posts per page
        
        // Get total number of posts
        const totalPosts = await Ppulist.countDocuments();
        
        // Calculate total pages
        const totalPages = Math.ceil(totalPosts / limit);
        
        // Calculate skip value
        const skip = (page - 1) * limit;
        
        // Get posts for current page
        const allPpulists = await Ppulist.find()
            .sort({ time: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit)
            .exec();
            
        console.log({
    allPpulists: allPpulists.length,
    currentPage,
    totalPages,
    totalPosts
});
        
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// Protect edit route - only owner or admin can edit
router.get('/:id/editpost', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const ppulist = await PpuList.findById(req.params.id);
        if (!ppulist) {
            req.flash('error', 'Post not found');
            return res.redirect('/ppulists');
        }
        res.render('ppulists/edit', { ppulist });
    } catch (e) {
        req.flash('error', 'Error accessing post');
        res.redirect(`/ppulists/${req.params.id}`);
    }
});

// Protect delete route - only owner or admin can delete
router.delete('/:id', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const deletedPost = await PpuList.findByIdAndDelete(req.params.id);
        if (!deletedPost) {
            req.flash('error', 'Post not found');
            return res.redirect('/ppulists');
        }
        req.flash('success', 'Successfully deleted post!');
        res.redirect('/ppulists');
    } catch (e) {
        console.error('Delete error:', e);
        req.flash('error', 'Failed to delete post');
        res.redirect(`/ppulists/${req.params.id}`);
    }
});


// Password change route
router.post('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Check if user is authenticated (assuming you're using sessions)
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const userId = req.session.user.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update password
        user.password = hashedPassword;
        await user.save();
        
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});






module.exports = router;