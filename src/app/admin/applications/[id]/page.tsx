import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatusForm } from "./StatusForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AddressEntry = {
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  fromDate?: string;
  toDate?: string;
  isCurrent?: boolean;
};

type EmploymentEntry = {
  employerName?: string;
  position?: string;
  city?: string;
  state?: string;
  phone?: string;
  fromDate?: string;
  toDate?: string;
  isCurrent?: boolean;
  reasonForLeaving?: string;
  wasSafetySensitive?: boolean;
  wasSubjectToDrugTesting?: boolean;
};

type AccidentEntry = {
  date?: string;
  nature?: string;
  fatalities?: number;
  injuries?: number;
  hazmatSpill?: boolean;
};

type ViolationEntry = {
  date?: string;
  violation?: string;
  location?: string;
  penalty?: string;
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function fmtDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(`${value}T00:00:00Z`) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function fmtDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function fmtPhone(digits: string | null | undefined) {
  if (!digits) return "—";
  const d = digits.replace(/\D/g, "").slice(-10);
  return d.length === 10
    ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
    : digits;
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  if (!/^[a-z0-9]{20,40}$/i.test(id)) notFound();

  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) notFound();

  const addresses = asArray<AddressEntry>(app.addressHistory);
  const employment = asArray<EmploymentEntry>(app.employmentHistory);
  const accidents = asArray<AccidentEntry>(app.accidents);
  const violations = asArray<ViolationEntry>(app.violations);

  return (
    <AdminShell email={session.sub}>
      <div className="no-print">
        <Link
          href="/admin"
          className="text-sm font-semibold text-ink-600 hover:text-ink-900"
        >
          ← All applications
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            {app.firstName} {app.lastName}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Received {fmtDateTime(app.createdAt)} · Reference{" "}
            <span className="font-mono">{app.id.slice(-8).toUpperCase()}</span>
          </p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Contact">
            <Rows
              rows={[
                ["Phone", <a key="p" href={`tel:${app.phone}`} className="text-brand-700 underline underline-offset-2">{fmtPhone(app.phone)}</a>],
                ["Email", <a key="e" href={`mailto:${app.email}`} className="text-brand-700 underline underline-offset-2 break-all">{app.email}</a>],
                ["Date of birth", fmtDate(app.dateOfBirth)],
                [
                  "Address",
                  `${app.addressLine1}${app.addressLine2 ? `, ${app.addressLine2}` : ""}, ${app.city}, ${app.state} ${app.postalCode}`,
                ],
                ["Heard about us via", app.referralSource ?? "—"],
              ]}
            />
          </Panel>

          <Panel title="CDL & experience">
            <Rows
              rows={[
                ["CDL number", app.cdlNumber],
                ["Issuing state", app.cdlState],
                ["Expires", fmtDate(app.cdlExpiration)],
                [
                  "Endorsements",
                  app.endorsements.length ? app.endorsements.join(", ") : "None",
                ],
                ["CDL-A experience", `${app.monthsCdlExperience} months`],
                ["OTR experience", `${app.monthsOtrExperience} months`],
                [
                  "Freight experience",
                  app.freightExperience.length
                    ? app.freightExperience.join(", ")
                    : "—",
                ],
                ["Current medical card", yesNo(app.hasValidMedicalCard)],
                [
                  "Medical card expires",
                  app.medicalCardExpiration
                    ? fmtDate(app.medicalCardExpiration)
                    : "—",
                ],
              ]}
            />
          </Panel>

          <Panel title="Eligibility">
            <Rows
              rows={[
                ["At least 21", yesNo(app.isAtLeast21)],
                ["Authorized to work in the US", yesNo(app.legallyAuthorized)],
                ["Can pass DOT drug screen", yesNo(app.canPassDrugScreen)],
                ["Can stay out 3–4 weeks", yesNo(app.canStayOut3To4Weeks)],
                ["Understands 1099", yesNo(app.understands1099)],
                ["In SAP program", yesNo(app.inSapProgram)],
                ["SAP step", app.sapStep ?? "—"],
                [
                  "Wants transportation assistance",
                  yesNo(app.needsTransportAssistance),
                ],
              ]}
            />
          </Panel>

          <Panel title={`Address history (${addresses.length})`}>
            {addresses.length === 0 ? (
              <Empty>No addresses recorded.</Empty>
            ) : (
              <ul className="space-y-3">
                {addresses.map((entry, i) => (
                  <li
                    key={i}
                    className="rounded-lg bg-ink-50 p-4 ring-1 ring-ink-200"
                  >
                    <p className="font-medium text-ink-900">
                      {entry.addressLine1}, {entry.city}, {entry.state}{" "}
                      {entry.postalCode}
                    </p>
                    <p className="mt-1 text-sm text-ink-500">
                      {fmtDate(entry.fromDate)} –{" "}
                      {entry.isCurrent ? "Present" : fmtDate(entry.toDate)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={`Employment history (${employment.length})`}>
            {employment.length === 0 ? (
              <Empty>No employment recorded.</Empty>
            ) : (
              <ul className="space-y-3">
                {employment.map((job, i) => (
                  <li
                    key={i}
                    className="rounded-lg bg-ink-50 p-4 ring-1 ring-ink-200"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-ink-900">
                        {job.employerName}
                      </p>
                      <p className="text-sm text-ink-500">
                        {fmtDate(job.fromDate)} –{" "}
                        {job.isCurrent ? "Present" : fmtDate(job.toDate)}
                      </p>
                    </div>
                    <p className="text-sm text-ink-600">
                      {job.position} · {job.city}, {job.state}
                      {job.phone ? ` · ${fmtPhone(job.phone)}` : ""}
                    </p>
                    {job.reasonForLeaving ? (
                      <p className="mt-1 text-sm text-ink-600">
                        <span className="text-ink-500">Reason for leaving:</span>{" "}
                        {job.reasonForLeaving}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-ink-500">
                      DOT safety-sensitive: {yesNo(Boolean(job.wasSafetySensitive))}{" "}
                      · Subject to DOT testing:{" "}
                      {yesNo(Boolean(job.wasSubjectToDrugTesting))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {app.hasEmploymentGaps ? (
              <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
                <p className="font-semibold">Gaps reported</p>
                <p className="mt-1 whitespace-pre-wrap">
                  {app.employmentGapExplanation}
                </p>
              </div>
            ) : null}
          </Panel>

          <Panel title="Driving record">
            <Rows
              rows={[
                ["Accidents in last 3 years", yesNo(app.hasAccidents)],
                ["Violations in last 3 years", yesNo(app.hasViolations)],
                ["License ever suspended/revoked", yesNo(app.licenseEverSuspended)],
                ["License ever denied", yesNo(app.licenseEverDenied)],
              ]}
            />

            {accidents.length > 0 ? (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-ink-800">Accidents</h3>
                <ul className="mt-2 space-y-2">
                  {accidents.map((a, i) => (
                    <li
                      key={i}
                      className="rounded-lg bg-ink-50 p-3 text-sm ring-1 ring-ink-200"
                    >
                      <span className="font-medium text-ink-900">
                        {fmtDate(a.date)}
                      </span>{" "}
                      — {a.nature} · Fatalities: {a.fatalities ?? 0} · Injuries:{" "}
                      {a.injuries ?? 0}
                      {a.hazmatSpill ? " · Hazmat spill" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {violations.length > 0 ? (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-ink-800">
                  Violations
                </h3>
                <ul className="mt-2 space-y-2">
                  {violations.map((v, i) => (
                    <li
                      key={i}
                      className="rounded-lg bg-ink-50 p-3 text-sm ring-1 ring-ink-200"
                    >
                      <span className="font-medium text-ink-900">
                        {fmtDate(v.date)}
                      </span>{" "}
                      — {v.violation} · {v.location}
                      {v.penalty ? ` · ${v.penalty}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {app.recordExplanation ? (
              <div className="mt-5 rounded-lg bg-ink-50 p-4 text-sm ring-1 ring-ink-200">
                <p className="font-semibold text-ink-800">
                  Applicant explanation
                </p>
                <p className="mt-1 whitespace-pre-wrap text-ink-700">
                  {app.recordExplanation}
                </p>
              </div>
            ) : null}
          </Panel>

          {app.notes ? (
            <Panel title="Notes from the applicant">
              <p className="whitespace-pre-wrap text-ink-700">{app.notes}</p>
            </Panel>
          ) : null}

          <Panel title="Certification">
            <Rows
              rows={[
                ["Certified accurate", yesNo(app.certifiesAccurate)],
                [
                  "Consented to verification",
                  yesNo(app.consentsToBackgroundCheck),
                ],
                ["Consented to FMCSA query", yesNo(app.consentsToFmcsaQuery)],
                ["Signature", app.signature],
                ["Signed", fmtDateTime(app.signedAt)],
              ]}
            />
          </Panel>
        </div>

        <div className="space-y-6">
          <div className="sticky top-6 rounded-xl bg-white p-5 ring-1 ring-ink-200 no-print">
            <h2 className="font-semibold text-ink-900">Recruiter actions</h2>
            <div className="mt-4">
              <StatusForm
                id={app.id}
                status={app.status}
                adminNotes={app.adminNotes ?? ""}
              />
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

/* -------------------------------------------------------------------------- */

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-ink-200">
      <h2 className="font-semibold text-ink-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Rows({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-ink-500">{label}</dt>
          <dd className="font-medium text-ink-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-ink-500">{children}</p>;
}
