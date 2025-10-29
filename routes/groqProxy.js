const express = require('express');
const router = express.Router();

// lightweight fetch which prefers global fetch (Node >=18) and falls back to node-fetch if needed
const getFetch = () => {
	if (typeof globalThis.fetch === 'function') return globalThis.fetch;
	return (...args) => import('node-fetch').then(({ default: f }) => f(...args));
};

// POST /api/groq?path=/v1/endpoint
router.post('/groq', async (req, res) => {
	try {
		const fetch = getFetch();
		const base = process.env.GROQ_API_URL || 'https://api.groq.ai/v1';
		const path = req.query.path || ''; // allow specifying a sub-path if needed
		const targetUrl = base.replace(/\/$/, '') + path;

		const response = await fetch(targetUrl, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
				'Content-Type': 'application/json',
				// forward any client-sent accept header if present
				'Accept': req.headers['accept'] || 'application/json',
			},
			body: JSON.stringify(req.body),
		});

		const status = response.status || 200;
		const text = await response.text();

		// small debug log to inspect what's coming back from Groq
		console.info(`[groqProxy] ${status} from Groq for ${req.originalUrl} — ${Math.min(200, text.length)} chars:`, text.slice(0, 200));

		try {
			const json = JSON.parse(text);
			return res.status(status).json(json);
		} catch (parseErr) {
			// Return wrapped raw text so frontend can parse reliably
			return res.status(status).json({ raw: text });
		}
	} catch (err) {
		console.error('[groqProxy] proxy error:', err);
		return res.status(500).json({ error: 'groq_proxy_error', detail: err.message });
	}
});

module.exports = router;