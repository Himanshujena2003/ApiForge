'use strict';

const express = require('express');
const store   = require('../store');

const router = express.Router();

// GET /api/environments
// Returns environment names and their variable keys (not values — keep tokens server-side)
router.get('/', (req, res) => {
  const envs = store.getEnvironments();
  // Only expose the variable names, not values — sensitive tokens stay on server
  const safeEnvs = Object.fromEntries(
    Object.entries(envs).map(([name, vars]) => [name, Object.keys(vars)])
  );
  res.json(safeEnvs);
});

module.exports = router;