'use strict';

// API module — all HTTP calls to the Express backend
// No DOM access. Returns data or throws.

const API = (() => {

  const BASE = '';   // Same origin — no need for absolute URL

  async function request(path, options = {}) {
    const res = await fetch(BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (res.status === 204) return null;   // No content

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    return data;
  }

  // ── Proxy ──────────────────────────────────────────────────────────────────
  async function proxyRequest({ method, url, headers, body, environment }) {
    return request('/api/proxy', {
      method: 'POST',
      body:   { method, url, headers, body, environment }
    });
  }

  // ── Collections ────────────────────────────────────────────────────────────
  async function getCollections() {
    return request('/api/collections');
  }

  async function saveRequestToCollection(collectionId, { name, method, url, body }) {
    return request(`/api/collections/${collectionId}/requests`, {
      method: 'POST',
      body:   { name, method, url, body }
    });
  }

  async function deleteRequest(collectionId, requestId) {
    return request(`/api/collections/${collectionId}/requests/${requestId}`, {
      method: 'DELETE'
    });
  }

  // ── History ────────────────────────────────────────────────────────────────
  async function getHistory() {
    return request('/api/history');
  }

  async function clearHistory() {
    return request('/api/history', { method: 'DELETE' });
  }

  return {
    proxyRequest,
    getCollections, saveRequestToCollection, deleteRequest,
    getHistory, clearHistory
  };
})();