const express = require('express');
const router = express.Router();

const getFetch = () => {
	// prefer global fetch (node 18+), otherwise dynamic import of node-fetch
	if (typeof globalThis.fetch === 'function') return globalThis.fetch;
	return (...args) => import('node-fetch').then(({ default: f }) => f(...args));
};

function extractReplyFromJson(json) {
	// Attempt multiple common shapes to find a human-readable reply string
	try {
		if (json == null) return null;
		if (typeof json === 'string' && json.trim()) return json;
		if (typeof json.output_text === 'string' && json.output_text.trim()) return json.output_text;
		if (typeof json.generated_text === 'string' && json.generated_text.trim()) return json.generated_text;
		if (typeof json.result === 'string' && json.result.trim()) return json.result;
		if (typeof json.output === 'string' && json.output.trim()) return json.output;

		if (Array.isArray(json.choices) && json.choices.length > 0) {
			const first = json.choices[0];
			if (first?.message) {
				if (typeof first.message.content === 'string' && first.message.content.trim()) return first.message.content;
				if (typeof first.message.text === 'string' && first.message.text.trim()) return first.message.text;
			}
			if (first?.delta) {
				if (typeof first.delta.content === 'string' && first.delta.content.trim()) return first.delta.content;
				if (typeof first.delta.text === 'string' && first.delta.text.trim()) return first.delta.text;
			}
			if (typeof first.text === 'string' && first.text.trim()) return first.text;
		}

		if (Array.isArray(json.results) && json.results.length > 0) {
			for (const r of json.results) {
				if (typeof r.output_text === 'string' && r.output_text.trim()) return r.output_text;
				if (Array.isArray(r.content) && r.content.length > 0) {
					for (const c of r.content) {
						if (typeof c === 'string' && c.trim()) return c;
						if (c?.text && typeof c.text === 'string' && c.text.trim()) return c.text;
					}
				}
			}
		}

		if (json.raw && typeof json.raw === 'object') {
			const nested = extractReplyFromJson(json.raw);
			if (nested) return nested;
		}

		return null;
	} catch (e) {
		return null;
	}
}

function tryParseNDJSON(text) {
	// Try to extract last JSON object from NDJSON / streaming "data: {...}\n\n" lines
	try {
		if (!text) return null;
		const lines = text.split(/\r?\n/).filter(Boolean);
		for (let i = lines.length - 1; i >= 0; i--) {
			let line = lines[i].trim();
			if (!line) continue;
			// strip "data:" prefix if present
			if (line.startsWith('data:')) line = line.slice(5).trim();
			try {
				const parsed = JSON.parse(line);
				return parsed;
			} catch (e) {
				continue;
			}
		}
		return null;
	} catch (e) {
		return null;
	}
}

// In-memory map to track in-progress requests and avoid duplicate Groq calls.
// Key: 'id:<requestId>' or 'payload:<jsonSignature>'
// Value: Promise resolving to { status, reply, raw }
const inFlight = new Map();

async function performGroqCall(groqUrl, outgoing) {
	const fetch = getFetch();
	// Use AbortController to enforce a timeout for external API calls
	const controller = new AbortController();
	const timeoutMs = Number(process.env.GROQ_REQUEST_TIMEOUT_MS || 30000);
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		console.info('[performGroqCall] groqUrl=', groqUrl, 'outgoingSnippet=', JSON.stringify(outgoing).slice(0,400));
		const resp = await fetch(groqUrl, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
				'Content-Type': 'application/json',
				'Accept': 'application/json, text/event-stream, */*',
			},
			body: JSON.stringify(outgoing),
			signal: controller.signal,
		});

		clearTimeout(timeout);

		const status = resp.status || 500;
		const text = await resp.text();

		// Log non-OK responses to help debug 502/4xx/5xx
		if (!resp.ok) {
			console.error('[performGroqCall] Groq responded with error', { status, textSnippet: (text||'').slice(0,800) });
			return { status, reply: null, raw: text, error: `Groq returned status ${status}` };
		}

		let parsed = null;
		let reply = null;

		// Try JSON parse
		try {
			parsed = text ? JSON.parse(text) : null;
			reply = extractReplyFromJson(parsed);
		} catch (parseErr) {
			parsed = tryParseNDJSON(text);
			if (parsed) reply = extractReplyFromJson(parsed);
		}

		// Always return structured result
		return { status, reply, raw: parsed ?? text };
	} catch (err) {
		clearTimeout(timeout);
		if (err && err.name === 'AbortError') {
			console.error('[performGroqCall] Request to Groq aborted due to timeout', { timeoutMs });
			return { status: 504, reply: null, raw: null, error: 'timeout' };
		}
		console.error('[performGroqCall] Network/fetch failure', err && err.message ? err.message : err);
		return { status: 502, reply: null, raw: null, error: String(err && err.message ? err.message : err) };
	}
}

// Core handler shared by both /chatllama and /chat (alias)
const chatHandler = async (req, res) => {
	// Log incoming request once
	const incomingId = req.headers['x-request-id'] || req.body?.requestId || null;
	const payloadSignature = (() => {
		try {
			// limit signature length to avoid huge keys
			const s = JSON.stringify(req.body || {});
			return s.length > 2000 ? s.slice(0, 2000) : s;
		} catch (e) {
			return String(Date.now());
		}
	})();

	console.info(`[chatLlama] HTTP ${req.method} ${req.originalUrl} incomingId=${incomingId} sig=${payloadSignature.slice(0,80)}`);

	// Validate API key
	if (!process.env.GROQ_API_KEY) {
		console.error('[chatLlama] Missing GROQ_API_KEY in environment');
		return res.status(500).json({ reply: '', error: 'missing_groq_api_key' });
	}

	// Validate body presence
	const body = req.body || {};
	// Accept several incoming shapes for the user content to be forgiving of different clients
	const userQuestion = (typeof body.userQuestion === 'string' && body.userQuestion.trim())
		|| (typeof body.user_question === 'string' && body.user_question.trim())
		|| (typeof body.input === 'string' && body.input.trim())
		|| (typeof body.prompt === 'string' && body.prompt.trim())
		|| null;
	const hasMessages = Array.isArray(body.messages) && body.messages.length > 0;
	if (!hasMessages && !userQuestion) {
		console.warn('[chatLlama] Request missing messages/userQuestion/prompt/input');
		return res.status(400).json({ reply: '', error: 'missing_messages_or_prompt' });
	}

	// Build outgoing body and groqUrl. Normalize to a `messages` array if only a single userQuestion provided.
	const outgoing = { ...body };
	if (!outgoing.messages || !Array.isArray(outgoing.messages) || outgoing.messages.length === 0) {
		if (userQuestion) {
			outgoing.messages = [{ role: 'user', content: userQuestion }];
		}
	}
	if (!outgoing.model) outgoing.model = 'llama3-8b-8192';
	let groqUrl = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
	if (!/\/chat\/?completions$/i.test(groqUrl) && !/\/chat\.completions$/i.test(groqUrl)) {
		groqUrl = groqUrl.replace(/\/$/, '') + '/chat/completions';
	}

	// Choose dedupe key: prefer incomingId if provided, otherwise payload signature
	const key = incomingId ? `id:${incomingId}` : `payload:${payloadSignature}`;

	// If identical request is already in-flight, wait on it and return its result
	if (inFlight.has(key)) {
		console.info(`[chatLlama] Duplicate request detected for key=${key} — awaiting in-flight result`);
		try {
			const result = await inFlight.get(key);
			// ensure reply returned as string (or empty string)
			const replyStr = result && result.reply ? String(result.reply) : '';
			return res.status(result.status >= 400 ? 502 : 200).json({ reply: replyStr, raw: result.raw ?? null, note: 'deduped_inflight' });
		} catch (err) {
			console.error('[chatLlama] Error awaiting in-flight promise:', err);
			return res.status(500).json({ reply: '', error: 'inflight_await_error' });
		}
	}

	// Not in-flight; create and store promise so duplicates can await it
	const promise = (async () => {
		try {
			console.info(`[chatLlama] Performing Groq call for key=${key}`);
			const result = await performGroqCall(groqUrl, outgoing);
			// normalize reply to string or null
			if (result && result.reply) result.reply = String(result.reply);
			return result;
		} catch (err) {
			return { status: 502, reply: null, raw: null, error: String(err.message || err) };
		}
	})();

	inFlight.set(key, promise);

	try {
		const result = await promise;
		// remove from inFlight map after completion
		inFlight.delete(key);

		if (!result || !result.reply) {
			console.warn(`[chatLlama] No reply extracted for key=${key} status=${result?.status}`);
			const statusToReturn = result?.status >= 400 ? 502 : 200;
			return res.status(statusToReturn).json({ reply: '', raw: result?.raw ?? null, note: result?.error ? 'error' : 'no_extracted_reply' });
		}

		// success
		console.info(`[chatLlama] Success for key=${key} reply-length=${String(result.reply).length}`);
		return res.status(200).json({ reply: result.reply, raw: result.raw ?? null });
	} catch (err) {
		inFlight.delete(key);
		console.error('[chatLlama] Unhandled error while processing request:', err);
		return res.status(500).json({ reply: '', error: 'internal_error', detail: String(err.message || err) });
	}
};

// POST /api/chatllama
router.post('/chatllama', chatHandler);

// Backwards-compatible alias: POST /api/chat
// Some older frontend code may still call /api/chat — accept it and forward to same handler.
router.post('/chat', (req, res) => {
	console.warn('[chatLlama] Received request to deprecated /api/chat — handling with chatHandler');
	return chatHandler(req, res);
});

module.exports = router;