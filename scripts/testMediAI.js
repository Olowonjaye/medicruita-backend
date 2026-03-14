// Simple test script to POST to /api/gemini
const url = process.argv[2] || 'http://localhost:5001';
const endpoint = (url.replace(/\/$/, '') + '/api/gemini');

async function run() {
  try {
    const payload = { messages: [{ role: 'user', content: 'Hello from test script - please reply briefly.' }] };
    // Use global fetch if available (Node 18+), otherwise dynamic import
    const fetchFn = (typeof globalThis.fetch === 'function')
      ? globalThis.fetch
      : (...args) => import('node-fetch').then(m => m.default(...args));

    console.log('[testMediAI] Posting to', endpoint);
    const resp = await fetchFn(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await resp.text();
    console.log('[testMediAI] status=', resp.status);
    try {
      console.log('[testMediAI] json=', JSON.parse(text));
    } catch (e) {
      console.log('[testMediAI] raw=', text);
    }
  } catch (err) {
    console.error('[testMediAI] Error', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

run();
