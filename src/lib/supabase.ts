import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { env } from "../config/env";

export const supabase = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      transport: ws as any,
    },
  },
);

//Tes
