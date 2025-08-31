// server1/chat/medicalChatBot.js
const { Groq } = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Temporary in-memory session storage (replace with Redis/DB in production)
const chatHistories = {};

/**
 * Medical chatbot controller
 */
const medicalChatBot = async (req, res) => {
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
You are Chatllama, a professional and friendly **medical assistant AI**. 
You answer medical questions in a clear, concise, and informative way.

Guidelines:
- Keep responses easy to understand.
- Be neutral and factual.
- Do NOT provide personal opinions.
- If unsure, say: "It's best to consult a healthcare provider."
          `.trim(),
        },
      ];
    }

    // Add user message to history
    chatHistories[sessionId].push({ role: "user", content: message });

    // Call Groq API with history
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: chatHistories[sessionId],
    });

    const reply = completion.choices[0].message.content.trim();

    // Add assistant reply to history
    chatHistories[sessionId].push({ role: "assistant", content: reply });

    // Respond with the AI’s reply + full chat history
    res.json({
      reply,
      history: chatHistories[sessionId],
    });

  } catch (error) {
    console.error("Medical ChatBot Error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { medicalChatBot };
