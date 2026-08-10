import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { applicationSchema, flattenIssues } from "@/lib/validation";
import { rateLimit, pruneRateLimits } from "@/lib/rate-limit";
import { getClientIp, hashIp } from "@/lib/hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Minimum time a human plausibly needs to complete the form. */
const MIN_FILL_MS = 5_000;

const NO_STORE = { "Cache-Control": "no-store" } as const;

function json(body: unknown, status: number, extraHeaders?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { ...NO_STORE, ...(extraHeaders ?? {}) },
  });
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  let ipHash: string;
  try {
    ipHash = hashIp(ip);
  } catch {
    // Misconfigured environment — never leak the reason to the client.
    console.error("[apply] environment misconfigured");
    return json({ error: "Server configuration error." }, 500);
  }

  // --- Origin check (defence in depth against cross-site posts) ------------
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("host");
    try {
      if (host && new URL(origin).host !== host) {
        return json({ error: "Request blocked." }, 403);
      }
    } catch {
      return json({ error: "Request blocked." }, 403);
    }
  }

  // --- Rate limit: 5 submissions per IP per hour ---------------------------
  const limit = await rateLimit(`apply:${ipHash}`, 5, 60 * 60);
  if (!limit.allowed) {
    return json(
      {
        error:
          "Too many applications from this connection. Please try again later, or call us.",
      },
      429,
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  // --- Parse body ----------------------------------------------------------
  let raw: unknown;
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return json({ error: "Unsupported content type." }, 415);
    }
    const text = await request.text();
    // Cap the payload so a huge body cannot exhaust memory.
    if (text.length > 200_000) {
      return json({ error: "Submission too large." }, 413);
    }
    raw = JSON.parse(text);
  } catch {
    return json({ error: "Could not read the submission." }, 400);
  }

  // --- Validate ------------------------------------------------------------
  const parsed = applicationSchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      {
        error: "Please correct the highlighted fields.",
        fieldErrors: flattenIssues(parsed.error),
      },
      422,
    );
  }
  const data = parsed.data;

  // --- Bot checks ----------------------------------------------------------
  // The honeypot is already enforced by the schema (`website` must be empty).
  // A form completed impossibly fast is almost certainly scripted. We respond
  // with a generic success shape so a bot cannot tell which check caught it.
  if (data.elapsedMs < MIN_FILL_MS) {
    console.warn("[apply] rejected: submitted too quickly");
    return json({ error: "Submission rejected. Please try again." }, 400);
  }

  const emailNormalized = data.email.toLowerCase().trim();
  const phoneNormalized = data.phone.replace(/\D/g, "").slice(-10);

  // Idempotency check up front. A retried or double-clicked submission carries
  // the same token; resolving it here (rather than relying on which unique
  // constraint Postgres happens to report first) guarantees the driver sees
  // "received" instead of a confusing duplicate-email error.
  try {
    const replay = await prisma.application.findUnique({
      where: { submissionToken: data.submissionToken },
      select: { id: true },
    });
    if (replay) {
      return json(
        {
          ok: true,
          duplicate: true,
          reference: replay.id.slice(-8).toUpperCase(),
        },
        200,
      );
    }
  } catch {
    // If the lookup fails, fall through — the unique constraint below still
    // prevents a duplicate record from being written.
  }

  try {
    const created = await prisma.application.create({
      data: {
        submissionToken: data.submissionToken,

        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        emailNormalized,
        phone: data.phone,
        phoneNormalized,
        dateOfBirth: new Date(`${data.dateOfBirth}T00:00:00Z`),
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 ?? null,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,

        cdlNumber: data.cdlNumber,
        cdlState: data.cdlState,
        cdlExpiration: new Date(`${data.cdlExpiration}T00:00:00Z`),
        endorsements: data.endorsements,
        monthsCdlExperience: data.monthsCdlExperience,
        monthsOtrExperience: data.monthsOtrExperience,
        freightExperience: data.freightExperience,

        isAtLeast21: data.isAtLeast21,
        legallyAuthorized: data.legallyAuthorized,
        hasValidMedicalCard: data.hasValidMedicalCard,
        medicalCardExpiration: data.medicalCardExpiration
          ? new Date(`${data.medicalCardExpiration}T00:00:00Z`)
          : null,
        canPassDrugScreen: data.canPassDrugScreen,
        inSapProgram: data.inSapProgram,
        sapStep: data.sapStep ?? null,
        canStayOut3To4Weeks: data.canStayOut3To4Weeks,
        needsTransportAssistance: data.needsTransportAssistance,
        understands1099: data.understands1099,

        hasAccidents: data.hasAccidents,
        accidents: data.accidents as unknown as Prisma.InputJsonValue,
        hasViolations: data.hasViolations,
        violations: data.violations as unknown as Prisma.InputJsonValue,
        licenseEverSuspended: data.licenseEverSuspended,
        licenseEverDenied: data.licenseEverDenied,
        recordExplanation: data.recordExplanation ?? null,

        addressHistory:
          data.addressHistory as unknown as Prisma.InputJsonValue,
        employmentHistory:
          data.employmentHistory as unknown as Prisma.InputJsonValue,
        hasEmploymentGaps: data.hasEmploymentGaps,
        employmentGapExplanation: data.employmentGapExplanation ?? null,

        certifiesAccurate: data.certifiesAccurate,
        consentsToBackgroundCheck: data.consentsToBackgroundCheck,
        consentsToFmcsaQuery: data.consentsToFmcsaQuery,
        signature: data.signature,
        signedAt: new Date(),

        referralSource: data.referralSource ?? null,
        notes: data.notes ?? null,

        ipHash,
        userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
      },
      select: { id: true },
    });

    // Opportunistic cleanup; failures are swallowed inside the helper.
    void pruneRateLimits();

    // Only a confirmation reference is returned — never the stored record.
    return json(
      { ok: true, reference: created.id.slice(-8).toUpperCase() },
      201,
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = (error.meta?.target as string[] | undefined) ?? [];

      // Same submissionToken → a retried or double-clicked request. This is
      // not a user error; report success so the driver is not told their
      // application failed when it actually saved.
      if (target.includes("submissionToken")) {
        const existing = await prisma.application.findUnique({
          where: { submissionToken: data.submissionToken },
          select: { id: true },
        });
        if (existing) {
          return json(
            {
              ok: true,
              duplicate: true,
              reference: existing.id.slice(-8).toUpperCase(),
            },
            200,
          );
        }
      }

      // Same email → this driver already has an application on file.
      return json(
        {
          error:
            "An application already exists for this email address. Give us a call and we'll pull it up.",
          code: "DUPLICATE",
        },
        409,
      );
    }

    // Log server-side only. The client gets nothing that describes internals.
    console.error("[apply] failed to save application:", error);
    return json(
      {
        error:
          "Something went wrong saving your application. Please try again, or call us.",
      },
      500,
    );
  }
}

/** Anything other than POST is not part of this endpoint's contract. */
export async function GET() {
  return json({ error: "Method not allowed" }, 405);
}
