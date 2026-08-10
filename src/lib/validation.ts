import { z } from "zod";
import {
  ENDORSEMENTS,
  FREIGHT_EXPERIENCE,
  REFERRAL_SOURCES,
  US_STATES,
  siteConfig,
} from "@/config/site";

/**
 * The single schema used by BOTH the browser and the API route.
 *
 * Client-side validation is a convenience for the driver filling the form; it
 * can be bypassed with any HTTP client. The server re-runs this exact schema on
 * every submission, so what reaches the database is always validated.
 */

const STATE_CODES = US_STATES.map(([code]) => code) as [string, ...string[]];

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Strips control characters and collapses whitespace. */
const cleanString = (max: number) =>
  z
    .string()
    .transform((v) =>
      v
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .pipe(z.string().max(max, `Must be ${max} characters or fewer`));

const requiredString = (max: number, label: string) =>
  cleanString(max).pipe(z.string().min(1, `${label} is required`));

const optionalString = (max: number) =>
  cleanString(max)
    .transform((v) => (v.length === 0 ? undefined : v))
    .optional();

const isoDate = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a valid date`)
    .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), {
      message: `${label} must be a valid date`,
    });

const optionalIsoDate = (label: string) =>
  z
    .union([isoDate(label), z.literal("")])
    .transform((v) => (v === "" ? undefined : v))
    .optional();

/** US phone: accepts common formatting, stores digits only. */
const phoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(
    z
      .string()
      .min(10, "Enter a 10-digit phone number")
      .max(11, "Enter a valid US phone number")
      .refine((v) => v.length === 10 || (v.length === 11 && v.startsWith("1")), {
        message: "Enter a valid US phone number",
      }),
  );

const emailSchema = cleanString(254)
  .pipe(z.string().min(1, "Email is required").email("Enter a valid email address"))
  .transform((v) => v.toLowerCase());

const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code");

const stateSchema = z.enum(STATE_CODES, { message: "Select a state" });

const mustBeTrue = (message: string) =>
  z.boolean().refine((v) => v === true, { message });

const monthsSchema = (label: string) =>
  z.coerce
    .number({ message: `Enter ${label} in months` })
    .int("Enter a whole number of months")
    .min(0, "Cannot be negative")
    .max(720, "Enter a realistic number of months");

// ---------------------------------------------------------------------------
// Repeating sections
// ---------------------------------------------------------------------------

export const addressHistoryEntrySchema = z
  .object({
    addressLine1: requiredString(120, "Street address"),
    city: requiredString(80, "City"),
    state: stateSchema,
    postalCode: postalCodeSchema,
    fromDate: isoDate("From date"),
    toDate: optionalIsoDate("To date"),
    isCurrent: z.boolean().default(false),
  })
  .refine((v) => v.isCurrent || Boolean(v.toDate), {
    message: "Enter an end date, or mark this address as current",
    path: ["toDate"],
  });

export const employmentHistoryEntrySchema = z
  .object({
    employerName: requiredString(120, "Employer name"),
    position: requiredString(80, "Position"),
    city: requiredString(80, "City"),
    state: stateSchema,
    phone: z
      .union([phoneSchema, z.literal("")])
      .transform((v) => (v === "" ? undefined : v))
      .optional(),
    fromDate: isoDate("From date"),
    toDate: optionalIsoDate("To date"),
    isCurrent: z.boolean().default(false),
    reasonForLeaving: optionalString(300),
    /** 49 CFR 391.21 requires these flags for DOT-regulated employment. */
    wasSafetySensitive: z.boolean().default(false),
    wasSubjectToDrugTesting: z.boolean().default(false),
  })
  .refine((v) => v.isCurrent || Boolean(v.toDate), {
    message: "Enter an end date, or mark this job as current",
    path: ["toDate"],
  });

export const accidentEntrySchema = z.object({
  date: isoDate("Accident date"),
  nature: requiredString(200, "Nature of accident"),
  fatalities: z.coerce.number().int().min(0).max(99).default(0),
  injuries: z.coerce.number().int().min(0).max(99).default(0),
  hazmatSpill: z.boolean().default(false),
});

export const violationEntrySchema = z.object({
  date: isoDate("Violation date"),
  violation: requiredString(200, "Violation"),
  location: requiredString(120, "Location"),
  penalty: optionalString(200),
});

// ---------------------------------------------------------------------------
// The application object (no cross-field rules yet)
// ---------------------------------------------------------------------------

export const applicationObjectSchema = z.object({
  // -- Idempotency + anti-spam (never shown to the applicant) --------------
  submissionToken: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{16,64}$/, "Invalid submission token"),
  /** Honeypot: a hidden field only an automated script would fill in. */
  website: z.string().max(0, "Submission rejected").optional().default(""),
  /** Milliseconds between the form rendering and being submitted. */
  elapsedMs: z.coerce.number().int().min(0).max(1000 * 60 * 60 * 24),

  // -- Step 1: eligibility --------------------------------------------------
  isAtLeast21: mustBeTrue(
    "You must be at least 21 years old to drive interstate (49 CFR 391.11)",
  ),
  legallyAuthorized: mustBeTrue(
    "You must be legally authorized to work in the United States",
  ),
  monthsCdlExperience: monthsSchema("your CDL-A experience"),
  monthsOtrExperience: monthsSchema("your OTR experience"),
  canStayOut3To4Weeks: mustBeTrue(
    "This position requires staying out 3–4 weeks at a time",
  ),
  understands1099: mustBeTrue(
    "Please confirm you understand this is a 1099 position",
  ),
  canPassDrugScreen: mustBeTrue("You must be able to pass a DOT drug screen"),
  inSapProgram: z.boolean().default(false),
  sapStep: optionalString(40),
  needsTransportAssistance: z.boolean().default(false),

  // -- Step 2: personal -----------------------------------------------------
  firstName: requiredString(60, "First name"),
  lastName: requiredString(60, "Last name"),
  email: emailSchema,
  phone: phoneSchema,
  dateOfBirth: isoDate("Date of birth"),
  addressLine1: requiredString(120, "Street address"),
  addressLine2: optionalString(120),
  city: requiredString(80, "City"),
  state: stateSchema,
  postalCode: postalCodeSchema,

  // -- Step 3: CDL ----------------------------------------------------------
  cdlNumber: requiredString(40, "CDL number"),
  cdlState: z.enum(STATE_CODES, { message: "Select the issuing state" }),
  cdlExpiration: isoDate("CDL expiration"),
  endorsements: z
    .array(z.enum(ENDORSEMENTS as unknown as [string, ...string[]]))
    .max(ENDORSEMENTS.length)
    .default([]),
  freightExperience: z
    .array(z.enum(FREIGHT_EXPERIENCE as unknown as [string, ...string[]]))
    .max(FREIGHT_EXPERIENCE.length)
    .default([]),
  hasValidMedicalCard: z.boolean().default(false),
  medicalCardExpiration: optionalIsoDate("Medical card expiration"),

  // -- Step 4: address history (3 years) -----------------------------------
  addressHistory: z
    .array(addressHistoryEntrySchema)
    .max(20, "Too many address entries")
    .default([]),

  // -- Step 5: employment history (10 years) -------------------------------
  employmentHistory: z
    .array(employmentHistoryEntrySchema)
    .max(30, "Too many employment entries")
    .default([]),
  hasEmploymentGaps: z.boolean().default(false),
  employmentGapExplanation: optionalString(1000),

  // -- Step 6: driving record ----------------------------------------------
  hasAccidents: z.boolean().default(false),
  accidents: z.array(accidentEntrySchema).max(20).default([]),
  hasViolations: z.boolean().default(false),
  violations: z.array(violationEntrySchema).max(20).default([]),
  licenseEverSuspended: z.boolean().default(false),
  licenseEverDenied: z.boolean().default(false),
  recordExplanation: optionalString(2000),

  // -- Step 7: consent ------------------------------------------------------
  certifiesAccurate: mustBeTrue(
    "You must certify that the information is accurate",
  ),
  consentsToBackgroundCheck: mustBeTrue(
    "Consent is required to process your application",
  ),
  consentsToFmcsaQuery: mustBeTrue(
    "Consent is required to query the FMCSA Drug & Alcohol Clearinghouse",
  ),
  signature: requiredString(120, "Signature"),

  referralSource: z
    .union([
      z.enum(REFERRAL_SOURCES as unknown as [string, ...string[]]),
      z.literal(""),
    ])
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  notes: optionalString(2000),
});

// ---------------------------------------------------------------------------
// Cross-field rules
// ---------------------------------------------------------------------------

/**
 * Rules that depend on more than one field.
 *
 * Every rule guards on the presence of the fields it reads, so this same
 * function can validate a single wizard step (a `.pick()`ed subset) or the
 * whole application. That keeps step-level and final validation from drifting
 * apart — there is exactly one copy of each rule.
 */
function addCrossFieldIssues(
  v: Record<string, unknown>,
  ctx: z.RefinementCtx,
): void {
  const has = (k: string) => Object.prototype.hasOwnProperty.call(v, k);
  const add = (path: (string | number)[], message: string) =>
    ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

  const cdlMonths = v.monthsCdlExperience as number | undefined;
  const otrMonths = v.monthsOtrExperience as number | undefined;

  if (typeof cdlMonths === "number" && cdlMonths < siteConfig.minCdlExperienceMonths) {
    add(
      ["monthsCdlExperience"],
      `This position requires at least ${siteConfig.minCdlExperienceMonths} months of CDL-A experience`,
    );
  }
  if (typeof otrMonths === "number" && otrMonths < siteConfig.minOtrExperienceMonths) {
    add(
      ["monthsOtrExperience"],
      `This position requires at least ${siteConfig.minOtrExperienceMonths} month of OTR experience`,
    );
  }
  if (
    typeof cdlMonths === "number" &&
    typeof otrMonths === "number" &&
    otrMonths > cdlMonths
  ) {
    add(
      ["monthsOtrExperience"],
      "OTR experience cannot be more than your total CDL-A experience",
    );
  }

  if (typeof v.dateOfBirth === "string" && v.dateOfBirth) {
    const dob = Date.parse(`${v.dateOfBirth}T00:00:00Z`);
    if (!Number.isNaN(dob)) {
      const years = (Date.now() - dob) / (365.2425 * 24 * 60 * 60 * 1000);
      if (years < 21) {
        add(
          ["dateOfBirth"],
          "You must be at least 21 years old to drive interstate",
        );
      } else if (years > 100) {
        add(["dateOfBirth"], "Enter a valid date of birth");
      }
    }
  }

  if (typeof v.cdlExpiration === "string" && v.cdlExpiration) {
    const exp = Date.parse(`${v.cdlExpiration}T00:00:00Z`);
    if (!Number.isNaN(exp) && exp <= Date.now()) {
      add(["cdlExpiration"], "This CDL appears to be expired");
    }
  }

  if (v.hasValidMedicalCard === true && !v.medicalCardExpiration) {
    add(
      ["medicalCardExpiration"],
      "Enter your medical card expiration date",
    );
  }

  if (v.inSapProgram === true && !v.sapStep) {
    add(["sapStep"], "Tell us which SAP step you have completed");
  }

  if (has("freightExperience")) {
    const freight = v.freightExperience as string[] | undefined;
    if (!freight || freight.length === 0) {
      add(
        ["freightExperience"],
        "Select at least one type of freight you have hauled",
      );
    }
  }

  if (has("addressHistory")) {
    const history = v.addressHistory as unknown[] | undefined;
    if (!history || history.length === 0) {
      add(
        ["addressHistory"],
        "Add at least one address covering the last 3 years",
      );
    }
  }

  if (has("employmentHistory")) {
    const history = v.employmentHistory as unknown[] | undefined;
    if (!history || history.length === 0) {
      add(
        ["employmentHistory"],
        "Add at least one employer. Federal rules require 10 years of history for CDL positions.",
      );
    }
  }

  if (v.hasEmploymentGaps === true && !v.employmentGapExplanation) {
    add(
      ["employmentGapExplanation"],
      "Please explain any gaps in your employment history",
    );
  }

  if (v.hasAccidents === true) {
    const accidents = v.accidents as unknown[] | undefined;
    if (!accidents || accidents.length === 0) {
      add(["accidents"], "Add at least one accident, or answer No above");
    }
  }

  if (v.hasViolations === true) {
    const violations = v.violations as unknown[] | undefined;
    if (!violations || violations.length === 0) {
      add(["violations"], "Add at least one violation, or answer No above");
    }
  }

  if (
    (v.licenseEverSuspended === true || v.licenseEverDenied === true) &&
    !v.recordExplanation
  ) {
    add(
      ["recordExplanation"],
      "Please explain the suspension or denial",
    );
  }

  if (
    typeof v.signature === "string" &&
    v.signature &&
    typeof v.firstName === "string" &&
    typeof v.lastName === "string"
  ) {
    const expected = `${v.firstName} ${v.lastName}`.toLowerCase().trim();
    if (v.signature.toLowerCase().trim() !== expected) {
      add(
        ["signature"],
        "Type your full legal name exactly as entered on the personal information step",
      );
    }
  }
}

export const applicationSchema =
  applicationObjectSchema.superRefine(addCrossFieldIssues);

export type ApplicationInput = z.input<typeof applicationObjectSchema>;
export type ApplicationData = z.output<typeof applicationSchema>;

// ---------------------------------------------------------------------------
// Per-step schemas (used by the multi-step form in the browser)
// ---------------------------------------------------------------------------

export const STEP_FIELDS = [
  [
    "isAtLeast21",
    "legallyAuthorized",
    "monthsCdlExperience",
    "monthsOtrExperience",
    "canStayOut3To4Weeks",
    "understands1099",
    "canPassDrugScreen",
    "inSapProgram",
    "sapStep",
    "needsTransportAssistance",
  ],
  [
    "firstName",
    "lastName",
    "email",
    "phone",
    "dateOfBirth",
    "addressLine1",
    "addressLine2",
    "city",
    "state",
    "postalCode",
  ],
  [
    "cdlNumber",
    "cdlState",
    "cdlExpiration",
    "endorsements",
    "freightExperience",
    "hasValidMedicalCard",
    "medicalCardExpiration",
  ],
  ["addressHistory"],
  ["employmentHistory", "hasEmploymentGaps", "employmentGapExplanation"],
  [
    "hasAccidents",
    "accidents",
    "hasViolations",
    "violations",
    "licenseEverSuspended",
    "licenseEverDenied",
    "recordExplanation",
  ],
  [
    // firstName/lastName are included so the signature rule can compare against
    // them; they are not rendered again on this step.
    "firstName",
    "lastName",
    "certifiesAccurate",
    "consentsToBackgroundCheck",
    "consentsToFmcsaQuery",
    "signature",
    "referralSource",
    "notes",
  ],
] as const satisfies ReadonlyArray<ReadonlyArray<keyof ApplicationInput>>;

type Mask = { [K in keyof ApplicationInput]?: true };

/** Validate one wizard step. Returns `{ fieldPath: message }`, empty if valid. */
export function validateStep(
  stepIndex: number,
  values: Record<string, unknown>,
): Record<string, string> {
  const fields = STEP_FIELDS[stepIndex];
  if (!fields) return {};

  const mask = Object.fromEntries(fields.map((f) => [f, true])) as Mask;
  const subset = Object.fromEntries(fields.map((f) => [f, values[f]]));

  const schema = applicationObjectSchema
    .pick(mask as never)
    .superRefine(addCrossFieldIssues as never);

  const result = schema.safeParse(subset);
  return result.success ? {} : flattenIssues(result.error);
}

// ---------------------------------------------------------------------------
// Admin schemas
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").max(200),
});

export const APPLICATION_STATUSES = [
  "NEW",
  "REVIEWING",
  "CONTACTED",
  "HIRED",
  "NOT_A_FIT",
  "ARCHIVED",
] as const;

export const updateApplicationSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
  adminNotes: z.string().max(5000).optional().default(""),
});

/** Flatten Zod issues into `{ fieldPath: message }` for the form UI. */
export function flattenIssues(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
