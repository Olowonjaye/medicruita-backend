const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const { sequelize } = require('../db');
const md = require('../models/User');

// Load environment variables
dotenv.config();

const app = express();

// Sync models with database
md.sequelize.sync({ alter: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check / test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is connected successfully!' });
});

// User Routes
const userRoutes = require('../routes/userRoute');
app.use('/api/users', userRoutes);

// Job Routes
const jobRoutes = require('../routes/jobRoute');
app.use('/api/jobs', jobRoutes);

// Chat Routes
const chatRoutes = require('../routes/chatRoute');
app.use('/api/chat', chatRoutes);

module.exports = app;
