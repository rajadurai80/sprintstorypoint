import { nanoid } from "nanoid";
import { RoomDO } from "./room-do";

// Re-export RoomDO for Wrangler to bind to
export { RoomDO };

export interface Env {
  ROOMS: DurableObjectNamespace<RoomDO>;
  ALLOWED_ORIGINS?: string; // comma-separated (e.g., "https://sprintstorypoint.com")
}

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

function corsHeaders(req: Request, env: Env) {
  const origin = req.headers.get("Origin") ?? "*";

  // In development (no ALLOWED_ORIGINS set), allow any origin
  if (!env.ALLOWED_ORIGINS) {
    return {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
    };
  }

  // In production, check against allowed list
  const allowed = env.ALLOWED_ORIGINS.split(",").map(s => s.trim());
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0];

  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
  };
}

function json(obj: unknown, req: Request, env: Env, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...JSON_HEADERS, ...corsHeaders(req, env) },
  });
}

function bad(msg: string, req: Request, env: Env, status = 400) {
  return json({ error: msg }, req, env, status);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(req, env) });
    }

    // Health
    if (url.pathname === "/api/health") {
      return json({ ok: true }, req, env);
    }

    // Create room
    if (url.pathname === "/api/rooms" && req.method === "POST") {
      // simple IP-based throttle hook (upgrade later to WAF rate rules)
      const roomId = nanoid(12);
      const roomSecret = nanoid(24);

      const id = env.ROOMS.idFromName(roomId);
      const stub = env.ROOMS.get(id);

      await stub.fetch("https://do/init", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roomId, roomSecret }),
      });

      return json({ roomId, roomSecret }, req, env, 201);
    }

    // Room state (snapshot)
    const stateMatch = url.pathname.match(/^\/api\/rooms\/([A-Za-z0-9_-]{6,})\/state$/);
    if (stateMatch && req.method === "GET") {
      const roomId = stateMatch[1];
      const id = env.ROOMS.idFromName(roomId);
      return env.ROOMS.get(id).fetch("https://do/state");
    }

    // WebSocket endpoint -> forward to DO
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
  },
};
