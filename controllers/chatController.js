const medicalChatBot = require("../chat/medicalChatBot");

const chatController = {
  async handleMedicalChat(req, res) {
    const { userQuestion } = req.body;

    if (!userQuestion) {
      return res.status(400).json({ error: "User question is required." });
    }

    try {
      const reply = await medicalChatBot(userQuestion);
      return res.status(200).json({ reply });
    } catch (error) {
      console.error("Error in medical chat:", error);
      return res.status(500).json({ error: "An error occurred while processing your request." });
    }
  },
};

module.exports = chatController;