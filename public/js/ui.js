'use strict';

// UI module — pure DOM manipulation, no fetch calls, no business logic.

const UI = (() => {

  // ── Collections ────────────────────────────────────────────────────────────
  function renderCollections(collections) {
    const el = document.getElementById('collectionList');
    el.innerHTML = collections.map(col => `
      <div class="col-group">
        <div class="col-name open" onclick="this.classList.toggle('open'); this.nextElementSibling.style.display = this.classList.contains('open') ? '' : 'none'">
          ${col.name}
        </div>
        <div class="col-items">
          ${col.requests.map(req => `
            <div class="req-item" data-col="${col.id}" data-req="${req.id}" onclick="App.loadRequest('${col.id}', '${req.id}', this)">
              <span class="m-tag ${req.method}">${req.method}</span>
              <span class="req-label">${req.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // ── History ────────────────────────────────────────────────────────────────
  function renderHistory(history) {
    const el = document.getElementById('historyList');
    if (!history.length) {
      el.innerHTML = '<div class="empty-state">No history yet</div>';
      return;
    }
    el.innerHTML = history.map(h => `
      <div class="history-item" onclick="App.replayHistory('${h.id}')">
        <span class="m-tag ${h.method}">${h.method}</span>
        <span class="h-url">${h.url}</span>
        <span class="status-badge ${statusClass(h.status)}">${h.status}</span>
        <span class="h-dur">${h.duration}ms</span>
      </div>
    `).join('');
  }

  // ── Response ───────────────────────────────────────────────────────────────
  function showResponse({ status, data, duration }) {
    const json = JSON.stringify(data, null, 2);

    setEl('statusBadge',   { text: status, cls: ['status-badge', statusClass(status)], show: true });
    setEl('durationBadge', { text: `${duration}ms`, show: true });
    setEl('sizeBadge',     { text: formatBytes(json.length), show: true });

    document.getElementById('responseBody').innerHTML = Highlight.highlight(json);
    window._lastResponse = json;
  }

  function showError(message) {
    clearMeta();
    document.getElementById('responseBody').innerHTML =
      `<span style="color:var(--red)">${message}</span>`;
  }

  function clearResponse() {
    clearMeta();
    document.getElementById('responseBody').innerHTML =
      '<span class="placeholder">Waiting for response...</span>';
  }

  function clearMeta() {
    ['statusBadge','durationBadge','sizeBadge'].forEach(id => {
      document.getElementById(id).classList.add('hidden');
    });
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────
  function switchTab(btn) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(btn.dataset.tab + 'Panel').classList.add('active');
  }

  // ── Headers KV ────────────────────────────────────────────────────────────
  function addHeaderRow(key = '', val = '') {
    const list = document.getElementById('headersList');

    if (!list.querySelector('.kv-header')) {
      const h = document.createElement('div');
      h.className = 'kv-header';
      h.innerHTML = '<span>Key</span><span>Value</span><span></span>';
      list.prepend(h);
    }

    const row = document.createElement('div');
    row.className = 'kv-row';
    row.innerHTML = `
      <input class="kv-key" placeholder="Header name" value="${key}" />
      <input class="kv-val" placeholder="Value" value="${val}" />
      <button class="kv-del" onclick="this.closest('.kv-row').remove()">✕</button>
    `;
    list.appendChild(row);
  }

  function getHeaders() {
    const headers = {};
    document.querySelectorAll('.kv-row:not(.kv-header)').forEach(row => {
      const [k, v] = row.querySelectorAll('input');
      if (k.value.trim()) headers[k.value.trim()] = v.value.trim();
    });
    return headers;
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  function renderAuthFields() {
    const type = document.getElementById('authType').value;
    const el   = document.getElementById('authFields');

    const fields = {
      none:   '',
      bearer: `<div class="field-row"><label>Token</label><input id="bearerToken" placeholder="eyJhbGci..." /></div>`,
      basic:  `<div class="field-row"><label>Username</label><input id="basicUser" /></div>
               <div class="field-row"><label>Password</label><input id="basicPass" type="password" /></div>`,
      apikey: `<div class="field-row"><label>Header name</label><input id="apiKeyName" placeholder="X-API-Key" /></div>
               <div class="field-row"><label>Value</label><input id="apiKeyVal" /></div>`
    };

    el.innerHTML = fields[type] || '';
  }

  function getAuthHeader() {
    const type = document.getElementById('authType').value;
    if (type === 'bearer') {
      const t = document.getElementById('bearerToken')?.value;
      return t ? { Authorization: `Bearer ${t}` } : {};
    }
    if (type === 'basic') {
      const u = document.getElementById('basicUser')?.value;
      const p = document.getElementById('basicPass')?.value;
      return (u && p) ? { Authorization: `Basic ${btoa(u + ':' + p)}` } : {};
    }
    if (type === 'apikey') {
      const k = document.getElementById('apiKeyName')?.value;
      const v = document.getElementById('apiKeyVal')?.value;
      return (k && v) ? { [k]: v } : {};
    }
    return {};
  }

  // ── Send button state ──────────────────────────────────────────────────────
  function setSending(on) {
    document.getElementById('sendBtn').disabled = on;
    document.getElementById('sendLabel').textContent = on ? 'Sending' : 'Send';
    document.getElementById('sendSpinner').classList.toggle('hidden', !on);
  }

  // ── Drawer ─────────────────────────────────────────────────────────────────
  function toggleHistory() {
    document.getElementById('historyDrawer').classList.toggle('hidden');
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function statusClass(s) {
    if (s >= 500) return 's5xx';
    if (s >= 400) return 's4xx';
    if (s >= 300) return 's3xx';
    return 's2xx';
  }

  function formatBytes(b) {
    return b < 1024 ? `${b} B` : `${(b / 1024).toFixed(1)} KB`;
  }

  function setEl(id, { text, cls, show }) {
    const el = document.getElementById(id);
    if (text !== undefined) el.textContent = text;
    if (cls)  el.className = cls.join(' ');
    if (show) el.classList.remove('hidden');
  }

  return {
    renderCollections, renderHistory,
    showResponse, showError, clearResponse,
    switchTab, addHeaderRow, getHeaders,
    renderAuthFields, getAuthHeader,
    setSending, toggleHistory, statusClass, formatBytes
  };
})();