'use strict';

// Socket.io client — all real-time event listeners in one place
// Exposes SocketClient.emit() so app.js can send presence events

const SocketClient = (() => {
  const socket = io();

  // ── Inbound events (server → client) ──────────────────────────────────────
  socket.on('users:update', (users) => {
    UI.renderUsers(users);
  });

  socket.on('history:new', (entry) => {
    App.onNewHistoryEntry(entry);
  });

  socket.on('history:cleared', () => {
    App.onHistoryCleared();
  });

  socket.on('collection:updated', () => {
    App.loadCollections();
  });

  // ── Outbound events (client → server) ─────────────────────────────────────
  function emitViewing(requestId) {
    socket.emit('presence:viewing', requestId);
  }

  return { emitViewing };
})();