const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const ensureJsonResponse = require('./middleware/ensureJsonResponse');
const chatLlamaRoute = require('./routes/chatLlama');

const app = express();

app.use(cors()); // tighten origin in production
app.use(express.json({ limit: '2mb' }));
app.use(ensureJsonResponse);

// Simple request logger
app.use((req, res, next) => {
	console.info(`[server] ${req.method} ${req.originalUrl}`);
	next();
});

// Mount ChatLlama proxy (no auth by default; add verifyToken if you want it protected)
app.use('/api', chatLlamaRoute);

// Basic error handler
app.use((err, req, res, next) => {
	console.error('[server] Unhandled error:', err);
	res.status(500).json({ error: 'internal_server_error', detail: err.message });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
	console.log(`Server listening on ${port}`);
});