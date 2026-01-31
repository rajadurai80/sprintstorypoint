var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-05BlMp/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// node_modules/nanoid/url-alphabet/index.js
var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

// node_modules/nanoid/index.browser.js
var nanoid = /* @__PURE__ */ __name((size = 21) => {
  let id = "";
  let bytes = crypto.getRandomValues(new Uint8Array(size |= 0));
  while (size--) {
    id += urlAlphabet[bytes[size] & 63];
  }
  return id;
}, "nanoid");

// src/room-do.ts
var MAX_MSG_BYTES = 4096;
var MAX_PARTICIPANTS = 25;
var MAX_STORIES = 50;
var MAX_CHAT_MESSAGES = 50;
var MAX_STORY_TITLE_LEN = 120;
var MAX_STORY_NOTES_LEN = 1e3;
var MAX_CHAT_MSG_LEN = 500;
var MAX_NAME_LEN = 24;
var MAX_VOTE_LEN = 12;
var MAX_CUSTOM_DECK_SIZE = 20;
var TTL_MS = 24 * 60 * 60 * 1e3;
var RATE_LIMIT_WINDOW_MS = 6e4;
var RATE_LIMIT_MAX_MSGS = 60;
var AVATARS = [
  // Animals
  "\u{1F98A}",
  "\u{1F43C}",
  "\u{1F981}",
  "\u{1F42F}",
  "\u{1F43B}",
  "\u{1F428}",
  "\u{1F438}",
  "\u{1F435}",
  "\u{1F984}",
  "\u{1F432}",
  "\u{1F98B}",
  "\u{1F41D}",
  "\u{1F985}",
  "\u{1F989}",
  "\u{1F427}",
  "\u{1F426}",
  "\u{1F986}",
  "\u{1F9A2}",
  "\u{1F9A9}",
  "\u{1F422}",
  "\u{1F419}",
  "\u{1F991}",
  "\u{1F990}",
  "\u{1F980}",
  "\u{1F421}",
  "\u{1F42C}",
  "\u{1F433}",
  "\u{1F988}",
  "\u{1F40A}",
  "\u{1F98E}",
  "\u{1F40D}",
  "\u{1F995}",
  "\u{1F996}",
  "\u{1F418}",
  "\u{1F98F}",
  "\u{1F99B}",
  "\u{1F42A}",
  "\u{1F992}",
  "\u{1F998}",
  "\u{1F9AC}",
  "\u{1F403}",
  "\u{1F402}",
  "\u{1F404}",
  "\u{1F40E}",
  "\u{1F98C}",
  "\u{1F411}",
  "\u{1F410}",
  "\u{1F999}",
  "\u{1F416}",
  "\u{1F417}",
  // Fantasy & Fun
  "\u{1F916}",
  "\u{1F47E}",
  "\u{1F47D}",
  "\u{1F47B}",
  "\u{1F480}",
  "\u{1F383}",
  "\u{1F9B8}",
  "\u{1F9B9}",
  "\u{1F9D9}",
  "\u{1F9DA}",
  "\u{1F9DB}",
  "\u{1F9DC}",
  "\u{1F9DD}",
  "\u{1F9DE}",
  "\u{1F9DF}",
  "\u{1F977}",
  "\u{1F9B4}",
  "\u{1F31F}",
  "\u2B50",
  "\u{1F319}",
  "\u2600\uFE0F",
  "\u{1F308}",
  "\u26A1",
  "\u{1F525}",
  "\u{1F4A7}",
  "\u2744\uFE0F",
  "\u{1F30A}",
  "\u{1F338}",
  "\u{1F33A}",
  "\u{1F33B}",
  // Objects & Symbols
  "\u{1F3AF}",
  "\u{1F3A8}",
  "\u{1F3AD}",
  "\u{1F3AA}",
  "\u{1F3A2}",
  "\u{1F680}",
  "\u{1F6F8}",
  "\u{1F3AE}",
  "\u{1F3B2}",
  "\u{1F3B3}",
  "\u{1F3C6}",
  "\u{1F947}",
  "\u{1F396}\uFE0F",
  "\u{1F3C5}",
  "\u26BD",
  "\u{1F3C0}",
  "\u{1F3C8}",
  "\u26BE",
  "\u{1F3BE}",
  "\u{1F3D0}",
  "\u{1F3B1}",
  "\u{1F3D3}",
  "\u{1F3F8}",
  "\u{1F94A}",
  "\u{1F3BF}",
  "\u{1F6F9}",
  "\u{1F6FC}",
  "\u{1F3B8}",
  "\u{1F3BA}",
  "\u{1F3B7}",
  "\u{1F941}",
  "\u{1F3B9}",
  "\u{1F3BB}",
  "\u{1FA97}",
  "\u{1F3A4}",
  "\u{1F3A7}",
  "\u{1F4FB}",
  "\u{1F4FA}",
  "\u{1F48E}",
  "\u{1F4B0}"
];
function getRandomAvatar(usedAvatars) {
  const available = AVATARS.filter((a) => !usedAvatars.includes(a));
  if (available.length === 0) {
    return `\u{1F464}${usedAvatars.length + 1}`;
  }
  return available[Math.floor(Math.random() * available.length)];
}
__name(getRandomAvatar, "getRandomAvatar");
function now() {
  return Date.now();
}
__name(now, "now");
function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
__name(safeJsonParse, "safeJsonParse");
function median(nums) {
  const a = [...nums].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}
__name(median, "median");
function toNumberMaybe(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
__name(toNumberMaybe, "toNumberMaybe");
async function sha256Hex(s) {
  const buf = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(digest);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
var RoomDO = class {
  state;
  env;
  sockets = /* @__PURE__ */ new Map();
  // clientId -> socket
  roomSecretHash = null;
  // Rate limiting: track message counts per client
  rateLimitCounts = /* @__PURE__ */ new Map();
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  // ---- Rate limiting helper ----
  checkRateLimit(clientId) {
    const now2 = Date.now();
    const entry = this.rateLimitCounts.get(clientId);
    if (!entry || now2 - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      this.rateLimitCounts.set(clientId, { count: 1, windowStart: now2 });
      return true;
    }
    if (entry.count >= RATE_LIMIT_MAX_MSGS) {
      return false;
    }
    entry.count++;
    return true;
  }
  // ---- persistence helpers ----
  async load() {
    const st = await this.state.storage.get("state");
    if (!st)
      return null;
    return st;
  }
  async save(st) {
    await this.state.storage.put("state", st);
  }
  async ensureAlarm(expiresAt) {
    await this.state.storage.setAlarm(expiresAt);
  }
  async alarm() {
    const st = await this.load();
    if (!st) {
      return;
    }
    const currentTime = now();
    if (currentTime >= st.expiresAt) {
      const expiredMsg = { type: "finished", reason: "Room expired (24 hour limit)" };
      const payload = JSON.stringify(expiredMsg);
      for (const [, ws] of this.sockets) {
        try {
          ws.send(payload);
          ws.close(1e3, "Room expired");
        } catch {
        }
      }
      this.sockets.clear();
      this.rateLimitCounts.clear();
      await this.state.storage.deleteAll();
    } else {
      await this.ensureAlarm(st.expiresAt);
    }
  }
  // ---- request router inside DO ----
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/init" && req.method === "POST") {
      const body = await req.json().catch(() => null);
      if (!body?.roomId || !body?.roomSecret) {
        return new Response("Bad init", { status: 400 });
      }
      const createdAt = now();
      const expiresAt = createdAt + TTL_MS;
      this.roomSecretHash = await sha256Hex(body.roomSecret);
      const initial = {
        roomId: body.roomId,
        createdAt,
        expiresAt,
        deck: { type: "fibonacci" },
        funMode: true,
        stories: [],
        currentStoryId: null,
        phase: "voting",
        votesByStory: {},
        lockedByStory: {},
        participants: {},
        chatMessages: []
      };
      await this.state.storage.put("secretHash", this.roomSecretHash);
      await this.save(initial);
      await this.ensureAlarm(expiresAt);
      return new Response("OK");
    }
    if (url.pathname === "/state" && req.method === "GET") {
      const st = await this.load();
      if (!st)
        return new Response("Not found", { status: 404 });
      const msg = { type: "state", state: st, derived: this.derive(st) };
      return new Response(JSON.stringify(msg), {
        headers: { "content-type": "application/json; charset=utf-8" }
      });
    }
    if (req.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];
      server.accept();
      const clientId = crypto.randomUUID();
      this.sockets.set(clientId, server);
      server.send(JSON.stringify({ type: "hello", clientId }));
      const st = await this.load();
      if (st)
        server.send(JSON.stringify({ type: "state", state: st, derived: this.derive(st) }));
      server.addEventListener("message", (evt) => {
        const data = typeof evt.data === "string" ? evt.data : "";
        if (!data || data.length > MAX_MSG_BYTES) {
          server.send(JSON.stringify({ type: "error", message: "Message too large" }));
          return;
        }
        if (!this.checkRateLimit(clientId)) {
          server.send(JSON.stringify({ type: "error", message: "Too many requests. Please slow down." }));
          return;
        }
        const msg = safeJsonParse(data);
        if (!msg?.type) {
          server.send(JSON.stringify({ type: "error", message: "Invalid message" }));
          return;
        }
        this.state.waitUntil(this.handleMessage(clientId, msg));
      });
      server.addEventListener("close", () => {
        this.sockets.delete(clientId);
        this.state.waitUntil(this.onDisconnect(clientId));
      });
      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response("Not found", { status: 404 });
  }
  async getSecretHash() {
    if (this.roomSecretHash)
      return this.roomSecretHash;
    const h = await this.state.storage.get("secretHash");
    this.roomSecretHash = h ?? null;
    return this.roomSecretHash;
  }
  async isHost(roomSecret) {
    if (!roomSecret)
      return false;
    const h = await this.getSecretHash();
    if (!h)
      return false;
    const candidate = await sha256Hex(roomSecret);
    return candidate === h;
  }
  derive(st) {
    const currentStory = st.currentStoryId ? st.stories.find((s) => s.id === st.currentStoryId) ?? null : null;
    const votes = st.currentStoryId && st.votesByStory[st.currentStoryId] ? Object.values(st.votesByStory[st.currentStoryId]) : [];
    const numeric = votes.map(toNumberMaybe).filter((x) => x !== null);
    const stats = st.phase !== "voting" && numeric.length > 0 ? {
      min: Math.min(...numeric),
      max: Math.max(...numeric),
      median: median(numeric),
      spread: Math.max(...numeric) - Math.min(...numeric)
    } : null;
    const waitingFor = Math.max(0, Object.keys(st.participants).length - votes.length);
    return { currentStory, stats, waitingFor };
  }
  broadcast(st) {
    const msg = { type: "state", state: st, derived: this.derive(st) };
    const payload = JSON.stringify(msg);
    for (const [, ws] of this.sockets) {
      try {
        ws.send(payload);
      } catch {
      }
    }
  }
  broadcastChat(chatMsg) {
    const msg = { type: "chat", message: chatMsg };
    const payload = JSON.stringify(msg);
    for (const [, ws] of this.sockets) {
      try {
        ws.send(payload);
      } catch {
      }
    }
  }
  async onDisconnect(clientId) {
    const st = await this.load();
    if (!st)
      return;
    delete st.participants[clientId];
    for (const storyId of Object.keys(st.votesByStory)) {
      delete st.votesByStory[storyId]?.[clientId];
    }
    await this.save(st);
    this.broadcast(st);
  }
  async handleMessage(clientId, msg) {
    const st = await this.load();
    if (!st)
      return;
    switch (msg.type) {
      case "join": {
        if (Object.keys(st.participants).length >= MAX_PARTICIPANTS) {
          this.sendTo(clientId, { type: "error", message: `Room full (max ${MAX_PARTICIPANTS} participants)` });
          return;
        }
        const name = (msg.name?.trim() || "Anonymous").slice(0, MAX_NAME_LEN);
        const usedAvatars = Object.values(st.participants).map((p) => p.avatar);
        const avatar = getRandomAvatar(usedAvatars);
        st.participants[clientId] = { name, avatar, joinedAt: now() };
        await this.save(st);
        this.broadcast(st);
        return;
      }
      case "setName": {
        const p = st.participants[clientId];
        if (!p)
          return;
        p.name = (msg.name.trim() || "Anonymous").slice(0, MAX_NAME_LEN);
        await this.save(st);
        this.broadcast(st);
        return;
      }
      case "setAvatar": {
        const p = st.participants[clientId];
        if (!p)
          return;
        const newAvatar = msg.avatar;
        if (!AVATARS.includes(newAvatar) && !newAvatar.startsWith("\u{1F464}")) {
          this.sendTo(clientId, { type: "error", message: "Invalid avatar" });
          return;
        }
        const otherParticipants = Object.entries(st.participants).filter(([id]) => id !== clientId);
        const usedAvatars = otherParticipants.map(([, participant]) => participant.avatar);
        if (usedAvatars.includes(newAvatar)) {
          this.sendTo(clientId, { type: "error", message: "This avatar is already in use" });
          return;
        }
        p.avatar = newAvatar;
        await this.save(st);
        this.broadcast(st);
        return;
      }
      case "setDeck": {
        if (msg.deck.type === "custom") {
          const custom = (msg.deck.custom ?? []).map((s) => s.trim()).filter(Boolean).slice(0, MAX_CUSTOM_DECK_SIZE);
          st.deck = { type: "custom", custom };
        } else {
          st.deck = { type: msg.deck.type };
        }
        await this.save(st);
        this.broadcast(st);
        return;
      }
      case "toggleFun": {
        st.funMode = !!msg.funMode;
        await this.save(st);
        this.broadcast(st);
        return;
      }
      case "addStory": {
        if (st.stories.length >= MAX_STORIES) {
          this.sendTo(clientId, { type: "error", message: `Too many stories (max ${MAX_STORIES})` });
          return;
        }
        const title = (msg.title?.trim() || "").slice(0, MAX_STORY_TITLE_LEN);
        if (!title) {
          this.sendTo(clientId, { type: "error", message: "Story title required" });
          return;
        }
        const id = crypto.randomUUID();
        st.stories.push({ id, title, notes: (msg.notes ?? "").slice(0, MAX_STORY_NOTES_LEN) || void 0 });
        if (!st.currentStoryId) {
          st.currentStoryId = id;
          st.phase = "voting";
        }
        await this.save(st);
        this.broadcast(st);
        return;
      }
      case "editStory": {
        const story = st.stories.find((s) => s.id === msg.storyId);
        if (!story)
          return;
        if (msg.storyId in st.lockedByStory) {
          this.sendTo(clientId, { type: "error", message: "Cannot edit a locked story" });
          return;
        }
        const newTitle = (msg.title?.trim() || "").slice(0, MAX_STORY_TITLE_LEN);
        if (!newTitle) {
          this.sendTo(clientId, { type: "error", message: "Story title required" });
          return;
        }
        story.title = newTitle;
        await this.save(st);
        this.broadcast(st);
        return;
      }
      case "updateNotes": {
        const story = st.stories.find((s) => s.id === msg.storyId);
        if (!story)
          return;
        if (msg.storyId in st.lockedByStory) {
          this.sendTo(clientId, { type: "error", message: "Cannot update notes on a locked story" });
          return;
        }
        if (!st.participants[clientId]) {
          this.sendTo(clientId, { type: "error", message: "Join the room first" });
          return;
        }
        story.notes = (msg.notes ?? "").slice(0, MAX_STORY_NOTES_LEN) || void 0;
        await this.save(st);
        this.broadcast(st);
        return;
      }
      case "deleteStory": {
        const storyIndex = st.stories.findIndex((s) => s.id === msg.storyId);
        if (storyIndex === -1)
          return;
        if (msg.storyId in st.lockedByStory) {
          this.sendTo(clientId, { type: "error", message: "Cannot delete a locked story" });
          return;
        }
        st.stories.splice(storyIndex, 1);
        delete st.votesByStory[msg.storyId];
        if (st.currentStoryId === msg.storyId) {
          st.currentStoryId = st.stories[0]?.id ?? null;
          st.phase = "voting";
        }
        await this.save(st);
        this.broadcast(st);
        return;
      }
      case "setCurrentStory": {
        const exists = st.stories.some((s) => s.id === msg.storyId);
        if (!exists)
          return;
        st.currentStoryId = msg.storyId;
        st.phase = "voting";
        await this.save(st);
        this.broadcast(st);
        return;
      }
      case "vote": {
        if (!st.currentStoryId || st.currentStoryId !== msg.storyId)
          return;
        if (st.phase === "locked")
          return;
        st.votesByStory[msg.storyId] ||= {};
        st.votesByStory[msg.storyId][clientId] = String(msg.value).slice(0, MAX_VOTE_LEN);
        await this.save(st);
        this.broadcast(st);
        return;
      }
      case "reveal": {
        if (!await this.isHost(msg.roomSecret)) {
          this.sendTo(clientId, { type: "error", message: "Host secret required" });
          return;
        }
        if (!st.currentStoryId)
          return;
        st.phase = "revealed";
        await this.save(st);
        this.broadcast(st);
        return;
      }
      case "lock": {
        if (!await this.isHost(msg.roomSecret)) {
          this.sendTo(clientId, { type: "error", message: "Host secret required" });
          return;
        }
        const exists = st.stories.some((s) => s.id === msg.storyId);
        if (!exists)
          return;
        st.lockedByStory[msg.storyId] = String(msg.value).slice(0, MAX_VOTE_LEN);
        st.phase = "locked";
        await this.save(st);
        this.broadcast(st);
        return;
      }
      case "clearVotes": {
        if (!await this.isHost(msg.roomSecret)) {
          this.sendTo(clientId, { type: "error", message: "Host secret required" });
          return;
        }
        st.votesByStory[msg.storyId] = {};
        st.phase = "voting";
        await this.save(st);
        this.broadcast(st);
        return;
      }
      case "next": {
        if (!await this.isHost(msg.roomSecret)) {
          this.sendTo(clientId, { type: "error", message: "Host secret required" });
          return;
        }
        if (!st.currentStoryId)
          return;
        const idx = st.stories.findIndex((s) => s.id === st.currentStoryId);
        const next = st.stories[idx + 1] ?? null;
        st.currentStoryId = next?.id ?? st.currentStoryId;
        st.phase = "voting";
        await this.save(st);
        this.broadcast(st);
        return;
      }
      case "chat": {
        const participant = st.participants[clientId];
        if (!participant) {
          this.sendTo(clientId, { type: "error", message: "Join the room first" });
          return;
        }
        const text = (msg.text?.trim() || "").slice(0, MAX_CHAT_MSG_LEN);
        if (!text)
          return;
        const chatMsg = {
          id: crypto.randomUUID(),
          clientId,
          name: participant.name,
          text,
          timestamp: now()
        };
        st.chatMessages.push(chatMsg);
        if (st.chatMessages.length > MAX_CHAT_MESSAGES) {
          st.chatMessages = st.chatMessages.slice(-MAX_CHAT_MESSAGES);
        }
        await this.save(st);
        this.broadcastChat(chatMsg);
        return;
      }
      case "finish": {
        if (!await this.isHost(msg.roomSecret)) {
          this.sendTo(clientId, { type: "error", message: "Host secret required" });
          return;
        }
        const finishMsg = { type: "finished", reason: "Session ended by host" };
        const payload = JSON.stringify(finishMsg);
        for (const [, ws] of this.sockets) {
          try {
            ws.send(payload);
          } catch {
          }
        }
        for (const [, ws] of this.sockets) {
          try {
            ws.close(1e3, "Session ended by host");
          } catch {
          }
        }
        this.sockets.clear();
        await this.state.storage.deleteAll();
        return;
      }
    }
  }
  sendTo(clientId, msg) {
    const ws = this.sockets.get(clientId);
    if (!ws)
      return;
    try {
      ws.send(JSON.stringify(msg));
    } catch {
    }
  }
};
__name(RoomDO, "RoomDO");

// src/worker.ts
var JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8"
};
function corsHeaders(req, env) {
  const origin = req.headers.get("Origin") ?? "*";
  if (!env.ALLOWED_ORIGINS) {
    return {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400"
    };
  }
  const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0];
  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400"
  };
}
__name(corsHeaders, "corsHeaders");
function json(obj, req, env, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...JSON_HEADERS, ...corsHeaders(req, env) }
  });
}
__name(json, "json");
function bad(msg, req, env, status = 400) {
  return json({ error: msg }, req, env, status);
}
__name(bad, "bad");
var worker_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(req, env) });
    }
    if (url.pathname === "/api/health") {
      return json({ ok: true }, req, env);
    }
    if (url.pathname === "/api/rooms" && req.method === "POST") {
      const roomId = nanoid(12);
      const roomSecret = nanoid(24);
      const id = env.ROOMS.idFromName(roomId);
      const stub = env.ROOMS.get(id);
      await stub.fetch("https://do/init", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roomId, roomSecret })
      });
      return json({ roomId, roomSecret }, req, env, 201);
    }
    const stateMatch = url.pathname.match(/^\/api\/rooms\/([A-Za-z0-9_-]{6,})\/state$/);
    if (stateMatch && req.method === "GET") {
      const roomId = stateMatch[1];
      const id = env.ROOMS.idFromName(roomId);
      return env.ROOMS.get(id).fetch("https://do/state");
    }
    const wsMatch = url.pathname.match(/^\/api\/rooms\/([A-Za-z0-9_-]{6,})\/ws$/);
    if (wsMatch) {
      if (req.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
        return bad("Expected websocket upgrade", req, env, 426);
      }
      const roomId = wsMatch[1];
      const id = env.ROOMS.idFromName(roomId);
      return env.ROOMS.get(id).fetch(req);
    }
    return new Response("Not found", { status: 404 });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-05BlMp/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-05BlMp/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  RoomDO,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
