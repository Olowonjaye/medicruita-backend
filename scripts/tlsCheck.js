const tls = require('tls');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) { console.error('No DATABASE_URL'); process.exit(2); }
const u = new URL(dbUrl);
const host = u.hostname;
const port = u.port ? parseInt(u.port, 10) : 5432;

console.log('TLS connect to', host, port);
const sock = tls.connect({ host, port, servername: host, rejectUnauthorized: false }, () => {
  console.log('TLS connected');
  console.log('authorized=', sock.authorized, 'protocol=', sock.getProtocol());
  try {
    console.log('peer cert:', sock.getPeerCertificate());
  } catch (e) {}
  sock.end();
  process.exit(0);
});

sock.on('error', (err) => {
  console.error('TLS error:', err && err.message ? err.message : err);
  if (err && err.stack) console.error(err.stack);
  process.exit(1);
});

sock.setTimeout(8000, () => { console.error('TLS timeout'); sock.destroy(); process.exit(1); });
