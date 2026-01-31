/**
 * WebSocket Client for Sprint Story Point
 * Handles connection, reconnection, and message passing with the Worker backend
 */

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_BASE = isLocal
  ? 'http://localhost:8787'
  : 'https://api.sprintstorypoint.com';

const WS_BASE = isLocal
  ? 'ws://localhost:8787'
  : 'wss://api.sprintstorypoint.com';

class RoomClient {
  constructor(roomId, options = {}) {
    this.roomId = roomId;
    this.roomSecret = options.roomSecret || null;
    this.ws = null;
    this.clientId = null;

    // Reconnection settings with exponential backoff
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 15;      // Increased from 10
    this.baseDelay = 1000;               // 1 second
    this.maxDelay = 30000;               // 30 seconds max
    this.reconnectTimer = null;
    this.isReconnecting = false;

    // Connection health tracking
    this.lastPongTime = null;
    this.pingInterval = null;
    this.connectionQuality = 'unknown'; // 'good', 'degraded', 'poor', 'unknown'

    // State
    this.state = null;
    this.derived = null;
    this.connected = false;
    this.wasConnected = false;          // Track if we ever connected successfully

    // Page visibility handling
    this.isPageVisible = true;
    this.pendingReconnect = false;
    this._setupVisibilityHandler();

    // Event callbacks
    this.onStateChange = options.onStateChange || (() => {});
    this.onError = options.onError || (() => {});
    this.onConnect = options.onConnect || (() => {});
    this.onDisconnect = options.onDisconnect || (() => {});
    this.onChat = options.onChat || (() => {});
    this.onFinish = options.onFinish || (() => {});
    this.onReconnecting = options.onReconnecting || (() => {}); // New callback

    // Chat messages (local cache)
    this.chatMessages = [];
  }

  /**
   * Setup page visibility handler to pause/resume reconnection
   */
  _setupVisibilityHandler() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      this.isPageVisible = !document.hidden;

      if (this.isPageVisible && this.pendingReconnect) {
        // Page became visible and we have a pending reconnect
        this.pendingReconnect = false;
        this._scheduleReconnect();
      }
    });

    // Also handle online/offline events
    window.addEventListener('online', () => {
      if (!this.connected && this.wasConnected) {
        console.log('Network online - attempting reconnect');
        this.reconnectAttempts = 0; // Reset attempts on network recovery
        this.connect();
      }
    });

    window.addEventListener('offline', () => {
      console.log('Network offline - pausing reconnection');
    });
  }

  /**
   * Connect to the room WebSocket
   */
  connect() {
    // Prevent multiple simultaneous connection attempts
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Check if browser is online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('Browser offline - deferring connection');
      this.pendingReconnect = true;
      return;
    }

    this.isReconnecting = this.wasConnected;
    if (this.isReconnecting) {
      this.onReconnecting(this.reconnectAttempts, this.maxReconnectAttempts);
    }

    const url = `${WS_BASE}/api/rooms/${this.roomId}/ws`;

    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      this._scheduleReconnect();
      return;
    }

    // Connection timeout - if we don't get open event in 10 seconds, retry
    const connectTimeout = setTimeout(() => {
      if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
        console.log('Connection timeout - closing and retrying');
        this.ws.close();
      }
    }, 10000);

    this.ws.onopen = () => {
      clearTimeout(connectTimeout);
      this.connected = true;
      this.wasConnected = true;
      this.isReconnecting = false;
      this.reconnectAttempts = 0;
      this.connectionQuality = 'good';
      this.lastPongTime = Date.now();
      this.onConnect();
    };

    this.ws.onmessage = (event) => {
      // Any message received indicates connection is alive
      this.lastPongTime = Date.now();
      this._handleMessage(event.data);
    };

    this.ws.onclose = (event) => {
      clearTimeout(connectTimeout);
      this.connected = false;
      this.onDisconnect();

      // Don't reconnect on clean close (code 1000) or if session ended (1001)
      if (event.code !== 1000 && event.code !== 1001) {
        this._scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // onerror is always followed by onclose, so we don't schedule reconnect here
    };
  }

  /**
   * Disconnect from the room
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'User disconnect');
      this.ws = null;
    }

    this.connected = false;
  }

  /**
   * Handle incoming WebSocket message
   */
  _handleMessage(data) {
    try {
      const msg = JSON.parse(data);

      switch (msg.type) {
        case 'hello':
          this.clientId = msg.clientId;
          break;

        case 'state':
          this.state = msg.state;
          this.derived = msg.derived;
          // Sync chat messages from state (for initial load / reconnect)
          if (msg.state.chatMessages && msg.state.chatMessages.length > 0) {
            this.chatMessages = msg.state.chatMessages;
          }
          this.onStateChange(this.state, this.derived);
          break;

        case 'error':
          this.onError(msg.message);
          break;

        case 'chat':
          // Add to local cache and notify
          this.chatMessages.push(msg.message);
          // Keep last 50 messages locally
          if (this.chatMessages.length > 50) {
            this.chatMessages = this.chatMessages.slice(-50);
          }
          this.onChat(msg.message);
          break;

        case 'finished':
          // Session ended by host - don't try to reconnect
          this.reconnectAttempts = this.maxReconnectAttempts;
          this.onFinish(msg.reason);
          break;

        default:
          console.warn('Unknown message type:', msg.type);
      }
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  }

  /**
   * Schedule reconnection with exponential backoff and jitter
   */
  _scheduleReconnect() {
    // Clear any existing timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Check if we've exceeded max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.isReconnecting = false;
      this.connectionQuality = 'poor';
      this.onError('Connection lost. Please refresh the page to reconnect.');
      return;
    }

    // If page is hidden, defer reconnection until visible
    if (!this.isPageVisible) {
      console.log('Page hidden - deferring reconnect');
      this.pendingReconnect = true;
      return;
    }

    // If browser is offline, defer reconnection
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('Browser offline - deferring reconnect');
      this.pendingReconnect = true;
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts),
      this.maxDelay
    );

    // Add jitter (±25%) to prevent thundering herd
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    const totalDelay = Math.round(delay + jitter);

    // Update connection quality based on attempts
    if (this.reconnectAttempts >= 5) {
      this.connectionQuality = 'poor';
    } else if (this.reconnectAttempts >= 2) {
      this.connectionQuality = 'degraded';
    }

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts} in ${totalDelay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, totalDelay);
  }

  /**
   * Get current connection status
   */
  getConnectionStatus() {
    if (this.connected) {
      return { status: 'connected', quality: this.connectionQuality };
    } else if (this.isReconnecting) {
      return {
        status: 'reconnecting',
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
        quality: this.connectionQuality
      };
    } else if (this.pendingReconnect) {
      return { status: 'waiting', reason: this.isPageVisible ? 'offline' : 'hidden' };
    } else {
      return { status: 'disconnected', quality: this.connectionQuality };
    }
  }

  /**
   * Send a message to the server
   */
  _send(msg) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return false;
    }

    this.ws.send(JSON.stringify(msg));
    return true;
  }

  // ============ Client Actions ============

  /**
   * Join the room with a name
   */
  join(name) {
    return this._send({ type: 'join', name });
  }

  /**
   * Update your display name
   */
  setName(name) {
    return this._send({ type: 'setName', name });
  }

  /**
   * Update your avatar
   */
  setAvatar(avatar) {
    return this._send({ type: 'setAvatar', avatar });
  }

  /**
   * Submit a vote for the current story
   */
  vote(storyId, value) {
    return this._send({ type: 'vote', storyId, value: String(value) });
  }

  /**
   * Add a new story to estimate
   */
  addStory(title, notes = '') {
    return this._send({ type: 'addStory', title, notes });
  }

  /**
   * Edit a story's title (cannot edit locked stories)
   */
  editStory(storyId, title) {
    return this._send({ type: 'editStory', storyId, title });
  }

  /**
   * Update a story's notes (any participant can do this, but not on locked stories)
   */
  updateNotes(storyId, notes) {
    return this._send({ type: 'updateNotes', storyId, notes });
  }

  /**
   * Delete a story (cannot delete locked stories)
   */
  deleteStory(storyId) {
    return this._send({ type: 'deleteStory', storyId });
  }

  /**
   * Select a story as the current one to estimate
   */
  setCurrentStory(storyId) {
    return this._send({ type: 'setCurrentStory', storyId });
  }

  /**
   * Change the deck type
   */
  setDeck(type, custom = null) {
    const deck = { type };
    if (type === 'custom' && custom) {
      deck.custom = custom;
    }
    return this._send({ type: 'setDeck', deck });
  }

  /**
   * Toggle fun mode
   */
  toggleFun(funMode) {
    return this._send({ type: 'toggleFun', funMode });
  }

  /**
   * Send a chat message
   */
  sendChat(text) {
    return this._send({ type: 'chat', text });
  }

  // ============ Host-Only Actions ============

  /**
   * Check if this client is the host
   */
  isHost() {
    return !!this.roomSecret;
  }

  /**
   * Reveal all votes (host only)
   */
  reveal() {
    if (!this.roomSecret) {
      this.onError('Only the host can reveal votes');
      return false;
    }
    return this._send({ type: 'reveal', roomSecret: this.roomSecret });
  }

  /**
   * Lock the estimate for a story (host only)
   */
  lock(storyId, value) {
    if (!this.roomSecret) {
      this.onError('Only the host can lock estimates');
      return false;
    }
    return this._send({
      type: 'lock',
      storyId,
      value: String(value),
      roomSecret: this.roomSecret
    });
  }

  /**
   * Move to the next story (host only)
   */
  next() {
    if (!this.roomSecret) {
      this.onError('Only the host can advance stories');
      return false;
    }
    return this._send({ type: 'next', roomSecret: this.roomSecret });
  }

  /**
   * Clear votes for a story (host only)
   */
  clearVotes(storyId) {
    if (!this.roomSecret) {
      this.onError('Only the host can clear votes');
      return false;
    }
    return this._send({ type: 'clearVotes', storyId, roomSecret: this.roomSecret });
  }

  /**
   * End the session and remove the room (host only)
   */
  finish() {
    if (!this.roomSecret) {
      this.onError('Only the host can end the session');
      return false;
    }
    return this._send({ type: 'finish', roomSecret: this.roomSecret });
  }

  // ============ Helper Methods ============

  /**
   * Get the current user's participant info
   */
  getCurrentParticipant() {
    if (!this.state || !this.clientId) return null;
    return this.state.participants[this.clientId] || null;
  }

  /**
   * Check if the current user has voted on the current story
   */
  hasVoted() {
    if (!this.state || !this.clientId || !this.state.currentStoryId) return false;
    const votes = this.state.votesByStory[this.state.currentStoryId] || {};
    return this.clientId in votes;
  }

  /**
   * Get the current user's vote for the current story
   */
  getMyVote() {
    if (!this.state || !this.clientId || !this.state.currentStoryId) return null;
    const votes = this.state.votesByStory[this.state.currentStoryId] || {};
    return votes[this.clientId] || null;
  }

  /**
   * Get all votes for the current story (only meaningful when revealed)
   */
  getCurrentVotes() {
    if (!this.state || !this.state.currentStoryId) return {};
    return this.state.votesByStory[this.state.currentStoryId] || {};
  }

  /**
   * Get the deck values based on current deck type
   */
  getDeckValues() {
    if (!this.state) return [];

    const deck = this.state.deck;
    switch (deck.type) {
      case 'fibonacci':
        return ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];
      case 'tshirt':
        return ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕'];
      case 'custom':
        return deck.custom || [];
      default:
        return [];
    }
  }
}

/**
 * Create a new room via the API
 * @returns {Promise<{roomId: string, roomSecret: string}>}
 */
async function createRoom() {
  console.log('Creating room, API_BASE:', API_BASE);

  try {
    const response = await fetch(`${API_BASE}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error('API error:', text);
      throw new Error('Failed to create room: ' + response.status);
    }

    const data = await response.json();
    console.log('Room created:', data);

    if (!data.roomId || !data.roomSecret) {
      throw new Error('Invalid response from server');
    }

    return data;
  } catch (err) {
    console.error('createRoom error:', err);
    throw err;
  }
}

/**
 * Get room state snapshot via HTTP (for initial load)
 * @param {string} roomId
 * @returns {Promise<{state: object, derived: object}>}
 */
async function getRoomState(roomId) {
  const response = await fetch(`${API_BASE}/api/rooms/${roomId}/state`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Room not found');
    }
    throw new Error('Failed to get room state');
  }

  return response.json();
}

// Avatar list (must match backend)
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

// Export for use in other scripts
window.RoomClient = RoomClient;
window.createRoom = createRoom;
window.getRoomState = getRoomState;
window.AVATARS = AVATARS;
