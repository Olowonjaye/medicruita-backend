const express = require('express');
const router = express.Router();
const { sendToGemini } = require('../lib/geminiClient');

// Log presence of GEMINI_API_KEY (masked) when the route module is loaded
try {
  if (process.env.GEMINI_API_KEY) {
    console.info('[gemini.route] GEMINI_API_KEY loaded:', '***' + String(process.env.GEMINI_API_KEY).slice(-4));
  } else {
    console.warn('[gemini.route] GEMINI_API_KEY is missing from process.env');
  }
} catch (e) {
  console.warn('[gemini.route] Error checking GEMINI_API_KEY', e && e.message ? e.message : e);
}

// POST /api/gemini
// Body: { prompt: string } OR { messages: [ { role, content } ] }
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : null;
    const messages = Array.isArray(body.messages) ? body.messages : (prompt ? [{ role: 'user', content: prompt }] : null);

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'missing_prompt_or_messages' });
    }

    const DEBUG = process.env.DEBUG === '1';
    if (DEBUG) console.info('[gemini.route] incoming request, messages:', messages.length);

    // Ensure API key is available either via request override or server env
    const apiKeyOverride = body.apiKey || body.api_key || undefined;
    if (!apiKeyOverride && !process.env.GEMINI_API_KEY) {
      console.error('[gemini.route] Missing GEMINI_API_KEY in environment and no apiKey provided in request');
      return res.status(500).json({ error: 'missing_gemini_api_key', detail: 'Set GEMINI_API_KEY in backend .env or pass apiKey in request body' });
    }

    const result = await sendToGemini({
      messages,
      model: body.model,
      max_tokens: typeof body.max_tokens === 'number' ? body.max_tokens : undefined,
      temperature: typeof body.temperature === 'number' ? body.temperature : undefined,
      apiKeyOverride,
      apiUrlOverride: body.apiUrl || body.api_url || undefined,
      timeoutMs: typeof body.timeoutMs === 'number' ? body.timeoutMs : 20000,
    });

    // If external provider failed or returned no reply, return a safe fallback reply
    if (!result || result.status >= 400 || !result.reply) {
      const fallback = 'I\'m having trouble contacting the assistant right now. Please try again later.';
      return res.status(200).json({ status: result?.status ?? 502, reply: fallback, raw: result?.raw ?? null, note: 'external_api_error' });
    }

    return res.status(200).json({ status: result.status, reply: result.reply, raw: result.raw });
  } catch (err) {
    console.error('[gemini.route] Error while proxying:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'gemini_proxy_error', detail: String(err && err.message ? err.message : err) });
  }
});

module.exports = router;
