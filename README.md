# APIForge — Collaborative API Playground

A production-structured Node.js/Express app that lets you test APIs in real-time.
Built for FAANG portfolios — demonstrates routing architecture, proxy patterns, Socket.io, and clean separation of concerns.

---

## 🚀 Quick Start

```bash
npm install
npm run dev
# open http://localhost:3000
```

---

## 📁 Project Structure

```
api-playground/
│
├── server/
│   ├── index.js                  # Entry point — Express + Socket.io wiring
│   ├── routes/
│   │   ├── proxy.js              # POST /api/proxy — core request forwarding
│   │   ├── collections.js        # GET/POST/DELETE /api/collections
│   │   ├── history.js            # GET/DELETE /api/history
│   │   └── environments.js       # GET /api/environments
│   ├── middleware/
│   │   ├── rateLimiter.js        # 60 req/min per IP via express-rate-limit
│   │   └── errorHandler.js       # Centralized error formatting
│   ├── socket/
│   │   └── events.js             # All Socket.io event handlers
│   └── store/
│       └── index.js              # In-memory store (Redis-ready abstraction)
│
├── public/
│   ├── index.html                # App shell
│   ├── css/
│   │   └── style.css             # Dark developer UI
│   └── js/
│       ├── app.js                # Boot, state, orchestration
│       ├── api.js                # All fetch() calls to backend
│       ├── socket.js             # Socket.io client + listeners
│       ├── ui.js                 # DOM rendering (no fetch, no logic)
│       └── highlight.js          # JSON syntax highlighting
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## 🧱 Architecture

```
Browser (HTML + JS modules)
    │
    ├─ app.js        ← orchestrator — owns state, calls API + UI
    ├─ api.js        ← all fetch() calls (one place to change base URL, auth, etc.)
    ├─ socket.js     ← real-time events in/out
    ├─ ui.js         ← pure DOM rendering, zero business logic
    └─ highlight.js  ← stateless JSON colorizer
         │
         │  HTTP + WebSocket
         ▼
Express Server (Node.js)
    │
    ├─ rateLimiter.js   → 60 req/min per IP
    ├─ /api/proxy       → axios forwards the request, logs to store, emits via socket
    ├─ /api/collections → CRUD for saved requests
    ├─ /api/history     → last 50 requests
    ├─ /api/environments→ variable names (values stay server-side)
    ├─ socket/events.js → user presence tracking
    ├─ store/index.js   → single source of truth (swap for Redis without touching routes)
    └─ errorHandler.js  → consistent { error: message } across all routes
         │
         │  axios
         ▼
    Any external API
```

---

## ✨ Features

| Feature | Implementation |
|---|---|
| **Proxy requests** | `POST /api/proxy` forwards via axios — solves CORS, centralizes auth |
| **Env variables** | `{{BASE_URL}}` in URLs resolved server-side per environment |
| **Request history** | In-memory, last 50 entries, broadcast to all clients |
| **Saved collections** | Grouped requests, persisted in store, synced via Socket.io |
| **Auth injection** | Bearer, Basic, API Key — added as headers before proxying |
| **Real-time presence** | Socket.io tracks which users are online and what they're viewing |
| **Rate limiting** | 60 requests/min per IP — prevents proxy abuse |
| **JSON highlighting** | Recursive colorizer, no dependencies |
| **Keyboard shortcut** | Ctrl/Cmd + Enter to send |

---

## 🔌 API Reference

### `POST /api/proxy`
Forward any HTTP request through the server.

```json
// Request body
{
  "method": "GET",
  "url": "https://api.example.com/users",
  "headers": { "X-Custom": "value" },
  "body": "{ \"name\": \"Alice\" }",
  "environment": "development"
}

// Response
{
  "status": 200,
  "statusText": "OK",
  "headers": { ... },
  "data": { ... },
  "duration": 142,
  "resolvedUrl": "https://api.example.com/users"
}
```

### `GET /api/collections`
Returns all saved request collections with their requests.

### `POST /api/collections/:id/requests`
Add a request to a collection. Body: `{ name, method, url, body }`.

### `DELETE /api/collections/:colId/requests/:reqId`
Remove a saved request.

### `GET /api/history`
Returns last 50 proxied requests: `[{ id, method, url, status, duration, timestamp }]`.

### `DELETE /api/history`
Clear all history. Broadcasts `history:cleared` to all connected clients.

### `GET /api/environments`
Returns environment names and their variable keys (values are never exposed to client).

---

## 📡 Socket.io Events

| Event | Direction | Payload |
|---|---|---|
| `users:update` | server → client | `[{ name, color, activeRequest }]` |
| `history:new` | server → client | `{ id, method, url, status, duration }` |
| `history:cleared` | server → client | — |
| `collection:updated` | server → client | `{ collectionId, action, request? }` |
| `presence:viewing` | client → server | `requestId` |

---

## 🗺️ What to build next

These are the upgrades that make this a real FAANG-level system design story:

### 1. Redis persistence
Replace `server/store/index.js` methods with Redis calls.
The abstraction is already there — routes don't need to change.

```js
// Current
getHistory() { return [..._data.history]; }

// With Redis
async getHistory() {
  const items = await redis.lrange('history', 0, 49);
  return items.map(JSON.parse);
}
```

### 2. JWT auth + team workspaces
Add `POST /api/auth/login` → return JWT.
Middleware reads token → scopes all store operations to `workspaceId`.

### 3. Request diffing
Store previous response per request ID.
Add `GET /api/diff/:requestId` → returns a unified diff of old vs new response.

### 4. Mock server mode
`POST /api/mocks` → define a route + fixture response.
Express registers it dynamically: `app[method](path, (req, res) => res.json(fixture))`.

### 5. cURL export
Convert any saved request to a cURL command string.
Pure function in `public/js/utils.js` — no backend needed.

### 6. Response timeline chart
Track `duration` per request in history.
Render a sparkline in the history drawer using Canvas API.

---

## 🎯 FAANG Interview Talking Points

**"Why a server-side proxy?"**
> Solves three problems: CORS restrictions, hiding auth tokens from the browser network tab, and giving us a central place to log/rate-limit all outbound traffic.

**"How does real-time sync work?"**
> Socket.io maintains a persistent WebSocket connection. When any client fires a request, the server saves it to the store and emits `history:new` — all other clients receive it instantly without polling.

**"How would you scale this horizontally?"**
> The store abstraction is the key. Swap `store/index.js` for Redis, and Socket.io for Socket.io + Redis adapter (`socket.io-redis`). Now multiple Node processes share state and can broadcast to each other's clients.

**"What's the rate limiter protecting against?"**
> The proxy could be abused to DDoS third-party APIs from our server's IP. Rate limiting per IP caps the blast radius.

**"Why are env variable values not exposed via `/api/environments`?"**
> Tokens and secrets shouldn't leave the server. The client only needs to know the variable names (to use `{{TOKEN}}` in URLs/headers). Resolution happens server-side.