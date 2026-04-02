'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store   = require('../store');

const router = express.Router();

// GET /api/collections
router.get('/', (req, res) => {
  res.json(store.getCollections());
});

// POST /api/collections/:collectionId/requests
// Save a new request into an existing collection
router.post('/:collectionId/requests', (req, res, next) => {
  const { name, method, url, body } = req.body;

  if (!name || !method || !url) {
    return next({ status: 400, message: 'name, method, and url are required' });
  }

  const newRequest = { id: uuidv4(), name, method, url, body: body || '' };
  const saved = store.addRequestToCollection(req.params.collectionId, newRequest);

  if (!saved) return next({ status: 404, message: 'Collection not found' });

  // Broadcast to all clients so sidebars update in real-time
  req.app.locals.io.emit('collection:updated', {
    collectionId: req.params.collectionId,
    request:      newRequest,
    action:       'add'
  });

  res.status(201).json(newRequest);
});

// DELETE /api/collections/:collectionId/requests/:requestId
router.delete('/:collectionId/requests/:requestId', (req, res, next) => {
  const deleted = store.deleteRequestFromCollection(
    req.params.collectionId,
    req.params.requestId
  );

  if (!deleted) return next({ status: 404, message: 'Request or collection not found' });

  req.app.locals.io.emit('collection:updated', {
    collectionId: req.params.collectionId,
    requestId:    req.params.requestId,
    action:       'delete'
  });

  res.status(204).send();
});

module.exports = router;