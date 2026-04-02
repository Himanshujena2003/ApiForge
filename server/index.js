'use strict';

require('dotenv').config();

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const path       = require('path');

const rateLimiter      = require('./middleware/rateLimiter');
const errorHandler     = require('./middleware/errorHandler');
const registerSockets  = require('./socket/events');

const proxyRoute        = require('./routes/proxy');
const collectionsRoute  = require('./routes/collections');
const historyRoute      = require('./routes/history');
const environmentsRoute = require('./routes/environments');

// ─── App Setup ────────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

// Make io accessible inside routes via req.app.locals.io
app.locals.io = io;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', rateLimiter);
app.use('/api/proxy',        proxyRoute);
app.use('/api/collections',  collectionsRoute);
app.use('/api/history',      historyRoute);
app.use('/api/environments', environmentsRoute);

// ─── Socket.io ────────────────────────────────────────────────────────────────
registerSockets(io);

// ─── Error Handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀  API Playground → http://localhost:${PORT}`);
  console.log(`    ENV: ${process.env.NODE_ENV || 'development'}\n`);
});