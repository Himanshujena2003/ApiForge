'use strict';

// App — orchestrator. Owns state, calls API, calls UI.

const App = (() => {

  const state = {
    collections: [],
    history:     [],
    environment: 'development'
  };

  // ── Boot ───────────────────────────────────────────────────────────────────
  async function boot() {
    await loadCollections();
    await loadHistory();
    UI.addHeaderRow();
    UI.renderAuthFields();

    document.getElementById('envSelect').addEventListener('change', (e) => {
      state.environment = e.target.value;
    });

    // Ctrl/Cmd + Enter → send
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') send();
    });
  }

  // ── Collections ────────────────────────────────────────────────────────────
  async function loadCollections() {
    state.collections = await API.getCollections();
    UI.renderCollections(state.collections);
  }

  function loadRequest(colId, reqId, el) {
    const col = state.collections.find(c => c.id === colId);
    const req = col?.requests.find(r => r.id === reqId);
    if (!req) return;

    document.getElementById('methodSelect').value = req.method;
    document.getElementById('urlInput').value     = req.url;
    document.getElementById('bodyEditor').value   = req.body || '';
    document.getElementById('reqNameInput').value = req.name;

    document.querySelectorAll('.req-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
  }

  async function saveRequest() {
    const name   = document.getElementById('reqNameInput').value.trim();
    const method = document.getElementById('methodSelect').value;
    const url    = document.getElementById('urlInput').value.trim();
    const body   = document.getElementById('bodyEditor').value;

    if (!name) return alert('Enter a request name first.');
    if (!url)  return alert('Enter a URL first.');

    const colId = state.collections[0]?.id;
    if (!colId) return;

    await API.saveRequestToCollection(colId, { name, method, url, body });
    await loadCollections();
  }

  // ── Send ───────────────────────────────────────────────────────────────────
  async function send() {
    const method = document.getElementById('methodSelect').value;
    const url    = document.getElementById('urlInput').value.trim();
    const body   = document.getElementById('bodyEditor').value.trim();

    if (!url) return;

    const headers = { ...UI.getHeaders(), ...UI.getAuthHeader() };

    UI.setSending(true);
    UI.clearResponse();

    try {
      const result = await API.proxyRequest({
        method, url, headers, body,
        environment: state.environment
      });
      UI.showResponse(result);
    } catch (err) {
      UI.showError(err.message);
    } finally {
      UI.setSending(false);
      // Refresh history after every request
      await loadHistory();
    }
  }

  // ── History ────────────────────────────────────────────────────────────────
  async function loadHistory() {
    state.history = await API.getHistory();
    UI.renderHistory(state.history);
  }

  function replayHistory(id) {
    const entry = state.history.find(h => h.id === id);
    if (!entry) return;
    document.getElementById('urlInput').value     = entry.url;
    document.getElementById('methodSelect').value = entry.method;
    UI.toggleHistory();
  }

  async function clearHistory() {
    await API.clearHistory();
    state.history = [];
    UI.renderHistory(state.history);
  }

  function copyResponse() {
    if (window._lastResponse) navigator.clipboard.writeText(window._lastResponse);
  }

  // ── Start ──────────────────────────────────────────────────────────────────
  boot();

  return {
    send, loadCollections, loadRequest, saveRequest,
    loadHistory, replayHistory, clearHistory, copyResponse
  };
})();