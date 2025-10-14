// app.js
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const { sequelize } = require("../db");
const md = require("../models/User"); // ensure it's used somewhere in your routes
const userRoute = require("../routes/userRoute");
const chatRoute = require("../routes/chatRoute"); // ✅ import chat route

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connect DB
sequelize
  .sync()
  .then(() => {
    console.log("✅ Database connected successfully");
  })
  .catch((err) => {
    console.error("❌ Unable to connect to DB:", err);
  });

// Routes
app.use("/api", userRoute);        // user routes
app.use("/api/chat", chatRoute);   // ✅ chat routes

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Chatilama API" });
});

// Export app for server.js
module.exports = app;
