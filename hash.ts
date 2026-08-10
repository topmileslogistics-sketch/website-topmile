import "server-only";
import { createHmac } from "node:crypto";
import { getEnv } from "./env";

/**
 * Hash an IP address before it touches the database.
 *
 * We need a stable per-visitor key for rate limiting and abuse investigation,
 * but storing raw IPs alongside driver applications would mean storing more
 * personal data than the job requires. An HMAC with a server-side salt gives
 * us the stable key without the raw value ever being persisted.
 */
export function hashIp(ip: string): string {
  const { IP_HASH_SALT } = getEnv();
  return createHmac("sha256", IP_HASH_SALT).update(ip).digest("hex");
}

/**
 * Best-effort client IP extraction.
 *
 * On Vercel `x-forwarded-for` is set by the platform edge and cannot be spoofed
 * by the client. On other hosts, only trust it if your proxy overwrites it.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
