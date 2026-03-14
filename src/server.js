// server.js
// Ensure backend .env is loaded even when the process cwd isn't the backend folder
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const app = require('./app');

const PORT = process.env.PORT || 5000;
// Helpful startup diagnostics
console.log(`Server starting — port=${PORT}`);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
