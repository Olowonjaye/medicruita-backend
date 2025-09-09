const { getMedicalResponse } = require('../chat/medicalChatBot');

// Controller for handling medical chat
exports.handleMedicalChat = async (req, res) => {
  try {
    const { sessionId, userQuestion } = req.body;

    if (!sessionId || !userQuestion) {
      return res.status(400).json({ error: "sessionId and userQuestion are required" });
    }

    const botReply = await getMedicalResponse(sessionId, userQuestion);

    res.json({ reply: botReply });
  } catch (error) {
    console.error("ChatController Error:", error.message);
    res.status(500).json({ error: "Failed to process request" });
  }
};
