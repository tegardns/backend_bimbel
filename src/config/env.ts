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

  FONNTE_TOKEN: z.string().min(1, "FONNTE_TOKEN wajib diisi"),
  FONNTE_ADMIN_TARGETS: z.string().min(1, "FONNTE_ADMIN_TARGETS wajib diisi"),
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
  fonnteToken: result.data.FONNTE_TOKEN,
  fonnteAdminTargets: result.data.FONNTE_ADMIN_TARGETS,
};
