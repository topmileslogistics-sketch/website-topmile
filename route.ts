import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

  const store = await cookies();
  // maxAge 0 expires the cookie immediately.
  store.set(SESSION_COOKIE, "", sessionCookieOptions(0));

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
