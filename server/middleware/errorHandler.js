'use strict';

// Central error handler — all routes call next(err) to land here
// Keeps error formatting consistent across the entire API

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${req.method}] ${req.path} → ${status}: ${message}`);
  }

  res.status(status).json({ error: message });
}

module.exports = errorHandler;