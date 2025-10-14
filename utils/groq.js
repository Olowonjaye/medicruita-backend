const { Groq } = require('groq-sdk');

if (!process.env.GROQ_API_KEY) {
	console.error('[Groq] GROQ_API_KEY environment variable is NOT set!');
} else {
	console.log('[Groq] GROQ_API_KEY loaded:', process.env.GROQ_API_KEY ? '***' + process.env.GROQ_API_KEY.slice(-4) : '');
}

// Initialize Groq client once
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports = groq;
