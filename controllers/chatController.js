const { getMedicalResponse } = require('../chat/medicalChatBot');

// Controller for handling medical chat
exports.handleMedicalChat = async (req, res) => {
  try {
    const { sessionId, userQuestion } = req.body;

    if (!sessionId || !userQuestion) {
      return res.status(400).json({ error: "sessionId and userQuestion are required" });
    }

    const result = await getMedicalResponse(sessionId, userQuestion);

    // result may be an object { reply, history } (as of updated service)
    if (result && typeof result === 'object') {
      return res.json({ reply: result.reply, history: result.history });
    }

    // fallback for older behavior where a plain string might be returned
    res.json({ reply: result });
  } catch (error) {
    console.error("ChatController Error:", error && error.stack ? error.stack : error);
    res.status(500).json({ error: error?.message || "Failed to process request" });
  }
};
