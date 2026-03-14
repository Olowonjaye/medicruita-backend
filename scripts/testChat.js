#!/usr/bin/env node
// Simple Node script to POST a sample payload to /api/gemini and print the response.
// Usage: node backend/scripts/testChat.js [baseUrl]

const DEFAULT_BASE = process.env.API_BASE || process.argv[2] || 'http://localhost:5000';

async function main() {
  const base = DEFAULT_BASE.replace(/\/+$/, '');
  const url = `${base}/api/gemini`;

  const payload = {
    sessionId: 'test-session-' + Date.now(),
    messages: [{ role: 'user', content: 'Hello — please respond with a short test message' }]
  };

  console.log('POST', url);
  console.log('payload:', JSON.stringify(payload));

  // Use global fetch if available (Node 18+), otherwise try to import node-fetch
  let fetchFn = globalThis.fetch;
  if (typeof fetchFn !== 'function') {
    try {
      const nodeFetch = await import('node-fetch');
      fetchFn = nodeFetch.default;
    } catch (e) {
      console.error('No fetch available. Please run on Node 18+ or install node-fetch.');
      process.exit(1);
    }
  }

  try {
    const resp = await fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-request-id': `script-${Date.now()}`
      },
      body: JSON.stringify(payload),
    });

    const status = resp.status;
    const text = await resp.text();
    console.log('status:', status);

    try {
      const json = text ? JSON.parse(text) : null;
      console.log('json:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('raw text response:', text);
    }
  } catch (err) {
    console.error('Network/error:', err);
    process.exit(2);
  }
}

main();
