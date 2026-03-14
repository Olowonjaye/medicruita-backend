const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('No DATABASE_URL');
  process.exit(2);
}

if (!/sslmode=/i.test(connectionString)) {
  connectionString = connectionString + '?sslmode=require';
}

(async () => {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    console.log('Connecting with sslmode=require');
    await client.connect();
    const res = await client.query('SELECT NOW() as now');
    console.log('Connected OK:', res.rows[0]);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('pg client error (sslmode):');
    console.error(err && err.stack ? err.stack : err);
    try { await client.end(); } catch(e){}
    process.exit(1);
  }
})();
