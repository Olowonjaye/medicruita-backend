const express = require('express');
const { handleMedicalChat } = require('../controllers/chatController');
const router = express.Router();

// POST /api/chat
router.post('/', handleMedicalChat);

module.exports = router;
