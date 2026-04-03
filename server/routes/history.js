'use strict';

const express = require('express');
const store   = require('../store');

const router = express.Router();

// GET /api/history
router.get('/', (req, res) => {
  res.json(store.getHistory());
});

// DELETE /api/history
// Clear all history and notify all clients
router.delete('/', (req, res) => {
  store.clearHistory();
  res.status(204).send();
});

module.exports = router;