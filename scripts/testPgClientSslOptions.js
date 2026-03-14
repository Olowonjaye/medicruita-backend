const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('No DATABASE_URL');
  process.exit(2);
}

try {
  const u = new URL(connectionString);
  const host = u.hostname;
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
      servername: host,
      minVersion: 'TLSv1.2',
    },
  });
  (async () => {
    try {
      console.log('Connecting with ssl.servername=', host);
      await client.connect();
      const res = await client.query('SELECT NOW() as now');
      console.log('Connected OK:', res.rows[0]);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.error('pg client error (ssl options):');
      console.error(err && err.stack ? err.stack : err);
      try { await client.end(); } catch(e){}
      process.exit(1);
    }
  })();
} catch (e) {
  console.error('URL parse error', e && e.message ? e.message : e);
  process.exit(2);
}
