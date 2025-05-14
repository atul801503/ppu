const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/accounts', authenticate, isAdmin, authController.createAccount);

module.exports = router;