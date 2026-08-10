import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminCredentials } from "@/lib/auth";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/session";
import { loginSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, hashIp } from "@/lib/hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * This route sits outside /api/admin on purpose: middleware protects that
 * prefix, and the sign-in endpoint must be reachable without a session.
 */
export async function POST(request: Request) {
  // Reject cross-site sign-in attempts.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin) {
    try {
      if (host && new URL(origin).host !== host) {
        return NextResponse.json({ error: "Request blocked." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Request blocked." }, { status: 403 });
    }
  }

  let ipHash: string;
  try {
    ipHash = hashIp(getClientIp(request.headers));
  } catch {
    console.error("[login] environment misconfigured");
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 },
    );
  }

  // Throttle credential stuffing: 8 attempts per IP per 15 minutes.
  const limit = await rateLimit(`login:${ipHash}`, 8, 15 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    // Deliberately generic: never reveal which field was wrong.
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const ok = await verifyAdminCredentials(
    parsed.data.email,
    parsed.data.password,
  );

  if (!ok) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const token = await createSessionToken(parsed.data.email);
  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    token,
    sessionCookieOptions(SESSION_MAX_AGE_SECONDS),
  );

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
