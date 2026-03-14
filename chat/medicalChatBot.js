const { sendToGemini } = require('../lib/geminiClient');

// Temporary in-memory session storage (replace with Redis/DB in production)
const chatHistories = {};

/**
 * Service function for handling medical questions using Gemini
 */
async function getMedicalResponse(sessionId, message) {
  if (!sessionId || !message) {
    throw new Error('sessionId and message are required.');
  }

  // Initialize history if not exists
  if (!chatHistories[sessionId]) {
    chatHistories[sessionId] = [
      {
        role: 'system',
        content: `You are a professional and friendly medical assistant. Answer clearly, concisely, and factually. If unsure, recommend consulting a healthcare provider.`,
      },
    ];
  }

  // Add user message to history
  chatHistories[sessionId].push({ role: 'user', content: message });

  try {
    const result = await sendToGemini({ messages: chatHistories[sessionId], timeoutMs: 20000 });
    const reply = (result && result.reply) ? String(result.reply).trim() : '';

    // Add assistant reply to history
    chatHistories[sessionId].push({ role: 'assistant', content: reply });

    return { reply, history: chatHistories[sessionId] };
  } catch (err) {
    console.error('Gemini API error:', err && err.stack ? err.stack : err);
    const fallback = "I'm having trouble connecting to the assistant right now. Please try again later.";
    chatHistories[sessionId].push({ role: 'assistant', content: fallback });
    return { reply: fallback, history: chatHistories[sessionId] };
  }
}

module.exports = { getMedicalResponse };
