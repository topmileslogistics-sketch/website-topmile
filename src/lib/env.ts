import "server-only";
import { z } from "zod";

/**
 * Server-side environment validation.
 *
 * Every secret the app needs is read here and nowhere else, so a missing or
 * malformed value fails loudly at boot instead of silently degrading security
 * (e.g. an empty SESSION_SECRET that would let anyone forge a session).
 *
 * Nothing in this module is importable from client components — `server-only`
 * turns that into a build error.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ADMIN_EMAIL: z
    .string()
    .email("ADMIN_EMAIL must be a valid email address")
    .transform((v) => v.toLowerCase().trim()),
  ADMIN_PASSWORD_HASH: z
    .string()
    .regex(
      /^\$2[aby]\$\d{2}\$.{53}$/,
      "ADMIN_PASSWORD_HASH must be a bcrypt hash — run: npm run hash-password -- \"your-password\"",
    ),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters"),
  IP_HASH_SALT: z
    .string()
    .min(16, "IP_HASH_SALT must be at least 16 characters"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

let cached: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (cached) return cached;

  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    SESSION_SECRET: process.env.SESSION_SECRET,
    IP_HASH_SALT: process.env.IP_HASH_SALT,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    // The message names the variables but never prints their values.
    throw new Error(
      `Invalid server environment configuration:\n${issues}\n\nSee .env.example.`,
    );
  }

  cached = parsed.data;
  return cached;
}
