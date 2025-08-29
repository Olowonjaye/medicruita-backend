const app = require('./app');
require('dotenv').config();
const { connectDb } = require('../db');

// Connect to database
connectDb();

// Ensure PORT always falls back to 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
