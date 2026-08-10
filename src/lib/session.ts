import { SignJWT, jwtVerify } from "jose";

/**
 * Admin session handling.
 *
 * Deliberately kept free of Node-only APIs (no `node:crypto`, no bcrypt) so it
 * can also run inside Next.js middleware on the Edge runtime, which is where
 * unauthenticated requests to /admin are turned away before any applicant data
 * is loaded.
 */

export const SESSION_COOKIE = "tml_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

const ISSUER = "top-miles-logistics";
const AUDIENCE = "admin-dashboard";

export type SessionPayload = {
  sub: string; // admin email
  role: "admin";
};

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or too short (min 32 characters).",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(email: string): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(email)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    if (payload.role !== "admin" || typeof payload.sub !== "string") {
      return null;
    }
    return { sub: payload.sub, role: "admin" };
  } catch {
    // Expired, tampered with, or signed by a different secret.
    return null;
  }
}

/** Cookie options shared by the login and logout routes. */
export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true, // not readable from JavaScript → XSS cannot steal it
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const, // blocks cross-site CSRF form posts
    path: "/",
    maxAge,
  };
}
