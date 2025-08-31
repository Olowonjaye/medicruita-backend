const medicalChatBot = require('../chat/medicalChatBot');

// Controller for handling medical chat
exports.handleMedicalChat = async (req, res) => {
  try {
    const { userQuestion } = req.body;

    if (!userQuestion) {
      return res.status(400).json({ error: "User question is required" });
    }

    // Pass question to chatbot service
    const botReply = await medicalChatBot.getMedicalResponse(userQuestion);

    res.json({ reply: botReply });
  } catch (error) {
    console.error("ChatController Error:", error.message);
    res.status(500).json({ error: "Failed to process request" });
  }
};
