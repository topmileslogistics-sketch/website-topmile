import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { APPLICATION_STATUSES } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Escape a value for CSV.
 *
 * The leading-quote guard defends against CSV injection: a cell starting with
 * =, +, - or @ is executed as a formula when the file is opened in Excel or
 * Sheets. Prefixing with an apostrophe keeps it as text.
 */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

const HEADERS = [
  "Reference",
  "Received",
  "Status",
  "First name",
  "Last name",
  "Email",
  "Phone",
  "City",
  "State",
  "ZIP",
  "CDL number",
  "CDL state",
  "CDL expiration",
  "Endorsements",
  "CDL-A months",
  "OTR months",
  "Freight experience",
  "Medical card",
  "In SAP program",
  "SAP step",
  "Transport assistance",
  "Accidents (3 yr)",
  "Violations (3 yr)",
  "License suspended",
  "License denied",
  "Employers listed",
  "Referral source",
  "Admin notes",
];

export async function GET(request: Request) {
  // Middleware guards this prefix; this is the authoritative check.
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const status = APPLICATION_STATUSES.includes(statusParam as never)
    ? (statusParam as (typeof APPLICATION_STATUSES)[number])
    : undefined;

  const where: Prisma.ApplicationWhereInput = status ? { status } : {};

  const applications = await prisma.application.findMany({
    where,
    orderBy: { createdAt: "desc" },
    // Bounded so one click cannot try to stream the entire table into memory.
    take: 5000,
  });

  const rows = applications.map((app) => [
    app.id.slice(-8).toUpperCase(),
    app.createdAt.toISOString(),
    app.status,
    app.firstName,
    app.lastName,
    app.email,
    app.phone,
    app.city,
    app.state,
    app.postalCode,
    app.cdlNumber,
    app.cdlState,
    app.cdlExpiration.toISOString().slice(0, 10),
    app.endorsements.join("; "),
    app.monthsCdlExperience,
    app.monthsOtrExperience,
    app.freightExperience.join("; "),
    app.hasValidMedicalCard ? "Yes" : "No",
    app.inSapProgram ? "Yes" : "No",
    app.sapStep ?? "",
    app.needsTransportAssistance ? "Yes" : "No",
    app.hasAccidents ? "Yes" : "No",
    app.hasViolations ? "Yes" : "No",
    app.licenseEverSuspended ? "Yes" : "No",
    app.licenseEverDenied ? "Yes" : "No",
    Array.isArray(app.employmentHistory) ? app.employmentHistory.length : 0,
    app.referralSource ?? "",
    app.adminNotes ?? "",
  ]);

  const csv = [
    HEADERS.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\r\n");

  const filename = `top-miles-applications-${new Date()
    .toISOString()
    .slice(0, 10)}${status ? `-${status.toLowerCase()}` : ""}.csv`;

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, private",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
