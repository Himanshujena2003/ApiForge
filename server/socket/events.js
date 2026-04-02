'use strict';

// All Socket.io event logic lives here — keeps index.js clean
// connectedUsers: Map<socketId, { name, color, activeRequest }>

const connectedUsers = new Map();

const COLORS = ['#58a6ff', '#3fb950', '#d29922', '#a371f7', '#f78166'];

function registerSocketEvents(io) {
  io.on('connection', (socket) => {
    // Assign a random display name + color to this connection
    const name  = `User-${Math.floor(Math.random() * 9000 + 1000)}`;
    const color = COLORS[connectedUsers.size % COLORS.length];

    connectedUsers.set(socket.id, { name, color, activeRequest: null });

    // Send current user list to everyone
    io.emit('users:update', Array.from(connectedUsers.values()));

    // Client tells server which request they're currently looking at
    // Used to show "Priya is viewing GET /users" in the collab bar
    socket.on('presence:viewing', (requestId) => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        user.activeRequest = requestId;
        io.emit('users:update', Array.from(connectedUsers.values()));
      }
    });

    socket.on('disconnect', () => {
      connectedUsers.delete(socket.id);
      io.emit('users:update', Array.from(connectedUsers.values()));
    });
  });
}

module.exports = registerSocketEvents;