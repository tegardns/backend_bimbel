import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || "https://bimbelsaka.vercel.app",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  jwtSecret: process.env.JWT_SECRET || "",
};

if (!env.supabaseUrl || !env.supabaseServiceRoleKey || !env.jwtSecret) {
  throw new Error("Env backend belum lengkap");
}
