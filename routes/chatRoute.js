// server1/routes/chatRoute.js
const express = require('express');
const { Groq } = require('groq-sdk');
const router = express.Router();

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Temporary in-memory session storage (use Redis/DB for production)
const chatHistories = {};

// Chat endpoint
router.post('/', async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: "sessionId and message are required." });
    }

    // Initialize history if not exists
    if (!chatHistories[sessionId]) {
      chatHistories[sessionId] = [
        {
          role: "system",
          content: `
You are a professional and friendly **medical assistant AI**. 
You answer medical questions in a clear, concise, and informative way.

Guidelines:
- Keep responses easy to understand.
- Be neutral and factual.
- If unsure, say "It's best to consult a healthcare provider."
          `.trim(),
        },
      ];
    }

    // Add user message to history
    chatHistories[sessionId].push({ role: "user", content: message });

    // Call Groq API with full history
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: chatHistories[sessionId],
    });

    const reply = completion.choices[0].message.content.trim();

    // Add assistant reply to history
    chatHistories[sessionId].push({ role: "assistant", content: reply });

    res.json({
      reply,
      history: chatHistories[sessionId], // return history so frontend can display
    });
  } catch (error) {
    console.error("Medical Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
