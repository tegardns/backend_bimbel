// import dotenv from "dotenv";

// dotenv.config();

// export const env = {
//   port: Number(process.env.PORT || 4000),
//   corsOrigin: process.env.CORS_ORIGIN || "https://bimbelsaka.vercel.app",
//   supabaseUrl: process.env.SUPABASE_URL || "",
//   supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
//   jwtSecret: process.env.JWT_SECRET || "",
// };

// if (!env.supabaseUrl || !env.supabaseServiceRoleKey || !env.jwtSecret) {
//   throw new Error("Env backend belum lengkap");
// }

import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN wajib diisi"),
  SUPABASE_URL: z.string().url("SUPABASE_URL tidak valid"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY wajib diisi"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET wajib diisi"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Env backend belum lengkap:");
  console.error(result.error.flatten().fieldErrors);
  throw new Error("Env backend belum lengkap");
}

export const env = {
  nodeEnv: result.data.NODE_ENV,
  port: result.data.PORT,
  corsOrigin: result.data.CORS_ORIGIN,
  supabaseUrl: result.data.SUPABASE_URL,
  supabaseServiceRoleKey: result.data.SUPABASE_SERVICE_ROLE_KEY,
  jwtSecret: result.data.JWT_SECRET,
};
