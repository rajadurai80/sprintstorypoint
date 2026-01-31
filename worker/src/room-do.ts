export type DeckType = "fibonacci" | "tshirt" | "custom";

type Story = {
  id: string;
  title: string;
  notes?: string;
};

type ChatMessage = {
  id: string;
  clientId: string;
  name: string;
  text: string;
  timestamp: number;
};

type RoomState = {
  roomId: string;
  createdAt: number;
  expiresAt: number;

  deck: { type: DeckType; custom?: string[] };
  funMode: boolean;

  stories: Story[];
  currentStoryId: string | null;

  phase: "voting" | "revealed" | "locked";
  // votesByStory[storyId][clientId] = value
  votesByStory: Record<string, Record<string, string>>;
  lockedByStory: Record<string, string>;

  participants: Record<string, { name: string; avatar: string; joinedAt: number }>;

  // Chat messages (keep last 50)
  chatMessages: ChatMessage[];
};

type ClientMsg =
  | { type: "join"; name?: string }
  | { type: "setName"; name: string }
  | { type: "setAvatar"; avatar: string }
  | { type: "setDeck"; deck: { type: DeckType; custom?: string[] } }
  | { type: "toggleFun"; funMode: boolean }
  | { type: "addStory"; title: string; notes?: string }
  | { type: "editStory"; storyId: string; title: string }
  | { type: "updateNotes"; storyId: string; notes: string }
  | { type: "deleteStory"; storyId: string }
  | { type: "setCurrentStory"; storyId: string }
  | { type: "vote"; storyId: string; value: string }
  | { type: "reveal"; roomSecret?: string }
  | { type: "lock"; storyId: string; value: string; roomSecret?: string }
  | { type: "next"; roomSecret?: string }
  | { type: "clearVotes"; storyId: string; roomSecret?: string }
  | { type: "chat"; text: string }
  | { type: "finish"; roomSecret?: string };

type ServerMsg =
  | { type: "hello"; clientId: string }
  | { type: "state"; state: RoomState; derived: DerivedState }
  | { type: "error"; message: string }
  | { type: "chat"; message: ChatMessage }
  | { type: "finished"; reason: string };

type DerivedState = {
  currentStory?: Story | null;
  stats?: { min?: number; max?: number; median?: number; spread?: number } | null;
  waitingFor: number;
};

// ============ Configuration Constants ============
const MAX_MSG_BYTES = 4096;        // Max WebSocket message size
const MAX_PARTICIPANTS = 25;       // Max participants per room (demo limit)
const MAX_STORIES = 50;            // Max stories per room
const MAX_CHAT_MESSAGES = 50;      // Max chat messages to retain
const MAX_STORY_TITLE_LEN = 120;   // Max story title length
const MAX_STORY_NOTES_LEN = 1000;  // Max story notes length
const MAX_CHAT_MSG_LEN = 500;      // Max chat message length
const MAX_NAME_LEN = 24;           // Max participant name length
const MAX_VOTE_LEN = 12;           // Max vote value length
const MAX_CUSTOM_DECK_SIZE = 20;   // Max custom deck values
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours room TTL

// Rate limiting: messages per client per minute
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_MSGS = 60;     // Max 60 messages per minute per client

// 100+ fun emoji avatars for participants
const AVATARS = [
  // Animals
  "🦊", "🐼", "🦁", "🐯", "🐻", "🐨", "🐸", "🐵", "🦄", "🐲",
  "🦋", "🐝", "🦅", "🦉", "🐧", "🐦", "🦆", "🦢", "🦩", "🐢",
  "🐙", "🦑", "🦐", "🦀", "🐡", "🐬", "🐳", "🦈", "🐊", "🦎",
  "🐍", "🦕", "🦖", "🐘", "🦏", "🦛", "🐪", "🦒", "🦘", "🦬",
  "🐃", "🐂", "🐄", "🐎", "🦌", "🐑", "🐐", "🦙", "🐖", "🐗",
  // Fantasy & Fun
  "🤖", "👾", "👽", "👻", "💀", "🎃", "🦸", "🦹", "🧙", "🧚",
  "🧛", "🧜", "🧝", "🧞", "🧟", "🥷", "🦴", "🌟", "⭐", "🌙",
  "☀️", "🌈", "⚡", "🔥", "💧", "❄️", "🌊", "🌸", "🌺", "🌻",
  // Objects & Symbols
  "🎯", "🎨", "🎭", "🎪", "🎢", "🚀", "🛸", "🎮", "🎲", "🎳",
  "🏆", "🥇", "🎖️", "🏅", "⚽", "🏀", "🏈", "⚾", "🎾", "🏐",
  "🎱", "🏓", "🏸", "🥊", "🎿", "🛹", "🛼", "🎸", "🎺", "🎷",
  "🥁", "🎹", "🎻", "🪗", "🎤", "🎧", "📻", "📺", "💎", "💰"
];

function getRandomAvatar(usedAvatars: string[]): string {
  const available = AVATARS.filter(a => !usedAvatars.includes(a));
  if (available.length === 0) {
    // Fallback: use a numbered avatar if all are taken
    return `👤${usedAvatars.length + 1}`;
  }
  return available[Math.floor(Math.random() * available.length)];
}

function now() {
  return Date.now();
}

function safeJsonParse<T>(text: string): T | null {
  try { return JSON.parse(text) as T; } catch { return null; }
}

function median(nums: number[]) {
  const a = [...nums].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function toNumberMaybe(v: string): number | null {
  // allow "0", "0.5", "1", etc. ignore tshirt
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function sha256Hex(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(digest);
  return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}

export class RoomDO implements DurableObject {
  private state: DurableObjectState;
  private env: unknown;

  private sockets = new Map<string, WebSocket>(); // clientId -> socket
  private roomSecretHash: string | null = null;

  // Rate limiting: track message counts per client
  private rateLimitCounts = new Map<string, { count: number; windowStart: number }>();

  constructor(state: DurableObjectState, env: unknown) {
    this.state = state;
    this.env = env;
  }

  // ---- Rate limiting helper ----
  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitCounts.get(clientId);

    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      // New window
      this.rateLimitCounts.set(clientId, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= RATE_LIMIT_MAX_MSGS) {
      return false; // Rate limited
    }

    entry.count++;
    return true;
  }

  // ---- persistence helpers ----
  private async load(): Promise<RoomState | null> {
    const st = await this.state.storage.get<RoomState>("state");
    if (!st) return null;
    return st;
  }

  private async save(st: RoomState) {
    await this.state.storage.put("state", st);
  }

  private async ensureAlarm(expiresAt: number) {
    await this.state.storage.setAlarm(expiresAt);
  }

  async alarm() {
    const st = await this.load();
    if (!st) {
      // No state means room was already cleaned up
      return;
    }

    const currentTime = now();

    // Check if room has expired
    if (currentTime >= st.expiresAt) {
      // Notify all connected clients that the room is expiring
      const expiredMsg: ServerMsg = { type: "finished", reason: "Room expired (24 hour limit)" };
      const payload = JSON.stringify(expiredMsg);
      for (const [, ws] of this.sockets) {
        try {
          ws.send(payload);
          ws.close(1000, "Room expired");
        } catch {
          // Socket may already be closed
        }
      }
      this.sockets.clear();

      // Clean up rate limit tracking
      this.rateLimitCounts.clear();

      // Delete all room data
      await this.state.storage.deleteAll();
    } else {
      // Room hasn't expired yet - re-arm the alarm
      // This handles edge cases where alarm fires slightly early
      await this.ensureAlarm(st.expiresAt);
    }
  }

  // ---- request router inside DO ----
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/init" && req.method === "POST") {
      const body = await req.json().catch(() => null) as any;
      if (!body?.roomId || !body?.roomSecret) {
        return new Response("Bad init", { status: 400 });
      }

      const createdAt = now();
      const expiresAt = createdAt + TTL_MS;
      this.roomSecretHash = await sha256Hex(body.roomSecret);

      const initial: RoomState = {
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

        chatMessages: [],
      };

      await this.state.storage.put("secretHash", this.roomSecretHash);
      await this.save(initial);
      await this.ensureAlarm(expiresAt);

      return new Response("OK");
    }

    if (url.pathname === "/state" && req.method === "GET") {
      const st = await this.load();
      if (!st) return new Response("Not found", { status: 404 });
      const msg: ServerMsg = { type: "state", state: st, derived: this.derive(st) };
      return new Response(JSON.stringify(msg), {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    // WebSocket upgrade
    if (req.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];

      server.accept();

      // generate clientId
      const clientId = crypto.randomUUID();
      this.sockets.set(clientId, server);

      server.send(JSON.stringify({ type: "hello", clientId } satisfies ServerMsg));

      // send current state snapshot
      const st = await this.load();
      if (st) server.send(JSON.stringify({ type: "state", state: st, derived: this.derive(st) } satisfies ServerMsg));

      server.addEventListener("message", (evt) => {
        const data = typeof evt.data === "string" ? evt.data : "";
        if (!data || data.length > MAX_MSG_BYTES) {
          server.send(JSON.stringify({ type: "error", message: "Message too large" } satisfies ServerMsg));
          return;
        }

        // Rate limiting check
        if (!this.checkRateLimit(clientId)) {
          server.send(JSON.stringify({ type: "error", message: "Too many requests. Please slow down." } satisfies ServerMsg));
          return;
        }

        const msg = safeJsonParse<ClientMsg>(data);
        if (!msg?.type) {
          server.send(JSON.stringify({ type: "error", message: "Invalid message" } satisfies ServerMsg));
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

  private async getSecretHash(): Promise<string | null> {
    if (this.roomSecretHash) return this.roomSecretHash;
    const h = await this.state.storage.get<string>("secretHash");
    this.roomSecretHash = h ?? null;
    return this.roomSecretHash;
  }

  private async isHost(roomSecret?: string): Promise<boolean> {
    if (!roomSecret) return false;
    const h = await this.getSecretHash();
    if (!h) return false;
    const candidate = await sha256Hex(roomSecret);
    return candidate === h;
  }

  private derive(st: RoomState): DerivedState {
    const currentStory = st.currentStoryId
      ? st.stories.find(s => s.id === st.currentStoryId) ?? null
      : null;

    const votes = (st.currentStoryId && st.votesByStory[st.currentStoryId])
      ? Object.values(st.votesByStory[st.currentStoryId])
      : [];

    const numeric = votes.map(toNumberMaybe).filter((x): x is number => x !== null);

    const stats = (st.phase !== "voting" && numeric.length > 0)
      ? {
          min: Math.min(...numeric),
          max: Math.max(...numeric),
          median: median(numeric),
          spread: Math.max(...numeric) - Math.min(...numeric),
        }
      : null;

    const waitingFor = Math.max(0, Object.keys(st.participants).length - votes.length);

    return { currentStory, stats, waitingFor };
  }

  private broadcast(st: RoomState) {
    const msg: ServerMsg = { type: "state", state: st, derived: this.derive(st) };
    const payload = JSON.stringify(msg);
    for (const [, ws] of this.sockets) {
      try { ws.send(payload); } catch {}
    }
  }

  private broadcastChat(chatMsg: ChatMessage) {
    const msg: ServerMsg = { type: "chat", message: chatMsg };
    const payload = JSON.stringify(msg);
    for (const [, ws] of this.sockets) {
      try { ws.send(payload); } catch {}
    }
  }

  private async onDisconnect(clientId: string) {
    const st = await this.load();
    if (!st) return;
    delete st.participants[clientId];

    // also remove votes for this client
    for (const storyId of Object.keys(st.votesByStory)) {
      delete st.votesByStory[storyId]?.[clientId];
    }

    await this.save(st);
    this.broadcast(st);
  }

  private async handleMessage(clientId: string, msg: ClientMsg) {
    const st = await this.load();
    if (!st) return;

    // refresh TTL if active (optional)
    // st.expiresAt = now() + TTL_MS; await this.ensureAlarm(st.expiresAt);

    switch (msg.type) {
      case "join": {
        if (Object.keys(st.participants).length >= MAX_PARTICIPANTS) {
          this.sendTo(clientId, { type: "error", message: `Room full (max ${MAX_PARTICIPANTS} participants)` });
          return;
        }
        const name = (msg.name?.trim() || "Anonymous").slice(0, MAX_NAME_LEN);
        const usedAvatars = Object.values(st.participants).map(p => p.avatar);
        const avatar = getRandomAvatar(usedAvatars);
        st.participants[clientId] = { name, avatar, joinedAt: now() };
        await this.save(st);
        this.broadcast(st);
        return;
      }

      case "setName": {
        const p = st.participants[clientId];
        if (!p) return;
        p.name = (msg.name.trim() || "Anonymous").slice(0, MAX_NAME_LEN);
        await this.save(st);
        this.broadcast(st);
        return;
      }

      case "setAvatar": {
        const p = st.participants[clientId];
        if (!p) return;

        const newAvatar = msg.avatar;

        // Check if avatar is valid (in our list or a fallback)
        if (!AVATARS.includes(newAvatar) && !newAvatar.startsWith("👤")) {
          this.sendTo(clientId, { type: "error", message: "Invalid avatar" });
          return;
        }

        // Check if avatar is already in use by another participant
        const otherParticipants = Object.entries(st.participants)
          .filter(([id]) => id !== clientId);
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
        // host-only not required; keep simple (could restrict later)
        if (msg.deck.type === "custom") {
          const custom = (msg.deck.custom ?? []).map(s => s.trim()).filter(Boolean).slice(0, MAX_CUSTOM_DECK_SIZE);
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
        st.stories.push({ id, title, notes: (msg.notes ?? "").slice(0, MAX_STORY_NOTES_LEN) || undefined });

        if (!st.currentStoryId) {
          st.currentStoryId = id;
          st.phase = "voting";
        }
        await this.save(st);
        this.broadcast(st);
        return;
      }

      case "editStory": {
        const story = st.stories.find(s => s.id === msg.storyId);
        if (!story) return;

        // Cannot edit a locked story
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
        const story = st.stories.find(s => s.id === msg.storyId);
        if (!story) return;

        // Cannot update notes on a locked story
        if (msg.storyId in st.lockedByStory) {
          this.sendTo(clientId, { type: "error", message: "Cannot update notes on a locked story" });
          return;
        }

        // Must be a participant to update notes
        if (!st.participants[clientId]) {
          this.sendTo(clientId, { type: "error", message: "Join the room first" });
          return;
        }

        story.notes = (msg.notes ?? "").slice(0, MAX_STORY_NOTES_LEN) || undefined;
        await this.save(st);
        this.broadcast(st);
        return;
      }

      case "deleteStory": {
        const storyIndex = st.stories.findIndex(s => s.id === msg.storyId);
        if (storyIndex === -1) return;

        // Cannot delete a locked story
        if (msg.storyId in st.lockedByStory) {
          this.sendTo(clientId, { type: "error", message: "Cannot delete a locked story" });
          return;
        }

        // Remove the story
        st.stories.splice(storyIndex, 1);

        // Clean up votes for this story
        delete st.votesByStory[msg.storyId];

        // If this was the current story, move to next or clear
        if (st.currentStoryId === msg.storyId) {
          st.currentStoryId = st.stories[0]?.id ?? null;
          st.phase = "voting";
        }

        await this.save(st);
        this.broadcast(st);
        return;
      }

      case "setCurrentStory": {
        const exists = st.stories.some(s => s.id === msg.storyId);
        if (!exists) return;
        st.currentStoryId = msg.storyId;
        st.phase = "voting";
        // clear votes for the newly selected story? keep existing history, but voting phase resets
        await this.save(st);
        this.broadcast(st);
        return;
      }

      case "vote": {
        if (!st.currentStoryId || st.currentStoryId !== msg.storyId) return;
        if (st.phase === "locked") return;

        st.votesByStory[msg.storyId] ||= {};
        st.votesByStory[msg.storyId][clientId] = String(msg.value).slice(0, MAX_VOTE_LEN);

        await this.save(st);
        this.broadcast(st);
        return;
      }

      case "reveal": {
        if (!(await this.isHost(msg.roomSecret))) {
          this.sendTo(clientId, { type: "error", message: "Host secret required" });
          return;
        }
        if (!st.currentStoryId) return;
        st.phase = "revealed";
        await this.save(st);
        this.broadcast(st);
        return;
      }

      case "lock": {
        if (!(await this.isHost(msg.roomSecret))) {
          this.sendTo(clientId, { type: "error", message: "Host secret required" });
          return;
        }
        const exists = st.stories.some(s => s.id === msg.storyId);
        if (!exists) return;
        st.lockedByStory[msg.storyId] = String(msg.value).slice(0, MAX_VOTE_LEN);
        st.phase = "locked";
        await this.save(st);
        this.broadcast(st);
        return;
      }

      case "clearVotes": {
        if (!(await this.isHost(msg.roomSecret))) {
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
        if (!(await this.isHost(msg.roomSecret))) {
          this.sendTo(clientId, { type: "error", message: "Host secret required" });
          return;
        }
        if (!st.currentStoryId) return;
        const idx = st.stories.findIndex(s => s.id === st.currentStoryId);
        const next = st.stories[idx + 1] ?? null;
        st.currentStoryId = next?.id ?? st.currentStoryId;
        st.phase = "voting";
        await this.save(st);
        this.broadcast(st);
        return;
      }

      case "chat": {
        // Must be a participant to chat
        const participant = st.participants[clientId];
        if (!participant) {
          this.sendTo(clientId, { type: "error", message: "Join the room first" });
          return;
        }

        const text = (msg.text?.trim() || "").slice(0, MAX_CHAT_MSG_LEN);
        if (!text) return;

        const chatMsg: ChatMessage = {
          id: crypto.randomUUID(),
          clientId,
          name: participant.name,
          text,
          timestamp: now(),
        };

        // Keep last N messages
        st.chatMessages.push(chatMsg);
        if (st.chatMessages.length > MAX_CHAT_MESSAGES) {
          st.chatMessages = st.chatMessages.slice(-MAX_CHAT_MESSAGES);
        }

        await this.save(st);
        // Broadcast just the new chat message (more efficient)
        this.broadcastChat(chatMsg);
        return;
      }

      case "finish": {
        if (!(await this.isHost(msg.roomSecret))) {
          this.sendTo(clientId, { type: "error", message: "Host secret required" });
          return;
        }

        // Notify all clients that the session is ending
        const finishMsg: ServerMsg = { type: "finished", reason: "Session ended by host" };
        const payload = JSON.stringify(finishMsg);
        for (const [, ws] of this.sockets) {
          try { ws.send(payload); } catch {}
        }

        // Close all WebSocket connections
        for (const [, ws] of this.sockets) {
          try { ws.close(1000, "Session ended by host"); } catch {}
        }
        this.sockets.clear();

        // Delete all room data
        await this.state.storage.deleteAll();
        return;
      }
    }
  }

  private sendTo(clientId: string, msg: ServerMsg) {
    const ws = this.sockets.get(clientId);
    if (!ws) return;
    try { ws.send(JSON.stringify(msg)); } catch {}
  }
}
