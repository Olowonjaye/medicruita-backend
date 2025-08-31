const { Groq } = require('groq-sdk');

// Initialize Groq client once
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports = groq;
