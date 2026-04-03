'use strict';

const express = require('express');
const axios   = require('axios');
const { v4: uuidv4 } = require('uuid');
const store   = require('../store');

const router = express.Router();

// POST /api/proxy
// Forwards any HTTP request on behalf of the client.
// Why a server-side proxy?
//   1. Avoids browser CORS restrictions
//   2. Hides sensitive auth tokens from the browser network tab
//   3. Central place to log and rate-limit all outbound requests
router.post('/', async (req, res, next) => {
  const { method, url, headers = {}, body, environment = 'development' } = req.body;

  if (!url)    return next({ status: 400, message: 'url is required' });
  if (!method) return next({ status: 400, message: 'method is required' });

  // Resolve {{VAR}} placeholders using the selected environment's values
  const envVars     = store.getEnvironment(environment);
  const resolvedUrl = url.replace(/\{\{(\w+)\}\}/g, (_, key) => envVars[key] || `{{${key}}}`);

  const start = Date.now();

  try {
    const config = {
      method:  method.toLowerCase(),
      url:     resolvedUrl,
      headers: { 'Content-Type': 'application/json', ...headers },
      timeout: 15_000,
      validateStatus: () => true  // Never throw on 4xx/5xx — return them to the client
    };

    if (['post', 'put', 'patch'].includes(config.method) && body) {
      config.data = typeof body === 'string' ? JSON.parse(body) : body;
    }

    const response = await axios(config);
    const duration = Date.now() - start;

    // Save to history
    store.addHistory({
      id:           uuidv4(),
      method,
      url:          resolvedUrl,
      status:       response.status,
      duration,
      timestamp:    new Date().toISOString(),
      responseSize: JSON.stringify(response.data).length
    });

    return res.json({
      status:     response.status,
      statusText: response.statusText,
      headers:    response.headers,
      data:       response.data,
      duration,
      resolvedUrl
    });

  } catch (err) {
    const duration = Date.now() - start;
    if (err.code === 'ECONNABORTED')         return next({ status: 408, message: 'Request timed out after 15s' });
    if (err.code === 'ENOTFOUND')            return next({ status: 502, message: `Could not resolve host: ${resolvedUrl}` });
    if (err.message.includes('Invalid URL')) return next({ status: 400, message: `Invalid URL: ${resolvedUrl}` });
    if (err.message.includes('JSON'))        return next({ status: 400, message: 'Invalid JSON in request body' });
    next({ status: 500, message: err.message, duration });
  }
});

module.exports = router;