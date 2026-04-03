'use strict';

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');

const rateLimiter      = require('./middleware/rateLimiter');
const errorHandler     = require('./middleware/errorHandler');

const proxyRoute        = require('./routes/proxy');
const collectionsRoute  = require('./routes/collections');
const historyRoute      = require('./routes/history');
const environmentsRoute = require('./routes/environments');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api', rateLimiter);
app.use('/api/proxy',        proxyRoute);
app.use('/api/collections',  collectionsRoute);
app.use('/api/history',      historyRoute);
app.use('/api/environments', environmentsRoute);

// ── Error Handler ──────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀  APIForge → http://localhost:${PORT}\n`);
});