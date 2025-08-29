const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Route to handle medical chat
router.post('/medical', chatController.handleMedicalChat);

module.exports = router;