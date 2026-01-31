# Sprint Story Point

A real-time Planning Poker application for agile sprint estimation. Built with Cloudflare Workers and Durable Objects for instant, scalable collaboration.

## Features

- **Real-time Collaboration** - Instant vote synchronization across all participants
- **No Signup Required** - Create a room and share the link
- **Multiple Decks** - Fibonacci, T-shirt sizes, or custom values
- **Fun Mode** - Confetti, celebrations, and fortune cookies
- **Chat** - In-room chat with emoji reactions
- **CSV Export** - Export session results for documentation
- **24-hour TTL** - Rooms automatically expire for privacy

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSERS                                │
│                                                                          │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│   │   Host      │  │ Participant │  │ Participant │  │ Participant │   │
│   │ (Creator)   │  │     #1      │  │     #2      │  │     #N      │   │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
│          │                │                │                │          │
│          │    WebSocket (wss://)           │                │          │
│          └────────────────┼────────────────┼────────────────┘          │
│                           │                │                            │
└───────────────────────────┼────────────────┼────────────────────────────┘
                            │                │
                            ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE EDGE (Global)                             │
│                                                                          │
│   ┌───────────────────────────────────────────────────────────────┐     │
│   │                    Cloudflare Worker                          │     │
│   │                    (worker/src/worker.ts)                     │     │
│   │                                                               │     │
│   │   Routes:                                                     │     │
│   │   • POST /api/rooms         → Create room                     │     │
│   │   • GET  /api/rooms/:id/state → Get state snapshot           │     │
│   │   • WS   /api/rooms/:id/ws  → WebSocket upgrade              │     │
│   │   • GET  /api/health        → Health check                    │     │
│   └───────────────────────────────────────────────────────────────┘     │
│                                    │                                     │
│                                    ▼                                     │
│   ┌───────────────────────────────────────────────────────────────┐     │
│   │                    Durable Object (RoomDO)                    │     │
│   │                    (worker/src/room-do.ts)                    │     │
│   │                                                               │     │
│   │   State:                     Features:                        │     │
│   │   • participants             • WebSocket broadcast            │     │
│   │   • stories                  • Host authentication (SHA-256)  │     │
│   │   • votes by story           • Rate limiting (60 msg/min)     │     │
│   │   • chat messages            • 24-hour TTL with Alarm API     │     │
│   │   • phase (voting/revealed)  • Persistent storage             │     │
│   └───────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Message Flow

```
Client                    Worker                    Durable Object
  │                         │                            │
  │ ───POST /api/rooms───► │                            │
  │                         │ ──POST /init + secret──►  │
  │                         │                            │ [Create state]
  │ ◄──{roomId, secret}─── │ ◄─────── OK ─────────────  │
  │                         │                            │
  │ ───WS Upgrade─────────►│                            │
  │                         │ ────WS Upgrade────────►   │
  │ ◄──{type: "hello"}─────│ ◄───{type: "hello"}─────  │
  │ ◄──{type: "state"}─────│ ◄───{type: "state"}─────  │
  │                         │                            │
  │ ───{type: "join"}─────►│ ────{type: "join"}─────►  │
  │                         │                            │ [Add participant]
  │ ◄──{type: "state"}─────│ ◄───Broadcast state─────  │
  │                         │                            │
  │ ───{type: "vote"}─────►│ ────{type: "vote"}─────►  │
  │                         │                            │ [Record vote]
  │ ◄──{type: "state"}─────│ ◄───Broadcast state─────  │
```

## Project Structure

```
sprintstorypoint/
├── pages/                      # Static frontend (HTML, CSS, JS)
│   ├── index.html              # Landing page
│   ├── room.html               # Room UI (main app)
│   └── scripts/
│       ├── ws-client.js        # WebSocket client with reconnection
│       └── room.js             # Room page logic
│
├── worker/                     # Cloudflare Worker backend
│   ├── src/
│   │   ├── worker.ts           # Main entry point, routing
│   │   └── room-do.ts          # Durable Object implementation
│   ├── wrangler.toml           # Cloudflare configuration
│   └── package.json
│
└── README.md                   # This file
```

## Setup & Development

### Prerequisites

- Node.js 18+
- Cloudflare account (for deployment)
- Wrangler CLI (`npm install -g wrangler`)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/rajadurai80/sprintstorypoint.git
   cd sprintstorypoint
   ```

2. **Install worker dependencies**
   ```bash
   cd worker
   npm install
   ```

3. **Start the worker locally**
   ```bash
   npm run dev
   # Worker runs at http://localhost:8787
   ```

4. **Serve the frontend**
   ```bash
   cd ../pages
   # Use any static server, e.g.:
   npx serve .
   # or
   python -m http.server 8080
   ```

5. **Open in browser**
   - Frontend: http://localhost:8080
   - API: http://localhost:8787

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins | `*` (dev) |

### Deployment

1. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

2. **Deploy the worker**
   ```bash
   cd worker
   npm run deploy
   ```

3. **Configure DNS** (if using custom domain)
   - Add CNAME record pointing to your worker
   - Configure routes in `wrangler.toml`

4. **Deploy frontend**
   - Use Cloudflare Pages, Vercel, or any static host
   - Set API_BASE to your worker URL

## Configuration & Limits

### Server-Side Limits

| Limit | Value | Description |
|-------|-------|-------------|
| `MAX_PARTICIPANTS` | 25 | Max participants per room |
| `MAX_STORIES` | 50 | Max stories per room |
| `MAX_CHAT_MESSAGES` | 50 | Chat message retention |
| `MAX_STORY_TITLE_LEN` | 120 | Story title max length |
| `MAX_STORY_NOTES_LEN` | 1000 | Story notes max length |
| `MAX_MSG_BYTES` | 4096 | Max WebSocket message size |
| `RATE_LIMIT` | 60/min | Messages per client per minute |
| `TTL` | 24 hours | Room expiration time |

### Rate Limiting

The application implements rate limiting at two levels:

1. **Application Level** (Durable Object)
   - 60 messages per minute per client
   - Automatically resets after 1 minute window

2. **Infrastructure Level** (Cloudflare WAF - recommended)
   - Configure rate limiting rules in Cloudflare dashboard
   - Suggested: 100 requests/minute for POST /api/rooms
   - Suggested: 1000 requests/minute for WebSocket upgrades

## WebSocket Protocol

### Client → Server Messages

```typescript
// Join room with name
{ type: "join", name: "Alice" }

// Vote on current story
{ type: "vote", storyId: "abc123", value: "5" }

// Add new story
{ type: "addStory", title: "As a user...", notes: "Details..." }

// Send chat message
{ type: "chat", text: "Hello team!" }

// Host-only: Reveal votes
{ type: "reveal", roomSecret: "..." }

// Host-only: Lock estimate
{ type: "lock", storyId: "abc123", value: "5", roomSecret: "..." }
```

### Server → Client Messages

```typescript
// Initial handshake
{ type: "hello", clientId: "uuid-..." }

// Full state update
{ type: "state", state: {...}, derived: {...} }

// New chat message
{ type: "chat", message: { id, name, text, timestamp } }

// Error
{ type: "error", message: "Room full" }

// Session ended
{ type: "finished", reason: "Session ended by host" }
```

## Reconnection Strategy

The client implements robust reconnection with:

- **Exponential backoff**: 1s → 2s → 4s → ... → 30s max
- **Jitter**: ±25% to prevent thundering herd
- **Max attempts**: 15 before giving up
- **Visibility aware**: Pauses when tab is hidden
- **Network aware**: Handles online/offline events

## Security

- **Host Authentication**: Room secret hashed with SHA-256
- **Input Validation**: All inputs sanitized and length-limited
- **Rate Limiting**: Protects against spam/abuse
- **Auto-Expiry**: Rooms deleted after 24 hours
- **No Persistent Storage**: No user accounts or tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

- Email: admin@agileforwork.com
- Issues: https://github.com/rajadurai80/sprintstorypoint/issues
# Sprint Story Point - Technical Requirements Document

> **Project**: Planning Poker Tool with Real-time Collaboration
> **Architecture**: Cloudflare Pages + Workers + Durable Objects
> **Status**: In Development

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Hosting Model](#2-hosting-model)
3. [API & WebSocket Flow](#3-api--websocket-flow)
4. [State Machine](#4-state-machine)
5. [Data Model](#5-data-model)
6. [Security](#6-security)
7. [Failure Modes](#7-failure-modes)
8. [Milestones](#8-milestones)
9. [Step-by-Step Build Plan](#9-step-by-step-build-plan)

---

## 1. Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE OVERVIEW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   sprintstorypoint.com                    api.sprintstorypoint.com          │
│   ┌─────────────────────┐                 ┌─────────────────────────────┐   │
│   │  CLOUDFLARE PAGES   │                 │    CLOUDFLARE WORKER        │   │
│   │                     │   HTTP/WS       │                             │   │
│   │  /pages/            │ ◄──────────────►│  POST /api/rooms            │   │
│   │  • index.html       │                 │  GET  /api/rooms/:id/state  │   │
│   │  • room.html        │                 │  GET  /api/rooms/:id/ws     │   │
│   │  • *.js / *.css     │                 │                             │   │
│   │                     │                 │         │                   │   │
│   │  Static CDN         │                 │         ▼                   │   │
│   └─────────────────────┘                 │  ┌─────────────────────┐    │   │
│                                           │  │  DURABLE OBJECT     │    │   │
│                                           │  │  (per room)         │    │   │
│                                           │  │                     │    │   │
│                                           │  │  • Participants     │    │   │
│                                           │  │  • Stories          │    │   │
│                                           │  │  • Votes            │    │   │
│                                           │  │  • Phase state      │    │   │
│                                           │  │  • WS broadcast     │    │   │
│                                           │  └─────────────────────┘    │   │
│                                           └─────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Cloudflare Pages | Static HTML/JS/CSS hosting with global CDN |
| API Router | Cloudflare Worker | REST API + WebSocket upgrade handling |
| Realtime Engine | Durable Objects | Per-room state management + WebSocket fanout |
| State Persistence | DO Storage API | Automatic persistence within Durable Objects |

---

## 2. Hosting Model

### What Runs Where

#### 2.1 Frontend Hosting

| Attribute | Value |
|-----------|-------|
| **Platform** | Cloudflare Pages |
| **Content** | `/pages/index.html`, `/pages/room.html`, `/pages/*.js`, `/pages/styles.css` |
| **Benefits** | Static CDN, fast global delivery, free tier, simple deploy, clean portfolio story |

#### 2.2 Backend Hosting (API + Realtime)

| Attribute | Value |
|-----------|-------|
| **Platform** | Cloudflare Worker |
| **Endpoints** | `POST /api/rooms` (create), `GET /api/rooms/:id/state` (snapshot), `GET /api/rooms/:id/ws` (WebSocket) |
| **Benefits** | Edge API, easy routing, direct Durable Objects integration |

#### 2.3 Realtime Room Engine

| Attribute | Value |
|-----------|-------|
| **Platform** | Durable Objects (one instance per room) |
| **Responsibilities** | Authoritative state holder for participants, stories, votes, reveal/lock phase, WebSocket broadcast |
| **Benefits** | Solves shared state + fanout + scaling cleanly; best showcase architecture |

### Domain Configuration

| Domain | Target | Purpose |
|--------|--------|---------|
| `sprintstorypoint.com` | Cloudflare Pages | Static frontend assets |
| `api.sprintstorypoint.com` | Cloudflare Worker | API + WebSocket endpoints |

### Why Split Domains?

- Clear separation of static vs API concerns
- Easy security rules (CORS + rate limiting per domain)
- Professional architecture narrative for portfolio
- Independent scaling and caching strategies

---

## 3. API & WebSocket Flow

### 3.1 REST API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/rooms` | Create new room | None |
| `GET` | `/api/rooms/:id/state` | Get room state snapshot | None |
| `GET` | `/api/rooms/:id/ws` | WebSocket upgrade | None |

#### Create Room Response

```json
{
  "roomId": "abc123xyz789",
  "roomSecret": "host-secret-token-24-chars"
}
```

### 3.2 WebSocket Protocol

#### Client → Server Messages

| Type | Payload | Auth Required |
|------|---------|---------------|
| `join` | `{ name?: string }` | No |
| `setName` | `{ name: string }` | No |
| `setDeck` | `{ deck: { type: DeckType, custom?: string[] } }` | No |
| `toggleFun` | `{ funMode: boolean }` | No |
| `addStory` | `{ title: string, notes?: string }` | No |
| `setCurrentStory` | `{ storyId: string }` | No |
| `vote` | `{ storyId: string, value: string }` | No |
| `reveal` | `{ roomSecret: string }` | **Host** |
| `lock` | `{ storyId: string, value: string, roomSecret: string }` | **Host** |
| `next` | `{ roomSecret: string }` | **Host** |
| `clearVotes` | `{ storyId: string, roomSecret: string }` | **Host** |

#### Server → Client Messages

| Type | Payload | Description |
|------|---------|-------------|
| `hello` | `{ clientId: string }` | Connection established |
| `state` | `{ state: RoomState, derived: DerivedState }` | Full state broadcast |
| `error` | `{ message: string }` | Error notification |

### 3.3 Connection Flow

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│  Client  │                    │  Worker  │                    │    DO    │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │  GET /api/rooms/:id/ws        │                               │
     │  Upgrade: websocket           │                               │
     │──────────────────────────────►│                               │
     │                               │                               │
     │                               │  Forward WS to DO             │
     │                               │──────────────────────────────►│
     │                               │                               │
     │◄──────────────────────────────┼───────────────────────────────│
     │  { type: "hello", clientId }  │                               │
     │                               │                               │
     │◄──────────────────────────────┼───────────────────────────────│
     │  { type: "state", ... }       │                               │
     │                               │                               │
     │  { type: "join", name }       │                               │
     │──────────────────────────────►│──────────────────────────────►│
     │                               │                               │
     │◄──────────────────────────────┼───────────────────────────────│
     │  { type: "state", ... }       │  (broadcast to all clients)   │
     │                               │                               │
```

---

## 4. State Machine

### 4.1 Room Phases

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
              ┌──────────┐      reveal()      ┌──────────┐   │
   ──────────►│  VOTING  │───────────────────►│ REVEALED │   │
              └──────────┘                    └────┬─────┘   │
                    ▲                              │         │
                    │                              │ lock()  │
                    │         clearVotes()         ▼         │
                    │         next()          ┌──────────┐   │
                    └─────────────────────────│  LOCKED  │───┘
                                              └──────────┘
```

### 4.2 Phase Descriptions

| Phase | Description | Allowed Actions |
|-------|-------------|-----------------|
| `voting` | Participants can submit/change votes | vote, addStory, setCurrentStory |
| `revealed` | Votes visible to all, discussion phase | lock (host), clearVotes (host) |
| `locked` | Final estimate locked, ready for next story | next (host), clearVotes (host) |

### 4.3 State Transitions

| From | To | Trigger | Auth |
|------|----|---------|------|
| `voting` | `revealed` | `reveal` message | Host |
| `revealed` | `locked` | `lock` message | Host |
| `revealed` | `voting` | `clearVotes` message | Host |
| `locked` | `voting` | `next` message | Host |
| `locked` | `voting` | `clearVotes` message | Host |

---

## 5. Data Model

### 5.1 TypeScript Types

```typescript
// Deck configuration
type DeckType = "fibonacci" | "tshirt" | "custom";

// Story definition
type Story = {
  id: string;           // UUID
  title: string;        // Max 120 chars
  notes?: string;       // Max 500 chars
};

// Complete room state
type RoomState = {
  roomId: string;
  createdAt: number;    // Unix timestamp
  expiresAt: number;    // createdAt + 24 hours

  // Configuration
  deck: { type: DeckType; custom?: string[] };
  funMode: boolean;

  // Stories
  stories: Story[];
  currentStoryId: string | null;

  // Voting
  phase: "voting" | "revealed" | "locked";
  votesByStory: Record<string, Record<string, string>>;  // storyId -> clientId -> value
  lockedByStory: Record<string, string>;                  // storyId -> final value

  // Participants
  participants: Record<string, { name: string; joinedAt: number }>;
};

// Derived state (computed on each broadcast)
type DerivedState = {
  currentStory?: Story | null;
  stats?: {
    min?: number;
    max?: number;
    median?: number;
    spread?: number;
  } | null;
  waitingFor: number;   // Participants who haven't voted
};
```

### 5.2 Limits

| Resource | Limit | Reason |
|----------|-------|--------|
| Participants per room | 25 | Demo/free tier constraint |
| Stories per room | 50 | Reasonable session size |
| Message size | 4096 bytes | Prevent abuse |
| Room TTL | 24 hours | Auto-cleanup, no persistence needed |
| Name length | 24 chars | Display constraint |
| Story title | 120 chars | Display constraint |
| Story notes | 500 chars | Reasonable description |

### 5.3 Deck Options

| Type | Values |
|------|--------|
| `fibonacci` | 0, 1, 2, 3, 5, 8, 13, 21, ?, ☕ |
| `tshirt` | XS, S, M, L, XL, XXL, ?, ☕ |
| `custom` | User-defined (max 20 values) |

---

## 6. Security

### 6.1 Host Authentication

- **Mechanism**: `roomSecret` stored as SHA-256 hash in Durable Object
- **Flow**:
  1. Room creation returns `roomSecret` to host
  2. Host stores in URL hash (`#secret=...`) - never sent to server in HTTP headers
  3. Host sends `roomSecret` with privileged actions
  4. DO compares SHA-256(provided) with stored hash

```typescript
async function isHost(roomSecret?: string): Promise<boolean> {
  if (!roomSecret) return false;
  const storedHash = await this.state.storage.get<string>("secretHash");
  const candidateHash = await sha256Hex(roomSecret);
  return candidateHash === storedHash;
}
```

### 6.2 CORS Configuration

```typescript
// Allowed origins (configurable via env)
const ALLOWED_ORIGINS = "https://sprintstorypoint.com";

// Headers
{
  "access-control-allow-origin": origin,
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400"
}
```

### 6.3 Rate Limiting

| Endpoint | Limit | Implementation |
|----------|-------|----------------|
| `POST /api/rooms` | 10/min per IP | Cloudflare WAF rules |
| WebSocket messages | 100/min per client | DO-level throttle |
| Room joins | 25 total | Hard cap in DO |

### 6.4 Input Validation

| Field | Validation |
|-------|------------|
| `name` | Trim, max 24 chars, default "Anonymous" |
| `title` | Trim, max 120 chars, required |
| `notes` | Max 500 chars, optional |
| `vote` | Max 12 chars |
| `roomId` | Alphanumeric + hyphen/underscore, 6+ chars |

---

## 7. Failure Modes

### 7.1 Connection Failures

| Scenario | Behavior | Client Action |
|----------|----------|---------------|
| WebSocket disconnect | Remove participant, clear votes | Auto-reconnect with exponential backoff |
| DO unavailable | 503 response | Retry with backoff |
| Room not found | 404 response | Show "Room expired" message |

### 7.2 Room Expiry

```typescript
// Alarm-based cleanup
async alarm() {
  const st = await this.load();
  if (!st) return;

  if (Date.now() >= st.expiresAt) {
    await this.state.storage.deleteAll();
    for (const [, ws] of this.sockets) {
      ws.close(1000, "Room expired");
    }
    this.sockets.clear();
  }
}
```

### 7.3 Reconnection Strategy

```javascript
// Client-side reconnection
class RoomConnection {
  private retryCount = 0;
  private maxRetries = 5;

  connect() {
    this.ws = new WebSocket(wsUrl);

    this.ws.onclose = () => {
      if (this.retryCount < this.maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
        setTimeout(() => this.connect(), delay);
        this.retryCount++;
      }
    };

    this.ws.onopen = () => {
      this.retryCount = 0;
      this.ws.send(JSON.stringify({ type: "join", name: this.userName }));
    };
  }
}
```

### 7.4 Error Handling

| Error | Response | Client Handling |
|-------|----------|-----------------|
| Invalid message | `{ type: "error", message: "..." }` | Show toast notification |
| Room full | `{ type: "error", message: "Room full" }` | Redirect to home |
| Host action without secret | `{ type: "error", message: "Host secret required" }` | Ignore (UI shouldn't allow) |

---

## 8. Milestones

### Phase 1: Foundation (MVP)

- [ ] **M1.1**: Set up mono-repo structure (`/pages`, `/worker`)
- [ ] **M1.2**: Deploy Cloudflare Worker with Durable Objects
- [ ] **M1.3**: Implement room creation API
- [ ] **M1.4**: Implement WebSocket connection handling
- [ ] **M1.5**: Basic room state management (join, vote, reveal)
- [ ] **M1.6**: Deploy static frontend to Cloudflare Pages
- [ ] **M1.7**: End-to-end voting flow working

### Phase 2: Core Features

- [ ] **M2.1**: Story management (add, select, next)
- [ ] **M2.2**: Multiple deck types (Fibonacci, T-shirt, custom)
- [ ] **M2.3**: Vote statistics (min, max, median, spread)
- [ ] **M2.4**: Lock final estimate
- [ ] **M2.5**: Participant list with vote status indicators
- [ ] **M2.6**: Fun mode (animations/sounds)

### Phase 3: Polish

- [ ] **M3.1**: Responsive mobile design
- [ ] **M3.2**: Reconnection handling
- [ ] **M3.3**: Copy invite link functionality
- [ ] **M3.4**: Host controls UI
- [ ] **M3.5**: Loading states and error handling
- [ ] **M3.6**: Room expiry countdown

### Phase 4: Production Ready

- [ ] **M4.1**: Custom domain setup
- [ ] **M4.2**: CORS configuration
- [ ] **M4.3**: Rate limiting via Cloudflare WAF
- [ ] **M4.4**: Analytics integration
- [ ] **M4.5**: Error monitoring (Sentry or similar)
- [ ] **M4.6**: Documentation and README

### Phase 5: Enhancements (Future)

- [ ] **M5.1**: AI-powered estimation suggestions
- [ ] **M5.2**: Jira/Azure DevOps integration
- [ ] **M5.3**: Session history export
- [ ] **M5.4**: Team velocity tracking
- [ ] **M5.5**: Retrospective mode

---

## Repository Structure

```
sprintstorypoint/
├── pages/                      # Frontend (Cloudflare Pages)
│   ├── index.html             # Landing page - create/join room
│   ├── room.html              # Room page - voting interface
│   ├── scripts/
│   │   ├── app.js             # Main application logic
│   │   ├── websocket.js       # WebSocket client
│   │   └── ui.js              # UI components
│   └── styles/
│       └── main.css           # Styling
│
├── worker/                     # Backend (Cloudflare Worker)
│   ├── src/
│   │   ├── worker.ts          # Entry point, routing
│   │   └── room-do.ts         # Durable Object implementation
│   ├── wrangler.toml          # Cloudflare configuration
│   └── package.json
│
├── TECHNICAL_REQUIREMENTS.md  # This document
└── README.md                  # Project overview
```

---

## Quick Start

### Local Development

```bash
# Worker
cd worker
npm install
npm run dev          # Starts local worker on :8787

# Pages (separate terminal)
cd pages
npx serve .          # Serves static files on :3000
```

### Deployment

```bash
# Deploy Worker
cd worker
npm run deploy

# Deploy Pages
cd pages
npx wrangler pages deploy . --project-name=sprintstorypoint
```

---

## URL Scheme

| URL | Purpose |
|-----|---------|
| `https://sprintstorypoint.com/` | Landing page |
| `https://sprintstorypoint.com/room.html?id=abc123#secret=xyz` | Host view |
| `https://sprintstorypoint.com/room.html?id=abc123` | Participant view |
| `https://api.sprintstorypoint.com/api/rooms` | Create room |
| `wss://api.sprintstorypoint.com/api/rooms/:id/ws` | WebSocket |

---

## 9. Step-by-Step Build Plan

This section provides a detailed technical implementation guide with clear deliverables for each step.

---

### Step 1: Repo + Boundary Definition

#### Goal

Lock down what belongs in `/pages` vs `/worker`. Establish clear separation of concerns.

#### Deliverables

- [ ] README "Architecture" section with system diagram
- [ ] Clear folder structure enforcing boundaries
- [ ] Development environment setup

#### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM BOUNDARIES                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────┐         HTTPS          ┌─────────────────────────────────┐   │
│   │             │◄──────────────────────►│                                 │   │
│   │   BROWSER   │                        │      CLOUDFLARE PAGES           │   │
│   │             │   Static Assets        │      /pages/*                   │   │
│   │             │   (HTML, JS, CSS)      │                                 │   │
│   └──────┬──────┘                        │   • index.html (landing)        │   │
│          │                               │   • room.html (voting UI)       │   │
│          │                               │   • scripts/*.js                │   │
│          │                               │   • styles/*.css                │   │
│          │                               │                                 │   │
│          │                               │   ❌ NO server code             │   │
│          │                               │   ❌ NO secrets                 │   │
│          │                               │   ❌ NO business logic          │   │
│          │                               └─────────────────────────────────┘   │
│          │                                                                      │
│          │  HTTP + WebSocket                                                    │
│          │                                                                      │
│          ▼                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                         CLOUDFLARE WORKER                                │  │
│   │                         /worker/*                                        │  │
│   │                                                                          │  │
│   │   Responsibilities:                                                      │  │
│   │   ✅ HTTP routing (POST /api/rooms, GET /state, WS upgrade)              │  │
│   │   ✅ CORS headers                                                        │  │
│   │   ✅ Request validation                                                  │  │
│   │   ✅ Forward to Durable Object                                           │  │
│   │                                                                          │  │
│   │   ❌ NO UI code                                                          │  │
│   │   ❌ NO room state (delegate to DO)                                      │  │
│   │   ❌ NO WebSocket message handling (delegate to DO)                      │  │
│   │                                                                          │  │
│   │         │                                                                │  │
│   │         │  env.ROOMS.get(id)                                             │  │
│   │         ▼                                                                │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │  │
│   │   │                      DURABLE OBJECT                              │   │  │
│   │   │                      (one per room)                              │   │  │
│   │   │                                                                  │   │  │
│   │   │   Responsibilities:                                              │   │  │
│   │   │   ✅ Authoritative room state                                    │   │  │
│   │   │   ✅ WebSocket connections + broadcast                           │   │  │
│   │   │   ✅ Participant management                                      │   │  │
│   │   │   ✅ Story management                                            │   │  │
│   │   │   ✅ Voting logic                                                │   │  │
│   │   │   ✅ Phase transitions (voting → revealed → locked)              │   │  │
│   │   │   ✅ Host authentication                                         │   │  │
│   │   │   ✅ TTL / expiry via alarms                                     │   │  │
│   │   │                                                                  │   │  │
│   │   │   Storage:                                                       │   │  │
│   │   │   • this.state.storage.get/put (automatic persistence)           │   │  │
│   │   │                                                                  │   │  │
│   │   └─────────────────────────────────────────────────────────────────┘   │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Boundary Rules

| Rule | Enforcement |
|------|-------------|
| `/pages` contains **NO server code** | Static files only; no Node.js, no build step for backend |
| `/worker` contains **NO UI** | TypeScript only; no HTML, no CSS, no frontend JS |
| All realtime/room-state belongs in **Durable Object** | Worker only routes; DO owns state + WebSocket |
| Secrets **never** in `/pages` | `roomSecret` stays in URL hash (client-side only) |

#### Folder Structure

```
sprintstorypoint/
│
├── pages/                          # FRONTEND ONLY
│   ├── index.html                 # Landing page
│   ├── room.html                  # Room/voting page
│   ├── scripts/
│   │   ├── main.js               # Entry point
│   │   ├── api.js                # HTTP client (create room)
│   │   ├── websocket.js          # WebSocket client
│   │   ├── state.js              # Client-side state management
│   │   └── ui.js                 # DOM manipulation
│   ├── styles/
│   │   └── main.css              # All styling
│   └── assets/
│       └── favicon.ico
│
├── worker/                         # BACKEND ONLY
│   ├── src/
│   │   ├── index.ts              # Worker entry point
│   │   ├── router.ts             # HTTP routing logic
│   │   ├── room-do.ts            # Durable Object class
│   │   └── types.ts              # Shared TypeScript types
│   ├── wrangler.toml             # Cloudflare config
│   ├── tsconfig.json             # TypeScript config
│   └── package.json
│
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml      # Auto-deploy pages on push
│       └── deploy-worker.yml     # Auto-deploy worker on push
│
├── TECHNICAL_REQUIREMENTS.md      # This document
├── README.md                      # Project overview
└── .gitignore
```

#### Step 1 Checklist

```
□ 1.1  Create clean folder structure (/pages, /worker)
□ 1.2  Initialize worker with wrangler init
□ 1.3  Create minimal index.html in /pages
□ 1.4  Add README with architecture diagram
□ 1.5  Set up .gitignore (node_modules, .wrangler, etc.)
□ 1.6  Verify local dev works:
       - cd worker && npm run dev
       - cd pages && npx serve .
□ 1.7  Commit: "Step 1: Repo structure and boundaries"
```

---

### Step 2: Product Flow (User Journeys)

#### Goal

Define all user journeys before writing code. Understand exactly what happens at each step.

---

#### Flow A: Create Room (Host)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FLOW A: CREATE ROOM (HOST)                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌──────────┐                                                                  │
│   │   USER   │                                                                  │
│   └────┬─────┘                                                                  │
│        │                                                                        │
│        │  1. Opens sprintstorypoint.com                                         │
│        ▼                                                                        │
│   ┌──────────────────────────────────────────┐                                  │
│   │           LANDING PAGE                    │                                  │
│   │           index.html                      │                                  │
│   │                                          │                                  │
│   │   ┌────────────────────────────────┐     │                                  │
│   │   │      [ Create Room ]           │     │                                  │
│   │   └────────────────────────────────┘     │                                  │
│   └──────────────────┬───────────────────────┘                                  │
│                      │                                                          │
│                      │  2. Click "Create Room"                                  │
│                      ▼                                                          │
│   ┌──────────────────────────────────────────┐                                  │
│   │           FRONTEND JS                     │                                  │
│   │           scripts/api.js                  │                                  │
│   │                                          │                                  │
│   │   fetch('https://api.sprintstorypoint.com/api/rooms', {                     │
│   │     method: 'POST'                                                          │
│   │   })                                                                        │
│   └──────────────────┬───────────────────────┘                                  │
│                      │                                                          │
│                      │  3. POST /api/rooms                                      │
│                      ▼                                                          │
│   ┌──────────────────────────────────────────┐                                  │
│   │           CLOUDFLARE WORKER               │                                  │
│   │                                          │                                  │
│   │   • Generate roomId (nanoid 12 chars)    │                                  │
│   │   • Generate roomSecret (nanoid 24 chars)│                                  │
│   │   • Create Durable Object instance       │                                  │
│   │   • Call DO.init(roomId, roomSecret)     │                                  │
│   └──────────────────┬───────────────────────┘                                  │
│                      │                                                          │
│                      │  4. Response: { roomId, roomSecret }                     │
│                      ▼                                                          │
│   ┌──────────────────────────────────────────┐                                  │
│   │           FRONTEND JS                     │                                  │
│   │                                          │                                  │
│   │   // Redirect with secret in hash        │                                  │
│   │   window.location.href =                 │                                  │
│   │     `/room.html?room=${roomId}#secret=${roomSecret}`                        │
│   │                                          │                                  │
│   └──────────────────┬───────────────────────┘                                  │
│                      │                                                          │
│                      │  5. Browser navigates                                    │
│                      ▼                                                          │
│   ┌──────────────────────────────────────────┐                                  │
│   │           ROOM PAGE                       │                                  │
│   │           room.html                       │                                  │
│   │                                          │                                  │
│   │   URL: /room.html?room=abc123#secret=xyz │                                  │
│   │                                          │                                  │
│   │   • Host controls visible                │                                  │
│   │   • Can reveal votes                     │                                  │
│   │   • Can lock estimates                   │                                  │
│   │   • Can advance to next story            │                                  │
│   └──────────────────────────────────────────┘                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Flow A: Sequence Diagram

```
┌────────┐          ┌────────┐          ┌────────┐          ┌────────┐
│Browser │          │ Pages  │          │ Worker │          │   DO   │
└───┬────┘          └───┬────┘          └───┬────┘          └───┬────┘
    │                   │                   │                   │
    │  GET /            │                   │                   │
    │──────────────────►│                   │                   │
    │                   │                   │                   │
    │  index.html       │                   │                   │
    │◄──────────────────│                   │                   │
    │                   │                   │                   │
    │  Click "Create"   │                   │                   │
    │─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                   │                   │
    │                   │                   │                   │
    │  POST /api/rooms  │                   │                   │
    │──────────────────────────────────────►│                   │
    │                   │                   │                   │
    │                   │                   │  init(id, secret) │
    │                   │                   │──────────────────►│
    │                   │                   │                   │
    │                   │                   │        OK         │
    │                   │                   │◄──────────────────│
    │                   │                   │                   │
    │  { roomId, roomSecret }               │                   │
    │◄──────────────────────────────────────│                   │
    │                   │                   │                   │
    │  Navigate to room.html?room=X#secret=Y                    │
    │──────────────────►│                   │                   │
    │                   │                   │                   │
    │  room.html        │                   │                   │
    │◄──────────────────│                   │                   │
    │                   │                   │                   │
```

#### Key Security Point

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🔒 URL HASH SECURITY                                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  URL: https://sprintstorypoint.com/room.html?room=abc123#secret=xyz789          │
│                                                                                 │
│       ├─────────────── Sent to server ───────────────┤├── NEVER sent ──┤        │
│       │                                              ││                │        │
│       https://sprintstorypoint.com/room.html?room=abc123               │        │
│                                                      ││                │        │
│                                                      ││  #secret=xyz   │        │
│                                                      ││                │        │
│                                                      │└── Client only ─┘        │
│                                                                                 │
│  Why this matters:                                                              │
│  • Hash fragment (#...) is NEVER sent in HTTP requests                          │
│  • Secret stays in browser memory only                                          │
│  • Server logs won't contain secrets                                            │
│  • Host can share participant link by removing hash                             │
│                                                                                 │
│  Host link:        /room.html?room=abc123#secret=xyz789                         │
│  Participant link: /room.html?room=abc123                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Flow A: Code Snippets

**Frontend (pages/scripts/api.js)**
```javascript
async function createRoom() {
  const response = await fetch('https://api.sprintstorypoint.com/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    throw new Error('Failed to create room');
  }

  const { roomId, roomSecret } = await response.json();

  // Redirect with secret in hash (never sent to server)
  window.location.href = `/room.html?room=${roomId}#secret=${roomSecret}`;
}
```

**Worker (worker/src/index.ts)**
```typescript
if (url.pathname === '/api/rooms' && req.method === 'POST') {
  const roomId = nanoid(12);      // e.g., "V1StGXR8_Z5j"
  const roomSecret = nanoid(24);  // e.g., "V1StGXR8_Z5jxYf3k9Lm2nQp"

  // Get Durable Object stub
  const id = env.ROOMS.idFromName(roomId);
  const stub = env.ROOMS.get(id);

  // Initialize room in DO
  await stub.fetch('https://do/init', {
    method: 'POST',
    body: JSON.stringify({ roomId, roomSecret })
  });

  return json({ roomId, roomSecret }, req, env, 201);
}
```

---

#### Flow B: Join Room (Participant/Guest)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        FLOW B: JOIN ROOM (PARTICIPANT)                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌──────────┐                                                                  │
│   │   GUEST  │                                                                  │
│   └────┬─────┘                                                                  │
│        │                                                                        │
│        │  1. Opens shared link (no #secret)                                     │
│        │     https://sprintstorypoint.com/room.html?room=abc123                 │
│        ▼                                                                        │
│   ┌──────────────────────────────────────────┐                                  │
│   │           ROOM PAGE                       │                                  │
│   │           room.html                       │                                  │
│   │                                          │                                  │
│   │   • Detects no #secret in URL            │                                  │
│   │   • Shows "Enter your name" prompt       │                                  │
│   │   • Host controls HIDDEN                 │                                  │
│   └──────────────────┬───────────────────────┘                                  │
│                      │                                                          │
│                      │  2. User enters display name                             │
│                      ▼                                                          │
│   ┌──────────────────────────────────────────┐                                  │
│   │           FRONTEND JS                     │                                  │
│   │           scripts/websocket.js            │                                  │
│   │                                          │                                  │
│   │   const ws = new WebSocket(              │                                  │
│   │     'wss://api.sprintstorypoint.com/api/rooms/abc123/ws'                    │
│   │   );                                     │                                  │
│   └──────────────────┬───────────────────────┘                                  │
│                      │                                                          │
│                      │  3. WebSocket connects                                   │
│                      ▼                                                          │
│   ┌──────────────────────────────────────────┐                                  │
│   │           CLOUDFLARE WORKER               │                                  │
│   │                                          │                                  │
│   │   • Matches /api/rooms/:id/ws            │                                  │
│   │   • Upgrades to WebSocket                │                                  │
│   │   • Forwards to Durable Object           │                                  │
│   └──────────────────┬───────────────────────┘                                  │
│                      │                                                          │
│                      │  4. WebSocket forwarded to DO                            │
│                      ▼                                                          │
│   ┌──────────────────────────────────────────┐                                  │
│   │           DURABLE OBJECT                  │                                  │
│   │                                          │                                  │
│   │   • Accepts WebSocket                    │                                  │
│   │   • Generates clientId (UUID)            │                                  │
│   │   • Sends: { type: "hello", clientId }   │                                  │
│   │   • Sends: { type: "state", state, derived }                                │
│   └──────────────────┬───────────────────────┘                                  │
│                      │                                                          │
│                      │  5. Client sends join message                            │
│                      ▼                                                          │
│   ┌──────────────────────────────────────────┐                                  │
│   │           CLIENT → DO                     │                                  │
│   │                                          │                                  │
│   │   { type: "join", name: "Alice" }        │                                  │
│   └──────────────────┬───────────────────────┘                                  │
│                      │                                                          │
│                      │  6. DO broadcasts updated state to ALL                   │
│                      ▼                                                          │
│   ┌──────────────────────────────────────────┐                                  │
│   │           DO → ALL CLIENTS                │                                  │
│   │                                          │                                  │
│   │   {                                      │                                  │
│   │     type: "state",                       │                                  │
│   │     state: {                             │                                  │
│   │       participants: {                    │                                  │
│   │         "uuid-1": { name: "Alice", ... } │                                  │
│   │       },                                 │                                  │
│   │       ...                                │                                  │
│   │     }                                    │                                  │
│   │   }                                      │                                  │
│   └──────────────────────────────────────────┘                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Flow B: Sequence Diagram

```
┌────────┐          ┌────────┐          ┌────────┐          ┌────────┐
│ Guest  │          │ Pages  │          │ Worker │          │   DO   │
└───┬────┘          └───┬────┘          └───┬────┘          └───┬────┘
    │                   │                   │                   │
    │  GET /room.html?room=abc123           │                   │
    │──────────────────►│                   │                   │
    │                   │                   │                   │
    │  room.html        │                   │                   │
    │◄──────────────────│                   │                   │
    │                   │                   │                   │
    │  Enter name: "Alice"                  │                   │
    │─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                   │                   │
    │                   │                   │                   │
    │  WS: /api/rooms/abc123/ws             │                   │
    │──────────────────────────────────────►│                   │
    │                   │                   │                   │
    │                   │                   │  Forward WS       │
    │                   │                   │──────────────────►│
    │                   │                   │                   │
    │  { type: "hello", clientId: "uuid-1" }│                   │
    │◄──────────────────────────────────────┼───────────────────│
    │                   │                   │                   │
    │  { type: "state", state: {...} }      │                   │
    │◄──────────────────────────────────────┼───────────────────│
    │                   │                   │                   │
    │  { type: "join", name: "Alice" }      │                   │
    │──────────────────────────────────────►│──────────────────►│
    │                   │                   │                   │
    │  { type: "state", ... } (broadcast)   │                   │
    │◄──────────────────────────────────────┼───────────────────│
    │                   │                   │                   │
```

#### Flow B: Code Snippets

**Frontend (pages/scripts/websocket.js)**
```javascript
class RoomConnection {
  constructor(roomId) {
    this.roomId = roomId;
    this.clientId = null;
    this.ws = null;
  }

  connect(displayName) {
    const wsUrl = `wss://api.sprintstorypoint.com/api/rooms/${this.roomId}/ws`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Connected to room');
    };

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case 'hello':
          this.clientId = msg.clientId;
          // Now join with display name
          this.send({ type: 'join', name: displayName });
          break;

        case 'state':
          this.onStateUpdate(msg.state, msg.derived);
          break;

        case 'error':
          console.error('Server error:', msg.message);
          break;
      }
    };
  }

  send(msg) {
    this.ws.send(JSON.stringify(msg));
  }
}
```

---

#### Flow C: Estimation Round

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          FLOW C: ESTIMATION ROUND                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PHASE 1: SETUP (Host)                                                          │
│  ─────────────────────                                                          │
│                                                                                 │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │  HOST adds stories                                                        │  │
│   │                                                                          │  │
│   │  { type: "addStory", title: "User login", notes: "OAuth required" }      │  │
│   │  { type: "addStory", title: "Dashboard", notes: "Show metrics" }         │  │
│   │  { type: "addStory", title: "Export CSV" }                               │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │  HOST selects current story                                               │  │
│   │                                                                          │  │
│   │  { type: "setCurrentStory", storyId: "story-uuid-1" }                    │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│                                                                                 │
│  PHASE 2: VOTING                                                                │
│  ───────────────                                                                │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         VOTING UI                                        │   │
│   │                                                                         │   │
│   │   Current Story: "User login"                                           │   │
│   │   Notes: OAuth required                                                 │   │
│   │                                                                         │   │
│   │   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │   │
│   │   │  1  │ │  2  │ │  3  │ │  5  │ │  8  │ │ 13  │ │ 21  │ │  ?  │      │   │
│   │   └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      │   │
│   │                                                                         │   │
│   │   Participants:                                                         │   │
│   │   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐          │   │
│   │   │   Alice    │ │    Bob     │ │   Carol    │ │   David    │          │   │
│   │   │     ✓      │ │     ✓      │ │   waiting  │ │     ✓      │          │   │
│   │   │   [???]    │ │   [???]    │ │    [ ]     │ │   [???]    │          │   │
│   │   └────────────┘ └────────────┘ └────────────┘ └────────────┘          │   │
│   │                                                                         │   │
│   │   Waiting for: 1 participant                                            │   │
│   │                                                                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│   Each participant sends:                                                       │
│   { type: "vote", storyId: "story-uuid-1", value: "5" }                         │
│                                                                                 │
│   ⚠️  Votes remain HIDDEN until host reveals                                    │
│   ⚠️  Participants can change vote until reveal                                 │
│                                                                                 │
│                                                                                 │
│  PHASE 3: REVEAL (Host only)                                                    │
│  ──────────────────────────                                                     │
│                                                                                 │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │  HOST clicks "Reveal Votes"                                               │  │
│   │                                                                          │  │
│   │  { type: "reveal", roomSecret: "xyz789..." }                             │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                       REVEALED STATE                                     │   │
│   │                                                                         │   │
│   │   Current Story: "User login"                                           │   │
│   │                                                                         │   │
│   │   Participants:                                                         │   │
│   │   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐          │   │
│   │   │   Alice    │ │    Bob     │ │   Carol    │ │   David    │          │   │
│   │   │     5      │ │     8      │ │     5      │ │     13     │          │   │
│   │   └────────────┘ └────────────┘ └────────────┘ └────────────┘          │   │
│   │                                                                         │   │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │  STATISTICS                                                      │   │   │
│   │   │                                                                 │   │   │
│   │   │  Min: 5    Median: 6.5    Max: 13    Spread: 8                  │   │   │
│   │   │                                                                 │   │   │
│   │   │  ⚠️ High spread - discussion recommended                        │   │   │
│   │   └─────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│                                                                                 │
│  PHASE 4: LOCK (Host only)                                                      │
│  ────────────────────────                                                       │
│                                                                                 │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │  After discussion, HOST locks final estimate                              │  │
│   │                                                                          │  │
│   │  { type: "lock", storyId: "story-uuid-1", value: "8", roomSecret: "..." }│  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   Story "User login" is now locked at 8 points                                  │
│                                                                                 │
│                                                                                 │
│  PHASE 5: NEXT STORY (Host only)                                                │
│  ──────────────────────────────                                                 │
│                                                                                 │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │  HOST advances to next story                                              │  │
│   │                                                                          │  │
│   │  { type: "next", roomSecret: "..." }                                     │  │
│   │                                                                          │  │
│   │  OR manually select:                                                     │  │
│   │  { type: "setCurrentStory", storyId: "story-uuid-2" }                    │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   Phase resets to "voting" for new story                                        │
│   Cycle repeats from PHASE 2                                                    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Flow C: State Transitions

```
                         addStory / setCurrentStory
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    ┌──────────┐                                                             │
│    │  VOTING  │◄─────────────────────────────────────────────────┐          │
│    └────┬─────┘                                                  │          │
│         │                                                        │          │
│         │  vote()     • Participants select cards                │          │
│         │             • Votes hidden (shown as "?")              │          │
│         │             • Can change vote anytime                  │          │
│         │                                                        │          │
│         │  reveal(roomSecret)                                    │          │
│         ▼                                                        │          │
│    ┌──────────┐                                                  │          │
│    │ REVEALED │                                                  │          │
│    └────┬─────┘                                                  │          │
│         │                                                        │          │
│         │  • All votes visible                                   │          │
│         │  • Stats calculated (min/max/median/spread)            │          │
│         │  • Discussion happens here                             │          │
│         │                                                        │          │
│         ├────────────────────────────────────────────────────────┤          │
│         │  clearVotes(roomSecret)  →  Back to VOTING             │          │
│         │                             (re-vote after discussion) │          │
│         │                                                        │          │
│         │  lock(storyId, value, roomSecret)                      │          │
│         ▼                                                        │          │
│    ┌──────────┐                                                  │          │
│    │  LOCKED  │                                                  │          │
│    └────┬─────┘                                                  │          │
│         │                                                        │          │
│         │  • Final estimate recorded                             │          │
│         │  • Story marked as estimated                           │          │
│         │                                                        │          │
│         │  next(roomSecret)  →  Advances currentStoryId ─────────┘          │
│         │                      Resets phase to VOTING                       │
│         │                                                                   │
│         │  clearVotes(roomSecret)  →  Back to VOTING                        │
│         │                             (rare: re-estimate)                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Flow C: Broadcast Payloads

**During Voting (votes hidden)**
```javascript
{
  type: "state",
  state: {
    phase: "voting",
    currentStoryId: "story-uuid-1",
    votesByStory: {
      "story-uuid-1": {
        "client-uuid-1": "5",    // Alice voted
        "client-uuid-2": "8",    // Bob voted
        // Carol hasn't voted yet
        "client-uuid-4": "13"    // David voted
      }
    },
    participants: {
      "client-uuid-1": { name: "Alice", joinedAt: 1706000000 },
      "client-uuid-2": { name: "Bob", joinedAt: 1706000001 },
      "client-uuid-3": { name: "Carol", joinedAt: 1706000002 },
      "client-uuid-4": { name: "David", joinedAt: 1706000003 }
    }
  },
  derived: {
    currentStory: { id: "story-uuid-1", title: "User login", notes: "OAuth required" },
    stats: null,  // No stats until revealed
    waitingFor: 1 // Carol hasn't voted
  }
}
```

**After Reveal (votes visible + stats)**
```javascript
{
  type: "state",
  state: {
    phase: "revealed",
    // ... same structure
  },
  derived: {
    currentStory: { id: "story-uuid-1", title: "User login", notes: "OAuth required" },
    stats: {
      min: 5,
      max: 13,
      median: 6.5,
      spread: 8
    },
    waitingFor: 0
  }
}
```

---

#### Step 2 Checklist

```
□ 2.1  Document Flow A: Create Room (Host)           ✅ DONE
□ 2.2  Document Flow B: Join Room (Participant)      ✅ DONE
□ 2.3  Document Flow C: Estimation Round             ✅ DONE
□ 2.4  Document Flow D: Room Expiry
□ 2.5  Document Flow E: Reconnection
□ 2.6  Review all flows for security considerations
□ 2.7  Commit: "Step 2: User journey documentation"
```

---

### Step 3: Room State Machine (Core Correctness)

#### Goal

Define the authoritative state machine that governs room behavior. This is the **source of truth** for all business logic.

---

#### States (Phase)

| State | Description | Default |
|-------|-------------|---------|
| `voting` | Participants can submit/change votes. Votes are hidden. | ✅ Yes |
| `revealed` | All votes visible. Statistics shown. Discussion phase. | |
| `locked` | Final estimate recorded. Story complete. | |

---

#### State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ROOM STATE MACHINE                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                              ┌─────────────┐                                    │
│                              │   INITIAL   │                                    │
│                              └──────┬──────┘                                    │
│                                     │                                           │
│                                     │  Room created / First story selected      │
│                                     ▼                                           │
│    ┌────────────────────────────────────────────────────────────────────────┐   │
│    │                                                                        │   │
│    │  ╔═══════════════╗                                                     │   │
│    │  ║    VOTING     ║ ◄────────────────────────────────────────────┐      │   │
│    │  ║   (default)   ║                                              │      │   │
│    │  ╚═══════╤═══════╝                                              │      │   │
│    │          │                                                      │      │   │
│    │          │  Allowed actions:                                    │      │   │
│    │          │  • vote(storyId, value) - any participant            │      │   │
│    │          │  • addStory(title, notes) - any participant          │      │   │
│    │          │  • setCurrentStory(storyId) - any (resets to voting) │      │   │
│    │          │                                                      │      │   │
│    │          │  Visibility:                                         │      │   │
│    │          │  • Vote values HIDDEN (show "hasVoted" only)         │      │   │
│    │          │  • No statistics calculated                          │      │   │
│    │          │                                                      │      │   │
│    │          │                                                      │      │   │
│    │          │  reveal(roomSecret)                                  │      │   │
│    │          │  [HOST ONLY]                                         │      │   │
│    │          ▼                                                      │      │   │
│    │  ╔═══════════════╗                                              │      │   │
│    │  ║   REVEALED    ║                                              │      │   │
│    │  ╚═══════╤═══════╝                                              │      │   │
│    │          │                                                      │      │   │
│    │          │  Allowed actions:                                    │      │   │
│    │          │  • vote(storyId, value) - still allowed (late votes) │      │   │
│    │          │  • clearVotes(roomSecret) - back to VOTING ──────────┤      │   │
│    │          │                                                      │      │   │
│    │          │  Visibility:                                         │      │   │
│    │          │  • All vote values VISIBLE                           │      │   │
│    │          │  • Statistics: min, max, median, spread              │      │   │
│    │          │                                                      │      │   │
│    │          │                                                      │      │   │
│    │          │  lock(storyId, value, roomSecret)                    │      │   │
│    │          │  [HOST ONLY]                                         │      │   │
│    │          ▼                                                      │      │   │
│    │  ╔═══════════════╗                                              │      │   │
│    │  ║    LOCKED     ║                                              │      │   │
│    │  ╚═══════╤═══════╝                                              │      │   │
│    │          │                                                      │      │   │
│    │          │  Allowed actions:                                    │      │   │
│    │          │  • next(roomSecret) - advance story ─────────────────┘      │   │
│    │          │  • clearVotes(roomSecret) - re-estimate ─────────────┘      │   │
│    │          │  • setCurrentStory(storyId) - manual select ─────────┘      │   │
│    │          │                                                             │   │
│    │          │  Blocked actions:                                           │   │
│    │          │  • vote() - IGNORED (story is finalized)                    │   │
│    │          │                                                             │   │
│    │          │  Visibility:                                                │   │
│    │          │  • Final locked value shown                                 │   │
│    │          │  • All votes still visible                                  │   │
│    │          │                                                             │   │
│    └──────────┴─────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

#### State Transitions

| From | To | Trigger | Auth | Notes |
|------|----|---------|------|-------|
| `voting` | `revealed` | `reveal` | **Host** | Exposes all votes + calculates stats |
| `revealed` | `locked` | `lock` | **Host** | Records final estimate |
| `revealed` | `voting` | `clearVotes` | **Host** | Clears votes, re-vote |
| `locked` | `voting` | `next` | **Host** | Advances to next story |
| `locked` | `voting` | `clearVotes` | **Host** | Re-estimate same story |
| `locked` | `voting` | `setCurrentStory` | Any | Manual story selection |
| `*` | `voting` | `setCurrentStory` | Any | Changing story resets phase |

---

#### Guard Rules (Critical for Correctness)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              GUARD RULES                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  🛡️ RULE 1: Vote Blocking in Locked Phase                                       │
│  ────────────────────────────────────────                                       │
│                                                                                 │
│  if (state.phase === "locked") {                                                │
│    // IGNORE vote updates - story is finalized                                  │
│    return;                                                                      │
│  }                                                                              │
│                                                                                 │
│  Rationale: Once locked, the estimate is final. No late changes.               │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  🛡️ RULE 2: Vote Privacy in Voting Phase                                        │
│  ────────────────────────────────────────                                       │
│                                                                                 │
│  if (state.phase === "voting") {                                                │
│    // Client receives votes, but UI must NOT display values                     │
│    // Only show: "hasVoted" (true/false) per participant                        │
│  }                                                                              │
│                                                                                 │
│  Implementation options:                                                        │
│  A) Server sends full votes, client hides values (simpler)                      │
│  B) Server omits vote values until revealed (more secure)                       │
│                                                                                 │
│  Recommendation: Option A (simpler, trust client, good enough for demo)         │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  🛡️ RULE 3: Host-Only Actions Must Validate Secret                              │
│  ─────────────────────────────────────────────────                              │
│                                                                                 │
│  Host-only actions:                                                             │
│  • reveal(roomSecret)                                                           │
│  • lock(storyId, value, roomSecret)                                             │
│  • clearVotes(storyId, roomSecret)                                              │
│  • next(roomSecret)                                                             │
│  • deleteStory(storyId, roomSecret)  [if implemented]                           │
│                                                                                 │
│  Validation:                                                                    │
│  async function isHost(roomSecret?: string): Promise<boolean> {                 │
│    if (!roomSecret) return false;                                               │
│    const storedHash = await this.state.storage.get<string>("secretHash");       │
│    const candidateHash = await sha256Hex(roomSecret);                           │
│    return candidateHash === storedHash;                                         │
│  }                                                                              │
│                                                                                 │
│  On failure:                                                                    │
│  sendTo(clientId, { type: "error", message: "Host secret required" });          │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  🛡️ RULE 4: Story Context Validation                                            │
│  ───────────────────────────────────                                            │
│                                                                                 │
│  // Vote must be for current story                                              │
│  if (msg.storyId !== state.currentStoryId) {                                    │
│    return; // Ignore stale vote                                                 │
│  }                                                                              │
│                                                                                 │
│  // Lock must reference valid story                                             │
│  if (!state.stories.some(s => s.id === msg.storyId)) {                          │
│    return; // Invalid story ID                                                  │
│  }                                                                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

#### Vote Visibility Matrix

| Phase | Vote Values | Statistics | Who Can See |
|-------|-------------|------------|-------------|
| `voting` | Hidden (show `?` or checkmark) | Not calculated | N/A |
| `revealed` | Visible to all | min, max, median, spread | All participants |
| `locked` | Visible to all | Shown + locked value | All participants |

---

#### Implementation: State Transition Handler

```typescript
// worker/src/room-do.ts

private async handleMessage(clientId: string, msg: ClientMsg) {
  const st = await this.load();
  if (!st) return;

  switch (msg.type) {
    // ═══════════════════════════════════════════════════════════════════
    // VOTING - Any participant
    // ═══════════════════════════════════════════════════════════════════
    case "vote": {
      // GUARD: Cannot vote when locked
      if (st.phase === "locked") {
        return; // Silently ignore
      }

      // GUARD: Must be voting on current story
      if (st.currentStoryId !== msg.storyId) {
        return; // Stale vote
      }

      // Record vote
      st.votesByStory[msg.storyId] ||= {};
      st.votesByStory[msg.storyId][clientId] = String(msg.value).slice(0, 12);

      await this.save(st);
      this.broadcast(st);
      return;
    }

    // ═══════════════════════════════════════════════════════════════════
    // REVEAL - Host only
    // ═══════════════════════════════════════════════════════════════════
    case "reveal": {
      // GUARD: Host authentication
      if (!(await this.isHost(msg.roomSecret))) {
        this.sendTo(clientId, { type: "error", message: "Host secret required" });
        return;
      }

      // GUARD: Must have a current story
      if (!st.currentStoryId) {
        return;
      }

      // TRANSITION: voting → revealed
      st.phase = "revealed";

      await this.save(st);
      this.broadcast(st);
      return;
    }

    // ═══════════════════════════════════════════════════════════════════
    // LOCK - Host only
    // ═══════════════════════════════════════════════════════════════════
    case "lock": {
      // GUARD: Host authentication
      if (!(await this.isHost(msg.roomSecret))) {
        this.sendTo(clientId, { type: "error", message: "Host secret required" });
        return;
      }

      // GUARD: Story must exist
      if (!st.stories.some(s => s.id === msg.storyId)) {
        return;
      }

      // Record locked value
      st.lockedByStory[msg.storyId] = String(msg.value).slice(0, 12);

      // TRANSITION: revealed → locked
      st.phase = "locked";

      await this.save(st);
      this.broadcast(st);
      return;
    }

    // ═══════════════════════════════════════════════════════════════════
    // CLEAR VOTES - Host only (back to voting)
    // ═══════════════════════════════════════════════════════════════════
    case "clearVotes": {
      // GUARD: Host authentication
      if (!(await this.isHost(msg.roomSecret))) {
        this.sendTo(clientId, { type: "error", message: "Host secret required" });
        return;
      }

      // Clear votes for this story
      st.votesByStory[msg.storyId] = {};

      // TRANSITION: * → voting
      st.phase = "voting";

      await this.save(st);
      this.broadcast(st);
      return;
    }

    // ═══════════════════════════════════════════════════════════════════
    // NEXT STORY - Host only
    // ═══════════════════════════════════════════════════════════════════
    case "next": {
      // GUARD: Host authentication
      if (!(await this.isHost(msg.roomSecret))) {
        this.sendTo(clientId, { type: "error", message: "Host secret required" });
        return;
      }

      // Find next story
      const currentIdx = st.stories.findIndex(s => s.id === st.currentStoryId);
      const nextStory = st.stories[currentIdx + 1];

      if (nextStory) {
        st.currentStoryId = nextStory.id;
      }
      // If no next story, keep current but reset phase

      // TRANSITION: locked → voting
      st.phase = "voting";

      await this.save(st);
      this.broadcast(st);
      return;
    }

    // ═══════════════════════════════════════════════════════════════════
    // SET CURRENT STORY - Any participant (resets to voting)
    // ═══════════════════════════════════════════════════════════════════
    case "setCurrentStory": {
      // GUARD: Story must exist
      if (!st.stories.some(s => s.id === msg.storyId)) {
        return;
      }

      st.currentStoryId = msg.storyId;

      // TRANSITION: * → voting (always reset on story change)
      st.phase = "voting";

      await this.save(st);
      this.broadcast(st);
      return;
    }
  }
}
```

---

#### Derived State Calculation

```typescript
private derive(st: RoomState): DerivedState {
  // Current story object
  const currentStory = st.currentStoryId
    ? st.stories.find(s => s.id === st.currentStoryId) ?? null
    : null;

  // Get votes for current story
  const votes = (st.currentStoryId && st.votesByStory[st.currentStoryId])
    ? Object.values(st.votesByStory[st.currentStoryId])
    : [];

  // Convert to numbers (ignore non-numeric like "?" or "☕")
  const numeric = votes
    .map(v => Number(v))
    .filter(n => Number.isFinite(n));

  // Calculate stats ONLY if revealed or locked
  const stats = (st.phase !== "voting" && numeric.length > 0)
    ? {
        min: Math.min(...numeric),
        max: Math.max(...numeric),
        median: median(numeric),
        spread: Math.max(...numeric) - Math.min(...numeric),
      }
    : null;

  // How many participants haven't voted
  const waitingFor = Math.max(
    0,
    Object.keys(st.participants).length - votes.length
  );

  return { currentStory, stats, waitingFor };
}

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
```

---

#### Step 3 Checklist

```
□ 3.1  Define states: voting, revealed, locked           ✅ DONE
□ 3.2  Define all state transitions                      ✅ DONE
□ 3.3  Implement guard rules:
       □ Block votes in locked phase
       □ Hide vote values in voting phase (client-side)
       □ Validate roomSecret for host actions
       □ Validate storyId context
□ 3.4  Implement derived state calculation (stats)
□ 3.5  Write unit tests for state machine
□ 3.6  Commit: "Step 3: State machine implementation"
```

---

### Step 4: Message Protocol (WebSocket Contract)

#### Goal

Define the complete WebSocket message protocol between client and server. This is the **API contract** that both sides must implement.

---

#### Design Decision: Full State Snapshots

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         BROADCAST STRATEGY                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Option A: Delta Updates              Option B: Full Snapshots ✅               │
│  ─────────────────────────            ────────────────────────────              │
│                                                                                 │
│  • Send only what changed             • Send entire state every time            │
│  • Complex client merging             • Simple client replacement               │
│  • Risk of desync                     • Always consistent                       │
│  • Less bandwidth                     • More bandwidth (acceptable)             │
│  • Hard to debug                      • Easy to debug                           │
│                                                                                 │
│  DECISION: Full Snapshots                                                       │
│                                                                                 │
│  Rationale:                                                                     │
│  • Rooms are small (≤25 participants, ≤50 stories)                              │
│  • State is <10KB typically                                                     │
│  • Simplicity > micro-optimization                                              │
│  • Reconnection is trivial (just receive latest state)                          │
│  • No client-side merge logic needed                                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

#### Client → Server Messages

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CLIENT → SERVER MESSAGES                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  PARTICIPANT ACTIONS (no auth required)                                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  join                                                                           │
│  ────                                                                           │
│  { type: "join", name?: string }                                                │
│                                                                                 │
│  • Adds participant to room                                                     │
│  • name is optional, defaults to "Anonymous"                                    │
│  • Triggers state broadcast to all                                              │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  setName                                                                        │
│  ───────                                                                        │
│  { type: "setName", name: string }                                              │
│                                                                                 │
│  • Updates participant's display name                                           │
│  • Max 24 characters, trimmed                                                   │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  addStory                                                                       │
│  ────────                                                                       │
│  { type: "addStory", title: string, notes?: string }                            │
│                                                                                 │
│  • Adds new story to backlog                                                    │
│  • title: required, max 120 chars                                               │
│  • notes: optional, max 500 chars                                               │
│  • Auto-selects as current if first story                                       │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  setCurrentStory                                                                │
│  ───────────────                                                                │
│  { type: "setCurrentStory", storyId: string }                                   │
│                                                                                 │
│  • Selects story for estimation                                                 │
│  • Resets phase to "voting"                                                     │
│  • storyId must exist in stories array                                          │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  vote                                                                           │
│  ────                                                                           │
│  { type: "vote", storyId: string, value: string }                               │
│                                                                                 │
│  • Submits/updates vote for story                                               │
│  • storyId must match currentStoryId                                            │
│  • value: "1", "2", "3", "5", "8", "13", "21", "?", "☕", etc.                   │
│  • Ignored if phase is "locked"                                                 │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  HOST-ONLY ACTIONS (require roomSecret)                                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  reveal                                                                         │
│  ──────                                                                         │
│  { type: "reveal", roomSecret: string }                                         │
│                                                                                 │
│  • Transitions phase: voting → revealed                                         │
│  • Exposes all vote values                                                      │
│  • Triggers statistics calculation                                              │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  lock                                                                           │
│  ────                                                                           │
│  { type: "lock", storyId: string, value: string, roomSecret: string }           │
│                                                                                 │
│  • Records final estimate for story                                             │
│  • Transitions phase: revealed → locked                                         │
│  • value: the consensus estimate (may differ from votes)                        │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  next                                                                           │
│  ────                                                                           │
│  { type: "next", roomSecret: string }                                           │
│                                                                                 │
│  • Advances to next story in list                                               │
│  • Transitions phase: locked → voting                                           │
│  • If no next story, keeps current but resets phase                             │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  clearVotes                                                                     │
│  ──────────                                                                     │
│  { type: "clearVotes", storyId: string, roomSecret: string }                    │
│                                                                                 │
│  • Clears all votes for specified story                                         │
│  • Transitions phase: * → voting                                                │
│  • Used for re-estimation after discussion                                      │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  OPTIONAL / FUN ACTIONS                                                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  toggleFun                                                                      │
│  ─────────                                                                      │
│  { type: "toggleFun", funMode: boolean }                                        │
│                                                                                 │
│  • Enables/disables fun mode (animations, sounds)                               │
│  • Affects all participants                                                     │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  setDeck                                                                        │
│  ───────                                                                        │
│  { type: "setDeck", deck: { type: DeckType, custom?: string[] } }               │
│                                                                                 │
│  • Changes estimation deck                                                      │
│  • type: "fibonacci" | "tshirt" | "custom"                                      │
│  • custom: array of values if type is "custom"                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

#### Server → Client Messages

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        SERVER → CLIENT MESSAGES                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  hello                                                                          │
│  ─────                                                                          │
│  { type: "hello", clientId: string }                                            │
│                                                                                 │
│  • Sent immediately on WebSocket connection                                     │
│  • clientId: UUID assigned to this connection                                   │
│  • Client should store this for identifying own votes                           │
│                                                                                 │
│  Example:                                                                       │
│  { "type": "hello", "clientId": "550e8400-e29b-41d4-a716-446655440000" }         │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  state                                                                          │
│  ─────                                                                          │
│  {                                                                              │
│    type: "state",                                                               │
│    state: RoomState,                                                            │
│    derived: DerivedState                                                        │
│  }                                                                              │
│                                                                                 │
│  • Sent after hello (initial state)                                             │
│  • Broadcast to ALL clients after ANY state change                              │
│  • Contains complete room state + computed values                               │
│                                                                                 │
│  Example:                                                                       │
│  {                                                                              │
│    "type": "state",                                                             │
│    "state": {                                                                   │
│      "roomId": "abc123xyz789",                                                  │
│      "createdAt": 1706745600000,                                                │
│      "expiresAt": 1706832000000,                                                │
│      "deck": { "type": "fibonacci" },                                           │
│      "funMode": false,                                                          │
│      "stories": [                                                               │
│        { "id": "story-1", "title": "User login", "notes": "OAuth" }             │
│      ],                                                                         │
│      "currentStoryId": "story-1",                                               │
│      "phase": "voting",                                                         │
│      "votesByStory": {                                                          │
│        "story-1": { "client-1": "5", "client-2": "8" }                          │
│      },                                                                         │
│      "lockedByStory": {},                                                       │
│      "participants": {                                                          │
│        "client-1": { "name": "Alice", "joinedAt": 1706745700000 },              │
│        "client-2": { "name": "Bob", "joinedAt": 1706745800000 }                 │
│      }                                                                          │
│    },                                                                           │
│    "derived": {                                                                 │
│      "currentStory": { "id": "story-1", "title": "User login" },                │
│      "stats": null,                                                             │
│      "waitingFor": 0                                                            │
│    }                                                                            │
│  }                                                                              │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  error                                                                          │
│  ─────                                                                          │
│  { type: "error", message: string }                                             │
│                                                                                 │
│  • Sent to single client (not broadcast)                                        │
│  • Indicates action was rejected                                                │
│                                                                                 │
│  Examples:                                                                      │
│  { "type": "error", "message": "Host secret required" }                         │
│  { "type": "error", "message": "Room full (demo limit)" }                       │
│  { "type": "error", "message": "Story title required" }                         │
│  { "type": "error", "message": "Too many stories" }                             │
│  { "type": "error", "message": "Message too large" }                            │
│  { "type": "error", "message": "Invalid message" }                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

#### TypeScript Type Definitions

```typescript
// worker/src/types.ts

// ═══════════════════════════════════════════════════════════════════════════════
// DECK TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type DeckType = "fibonacci" | "tshirt" | "custom";

export const DECK_VALUES: Record<DeckType, string[]> = {
  fibonacci: ["0", "1", "2", "3", "5", "8", "13", "21", "?", "☕"],
  tshirt: ["XS", "S", "M", "L", "XL", "XXL", "?", "☕"],
  custom: [], // User-defined
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROOM STATE
// ═══════════════════════════════════════════════════════════════════════════════

export type Story = {
  id: string;
  title: string;
  notes?: string;
};

export type Participant = {
  name: string;
  joinedAt: number;
};

export type RoomState = {
  roomId: string;
  createdAt: number;
  expiresAt: number;

  deck: { type: DeckType; custom?: string[] };
  funMode: boolean;

  stories: Story[];
  currentStoryId: string | null;

  phase: "voting" | "revealed" | "locked";
  votesByStory: Record<string, Record<string, string>>;
  lockedByStory: Record<string, string>;

  participants: Record<string, Participant>;
};

export type DerivedState = {
  currentStory: Story | null;
  stats: {
    min: number;
    max: number;
    median: number;
    spread: number;
  } | null;
  waitingFor: number;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT → SERVER MESSAGES
// ═══════════════════════════════════════════════════════════════════════════════

export type ClientMsg =
  // Participant actions
  | { type: "join"; name?: string }
  | { type: "setName"; name: string }
  | { type: "addStory"; title: string; notes?: string }
  | { type: "setCurrentStory"; storyId: string }
  | { type: "vote"; storyId: string; value: string }
  // Host-only actions
  | { type: "reveal"; roomSecret: string }
  | { type: "lock"; storyId: string; value: string; roomSecret: string }
  | { type: "next"; roomSecret: string }
  | { type: "clearVotes"; storyId: string; roomSecret: string }
  // Optional
  | { type: "toggleFun"; funMode: boolean }
  | { type: "setDeck"; deck: { type: DeckType; custom?: string[] } };

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER → CLIENT MESSAGES
// ═══════════════════════════════════════════════════════════════════════════════

export type ServerMsg =
  | { type: "hello"; clientId: string }
  | { type: "state"; state: RoomState; derived: DerivedState }
  | { type: "error"; message: string };
```

---

#### Message Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MESSAGE FLOW                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  CLIENT A          CLIENT B          CLIENT C              DURABLE OBJECT       │
│  (Host)            (Guest)           (Guest)                                    │
│     │                 │                 │                        │              │
│     │══ WS Connect ══════════════════════════════════════════════►│              │
│     │◄══════════════════════════════════════════ hello(clientId) ═│              │
│     │◄══════════════════════════════════════════ state(initial) ══│              │
│     │                 │                 │                        │              │
│     │                 │══ WS Connect ═══════════════════════════►│              │
│     │                 │◄═════════════════════════ hello(clientId)│              │
│     │                 │◄═════════════════════════ state(initial) │              │
│     │                 │                 │                        │              │
│     │── join(name) ──────────────────────────────────────────────►│              │
│     │◄══════════════════════════════════════════ state(updated) ═│              │
│     │                 │◄═════════════════════════ state(updated) │              │
│     │                 │                 │                        │              │
│     │── addStory(title) ─────────────────────────────────────────►│              │
│     │◄══════════════════════════════════════════ state(updated) ═│              │
│     │                 │◄═════════════════════════ state(updated) │              │
│     │                 │                 │◄═══════ state(updated) │              │
│     │                 │                 │                        │              │
│     │                 │── vote(5) ───────────────────────────────►│              │
│     │◄══════════════════════════════════════════ state(updated) ═│              │
│     │                 │◄═════════════════════════ state(updated) │              │
│     │                 │                 │◄═══════ state(updated) │              │
│     │                 │                 │                        │              │
│     │── reveal(secret) ──────────────────────────────────────────►│              │
│     │◄══════════════════════════════════════════ state(revealed) │              │
│     │                 │◄═════════════════════════ state(revealed)│              │
│     │                 │                 │◄═══════ state(revealed)│              │
│     │                 │                 │                        │              │
│     │                 │                 │                        │              │
│  ═══════════════════════════════════════════════════════════════════════════   │
│  Legend:                                                                        │
│  ──► Single message (client to server)                                          │
│  ═══ Broadcast (server to all clients)                                          │
│  ◄── Response to single client                                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

#### Message Validation Rules

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         VALIDATION RULES                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Message Size                                                                   │
│  ────────────                                                                   │
│  MAX_MSG_BYTES = 4096                                                           │
│                                                                                 │
│  if (data.length > MAX_MSG_BYTES) {                                             │
│    send({ type: "error", message: "Message too large" });                       │
│    return;                                                                      │
│  }                                                                              │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  String Limits                                                                  │
│  ─────────────                                                                  │
│  name:    max 24 chars, trimmed, default "Anonymous"                            │
│  title:   max 120 chars, trimmed, required                                      │
│  notes:   max 500 chars, optional                                               │
│  value:   max 12 chars                                                          │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  Collection Limits                                                              │
│  ─────────────────                                                              │
│  MAX_PARTICIPANTS = 25                                                          │
│  MAX_STORIES = 50                                                               │
│  MAX_CUSTOM_DECK = 20 values                                                    │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  JSON Parsing                                                                   │
│  ────────────                                                                   │
│  function safeJsonParse<T>(text: string): T | null {                            │
│    try { return JSON.parse(text) as T; }                                        │
│    catch { return null; }                                                       │
│  }                                                                              │
│                                                                                 │
│  const msg = safeJsonParse<ClientMsg>(data);                                    │
│  if (!msg?.type) {                                                              │
│    send({ type: "error", message: "Invalid message" });                         │
│    return;                                                                      │
│  }                                                                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

#### Client Implementation Example

```javascript
// pages/scripts/websocket.js

class RoomConnection {
  constructor(roomId, roomSecret = null) {
    this.roomId = roomId;
    this.roomSecret = roomSecret; // null for participants
    this.clientId = null;
    this.ws = null;
    this.state = null;
    this.derived = null;
    this.onStateChange = () => {};
    this.onError = () => {};
  }

  connect() {
    const wsUrl = `wss://api.sprintstorypoint.com/api/rooms/${this.roomId}/ws`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      this.handleMessage(msg);
    };

    this.ws.onclose = () => {
      // Reconnection logic here
    };
  }

  handleMessage(msg) {
    switch (msg.type) {
      case "hello":
        this.clientId = msg.clientId;
        break;

      case "state":
        this.state = msg.state;
        this.derived = msg.derived;
        this.onStateChange(this.state, this.derived);
        break;

      case "error":
        this.onError(msg.message);
        break;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // PARTICIPANT ACTIONS
  // ═══════════════════════════════════════════════════════════════════

  join(name) {
    this.send({ type: "join", name });
  }

  setName(name) {
    this.send({ type: "setName", name });
  }

  addStory(title, notes) {
    this.send({ type: "addStory", title, notes });
  }

  selectStory(storyId) {
    this.send({ type: "setCurrentStory", storyId });
  }

  vote(value) {
    if (!this.state?.currentStoryId) return;
    this.send({ type: "vote", storyId: this.state.currentStoryId, value });
  }

  // ═══════════════════════════════════════════════════════════════════
  // HOST ACTIONS
  // ═══════════════════════════════════════════════════════════════════

  reveal() {
    if (!this.roomSecret) return;
    this.send({ type: "reveal", roomSecret: this.roomSecret });
  }

  lock(value) {
    if (!this.roomSecret || !this.state?.currentStoryId) return;
    this.send({
      type: "lock",
      storyId: this.state.currentStoryId,
      value,
      roomSecret: this.roomSecret,
    });
  }

  next() {
    if (!this.roomSecret) return;
    this.send({ type: "next", roomSecret: this.roomSecret });
  }

  clearVotes() {
    if (!this.roomSecret || !this.state?.currentStoryId) return;
    this.send({
      type: "clearVotes",
      storyId: this.state.currentStoryId,
      roomSecret: this.roomSecret,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════

  send(msg) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  get isHost() {
    return !!this.roomSecret;
  }

  get myVote() {
    if (!this.state?.currentStoryId || !this.clientId) return null;
    return this.state.votesByStory[this.state.currentStoryId]?.[this.clientId];
  }

  get hasVoted() {
    return this.myVote !== undefined;
  }
}
```

---

#### Step 4 Checklist

```
□ 4.1  Define all Client → Server message types           ✅ DONE
□ 4.2  Define all Server → Client message types           ✅ DONE
□ 4.3  Create TypeScript type definitions                 ✅ DONE
□ 4.4  Document validation rules                          ✅ DONE
□ 4.5  Implement client-side WebSocket class
□ 4.6  Write message handling tests
□ 4.7  Commit: "Step 4: WebSocket protocol implementation"
```

---

### Step 5: Data Model (Durable Object Storage)

#### Goal

Define exactly what data the Durable Object stores, how it's structured, and what's computed on-the-fly.

---

#### Storage Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      DURABLE OBJECT STORAGE                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    PERSISTENT STORAGE                                    │   │
│  │                    (this.state.storage)                                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Key: "state"                                                                   │
│  ─────────────                                                                  │
│  Type: RoomState (JSON object)                                                  │
│  Size: ~1KB - 50KB depending on stories/participants                            │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  {                                                                       │   │
│  │    "roomId": "abc123xyz789",                                             │   │
│  │    "createdAt": 1706745600000,                                           │   │
│  │    "expiresAt": 1706832000000,                                           │   │
│  │    "deck": { "type": "fibonacci" },                                      │   │
│  │    "funMode": false,                                                     │   │
│  │    "stories": [...],                                                     │   │
│  │    "currentStoryId": "story-1",                                          │   │
│  │    "phase": "voting",                                                    │   │
│  │    "votesByStory": {...},                                                │   │
│  │    "lockedByStory": {...},                                               │   │
│  │    "participants": {...}                                                 │   │
│  │  }                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  Key: "secretHash"                                                              │
│  ─────────────────                                                              │
│  Type: string (64 hex characters)                                               │
│  Value: SHA-256 hash of roomSecret                                              │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  "a1b2c3d4e5f6...64 hex chars total..."                                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Why hashed?                                                                    │
│  • Original secret never stored                                                 │
│  • Can verify without exposing                                                  │
│  • If storage leaked, secret still safe                                         │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    IN-MEMORY ONLY                                        │   │
│  │                    (not persisted)                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  sockets: Map<string, WebSocket>                                                │
│  ─────────────────────────────────                                              │
│  • Maps clientId → active WebSocket                                             │
│  • Rebuilt on DO wake-up                                                        │
│  • Used for broadcast                                                           │
│                                                                                 │
│  roomSecretHash: string | null                                                  │
│  ───────────────────────────────                                                │
│  • Cached from storage                                                          │
│  • Avoids repeated storage reads                                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

#### RoomState Schema (Persisted)

```typescript
// worker/src/types.ts

/**
 * Complete room state - persisted to Durable Object storage
 */
type RoomState = {
  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY & LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Unique room identifier (nanoid, 12 chars) */
  roomId: string;

  /** Unix timestamp when room was created */
  createdAt: number;

  /** Unix timestamp when room expires (createdAt + 24 hours) */
  expiresAt: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  /** Estimation deck configuration */
  deck: {
    type: "fibonacci" | "tshirt" | "custom";
    custom?: string[];  // Only used when type is "custom"
  };

  /** Fun mode enables animations/sounds */
  funMode: boolean;

  // ═══════════════════════════════════════════════════════════════════════════
  // STORIES
  // ═══════════════════════════════════════════════════════════════════════════

  /** All stories in this session */
  stories: Array<{
    id: string;       // UUID
    title: string;    // Max 120 chars
    notes?: string;   // Max 500 chars, optional
  }>;

  /** Currently active story for voting (null if none) */
  currentStoryId: string | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // VOTING STATE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Current phase of estimation */
  phase: "voting" | "revealed" | "locked";

  /**
   * Votes organized by story, then by client
   * Structure: { [storyId]: { [clientId]: voteValue } }
   */
  votesByStory: Record<string, Record<string, string>>;

  /**
   * Final locked estimates by story
   * Structure: { [storyId]: lockedValue }
   */
  lockedByStory: Record<string, string>;

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTICIPANTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Active participants in the room
   * Structure: { [clientId]: { name, joinedAt } }
   */
  participants: Record<string, {
    name: string;      // Display name, max 24 chars
    joinedAt: number;  // Unix timestamp
  }>;
};
```

---

#### DerivedState Schema (Computed)

```typescript
/**
 * Computed state - calculated on each broadcast, never persisted
 */
type DerivedState = {
  // ═══════════════════════════════════════════════════════════════════════════
  // CONVENIENCE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Current story object (resolved from currentStoryId)
   * null if no story selected
   */
  currentStory: {
    id: string;
    title: string;
    notes?: string;
  } | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // VOTING PROGRESS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Number of participants who haven't voted yet
   * Formula: participantCount - votedCount
   */
  waitingFor: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // STATISTICS (only when phase !== "voting")
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Vote statistics - only calculated after reveal
   * null during voting phase
   * Only includes numeric votes (ignores "?", "☕", etc.)
   */
  stats: {
    min: number;      // Lowest numeric vote
    max: number;      // Highest numeric vote
    median: number;   // Middle value
    spread: number;   // max - min (indicates consensus)
  } | null;
};
```

---

#### Data Relationships

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DATA RELATIONSHIPS                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                                                                                 │
│   RoomState                                                                     │
│   ─────────                                                                     │
│        │                                                                        │
│        ├──── stories[] ─────────────────────┐                                   │
│        │     [0] { id: "s1", title: "..." }  │                                   │
│        │     [1] { id: "s2", title: "..." }  │                                   │
│        │     [2] { id: "s3", title: "..." }  │                                   │
│        │                                     │                                   │
│        ├──── currentStoryId: "s2" ──────────┼──► Points to stories[1]           │
│        │                                     │                                   │
│        ├──── votesByStory ──────────────────┤                                   │
│        │     {                              │                                   │
│        │       "s1": {                      │  ◄── Story s1 votes               │
│        │         "c1": "5",                 │      (already estimated)          │
│        │         "c2": "8"                  │                                   │
│        │       },                           │                                   │
│        │       "s2": {                      │  ◄── Story s2 votes               │
│        │         "c1": "3",                 │      (current story)              │
│        │         "c3": "5"                  │                                   │
│        │       }                            │                                   │
│        │     }                              │                                   │
│        │                                     │                                   │
│        ├──── lockedByStory ─────────────────┤                                   │
│        │     {                              │                                   │
│        │       "s1": "5"                    │  ◄── Story s1 final: 5 points     │
│        │     }                              │                                   │
│        │                                     │                                   │
│        └──── participants ──────────────────┤                                   │
│              {                              │                                   │
│                "c1": { name: "Alice" },     │  ◄── Connected clients            │
│                "c2": { name: "Bob" },       │                                   │
│                "c3": { name: "Carol" }      │                                   │
│              }                              │                                   │
│                                                                                 │
│                                                                                 │
│   Key Relationships:                                                            │
│   ─────────────────                                                             │
│   • currentStoryId → must exist in stories[]                                    │
│   • votesByStory keys → should be valid story IDs                               │
│   • votesByStory[x] keys → should be valid participant IDs                      │
│   • lockedByStory keys → should be valid story IDs                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

#### Storage Operations

```typescript
// worker/src/room-do.ts

export class RoomDO implements DurableObject {
  private state: DurableObjectState;
  private sockets = new Map<string, WebSocket>();
  private roomSecretHash: string | null = null;

  constructor(state: DurableObjectState, env: unknown) {
    this.state = state;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSISTENCE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Load room state from storage
   * Returns null if room doesn't exist
   */
  private async load(): Promise<RoomState | null> {
    return await this.state.storage.get<RoomState>("state") ?? null;
  }

  /**
   * Save room state to storage
   */
  private async save(st: RoomState): Promise<void> {
    await this.state.storage.put("state", st);
  }

  /**
   * Get secret hash (cached)
   */
  private async getSecretHash(): Promise<string | null> {
    if (this.roomSecretHash) return this.roomSecretHash;
    const h = await this.state.storage.get<string>("secretHash");
    this.roomSecretHash = h ?? null;
    return this.roomSecretHash;
  }

  /**
   * Initialize new room
   */
  async initRoom(roomId: string, roomSecret: string): Promise<void> {
    const createdAt = Date.now();
    const expiresAt = createdAt + 24 * 60 * 60 * 1000; // 24 hours

    const secretHash = await sha256Hex(roomSecret);

    const initial: RoomState = {
      roomId,
      createdAt,
      expiresAt,

      deck: { type: "fibonacci" },
      funMode: false,

      stories: [],
      currentStoryId: null,

      phase: "voting",
      votesByStory: {},
      lockedByStory: {},

      participants: {},
    };

    await this.state.storage.put("secretHash", secretHash);
    await this.save(initial);
    await this.state.storage.setAlarm(expiresAt);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DERIVED STATE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Compute derived state from room state
   * Called on every broadcast
   */
  private derive(st: RoomState): DerivedState {
    // Resolve current story
    const currentStory = st.currentStoryId
      ? st.stories.find(s => s.id === st.currentStoryId) ?? null
      : null;

    // Get votes for current story
    const currentVotes = st.currentStoryId
      ? st.votesByStory[st.currentStoryId] ?? {}
      : {};

    const voteValues = Object.values(currentVotes);
    const voteCount = voteValues.length;
    const participantCount = Object.keys(st.participants).length;

    // Calculate waiting count
    const waitingFor = Math.max(0, participantCount - voteCount);

    // Calculate stats (only if revealed/locked and has numeric votes)
    let stats: DerivedState["stats"] = null;

    if (st.phase !== "voting" && voteValues.length > 0) {
      const numeric = voteValues
        .map(v => parseFloat(v))
        .filter(n => Number.isFinite(n));

      if (numeric.length > 0) {
        const sorted = [...numeric].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);

        stats = {
          min: Math.min(...numeric),
          max: Math.max(...numeric),
          median: sorted.length % 2
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2,
          spread: Math.max(...numeric) - Math.min(...numeric),
        };
      }
    }

    return { currentStory, waitingFor, stats };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Alarm handler - called when room expires
   */
  async alarm(): Promise<void> {
    const st = await this.load();
    if (!st) return;

    if (Date.now() >= st.expiresAt) {
      // Close all connections
      for (const [, ws] of this.sockets) {
        try {
          ws.close(1000, "Room expired");
        } catch {}
      }
      this.sockets.clear();

      // Delete all storage
      await this.state.storage.deleteAll();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════════════════════

async function sha256Hex(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(digest);
  return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}
```

---

#### Example Data

```json
{
  "state": {
    "roomId": "V1StGXR8_Z5j",
    "createdAt": 1706745600000,
    "expiresAt": 1706832000000,

    "deck": { "type": "fibonacci" },
    "funMode": false,

    "stories": [
      { "id": "a1b2c3d4", "title": "User authentication", "notes": "OAuth + email" },
      { "id": "e5f6g7h8", "title": "Dashboard widgets" },
      { "id": "i9j0k1l2", "title": "Export to CSV" }
    ],
    "currentStoryId": "e5f6g7h8",

    "phase": "revealed",
    "votesByStory": {
      "a1b2c3d4": {
        "client-111": "8",
        "client-222": "5",
        "client-333": "8"
      },
      "e5f6g7h8": {
        "client-111": "3",
        "client-222": "5",
        "client-333": "3"
      }
    },
    "lockedByStory": {
      "a1b2c3d4": "8"
    },

    "participants": {
      "client-111": { "name": "Alice", "joinedAt": 1706745700000 },
      "client-222": { "name": "Bob", "joinedAt": 1706745800000 },
      "client-333": { "name": "Carol", "joinedAt": 1706745900000 }
    }
  },

  "secretHash": "a1b2c3d4e5f6789...64 hex characters..."
}
```

**Derived for this state:**
```json
{
  "currentStory": {
    "id": "e5f6g7h8",
    "title": "Dashboard widgets"
  },
  "waitingFor": 0,
  "stats": {
    "min": 3,
    "max": 5,
    "median": 3,
    "spread": 2
  }
}
```

---

#### Size Estimates

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SIZE ESTIMATES                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Component                    Size Estimate                                     │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  Base state (empty room)      ~200 bytes                                        │
│  Per story                    ~150 bytes (title + notes + id)                   │
│  Per participant              ~80 bytes (name + id + timestamp)                 │
│  Per vote                     ~50 bytes (storyId + clientId + value)            │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  Typical room (10 people, 20 stories, all voted):                               │
│  • Base: 200                                                                    │
│  • Stories: 20 × 150 = 3,000                                                    │
│  • Participants: 10 × 80 = 800                                                  │
│  • Votes: 20 × 10 × 50 = 10,000                                                 │
│  • TOTAL: ~14 KB                                                                │
│                                                                                 │
│  Maximum room (25 people, 50 stories):                                          │
│  • Base: 200                                                                    │
│  • Stories: 50 × 150 = 7,500                                                    │
│  • Participants: 25 × 80 = 2,000                                                │
│  • Votes: 50 × 25 × 50 = 62,500                                                 │
│  • TOTAL: ~72 KB                                                                │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  Durable Object storage limit: 128 KB per key ✅                                │
│  WebSocket message size: well under 1 MB limit ✅                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

#### Step 5 Checklist

```
□ 5.1  Define persistent storage keys (state, secretHash)    ✅ DONE
□ 5.2  Define RoomState schema                               ✅ DONE
□ 5.3  Define DerivedState schema                            ✅ DONE
□ 5.4  Document data relationships                           ✅ DONE
□ 5.5  Implement storage operations (load, save, init)
□ 5.6  Implement derive() function
□ 5.7  Verify size constraints
□ 5.8  Commit: "Step 5: Data model implementation"
```

---

### Step 6: Backend Routing Responsibilities (Worker vs DO)

#### Goal

Clearly define what the Worker handles vs what the Durable Object handles. This separation is what makes it a **"showcase-grade"** architecture.

---

#### Architecture Principle

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     SEPARATION OF CONCERNS                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         CLOUDFLARE WORKER                                │   │
│   │                         (Stateless Router)                               │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│   DOES:                              DOES NOT:                                  │
│   ─────                              ─────────                                  │
│   ✅ HTTP routing                    ❌ Store any room state                    │
│   ✅ CORS headers                    ❌ Handle WebSocket messages               │
│   ✅ Request validation              ❌ Know voting logic                       │
│   ✅ Generate IDs (nanoid)           ❌ Track participants                      │
│   ✅ Pass-through to DO              ❌ Manage sessions                         │
│                                                                                 │
│   Think of it as: "API Gateway" or "Reverse Proxy"                              │
│                                                                                 │
│   ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         DURABLE OBJECT                                   │   │
│   │                         (Stateful Room Engine)                           │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│   DOES:                              DOES NOT:                                  │
│   ─────                              ─────────                                  │
│   ✅ Own authoritative state         ❌ Handle HTTP routing                     │
│   ✅ WebSocket management            ❌ Know about other rooms                  │
│   ✅ Apply state machine rules       ❌ Generate room IDs                       │
│   ✅ Broadcast to clients            ❌ Handle CORS                             │
│   ✅ Validate host secret                                                       │
│   ✅ TTL expiry / cleanup                                                       │
│                                                                                 │
│   Think of it as: "Room Server" or "Game Session"                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

#### Worker Responsibilities (Stateless)

```typescript
// worker/src/index.ts

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // ═══════════════════════════════════════════════════════════════════════
    // CORS PREFLIGHT
    // ═══════════════════════════════════════════════════════════════════════
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(req, env) });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HEALTH CHECK
    // ═══════════════════════════════════════════════════════════════════════
    if (url.pathname === "/api/health") {
      return json({ ok: true, timestamp: Date.now() }, req, env);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CREATE ROOM
    // POST /api/rooms
    // ═══════════════════════════════════════════════════════════════════════
    if (url.pathname === "/api/rooms" && req.method === "POST") {
      // 1. Generate unique identifiers
      const roomId = nanoid(12);       // Public room ID
      const roomSecret = nanoid(24);   // Host secret (never stored plain)

      // 2. Get Durable Object instance
      const id = env.ROOMS.idFromName(roomId);
      const stub = env.ROOMS.get(id);

      // 3. Initialize room via DO
      const initResp = await stub.fetch("https://do/init", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roomId, roomSecret }),
      });

      if (!initResp.ok) {
        return json({ error: "Failed to create room" }, req, env, 500);
      }

      // 4. Return IDs to client
      return json({ roomId, roomSecret }, req, env, 201);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WEBSOCKET UPGRADE
    // GET /api/rooms/:id/ws
    // ═══════════════════════════════════════════════════════════════════════
    const wsMatch = url.pathname.match(/^\/api\/rooms\/([A-Za-z0-9_-]{6,})\/ws$/);
    if (wsMatch) {
      if (req.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
        return json({ error: "Expected WebSocket upgrade" }, req, env, 426);
      }

      const roomId = wsMatch[1];
      const id = env.ROOMS.idFromName(roomId);
      const stub = env.ROOMS.get(id);

      // Pass-through: DO handles everything from here
      return stub.fetch(req);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STATE SNAPSHOT (Optional - for debugging/support)
    // GET /api/rooms/:id/state
    // ═══════════════════════════════════════════════════════════════════════
    const stateMatch = url.pathname.match(/^\/api\/rooms\/([A-Za-z0-9_-]{6,})\/state$/);
    if (stateMatch && req.method === "GET") {
      const roomId = stateMatch[1];
      const id = env.ROOMS.idFromName(roomId);
      const stub = env.ROOMS.get(id);

      // Forward to DO
      const resp = await stub.fetch("https://do/state");
      return new Response(resp.body, {
        status: resp.status,
        headers: { ...corsHeaders(req, env), "content-type": "application/json" },
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 404 NOT FOUND
    // ═══════════════════════════════════════════════════════════════════════
    return json({ error: "Not found" }, req, env, 404);
  },
};
```

---

#### Durable Object Responsibilities (Stateful)

```typescript
// worker/src/room-do.ts

export class RoomDO implements DurableObject {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE OWNERSHIP
  // ═══════════════════════════════════════════════════════════════════════════

  private state: DurableObjectState;       // Cloudflare storage API
  private sockets = new Map<string, WebSocket>();  // Active connections
  private roomSecretHash: string | null = null;    // Cached for performance

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUEST ROUTER (Internal to DO)
  // ═══════════════════════════════════════════════════════════════════════════

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // Room initialization (called by Worker on POST /api/rooms)
    if (url.pathname === "/init" && req.method === "POST") {
      return this.handleInit(req);
    }

    // State snapshot (called by Worker on GET /api/rooms/:id/state)
    if (url.pathname === "/state" && req.method === "GET") {
      return this.handleStateSnapshot();
    }

    // WebSocket upgrade (called by Worker on GET /api/rooms/:id/ws)
    if (req.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      return this.handleWebSocket(req);
    }

    return new Response("Not found", { status: 404 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WEBSOCKET SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  private async handleWebSocket(req: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    server.accept();

    const clientId = crypto.randomUUID();
    this.sockets.set(clientId, server);

    // Send hello
    server.send(JSON.stringify({ type: "hello", clientId }));

    // Send current state
    const st = await this.load();
    if (st) {
      server.send(JSON.stringify({
        type: "state",
        state: st,
        derived: this.derive(st),
      }));
    }

    // Handle messages
    server.addEventListener("message", (evt) => {
      this.handleMessage(clientId, evt.data);
    });

    // Handle disconnect
    server.addEventListener("close", () => {
      this.handleDisconnect(clientId);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MACHINE ENFORCEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  private async handleMessage(clientId: string, data: string): Promise<void> {
    // Parse and validate message
    // Apply state machine rules
    // Update state
    // Broadcast to all clients
    // (Detailed implementation in Step 3)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BROADCAST
  // ═══════════════════════════════════════════════════════════════════════════

  private broadcast(st: RoomState): void {
    const msg = JSON.stringify({
      type: "state",
      state: st,
      derived: this.derive(st),
    });

    for (const [, ws] of this.sockets) {
      try {
        ws.send(msg);
      } catch {
        // Connection may be closed
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TTL EXPIRY & CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════

  async alarm(): Promise<void> {
    const st = await this.load();
    if (!st) return;

    if (Date.now() >= st.expiresAt) {
      // Close all WebSocket connections
      for (const [, ws] of this.sockets) {
        try {
          ws.close(1000, "Room expired");
        } catch {}
      }
      this.sockets.clear();

      // Delete all persisted data
      await this.state.storage.deleteAll();
    }
  }
}
```

---

#### Why This Separation Matters

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    WHY THIS IS "SHOWCASE-GRADE"                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. SCALABILITY                                                                 │
│  ──────────────                                                                 │
│  • Worker is stateless → scales infinitely at edge                              │
│  • Each room is isolated DO → no cross-room contention                          │
│  • Cloudflare handles load balancing automatically                              │
│                                                                                 │
│  2. CONSISTENCY                                                                 │
│  ─────────────                                                                  │
│  • Single DO per room = single source of truth                                  │
│  • No race conditions between servers                                           │
│  • Strong consistency without distributed locking                               │
│                                                                                 │
│  3. SIMPLICITY                                                                  │
│  ───────────                                                                    │
│  • Worker code is trivial (just routing)                                        │
│  • DO code is focused (just room logic)                                         │
│  • Clear mental model for debugging                                             │
│                                                                                 │
│  4. COST EFFICIENCY                                                             │
│  ─────────────────                                                              │
│  • Rooms auto-expire (no zombie resources)                                      │
│  • Pay only for active rooms                                                    │
│  • No always-on server costs                                                    │
│                                                                                 │
│  5. REAL-TIME PERFORMANCE                                                       │
│  ────────────────────────                                                       │
│  • WebSockets held at edge                                                      │
│  • Low latency broadcasts                                                       │
│  • No round-trip to origin server                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

#### Step 6 Checklist

```
□ 6.1  Worker: Implement CORS handling                       ✅ DONE
□ 6.2  Worker: Implement POST /api/rooms                     ✅ DONE
□ 6.3  Worker: Implement WebSocket pass-through              ✅ DONE
□ 6.4  Worker: Implement GET /api/rooms/:id/state (optional)
□ 6.5  DO: Implement /init endpoint
□ 6.6  DO: Implement WebSocket handling
□ 6.7  DO: Implement broadcast mechanism
□ 6.8  DO: Implement alarm-based cleanup
□ 6.9  Commit: "Step 6: Worker and DO responsibilities"
```

---

### Step 7: Hosting & Deployment Pipeline

#### Goal

Set up the complete deployment pipeline for both frontend (Cloudflare Pages) and backend (Cloudflare Workers + Durable Objects).

---

#### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   GitHub Repository                                                             │
│   ─────────────────                                                             │
│        │                                                                        │
│        ├──── /pages  ────────────────────►  Cloudflare Pages                    │
│        │                                    sprintstorypoint.com                │
│        │                                                                        │
│        └──── /worker ────────────────────►  Cloudflare Workers                  │
│                                             api.sprintstorypoint.com            │
│                                                                                 │
│   ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│   Domains:                                                                      │
│   ────────                                                                      │
│                                                                                 │
│   sprintstorypoint.com ──────────► Cloudflare Pages                             │
│   │                                • index.html                                 │
│   │                                • room.html                                  │
│   │                                • scripts/*.js                               │
│   │                                • styles/*.css                               │
│   │                                                                             │
│   api.sprintstorypoint.com ──────► Cloudflare Worker                            │
│                                    • POST /api/rooms                            │
│                                    • GET /api/rooms/:id/ws                      │
│                                    • Durable Objects                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

#### Deploy Frontend (Cloudflare Pages)

##### Step 7.1: Connect Repository

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
2. Click "Create a project" → "Connect to Git"
3. Select your GitHub repository
4. Configure build settings:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CLOUDFLARE PAGES CONFIGURATION                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Project name:        sprintstorypoint                                          │
│  Production branch:   main                                                      │
│                                                                                 │
│  Build settings:                                                                │
│  ───────────────                                                                │
│  Root directory:      pages                                                     │
│  Build command:       (leave empty - static files)                              │
│  Build output:        (leave empty or ".")                                      │
│                                                                                 │
│  Environment variables:                                                         │
│  ──────────────────────                                                         │
│  (none required for static site)                                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

##### Step 7.2: Initial Deployment

```bash
# Pages deploys automatically on git push
git push origin main

# Or manual deploy with Wrangler
cd pages
npx wrangler pages deploy . --project-name=sprintstorypoint
```

##### Step 7.3: Add Custom Domain

1. Go to Pages project → Custom domains
2. Add domain: `sprintstorypoint.com`
3. Add domain: `www.sprintstorypoint.com` (optional redirect)
4. Update DNS records as instructed

```
DNS Records:
────────────
sprintstorypoint.com     CNAME    sprintstorypoint.pages.dev
www.sprintstorypoint.com CNAME    sprintstorypoint.pages.dev
```

---

#### Deploy Backend (Worker + Durable Objects)

##### Step 7.4: Configure wrangler.toml

```toml
# worker/wrangler.toml

name = "sprintstorypoint-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# ═══════════════════════════════════════════════════════════════════════════════
# DURABLE OBJECTS
# ═══════════════════════════════════════════════════════════════════════════════

[[durable_objects.bindings]]
name = "ROOMS"
class_name = "RoomDO"

[[migrations]]
tag = "v1"
new_classes = ["RoomDO"]

# ═══════════════════════════════════════════════════════════════════════════════
# ENVIRONMENT VARIABLES
# ═══════════════════════════════════════════════════════════════════════════════

[vars]
ALLOWED_ORIGINS = "https://sprintstorypoint.com"

# ═══════════════════════════════════════════════════════════════════════════════
# ROUTES (Production)
# ═══════════════════════════════════════════════════════════════════════════════

# Custom domain route (configured in Cloudflare Dashboard)
# api.sprintstorypoint.com/* → this worker

# ═══════════════════════════════════════════════════════════════════════════════
# DEVELOPMENT
# ═══════════════════════════════════════════════════════════════════════════════

[dev]
port = 8787
local_protocol = "http"
```

##### Step 7.5: Deploy Worker

```bash
cd worker

# Install dependencies
npm install

# Deploy to Cloudflare
npm run deploy
# or
npx wrangler deploy

# Output:
# Uploaded sprintstorypoint-api
# Published sprintstorypoint-api
#   https://sprintstorypoint-api.<account>.workers.dev
```

##### Step 7.6: Add Custom Domain for API

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your worker → Settings → Triggers
3. Add Custom Domain: `api.sprintstorypoint.com`

```
DNS Records (auto-created):
───────────────────────────
api.sprintstorypoint.com    CNAME    <worker-route>.workers.dev
```

---

#### Frontend Configuration

##### Step 7.7: Configure API Origin

```javascript
// pages/scripts/config.js

const CONFIG = {
  // Production
  API_ORIGIN: "https://api.sprintstorypoint.com",

  // Derived
  get WS_ORIGIN() {
    return this.API_ORIGIN.replace("https://", "wss://");
  },

  get API_URL() {
    return `${this.API_ORIGIN}/api`;
  },

  get WS_URL() {
    return (roomId) => `${this.WS_ORIGIN}/api/rooms/${roomId}/ws`;
  },
};

// For local development, override:
// CONFIG.API_ORIGIN = "http://localhost:8787";
```

---

#### GitHub Actions (Optional CI/CD)

##### Step 7.8: Auto-deploy Pages

```yaml
# .github/workflows/deploy-pages.yml

name: Deploy Pages

on:
  push:
    branches: [main]
    paths:
      - "pages/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: sprintstorypoint
          directory: pages
```

##### Step 7.9: Auto-deploy Worker

```yaml
# .github/workflows/deploy-worker.yml

name: Deploy Worker

on:
  push:
    branches: [main]
    paths:
      - "worker/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        working-directory: worker
        run: npm ci

      - name: Deploy to Cloudflare
        working-directory: worker
        run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

---

#### Environment Summary

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ENVIRONMENT CONFIGURATION                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PRODUCTION                                                                     │
│  ──────────                                                                     │
│                                                                                 │
│  Frontend:                                                                      │
│  • URL: https://sprintstorypoint.com                                            │
│  • Host: Cloudflare Pages                                                       │
│  • Source: /pages                                                               │
│                                                                                 │
│  Backend:                                                                       │
│  • URL: https://api.sprintstorypoint.com                                        │
│  • Host: Cloudflare Workers                                                     │
│  • Source: /worker                                                              │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  DEVELOPMENT                                                                    │
│  ───────────                                                                    │
│                                                                                 │
│  Frontend:                                                                      │
│  • URL: http://localhost:3000                                                   │
│  • Command: cd pages && npx serve .                                             │
│                                                                                 │
│  Backend:                                                                       │
│  • URL: http://localhost:8787                                                   │
│  • Command: cd worker && npm run dev                                            │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  PREVIEW (auto-created by Cloudflare)                                           │
│  ───────                                                                        │
│                                                                                 │
│  • Pages: https://<commit>.<project>.pages.dev                                  │
│  • Worker: https://sprintstorypoint-api.<account>.workers.dev                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

#### Deployment Checklist

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT CHECKLIST                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  FRONTEND (Pages)                                                               │
│  ─────────────────                                                              │
│  □ Connect GitHub repo to Cloudflare Pages                                      │
│  □ Configure build settings (root: pages, no build command)                     │
│  □ Verify initial deployment works                                              │
│  □ Add custom domain: sprintstorypoint.com                                      │
│  □ Verify SSL certificate is active                                             │
│  □ Test: https://sprintstorypoint.com loads                                     │
│                                                                                 │
│  BACKEND (Worker)                                                               │
│  ─────────────────                                                              │
│  □ Configure wrangler.toml with DO bindings                                     │
│  □ Deploy worker: npm run deploy                                                │
│  □ Verify worker is running: *.workers.dev/api/health                           │
│  □ Add custom domain: api.sprintstorypoint.com                                  │
│  □ Configure CORS to allow frontend origin                                      │
│  □ Test: POST /api/rooms works                                                  │
│  □ Test: WebSocket connection works                                             │
│                                                                                 │
│  INTEGRATION                                                                    │
│  ───────────                                                                    │
│  □ Update frontend CONFIG with production API URL                               │
│  □ Test full flow: create room → join → vote → reveal                           │
│  □ Verify CORS works correctly                                                  │
│  □ Verify WebSocket upgrades work                                               │
│                                                                                 │
│  CI/CD (Optional)                                                               │
│  ───────────────                                                                │
│  □ Add CLOUDFLARE_API_TOKEN to GitHub secrets                                   │
│  □ Add CLOUDFLARE_ACCOUNT_ID to GitHub secrets                                  │
│  □ Create deploy-pages.yml workflow                                             │
│  □ Create deploy-worker.yml workflow                                            │
│  □ Test auto-deploy on push                                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

#### Step 7 Checklist

```
□ 7.1  Connect repo to Cloudflare Pages                      ✅ DONE
□ 7.2  Configure Pages build settings
□ 7.3  Add custom domain for Pages
□ 7.4  Configure wrangler.toml for Worker                    ✅ DONE
□ 7.5  Deploy Worker with DO bindings
□ 7.6  Add custom domain for Worker
□ 7.7  Configure frontend API origin
□ 7.8  Set up GitHub Actions (optional)
□ 7.9  Test end-to-end flow
□ 7.10 Commit: "Step 7: Deployment pipeline"
```

---

### Step 8: Security, Reliability & Edge Cases

> **Goal**: Ensure the application is secure, resilient to abuse, and handles edge cases gracefully - essential for both portfolio demonstration and real-world use.

---

#### 8.1 Abuse Controls

##### Rate Limiting (Cloudflare-level)

Configure rate limiting rules in Cloudflare dashboard or via API:

```
Rule 1: Room Creation Rate Limit
─────────────────────────────────
URL Pattern: /api/rooms (POST only)
Rate:        10 requests per minute per IP
Action:      Block with 429 response

Rule 2: WebSocket Upgrade Rate Limit
────────────────────────────────────
URL Pattern: /api/rooms/*/ws
Rate:        30 requests per minute per IP
Action:      Block with 429 response

Rule 3: General API Rate Limit
──────────────────────────────
URL Pattern: /api/*
Rate:        100 requests per minute per IP
Action:      Challenge after threshold
```

##### Server-Side Caps (Enforced in DO)

```typescript
// Constants defined in room-do.ts
const MAX_PARTICIPANTS = 25;      // Per room
const MAX_STORIES = 50;           // Per room
const MAX_MSG_BYTES = 4096;       // 4KB per WebSocket message
const MAX_NAME_LENGTH = 24;       // Participant name
const MAX_TITLE_LENGTH = 120;     // Story title
const MAX_NOTES_LENGTH = 500;     // Story notes
const MAX_CUSTOM_CARDS = 20;      // Custom deck size
const MAX_VOTE_LENGTH = 12;       // Vote value string
```

##### Validation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Message Validation                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Size Check                                               │
│     └─ message.length > MAX_MSG_BYTES → reject              │
│                                                              │
│  2. JSON Parse                                               │
│     └─ invalid JSON → reject with error                     │
│                                                              │
│  3. Type Check                                               │
│     └─ missing/unknown msg.type → reject                    │
│                                                              │
│  4. Field Validation (per message type)                     │
│     ├─ join: name.slice(0, 24)                              │
│     ├─ addStory: title required, title.slice(0, 120)        │
│     ├─ vote: value.slice(0, 12)                             │
│     └─ setDeck: custom cards limited to 20                  │
│                                                              │
│  5. State Guards                                             │
│     ├─ participants.length >= 25 → "Room full"              │
│     ├─ stories.length >= 50 → "Too many stories"            │
│     └─ phase === "locked" → reject votes                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

#### 8.2 Room ID Security

##### Unguessable Room IDs

```typescript
import { nanoid } from "nanoid";

// Room ID: 12 characters = 64^12 ≈ 4.7 × 10^21 combinations
const roomId = nanoid(12);  // e.g., "V1StGXR8_Z5j"

// Room Secret: 24 characters = 64^24 ≈ 2.2 × 10^43 combinations
const roomSecret = nanoid(24);  // e.g., "V1StGXR8_Z5jkL9hM2nP3qR4"
```

##### Security Properties

```
┌─────────────────────────────────────────────────────────────┐
│                  Room ID Security                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Room ID (12 chars):                                        │
│  ├─ Purpose: URL-safe identifier for joining                │
│  ├─ Entropy: ~71 bits (nanoid alphabet: A-Za-z0-9_-)        │
│  ├─ Brute force: 4.7 sextillion combinations               │
│  └─ Safe to share: Cannot control room without secret       │
│                                                              │
│  Room Secret (24 chars):                                    │
│  ├─ Purpose: Host authentication for privileged actions     │
│  ├─ Entropy: ~143 bits                                      │
│  ├─ Stored: NEVER in plaintext, only SHA-256 hash          │
│  └─ Exposure: URL hash only (not sent to server in URL)    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

#### 8.3 Host Secret Handling

##### Secret Storage Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               Host Secret Security Model                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  HOST BROWSER                                                │
│  ─────────────                                               │
│  URL: https://sprintstorypoint.com/room/V1StGXR8_Z5j        │
│       #secret=V1StGXR8_Z5jkL9hM2nP3qR4                      │
│            ▲                                                 │
│            │ URL hash NEVER sent to server                  │
│            └─ Stored in browser only                        │
│                                                              │
│  WebSocket Message (privileged action):                     │
│  ────────────────────────────────────────                    │
│  {                                                           │
│    "type": "reveal",                                         │
│    "roomSecret": "V1StGXR8_Z5jkL9hM2nP3qR4"  ◄── Sent only  │
│  }                                            when needed    │
│                                                              │
│  DURABLE OBJECT STORAGE                                     │
│  ──────────────────────────                                  │
│  secretHash: "a1b2c3d4..." ◄── SHA-256 hash only           │
│                                                              │
│  VERIFICATION FLOW                                          │
│  ─────────────────                                           │
│  1. Client sends: roomSecret in message body                │
│  2. DO computes: SHA-256(roomSecret)                        │
│  3. DO compares: computed hash === stored secretHash        │
│  4. Result: Allow or reject privileged action               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

##### Implementation

```typescript
// Hash function (DO)
async function sha256Hex(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(digest);
  return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}

// Verification (DO)
private async isHost(roomSecret?: string): Promise<boolean> {
  if (!roomSecret) return false;
  const storedHash = await this.getSecretHash();
  if (!storedHash) return false;
  const candidateHash = await sha256Hex(roomSecret);
  return candidateHash === storedHash;
}

// Usage in message handler
case "reveal": {
  if (!(await this.isHost(msg.roomSecret))) {
    this.sendTo(clientId, { type: "error", message: "Host secret required" });
    return;
  }
  // ... proceed with reveal
}
```

##### Privileged Actions Requiring roomSecret

| Action | Message Type | Why Protected |
|--------|--------------|---------------|
| Reveal votes | `reveal` | Prevents premature reveal |
| Lock estimate | `lock` | Only host should finalize |
| Clear votes | `clearVotes` | Prevents griefing |
| Next story | `next` | Controls session flow |

---

#### 8.4 WebSocket Failure Modes

##### Client Reconnection Strategy

```typescript
// Frontend reconnection with exponential backoff
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseDelay = 1000; // 1 second
  private maxDelay = 30000; // 30 seconds

  connect(url: string) {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0; // Reset on successful connect
      // Note: DO automatically sends full state on connect
    };

    this.ws.onclose = (event) => {
      if (event.code !== 1000) { // Not a clean close
        this.scheduleReconnect(url);
      }
    };

    this.ws.onerror = () => {
      // Error will be followed by close event
    };
  }

  private scheduleReconnect(url: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Show "connection lost" UI
      return;
    }

    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts),
      this.maxDelay
    );

    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(url);
    }, delay + jitter);
  }
}
```

##### Reconnection Timeline

```
┌─────────────────────────────────────────────────────────────┐
│              Reconnection with Exponential Backoff           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Attempt │ Base Delay │ With Jitter    │ Cumulative        │
│  ────────┼────────────┼────────────────┼───────────────────│
│     1    │    1s      │   0.75-1.25s   │   ~1s             │
│     2    │    2s      │   1.5-2.5s     │   ~3s             │
│     3    │    4s      │   3-5s         │   ~7s             │
│     4    │    8s      │   6-10s        │   ~15s            │
│     5    │   16s      │   12-20s       │   ~31s            │
│     6    │   30s      │   22-37s       │   ~1m             │
│    ...   │   30s      │   22-37s       │   ...             │
│    10    │   30s      │   22-37s       │   ~4m             │
│          │            │                │                    │
│  After 10 attempts: Show "Connection lost" message          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

##### DO-Side Resilience

```typescript
// DO always sends full state on new connection
server.addEventListener("message", (evt) => {
  // ... handle message
});

// On WebSocket accept, immediately send current state
server.accept();
server.send(JSON.stringify({ type: "hello", clientId }));

const st = await this.load();
if (st) {
  server.send(JSON.stringify({
    type: "state",
    state: st,
    derived: this.derive(st)
  }));
}
```

##### Keep-Alive (Optional)

```typescript
// Optional ping/pong for connection health
// Browser WebSocket API handles ping/pong at protocol level
// If needed, implement application-level heartbeat:

// Client
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "ping" }));
  }
}, 30000);

// DO (if implementing)
case "ping": {
  this.sendTo(clientId, { type: "pong" });
  return;
}
```

---

#### 8.5 Data Lifecycle (TTL)

##### Room Expiration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Room Lifecycle (24-hour TTL)               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  T+0: Room Created                                          │
│  ─────────────────                                           │
│  POST /api/rooms                                             │
│    └─► Worker creates room                                  │
│        └─► DO.init() called                                 │
│            ├─ createdAt = now()                             │
│            ├─ expiresAt = now() + 24h                       │
│            ├─ state.storage.put("state", initialState)      │
│            └─ state.storage.setAlarm(expiresAt)             │
│                                                              │
│  T+0 to T+24h: Room Active                                  │
│  ─────────────────────────                                   │
│  - Normal operations proceed                                 │
│  - State persisted on each change                           │
│  - Alarm scheduled but not yet triggered                    │
│                                                              │
│  T+24h: Alarm Fires                                         │
│  ──────────────────                                          │
│  DO.alarm() invoked by Cloudflare                           │
│    ├─ Check: now() >= expiresAt?                            │
│    │   ├─ YES: Proceed with cleanup                         │
│    │   └─ NO: Re-arm alarm (edge case)                      │
│    │                                                         │
│    ├─ state.storage.deleteAll()                             │
│    │   └─ Removes all persisted data                        │
│    │                                                         │
│    └─ Close all WebSocket connections                       │
│        └─ ws.close(1000, "Room expired")                    │
│                                                              │
│  T+24h+: Room Destroyed                                     │
│  ──────────────────────                                      │
│  - DO instance may be evicted                               │
│  - Any new access creates fresh (empty) state               │
│  - GET /state returns 404                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

##### Implementation

```typescript
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// On room init
const createdAt = now();
const expiresAt = createdAt + TTL_MS;

const initial: RoomState = {
  roomId: body.roomId,
  createdAt,
  expiresAt,
  // ... rest of initial state
};

await this.save(initial);
await this.state.storage.setAlarm(expiresAt);

// Alarm handler
async alarm() {
  const st = await this.load();
  if (!st) return;

  if (now() >= st.expiresAt) {
    // Hard expire - delete everything
    await this.state.storage.deleteAll();

    // Close all connected WebSockets
    for (const [, ws] of this.sockets) {
      try {
        ws.close(1000, "Room expired");
      } catch {}
    }
    this.sockets.clear();
  } else {
    // Edge case: alarm fired early, re-arm
    await this.state.storage.setAlarm(st.expiresAt);
  }
}
```

##### TTL Extension (Optional Future Enhancement)

```typescript
// If implementing activity-based TTL extension:
private async handleMessage(clientId: string, msg: ClientMsg) {
  const st = await this.load();
  if (!st) return;

  // Extend TTL on activity (optional)
  // st.expiresAt = now() + TTL_MS;
  // await this.ensureAlarm(st.expiresAt);

  // ... rest of handler
}
```

---

#### 8.6 Edge Cases

##### Connection Edge Cases

| Scenario | Handling |
|----------|----------|
| Client connects to non-existent room | Return 404 on `/state`, empty state on WS connect |
| Client disconnects mid-vote | Remove from participants, remove their votes |
| All clients disconnect | Room persists until TTL expires |
| Host loses connection | Room continues; host can reconnect with secret |
| Duplicate client IDs | Not possible - UUID generated per connection |

##### State Edge Cases

| Scenario | Handling |
|----------|----------|
| Vote on wrong story | Ignore (storyId mismatch check) |
| Vote after lock | Ignore (phase === "locked" check) |
| Reveal with no votes | Allowed, stats will be null |
| Lock with invalid value | Truncate to 12 chars, store as-is |
| Add story when at limit | Return error, don't add |

##### Message Edge Cases

| Scenario | Handling |
|----------|----------|
| Malformed JSON | Send error response, don't crash |
| Unknown message type | Silently ignore (switch default) |
| Missing required fields | Validate and return error |
| Extremely long strings | Truncate with `.slice()` |
| Binary WebSocket message | Convert to string or ignore |

---

#### Step 8 Checklist

```
□ 8.1  Configure Cloudflare rate limiting rules
□ 8.2  Verify server-side caps are enforced
□ 8.3  Test room ID entropy (12+ chars)
□ 8.4  Verify secret hash storage (no plaintext)
□ 8.5  Test privileged actions require valid secret
□ 8.6  Implement client reconnection with backoff
□ 8.7  Test DO sends full state on reconnect
□ 8.8  Verify 24h TTL and alarm cleanup
□ 8.9  Test edge cases (disconnects, limits, malformed data)
□ 8.10 Commit: "Step 8: Security and edge case handling"
```

---

### Step 9: Build Milestones (Implementation Order)

> **Goal**: Define a clear progression of features to implement, ensuring each milestone delivers working functionality that can be tested and demonstrated.

---

#### Overview: Incremental Delivery

```
┌─────────────────────────────────────────────────────────────┐
│                    Build Milestones                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Milestone 1          Milestone 2          Milestone 3      │
│  "Room Works"         "Planning Poker"     "Polish + Fun"   │
│  ─────────────        ────────────────     ──────────────   │
│  ┌───────────┐        ┌───────────┐        ┌───────────┐   │
│  │ Create    │        │ Reveal    │        │ Fun mode  │   │
│  │ Join      │───────►│ Stats     │───────►│ Confetti  │   │
│  │ Vote      │        │ Lock      │        │ Reactions │   │
│  │ Stories   │        │ Next      │        │           │   │
│  └───────────┘        └───────────┘        └───────────┘   │
│       │                    │                    │           │
│       ▼                    ▼                    ▼           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Milestone 4: "Hardening"                │   │
│  │  Rate limits • Reconnect • Documentation             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

#### Milestone 1: "Room Works"

> **Deliverable**: Users can create a room, join it, add stories, and vote. Votes are hidden until reveal.

##### Features

| Feature | Frontend | Backend (DO) |
|---------|----------|--------------|
| Create room | Call `POST /api/rooms`, store secret in hash | Generate roomId/secret, init state |
| Join room | Connect WebSocket, send `join` message | Add to participants, broadcast |
| Participants list | Render from `state.participants` | Update on join/disconnect |
| Add story | Send `addStory` message | Append to stories array |
| Select current story | Send `setCurrentStory` message | Update currentStoryId, broadcast |
| Vote (hidden) | Send `vote` message | Store in votesByStory |
| "Has voted" indicator | Derive from votesByStory keys | Include in state broadcast |

##### User Flow Test

```
┌─────────────────────────────────────────────────────────────┐
│                 Milestone 1 Test Scenario                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Host creates room                                       │
│     └─ Verify: roomId in URL, secret in hash                │
│                                                              │
│  2. Host enters name "Alice"                                │
│     └─ Verify: Participants shows "Alice"                   │
│                                                              │
│  3. Guest joins via room link (no secret)                   │
│     └─ Verify: Guest sees "Alice", enters name "Bob"        │
│                                                              │
│  4. Both see participants: Alice, Bob                       │
│     └─ Verify: Real-time sync                               │
│                                                              │
│  5. Alice adds story "Login feature"                        │
│     └─ Verify: Story appears, auto-selected                 │
│                                                              │
│  6. Alice votes "5", Bob votes "8"                          │
│     └─ Verify: Both show "voted" indicator, values hidden   │
│                                                              │
│  7. Bob disconnects                                         │
│     └─ Verify: Bob removed from participants, vote cleared  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

##### Milestone 1 Checklist

```
□ 1.1  POST /api/rooms creates room and returns IDs
□ 1.2  Frontend stores secret in URL hash
□ 1.3  WebSocket connects and receives hello + state
□ 1.4  Join message adds participant
□ 1.5  Participants list renders and updates live
□ 1.6  Add story works (title, optional notes)
□ 1.7  Stories list renders with selection
□ 1.8  Set current story changes selection
□ 1.9  Vote stores value (hidden from UI)
□ 1.10 "Has voted" indicator shows for each participant
□ 1.11 Disconnect removes participant and their votes
```

---

#### Milestone 2: "Planning Poker Round"

> **Deliverable**: Complete estimation workflow - reveal votes, see statistics, lock final estimate, move to next story.

##### Features

| Feature | Frontend | Backend (DO) |
|---------|----------|--------------|
| Reveal votes (host) | Button sends `reveal` with roomSecret | Verify host, set phase="revealed" |
| Display votes | Show actual values when phase !== "voting" | Include in state broadcast |
| Statistics | Calculate and display min/max/median/spread | Compute in `derive()` function |
| Lock estimate | Host selects final value, sends `lock` | Store in lockedByStory, phase="locked" |
| Clear votes | Host can reset, sends `clearVotes` | Clear votes for story, phase="voting" |
| Next story | Host advances, sends `next` | Move currentStoryId to next, phase="voting" |

##### User Flow Test

```
┌─────────────────────────────────────────────────────────────┐
│                 Milestone 2 Test Scenario                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  (Continuing from Milestone 1 - Alice host, Bob guest)      │
│                                                              │
│  1. Alice (host) clicks "Reveal"                            │
│     └─ Verify: Both see votes - Alice:5, Bob:8              │
│                                                              │
│  2. Statistics displayed                                    │
│     └─ Verify: Min=5, Max=8, Median=6.5, Spread=3           │
│                                                              │
│  3. Alice selects "8" as final estimate, clicks "Lock"      │
│     └─ Verify: Story shows locked value "8"                 │
│     └─ Verify: Voting disabled for this story               │
│                                                              │
│  4. Alice adds second story "Logout feature"                │
│     └─ Verify: Story added to list                          │
│                                                              │
│  5. Alice clicks "Next Story"                               │
│     └─ Verify: Current story changes to "Logout feature"    │
│     └─ Verify: Phase resets to "voting"                     │
│                                                              │
│  6. Guest (Bob) tries to click "Reveal"                     │
│     └─ Verify: Button disabled or hidden (no roomSecret)    │
│                                                              │
│  7. Alice clicks "Clear Votes" on first story               │
│     └─ Verify: Votes reset, can vote again                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

##### Milestone 2 Checklist

```
□ 2.1  Reveal button visible only to host (has roomSecret)
□ 2.2  Reveal changes phase, broadcasts state
□ 2.3  Votes display when phase is "revealed" or "locked"
□ 2.4  Statistics (min/max/median/spread) calculated and shown
□ 2.5  Lock stores final estimate in lockedByStory
□ 2.6  Locked stories show final value, voting disabled
□ 2.7  Next story advances currentStoryId
□ 2.8  Phase resets to "voting" on next/clear
□ 2.9  Clear votes resets votes for current story
□ 2.10 Host-only actions reject without valid roomSecret
```

---

#### Milestone 3: "Polish + Fun"

> **Deliverable**: Enhanced user experience with fun mode, animations, and optional social features.

##### Features

| Feature | Frontend | Backend (DO) |
|---------|----------|--------------|
| Fun mode toggle | Toggle switch, sends `toggleFun` | Store funMode in state |
| Confetti on lock | Trigger confetti animation when phase="locked" | N/A (client-only) |
| Card flip animation | CSS animation on reveal | N/A (client-only) |
| Emoji reactions (optional) | Reaction picker, send `react` message | Store reactions, broadcast |
| Sound effects (optional) | Play sounds on events | N/A (client-only) |
| Deck selection | Dropdown for fibonacci/tshirt/custom | Send `setDeck` message |

##### Fun Mode Behavior

```
┌─────────────────────────────────────────────────────────────┐
│                     Fun Mode Features                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Fun Mode OFF (Professional)        Fun Mode ON (Playful)   │
│  ─────────────────────────          ─────────────────────   │
│  • Clean, minimal UI                • Animated cards        │
│  • No animations on reveal          • Card flip animation   │
│  • No confetti                      • Confetti on lock 🎉   │
│  • No sound effects                 • Optional sounds       │
│  • Neutral color scheme             • Vibrant colors        │
│                                                              │
│  Toggle persists in room state and affects all participants │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

##### Confetti Implementation (Client-Only)

```typescript
// Example using canvas-confetti library
import confetti from 'canvas-confetti';

// In state update handler
useEffect(() => {
  if (state.phase === 'locked' && state.funMode && previousPhase !== 'locked') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}, [state.phase, state.funMode]);
```

##### Milestone 3 Checklist

```
□ 3.1  Fun mode toggle in UI
□ 3.2  Fun mode state syncs across all clients
□ 3.3  Confetti triggers on lock (fun mode only)
□ 3.4  Card flip animation on reveal (fun mode only)
□ 3.5  Deck selection UI (fibonacci/tshirt/custom)
□ 3.6  Custom deck input and validation
□ 3.7  (Optional) Emoji reactions
□ 3.8  (Optional) Sound effects with mute option
□ 3.9  Smooth transitions and micro-animations
□ 3.10 Responsive design polish
```

---

#### Milestone 4: "Hardening"

> **Deliverable**: Production-ready application with security, reliability, and documentation.

##### Features

| Feature | Implementation | Testing |
|---------|----------------|---------|
| Rate limiting | Cloudflare rules for POST /api/rooms, WS upgrades | Verify 429 on excess requests |
| Server-side caps | Enforce limits in DO message handler | Test with >25 participants, >50 stories |
| TTL cleanup | DO Alarm at expiresAt | Create room, wait 24h (or mock) |
| Reconnect robustness | Exponential backoff in frontend | Kill WS, verify auto-reconnect |
| Error handling | Graceful degradation, user-friendly messages | Test malformed messages, network errors |
| README | Architecture diagram, setup instructions | Review for completeness |
| Architecture diagram | Visual system overview | Include in README |

##### Security Audit Checklist

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Audit                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  □ Room IDs are unguessable (12+ chars, nanoid)             │
│  □ Room secrets never stored in plaintext                   │
│  □ Secrets never logged or exposed in responses             │
│  □ URL hash not sent to server                              │
│  □ Host-only actions verified server-side                   │
│  □ Input validation on all message types                    │
│  □ String truncation prevents oversized data                │
│  □ Rate limiting configured and tested                      │
│  □ CORS properly configured                                 │
│  □ No sensitive data in error messages                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

##### Documentation Requirements

```
README.md
├── Project Overview
│   ├── What is Sprint Story Point?
│   └── Key features
├── Architecture
│   ├── System diagram
│   ├── Technology stack
│   └── Data flow
├── Getting Started
│   ├── Prerequisites
│   ├── Local development setup
│   └── Environment variables
├── Deployment
│   ├── Cloudflare Pages setup
│   ├── Cloudflare Workers setup
│   └── Custom domain configuration
├── API Reference
│   ├── REST endpoints
│   └── WebSocket protocol
└── Contributing
    └── Development guidelines
```

##### Milestone 4 Checklist

```
□ 4.1  Rate limiting rules configured in Cloudflare
□ 4.2  Rate limiting tested (verify 429 responses)
□ 4.3  All server-side caps enforced and tested
□ 4.4  24h TTL tested (room expires, sockets closed)
□ 4.5  Reconnect works after WS disconnect
□ 4.6  Error messages are user-friendly
□ 4.7  No crashes on malformed input
□ 4.8  README.md complete with architecture diagram
□ 4.9  Local dev setup documented and tested
□ 4.10 Production deployment verified end-to-end
```

---

#### Milestone Summary

```
┌─────────────────────────────────────────────────────────────┐
│                  Implementation Timeline                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Milestone 1: "Room Works"                                  │
│  ──────────────────────────                                  │
│  Commits: Step 1-4 foundation                               │
│  Outcome: Basic room functionality, voting works            │
│  Demo: Create room, invite guest, vote on story             │
│                                                              │
│  Milestone 2: "Planning Poker Round"                        │
│  ────────────────────────────────────                        │
│  Commits: Step 5-6 features                                 │
│  Outcome: Complete estimation workflow                      │
│  Demo: Full planning poker session with reveal/lock         │
│                                                              │
│  Milestone 3: "Polish + Fun"                                │
│  ────────────────────────────                                │
│  Commits: UI/UX enhancements                                │
│  Outcome: Delightful user experience                        │
│  Demo: Fun mode with confetti, smooth animations            │
│                                                              │
│  Milestone 4: "Hardening"                                   │
│  ─────────────────────────                                   │
│  Commits: Step 7-8 security + docs                          │
│  Outcome: Production-ready, portfolio-worthy                │
│  Demo: Resilient to abuse, well-documented                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

#### Build Strategy: Backend-First Approach

> **Recommendation**: Start by building the backend contract first (message protocol + state machine), then build the simplest UI that consumes state snapshots. This keeps you from repainting UI multiple times when you discover missing backend transitions.

```
┌─────────────────────────────────────────────────────────────┐
│                 Backend-First Build Order                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Phase 1: Backend Contract                                  │
│  ─────────────────────────                                   │
│  1. Define TypeScript types (RoomState, ClientMsg, etc.)    │
│  2. Implement DO state machine (all message handlers)       │
│  3. Test via WebSocket client (wscat, Postman, or script)   │
│  4. Verify all transitions work before touching UI          │
│                                                              │
│  Phase 2: Minimal UI                                        │
│  ───────────────────                                         │
│  1. Build simplest possible UI that renders state           │
│  2. Just display JSON state initially (debug view)          │
│  3. Add forms/buttons that send messages                    │
│  4. Verify round-trip works                                 │
│                                                              │
│  Phase 3: Polish UI                                         │
│  ──────────────────                                          │
│  1. Replace debug view with proper components               │
│  2. Add styling, animations, responsive design              │
│  3. No backend changes needed at this point                 │
│                                                              │
│  Why This Works:                                            │
│  ───────────────                                             │
│  • Backend contract is stable before UI depends on it       │
│  • Discover missing states/transitions early                │
│  • UI refactors don't require backend changes               │
│  • Easier to test backend in isolation                      │
│  • Cleaner git history (backend commits, then UI commits)   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

##### Testing Backend Without UI

```bash
# Using wscat to test WebSocket
npm install -g wscat

# Connect to local dev
wscat -c ws://localhost:8787/api/rooms/TEST123/ws

# Send messages manually
> {"type":"join","name":"Alice"}
> {"type":"addStory","title":"Login feature"}
> {"type":"vote","storyId":"<id-from-state>","value":"5"}
> {"type":"reveal","roomSecret":"<secret>"}
```

##### Minimal Debug UI (Phase 2)

```tsx
// Simplest possible UI - just render state as JSON
function DebugRoom({ roomId }: { roomId: string }) {
  const [state, setState] = useState<RoomState | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`wss://api.../rooms/${roomId}/ws`);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'state') setState(msg.state);
    };
    return () => ws.close();
  }, [roomId]);

  return (
    <div>
      <pre>{JSON.stringify(state, null, 2)}</pre>
      <button onClick={() => ws.send(JSON.stringify({type:'join',name:'Test'}))}>
        Join
      </button>
      {/* Add more buttons as needed */}
    </div>
  );
}
```

---

#### Step 9 Checklist

```
□ 9.1  Milestone 1 complete - room works end-to-end
□ 9.2  Milestone 2 complete - full planning poker flow
□ 9.3  Milestone 3 complete - polish and fun features
□ 9.4  Milestone 4 complete - hardened and documented
□ 9.5  All test scenarios pass
□ 9.6  Production deployment live
□ 9.7  Final commit: "v1.0: Sprint Story Point complete"
```

---

*Document generated for Sprint Story Point project. Last updated: 2026-01-31*
