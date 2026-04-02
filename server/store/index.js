'use strict';

// ─── In-Memory Store ──────────────────────────────────────────────────────────
// All state lives here. To migrate to Redis:
//   1. Replace each method body with a Redis call (GET, SET, LPUSH, etc.)
//   2. Make methods async (they already return values, just wrap in Promise)
//   3. No route or socket code needs to change — they all go through this API

const _data = {
  history: [],
  collections: [
    {
      id: 'col-1',
      name: 'User Service',
      requests: [
        { id: 'r-1', name: 'List users',  method: 'GET',    url: 'https://jsonplaceholder.typicode.com/users',   body: '' },
        { id: 'r-2', name: 'Get user',    method: 'GET',    url: 'https://jsonplaceholder.typicode.com/users/1', body: '' },
        { id: 'r-3', name: 'Create user', method: 'POST',   url: 'https://jsonplaceholder.typicode.com/users',   body: '{\n  "name": "John Doe",\n  "email": "john@example.com"\n}' },
        { id: 'r-4', name: 'Update user', method: 'PUT',    url: 'https://jsonplaceholder.typicode.com/users/1', body: '{\n  "name": "Jane Doe"\n}' },
        { id: 'r-5', name: 'Delete user', method: 'DELETE', url: 'https://jsonplaceholder.typicode.com/users/1', body: '' }
      ]
    },
    {
      id: 'col-2',
      name: 'Posts API',
      requests: [
        { id: 'r-6', name: 'All posts',   method: 'GET',  url: 'https://jsonplaceholder.typicode.com/posts',  body: '' },
        { id: 'r-7', name: 'Create post', method: 'POST', url: 'https://jsonplaceholder.typicode.com/posts',  body: '{\n  "title": "Hello World",\n  "body": "Post content here",\n  "userId": 1\n}' }
      ]
    }
  ],
  environments: {
    development: { BASE_URL: 'https://jsonplaceholder.typicode.com', TOKEN: 'dev-token-123' },
    staging:     { BASE_URL: 'https://staging.api.example.com',      TOKEN: 'stg-token-456' },
    production:  { BASE_URL: 'https://api.example.com',              TOKEN: 'prod-token-789' }
  }
};

const HISTORY_LIMIT = 50;

const store = {
  // ── History ────────────────────────────────────────────────────────────────
  getHistory()            { return [..._data.history]; },
  addHistory(entry)       {
    _data.history.unshift(entry);
    if (_data.history.length > HISTORY_LIMIT) _data.history.pop();
  },
  clearHistory()          { _data.history = []; },

  // ── Collections ────────────────────────────────────────────────────────────
  getCollections()        { return _data.collections; },
  getCollection(id)       { return _data.collections.find(c => c.id === id) || null; },
  addRequestToCollection(colId, request) {
    const col = store.getCollection(colId);
    if (!col) return null;
    col.requests.push(request);
    return request;
  },
  deleteRequestFromCollection(colId, reqId) {
    const col = store.getCollection(colId);
    if (!col) return false;
    const before = col.requests.length;
    col.requests = col.requests.filter(r => r.id !== reqId);
    return col.requests.length < before;
  },

  // ── Environments ───────────────────────────────────────────────────────────
  getEnvironments()       { return _data.environments; },
  getEnvironment(name)    { return _data.environments[name] || {}; }
};

module.exports = store;