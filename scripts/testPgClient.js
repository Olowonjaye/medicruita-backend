const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('No DATABASE_URL');
  process.exit(2);
}

(async () => {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  try {
    console.log('Connecting with pg client...');
    await client.connect();
    const res = await client.query('SELECT NOW() as now');
    console.log('Connected OK:', res.rows[0]);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('pg client error:');
    console.error(err && err.stack ? err.stack : err);
    try { await client.end(); } catch(e){}
    process.exit(1);
  }
})();
