const express = require('express');
const { register, login, getUserDetails } = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Public
router.post('/register', register);
router.post('/login', login);

// Protected - returns current user details (excluding password)
router.get('/me', verifyToken, getUserDetails);

module.exports = router;