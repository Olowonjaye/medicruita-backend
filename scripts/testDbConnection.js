// testDbConnection.js — quick helper to test Sequelize DB auth and show full error
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { sequelize } = require('../db');

(async () => {
  try {
    console.log('Testing DB connection to:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@') : '<no DATABASE_URL>');
    await sequelize.authenticate();
    console.log('✅ sequelize.authenticate() succeeded');
    process.exit(0);
  } catch (err) {
    console.error('❌ sequelize.authenticate() failed');
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
