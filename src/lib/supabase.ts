import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { env } from "../config/env";

if (!globalThis.WebSocket) {
  (
    globalThis as typeof globalThis & { WebSocket: typeof WebSocket }
  ).WebSocket = WebSocket;
}

export const supabase = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      transport: WebSocket,
    },
  },
);
