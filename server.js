const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const ensureJsonResponse = require('./middleware/ensureJsonResponse');
const geminiRoute = require('./routes/gemini');

const app = express();

app.use(cors()); // tighten origin in production
app.use(express.json({ limit: '2mb' }));
app.use(ensureJsonResponse);

// Simple request logger
app.use((req, res, next) => {
	console.info(`[server] ${req.method} ${req.originalUrl}`);
	next();
});

// Quick health endpoint to verify which process is responding on the port
app.get('/ping', (req, res) => {
    res.json({ ok: true, pid: process.pid, time: Date.now() });
});

// Mount Gemini proxy (no auth by default; add verifyToken if you want it protected)
app.use('/api/gemini', geminiRoute);

// User routes (register/login/me)
const userRoute = require('./routes/userRoute');
// Mount under both /api and /api/user to accept either client style
app.use('/api', userRoute);
app.use('/api/user', userRoute);

// Basic error handler
app.use((err, req, res, next) => {
	console.error('[server] Unhandled error:', err);
	res.status(500).json({ error: 'internal_server_error', detail: err.message });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
	console.log(`Server listening on ${port}`);
});