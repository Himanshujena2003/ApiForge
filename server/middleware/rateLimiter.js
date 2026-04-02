'use strict';

const rateLimit = require('express-rate-limit');

// 60 requests per minute per IP on /api/* routes
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Max 60 per minute.' }
});

module.exports = limiter;