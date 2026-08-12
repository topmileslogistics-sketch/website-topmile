import "server-only";
import { prisma } from "./prisma";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const ALLOW: RateLimitResult = {
  allowed: true,
  remaining: Number.MAX_SAFE_INTEGER,
  retryAfterSeconds: 0,
};

/**
 * Fixed-window rate limiting, backed by Postgres.
 *
 * An in-memory counter is useless on Vercel: each serverless instance would
 * keep its own count, so an attacker gets `limit × instances` requests. Storing
 * the window in the database makes the limit hold across every instance.
 *
 * Two operations are exposed rather than one, because the application form
 * needs them separated:
 *
 *   - `rateLimit()` checks and consumes in one step — right for endpoints where
 *     every request is equally expensive (sign-in).
 *   - `peekRateLimit()` / `bumpRateLimit()` let a caller consume the quota only
 *     when something was actually created. The application form needs this:
 *     counting failed validation attempts against a driver would lock out
 *     someone who simply mistyped their ZIP code a few times.
 */

async function readWindow(key: string) {
  return prisma.rateLimit.findUnique({ where: { key } });
}

/** Check the quota without consuming any of it. */
export async function peekRateLimit(
  key: string,
  limit: number,
): Promise<RateLimitResult> {
  try {
    const now = new Date();
    const existing = await readWindow(key);

    if (!existing || existing.expiresAt <= now) {
      return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
    }

    if (existing.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000),
        ),
      };
    }

    return {
      allowed: true,
      remaining: limit - existing.count,
      retryAfterSeconds: 0,
    };
  } catch {
    return ALLOW;
  }
}

/** Consume one unit of the quota, starting a new window if needed. */
export async function bumpRateLimit(
  key: string,
  windowSeconds: number,
): Promise<void> {
  try {
    const now = new Date();
    const existing = await readWindow(key);

    if (!existing || existing.expiresAt <= now) {
      const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, windowStart: now, expiresAt },
        update: { count: 1, windowStart: now, expiresAt },
      });
      return;
    }

    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
  } catch {
    // A rate-limiter outage must not take the application form down with it.
    // Failing open is the right trade-off: the other defences (honeypot,
    // timing check, duplicate constraints) still apply.
  }
}

/** Check and consume in one step. */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const result = await peekRateLimit(key, limit);
  if (!result.allowed) return result;
  await bumpRateLimit(key, windowSeconds);
  return {
    ...result,
    remaining: Math.max(0, result.remaining - 1),
  };
}

/** Housekeeping: drop expired windows. Safe to call opportunistically. */
export async function pruneRateLimits(): Promise<void> {
  try {
    await prisma.rateLimit.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  } catch {
    // Non-critical.
  }
}
