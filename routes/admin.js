const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');

// Middleware to ensure admin access
const ensureAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    req.flash('error', 'Admin privileges required');
    res.redirect('/admin/login');
};

// Admin signup form
router.get('/create-account', ensureAdmin, (req, res) => {
    res.render('admin/signup', { 
        title: 'Create New Account - Admin',
        csrfToken: req.csrfToken(),
        error: req.flash('error'),
        isAuthenticated: req.isAuthenticated(),
        isAdmin: req.user && req.user.role === 'admin',
        user: req.user || null
    });
});

// Account creation handler
router.post('/create-account', ensureAdmin, [
    check('fullName').notEmpty().trim().escape(),
    check('email').isEmail().normalizeEmail(),
    check('username').isAlphanumeric().withMessage('Username must be alphanumeric'),
    check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    check('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),
    check('role').isIn(['editor', 'moderator', 'admin']).withMessage('Invalid role selected')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('admin/signup', {
            title: 'Create New Account - Admin',
            errors: errors.array(),
            formData: req.body,
            csrfToken: req.csrfToken(),
            isAuthenticated: req.isAuthenticated(),
            isAdmin: req.user && req.user.role === 'admin',
            user: req.user || null
        });
    }

    try {
        const { fullName, email, username, password, role } = req.body;
        
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            req.flash('error', 'User with this email/username already exists');
            return res.redirect('/admin/create-account');
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({
            fullName,
            email,
            username,
            password: hashedPassword,
            role,
            createdBy: req.user._id,
            createdAt: new Date()
        });

        await newUser.save();
        
        req.flash('success', `Account created successfully for ${fullName}`);
        res.redirect('/admin/users');
        
    } catch (err) {
        console.error('Account creation error:', err);
        req.flash('error', 'Server error during account creation');
        res.redirect('/ppulists');
    }
});

module.exports = router;