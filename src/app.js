// app.js
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const { sequelize } = require("../db");
const md = require("../models/User");
const userRoute = require("../routes/userRoute");
const Groq = require("groq-sdk");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Connect DB
sequelize
  .sync()
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error("Unable to connect to DB:", err);
  });

// Routes
app.use("/api", userRoute);

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Chatilama API" });
});

// --- GROQ SETUP ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Chat route
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.userQuestion || req.body.message;

  if (!userMessage) {
    return res.status(400).json({ message: "Message is required" });
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are Chatilama, a helpful assistant." },
        { role: "user", content: userMessage },
      ],
      model: "llama-3.1-70b-versatile",
    });

    const reply = chatCompletion.choices?.[0]?.message?.content || "No reply received.";

    res.json({ reply });
  } catch (error) {
    console.error("Groq error:", error.response?.data || error.message);
    res.status(500).json({ message: "Error communicating with Groq API" });
  }
});

// Export app (so server.js runs it)
module.exports = app;
