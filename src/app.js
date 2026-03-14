// app.js
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const { sequelize } = require("../db");
const md = require("../models/User"); // ensure it's used somewhere in your routes
const userRoute = require("../routes/userRoute");
const chatRoute = require("../routes/chatRoute"); // ✅ import chat route
// Gemini route (replaces legacy chatllama / mediAI proxies)
const geminiRoute = require("../routes/gemini");
const edutechRoute = require("../routes/edutech");
const projectManagementRoute = require("../routes/projectManagement");

dotenv.config();

const app = express();

// Middlewares
// Configure CORS to allow local frontend during development and required headers
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'X-Requested-With'],
  credentials: false,
};
// Use a permissive CORS header middleware for development to avoid preflight issues.
// This is intentionally simple and should be tightened for production.
app.use((req, res, next) => {
  const origin = process.env.FRONTEND_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-request-id');
  // allow credentials if you later need them
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  // Simple request logger to aid debugging (prints method/path and key headers)
  console.info('[server.req]', req.method, req.originalUrl, {
    origin: req.headers.origin,
    'x-request-id': req.headers['x-request-id'] || null,
    authorization: req.headers.authorization ? 'present' : 'missing',
  });
  next();
});

app.use(express.json({ limit: '5mb' }));

// Connect DB (authenticate and sync). Use connectDb to surface errors clearly.
const { connectDb } = require("../db");

connectDb({ sync: true })
  .then(() => {
    console.log("✅ Database connected and synced successfully");
  })
  .catch((err) => {
    console.error("❌ Unable to connect to DB:", err);
    // Optional: exit process if DB is critical
    // process.exit(1);
  });

// Routes
// Mount user routes under both /api and /api/user to be tolerant of different client calls
app.use("/api", userRoute);      // supports /api/login, /api/register, /api/me
app.use("/api/user", userRoute); // supports /api/user/login, etc.

// Chat routes mounted at /api/chat (kept separate)
app.use("/api/chat", chatRoute);
// Mount Gemini proxy under /api/gemini
app.use('/api/gemini', geminiRoute);
// EduTech routes for CPD courses, registration and payments
app.use('/api/edutech', edutechRoute);
// Project management routes
app.use('/api/projects', projectManagementRoute);

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Gemini-powered API" });
});

// Health ping (keeps compatibility with earlier scripts)
app.get('/ping', (req, res) => {
  res.json({ ok: true, pid: process.pid, time: Date.now() });
});

// Helpful debug endpoint to list mounts (useful to confirm which routes are registered)
app.get('/_routes', (req, res) => {
  try {
    const routes = [];
    app._router.stack.forEach((layer) => {
      if (layer.route && layer.route.path) {
        routes.push({ path: layer.route.path, methods: layer.route.methods });
      }
    });
    res.json({ count: routes.length, routes });
  } catch (err) {
    res.status(500).json({ error: 'failed_to_list_routes', detail: String(err) });
  }
});

// JSON 404 for unknown routes (avoid Express HTML response)
app.use((req, res) => {
  res.status(404).json({ error: 'not_found', path: req.originalUrl });
});

// Body parser / JSON error handler: return JSON instead of HTML when client sends invalid JSON
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    console.warn('[app] JSON parse error for', req.originalUrl, err.message);
    return res.status(400).json({ error: 'invalid_json', message: err.message });
  }
  // Pass through to default handler
  next(err);
});

// Export app for server.js
module.exports = app;
