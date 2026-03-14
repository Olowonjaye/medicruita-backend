// geminiClient.js
// Use Google service account OAuth and call the canonical Generative Language
// `models:generateMessage` REST endpoint. Falls back to API key if provided.
const DEFAULT_BASE = 'https://generativelanguage.googleapis.com/v1';
const fs = require('fs');
let GoogleAuth = null;
try {
  GoogleAuth = require('google-auth-library').GoogleAuth;
} catch (e) {
  GoogleAuth = null;
}

const getFetch = () => {
  if (typeof globalThis.fetch === 'function') return globalThis.fetch;
  let cached = null;
  return async (...args) => {
    if (!cached) {
      const mod = await import('node-fetch');
      cached = mod.default || mod;
    }
    return cached(...args);
  };
};

async function obtainAccessTokenFromSA(saJson) {
  if (!GoogleAuth) return null;
  let creds = saJson;
  if (typeof saJson === 'string') {
    try { creds = JSON.parse(saJson); } catch (e) { creds = null; }
  }
  if (!creds || !creds.client_email) return null;
  const auth = new GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const client = await auth.getClient();
  const at = await client.getAccessToken();
  return at && at.token ? at.token : (typeof at === 'string' ? at : null);
}

function extractReplyFromJson(json) {
  try {
    if (!json) return null;
    // v1 responses often include `candidates` or `output` or `reply` fields
    if (Array.isArray(json.candidates) && json.candidates.length > 0) {
      const c = json.candidates[0];
      if (c && Array.isArray(c.content)) return c.content.map(x => x.text || '').join(' ').trim();
      if (c?.text) return c.text;
    }
    if (json.output && Array.isArray(json.output)) {
      return json.output.map(r => (Array.isArray(r.content) ? r.content.map(c => c.text || '').join(' ') : r.text || '')).join('\n').trim();
    }
    if (json.reply && typeof json.reply === 'string') return json.reply;
    return null;
  } catch (e) { return null; }
}

async function sendToGemini(options = {}) {
  const fetch = getFetch();
  const {
    messages,
    prompt,
    temperature,
    max_tokens,
    apiKeyOverride,
    apiUrlOverride,
    model: modelOverride,
    timeoutMs = 20000,
  } = options;

  const model = modelOverride || process.env.GEMINI_AI_MODEL || process.env.GOOGLE_AI_MODEL || 'gemini-2.5-flash';

  // Build user text
  let text = '';
  if (Array.isArray(messages) && messages.length > 0) {
    // prefer last user message
    const last = messages[messages.length - 1];
    text = last.content || last.text || (typeof last === 'string' ? last : '');
  } else if (typeof prompt === 'string' && prompt.trim()) {
    text = prompt.trim();
  } else {
    throw new Error('missing_prompt_or_messages');
  }

  // Determine endpoint URL
  let apiUrl = apiUrlOverride || process.env.GEMINI_API_URL || `${DEFAULT_BASE}/models/${encodeURIComponent(model)}:generateMessage`;

  // Support API key usage by appending ?key= if provided and appears to be an API key
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const looksLikeApiKey = typeof apiKey === 'string' && apiKey.startsWith('AIza');
  if (looksLikeApiKey && !/[?&]key=/.test(apiUrl)) {
    apiUrl = apiUrl + (apiUrl.includes('?') ? '&' : '?') + `key=${encodeURIComponent(apiKey)}`;
  }

  // Collect service-account JSON if provided
  let saJson = process.env.GEMINI_SA_KEY || process.env.GEMINI_SA || undefined;
  if (!saJson && process.env.GEMINI_SA_FILE) {
    try { saJson = fs.readFileSync(process.env.GEMINI_SA_FILE, 'utf8'); } catch (e) { saJson = undefined; }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Try to obtain OAuth token from service account if available
    let oauthToken = null;
    if (saJson && GoogleAuth) {
      try { oauthToken = await obtainAccessTokenFromSA(saJson); } catch (e) { oauthToken = null; }
    }

    // Build headers
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (oauthToken) {
      headers.Authorization = `Bearer ${oauthToken}`;
    } else if (!looksLikeApiKey && apiKey) {
      // If apiKey is not an API key starting with 'AIza', assume it's an OAuth token
      headers.Authorization = `Bearer ${apiKey}`;
    }

    // Build canonical payload for generateMessage
    const payload = {
      message: {
        author: 'user',
        content: [{ type: 'text', text }],
      },
    };
    if (typeof temperature === 'number') payload.temperature = temperature;
    if (typeof max_tokens === 'number') payload.maxOutputTokens = max_tokens;

    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const status = resp.status || 500;
    const textResp = await resp.text();
    try {
      const json = textResp ? JSON.parse(textResp) : null;
      const reply = extractReplyFromJson(json) || null;
      return { ok: status >= 200 && status < 300, status, reply, raw: json };
    } catch (parseErr) {
      return { ok: status >= 200 && status < 300, status, reply: textResp, raw: textResp };
    }
  } catch (err) {
    clearTimeout(timeout);
    if (err && err.name === 'AbortError') {
      const e = new Error('timeout');
      e.code = 'timeout';
      throw e;
    }
    throw err;
  }
}

module.exports = { sendToGemini };
