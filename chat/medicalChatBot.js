const groq_client = require("../utils/groq");

const medicalChatBot = async (userQuestion) => {
  const prompt = `
You are a professional and friendly medical assistant. 
You answer random medical questions asked by users in a clear, concise, and informative way.

Guidelines:
- Keep responses easy to understand.
- Be neutral and factual.
- If unsure, say "It's best to consult a healthcare provider."

Question:
${userQuestion}

Answer:
  `.trim();

  try {
    const chatCompletion = await groq_client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192",
    });

    const reply = chatCompletion.choices[0].message.content.trim();
    return reply;
  } catch (error) {
    console.error("Medical bot error:", error);
    return "Sorry, something went wrong. Please try again.";
  }
};

module.exports = medicalChatBot;