const net = require('net');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) { console.error('No DATABASE_URL'); process.exit(2); }

try {
  const u = new URL(dbUrl);
  const host = u.hostname;
  const port = u.port || 5432;
  console.log('Testing TCP connect to', host, port);
  const s = net.connect({ host, port }, () => {
    console.log('TCP connect OK');
    s.end();
    process.exit(0);
  });
  s.on('error', (err) => {
    console.error('TCP error:', err && err.message ? err.message : err);
    process.exit(1);
  });
  // timeout after 8s
  s.setTimeout(8000, () => { console.error('TCP timeout'); s.destroy(); process.exit(1); });
} catch (e) {
  console.error('URL parse error', e && e.message ? e.message : e);
  process.exit(2);
}
