import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "node:crypto";
import { getEnv } from "./env";
import {
  SESSION_COOKIE,
  verifySessionToken,
  type SessionPayload,
} from "./session";

/**
 * Constant-time string comparison, so the email check cannot be used as an
 * oracle to discover the admin address one character at a time.
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still burn a comparison so the timing does not leak the length.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verify admin credentials.
 *
 * Always runs a bcrypt comparison — even when the email is wrong — so a valid
 * email cannot be distinguished from an invalid one by response time.
 */
export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<boolean> {
  const env = getEnv();
  const emailMatches = safeEqual(email.toLowerCase().trim(), env.ADMIN_EMAIL);
  const passwordMatches = await bcrypt.compare(
    password,
    env.ADMIN_PASSWORD_HASH,
  );
  return emailMatches && passwordMatches;
}

/** The current admin session, or null. Use in server components / route handlers. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/**
 * Guard for anything that touches applicant data.
 *
 * Middleware already redirects unauthenticated browsers, but middleware is a
 * routing concern and can be bypassed by misconfiguration. This is the check
 * that actually stands between an anonymous request and the database.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
