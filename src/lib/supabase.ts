import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { env } from "../config/env";

// PATCH untuk Node.js < 22
if (!(globalThis as any).WebSocket) {
  (globalThis as any).WebSocket = WebSocket;
}

export const supabase = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
