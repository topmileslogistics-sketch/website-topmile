"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ENDORSEMENTS,
  FREIGHT_EXPERIENCE,
  REFERRAL_SOURCES,
  US_STATES,
  siteConfig,
} from "@/config/site";
import { STEP_FIELDS, validateStep } from "@/lib/validation";
import { Alert, Button, cx } from "@/components/ui";
import {
  CheckboxField,
  CheckboxGroup,
  FieldGrid,
  RepeaterCard,
  SelectField,
  TextField,
  TextareaField,
  YesNoField,
} from "./Fields";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type AddressEntry = {
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  fromDate: string;
  toDate: string;
  isCurrent: boolean;
};

type EmploymentEntry = {
  employerName: string;
  position: string;
  city: string;
  state: string;
  phone: string;
  fromDate: string;
  toDate: string;
  isCurrent: boolean;
  reasonForLeaving: string;
  wasSafetySensitive: boolean;
  wasSubjectToDrugTesting: boolean;
};

type AccidentEntry = {
  date: string;
  nature: string;
  fatalities: string;
  injuries: string;
  hazmatSpill: boolean;
};

type ViolationEntry = {
  date: string;
  violation: string;
  location: string;
  penalty: string;
};

type FormValues = {
  isAtLeast21: boolean;
  legallyAuthorized: boolean;
  monthsCdlExperience: string;
  monthsOtrExperience: string;
  canStayOut3To4Weeks: boolean;
  understands1099: boolean;
  canPassDrugScreen: boolean;
  inSapProgram: boolean;
  sapStep: string;
  needsTransportAssistance: boolean;

  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;

  cdlNumber: string;
  cdlState: string;
  cdlExpiration: string;
  endorsements: string[];
  freightExperience: string[];
  hasValidMedicalCard: boolean;
  medicalCardExpiration: string;

  addressHistory: AddressEntry[];
  employmentHistory: EmploymentEntry[];
  hasEmploymentGaps: boolean;
  employmentGapExplanation: string;

  hasAccidents: boolean;
  accidents: AccidentEntry[];
  hasViolations: boolean;
  violations: ViolationEntry[];
  licenseEverSuspended: boolean;
  licenseEverDenied: boolean;
  recordExplanation: string;

  certifiesAccurate: boolean;
  consentsToBackgroundCheck: boolean;
  consentsToFmcsaQuery: boolean;
  signature: string;
  referralSource: string;
  notes: string;
};

const emptyAddress: AddressEntry = {
  addressLine1: "",
  city: "",
  state: "",
  postalCode: "",
  fromDate: "",
  toDate: "",
  isCurrent: false,
};

const emptyEmployment: EmploymentEntry = {
  employerName: "",
  position: "",
  city: "",
  state: "",
  phone: "",
  fromDate: "",
  toDate: "",
  isCurrent: false,
  reasonForLeaving: "",
  wasSafetySensitive: true,
  wasSubjectToDrugTesting: true,
};

const emptyAccident: AccidentEntry = {
  date: "",
  nature: "",
  fatalities: "0",
  injuries: "0",
  hazmatSpill: false,
};

const emptyViolation: ViolationEntry = {
  date: "",
  violation: "",
  location: "",
  penalty: "",
};

const initialValues: FormValues = {
  isAtLeast21: false,
  legallyAuthorized: false,
  monthsCdlExperience: "",
  monthsOtrExperience: "",
  canStayOut3To4Weeks: false,
  understands1099: false,
  canPassDrugScreen: false,
  inSapProgram: false,
  sapStep: "",
  needsTransportAssistance: false,

  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",

  cdlNumber: "",
  cdlState: "",
  cdlExpiration: "",
  endorsements: [],
  freightExperience: [],
  hasValidMedicalCard: false,
  medicalCardExpiration: "",

  addressHistory: [{ ...emptyAddress, isCurrent: true }],
  employmentHistory: [{ ...emptyEmployment, isCurrent: true }],
  hasEmploymentGaps: false,
  employmentGapExplanation: "",

  hasAccidents: false,
  accidents: [],
  hasViolations: false,
  violations: [],
  licenseEverSuspended: false,
  licenseEverDenied: false,
  recordExplanation: "",

  certifiesAccurate: false,
  consentsToBackgroundCheck: false,
  consentsToFmcsaQuery: false,
  signature: "",
  referralSource: "",
  notes: "",
};

const STEPS = [
  { title: "Eligibility", short: "Eligibility" },
  { title: "Personal Information", short: "Personal" },
  { title: "CDL & Experience", short: "CDL" },
  { title: "Address History", short: "Address" },
  { title: "Employment History", short: "Employment" },
  { title: "Driving Record", short: "Record" },
  { title: "Review & Sign", short: "Sign" },
] as const;

/* -------------------------------------------------------------------------- */

/** Values shaped the way the zod schema expects (numbers, no empty strings). */
function toSchemaShape(v: FormValues): Record<string, unknown> {
  return {
    ...v,
    monthsCdlExperience: v.monthsCdlExperience,
    monthsOtrExperience: v.monthsOtrExperience,
    accidents: v.hasAccidents ? v.accidents : [],
    violations: v.hasViolations ? v.violations : [],
    addressHistory: v.addressHistory.map((a) => ({
      ...a,
      toDate: a.isCurrent ? "" : a.toDate,
    })),
    employmentHistory: v.employmentHistory.map((e) => ({
      ...e,
      toDate: e.isCurrent ? "" : e.toDate,
    })),
  };
}

function generateToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  // Fallback for very old browsers.
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}

/* -------------------------------------------------------------------------- */

export function ApplicationForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const startedAt = useRef<number>(Date.now());
  const tokenRef = useRef<string>("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Guards against a double click firing two POSTs before state updates.
  const inFlight = useRef(false);

  useEffect(() => {
    tokenRef.current = generateToken();
    startedAt.current = Date.now();
  }, []);

  // Move focus to the step heading on change so keyboard and screen-reader
  // users land in the right place instead of at the top of the document.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  // Warn before losing a partially completed application.
  useEffect(() => {
    const dirty =
      values.firstName !== "" || values.email !== "" || step > 0;
    if (!dirty || submitting) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [values.firstName, values.email, step, submitting]);

  const set = useCallback(
    <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        if (!prev[key as string]) return prev;
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    },
    [],
  );

  const stepFieldSet = useMemo(
    () => new Set<string>(STEP_FIELDS[step] as readonly string[]),
    [step],
  );

  const runStepValidation = useCallback(
    (index: number) => {
      const found = validateStep(index, toSchemaShape(values));
      setErrors(found);
      return Object.keys(found).length === 0;
    },
    [values],
  );

  const goNext = () => {
    setFormError(null);
    if (!runStepValidation(step)) {
      setFormError("Please correct the highlighted fields before continuing.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setFormError(null);
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlight.current) return;

    setFormError(null);
    if (!runStepValidation(step)) {
      setFormError("Please correct the highlighted fields before submitting.");
      return;
    }

    inFlight.current = true;
    setSubmitting(true);

    const payload = {
      ...toSchemaShape(values),
      submissionToken: tokenRef.current,
      website: honeypot,
      elapsedMs: Date.now() - startedAt.current,
    };

    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        reference?: string;
        error?: string;
        fieldErrors?: Record<string, string>;
      };

      if (response.ok && result.ok) {
        // Let the unload guard know the form is no longer dirty.
        setSubmitting(true);
        router.push(
          `/apply/submitted?ref=${encodeURIComponent(result.reference ?? "")}`,
        );
        return;
      }

      if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
        setErrors(result.fieldErrors);
        // Jump to the earliest step that has a problem.
        const firstBadStep = STEP_FIELDS.findIndex((fields) =>
          (fields as readonly string[]).some((f) =>
            Object.keys(result.fieldErrors!).some(
              (key) => key === f || key.startsWith(`${f}.`),
            ),
          ),
        );
        if (firstBadStep >= 0) setStep(firstBadStep);
      }

      setFormError(
        result.error ?? "We could not submit your application. Please try again.",
      );
      inFlight.current = false;
      setSubmitting(false);
    } catch {
      setFormError(
        `We could not reach the server. Check your connection and try again, or call us at ${siteConfig.phoneDisplay}.`,
      );
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const err = (key: string) =>
    stepFieldSet.has(key.split(".")[0]) ? errors[key] : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stepper current={step} />

      <div className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-ink-200 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mt-1 text-2xl font-bold tracking-tight text-ink-900 outline-none sm:text-3xl"
        >
          {STEPS[step].title}
        </h2>

        {formError ? (
          <div className="mt-5">
            <Alert tone="error" title="Please check the form">
              {formError}
            </Alert>
          </div>
        ) : null}

        <div className="mt-7 space-y-7">
          {step === 0 ? (
            <EligibilityStep values={values} set={set} err={err} />
          ) : null}
          {step === 1 ? (
            <PersonalStep values={values} set={set} err={err} />
          ) : null}
          {step === 2 ? <CdlStep values={values} set={set} err={err} /> : null}
          {step === 3 ? (
            <AddressHistoryStep values={values} set={set} errors={errors} />
          ) : null}
          {step === 4 ? (
            <EmploymentStep
              values={values}
              set={set}
              errors={errors}
              err={err}
            />
          ) : null}
          {step === 5 ? (
            <RecordStep values={values} set={set} errors={errors} err={err} />
          ) : null}
          {step === 6 ? (
            <SignStep values={values} set={set} err={err} />
          ) : null}
        </div>

        {/* Honeypot: hidden from people, irresistible to naive bots. */}
        <div aria-hidden="true" className="absolute left-[-9999px] top-0">
          <label htmlFor="website">
            Website (leave this field empty)
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-9 flex flex-col-reverse gap-3 border-t border-ink-200 pt-6 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={goBack}
            disabled={step === 0 || submitting}
            className={cx(step === 0 && "invisible")}
          >
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Application"}
            </Button>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-ink-500">
        Your information is submitted over an encrypted connection and is only
        visible to {siteConfig.name} recruiting staff.
      </p>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Stepper                                                                     */
/* -------------------------------------------------------------------------- */

function Stepper({ current }: { current: number }) {
  const percent = Math.round(((current + 1) / STEPS.length) * 100);
  return (
    <div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-ink-200"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Application progress"
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ol className="mt-3 hidden justify-between gap-1 text-xs font-medium sm:flex">
        {STEPS.map((s, i) => (
          <li
            key={s.short}
            className={cx(
              i === current
                ? "text-brand-700"
                : i < current
                  ? "text-ink-600"
                  : "text-ink-400",
            )}
            aria-current={i === current ? "step" : undefined}
          >
            {s.short}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step components                                                             */
/* -------------------------------------------------------------------------- */

type SetFn = <K extends keyof FormValues>(k: K, v: FormValues[K]) => void;
type ErrFn = (key: string) => string | undefined;

function EligibilityStep({
  values,
  set,
  err,
}: {
  values: FormValues;
  set: SetFn;
  err: ErrFn;
}) {
  return (
    <>
      <Alert tone="info">
        This position is {siteConfig.payRangeNote} It requires a minimum of{" "}
        {siteConfig.minCdlExperienceMonths} months of CDL-A experience and{" "}
        {siteConfig.minOtrExperienceMonths} month of OTR experience.
      </Alert>

      <FieldGrid>
        <TextField
          label="Months of CDL-A experience"
          type="number"
          inputMode="numeric"
          min={0}
          max={720}
          required
          value={values.monthsCdlExperience}
          onChange={(v) => set("monthsCdlExperience", v)}
          error={err("monthsCdlExperience")}
          hint="Total time holding a Class A CDL."
        />
        <TextField
          label="Months of OTR experience"
          type="number"
          inputMode="numeric"
          min={0}
          max={720}
          required
          value={values.monthsOtrExperience}
          onChange={(v) => set("monthsOtrExperience", v)}
          error={err("monthsOtrExperience")}
          hint="Time running over-the-road, not local or regional."
        />
      </FieldGrid>

      <div className="space-y-4 rounded-xl bg-ink-50 p-5 ring-1 ring-ink-200">
        <CheckboxField
          label="I am at least 21 years old."
          checked={values.isAtLeast21}
          onChange={(v) => set("isAtLeast21", v)}
          error={err("isAtLeast21")}
        />
        <CheckboxField
          label="I am legally authorized to work in the United States."
          checked={values.legallyAuthorized}
          onChange={(v) => set("legallyAuthorized", v)}
          error={err("legallyAuthorized")}
        />
        <CheckboxField
          label="I can stay out 3–4 weeks at a time."
          checked={values.canStayOut3To4Weeks}
          onChange={(v) => set("canStayOut3To4Weeks", v)}
          error={err("canStayOut3To4Weeks")}
        />
        <CheckboxField
          label="I understand this is a 1099 independent contractor position."
          checked={values.understands1099}
          onChange={(v) => set("understands1099", v)}
          error={err("understands1099")}
        />
        <CheckboxField
          label="I am able to pass a DOT drug screen."
          checked={values.canPassDrugScreen}
          onChange={(v) => set("canPassDrugScreen", v)}
          error={err("canPassDrugScreen")}
        />
      </div>

      <YesNoField
        label="Are you currently in a SAP (Substance Abuse Professional) program?"
        hint={`${siteConfig.sapPolicy}.`}
        value={values.inSapProgram}
        onChange={(v) => set("inSapProgram", v)}
      />

      {values.inSapProgram ? (
        <TextField
          label="Which SAP step have you completed?"
          required
          value={values.sapStep}
          onChange={(v) => set("sapStep", v)}
          error={err("sapStep")}
          placeholder="e.g. Step 6"
          maxLength={40}
        />
      ) : null}

      <YesNoField
        label="Would you like to be considered for transportation assistance?"
        hint={`${siteConfig.transportAssistance}.`}
        value={values.needsTransportAssistance}
        onChange={(v) => set("needsTransportAssistance", v)}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */

function PersonalStep({
  values,
  set,
  err,
}: {
  values: FormValues;
  set: SetFn;
  err: ErrFn;
}) {
  return (
    <>
      <FieldGrid>
        <TextField
          label="First name"
          required
          autoComplete="given-name"
          value={values.firstName}
          onChange={(v) => set("firstName", v)}
          error={err("firstName")}
        />
        <TextField
          label="Last name"
          required
          autoComplete="family-name"
          value={values.lastName}
          onChange={(v) => set("lastName", v)}
          error={err("lastName")}
        />
        <TextField
          label="Email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={(v) => set("email", v)}
          error={err("email")}
        />
        <TextField
          label="Phone"
          type="tel"
          required
          autoComplete="tel"
          inputMode="tel"
          placeholder="(555) 123-4567"
          value={values.phone}
          onChange={(v) => set("phone", v)}
          error={err("phone")}
        />
        <TextField
          label="Date of birth"
          type="date"
          required
          autoComplete="bday"
          value={values.dateOfBirth}
          onChange={(v) => set("dateOfBirth", v)}
          error={err("dateOfBirth")}
        />
      </FieldGrid>

      <div className="space-y-5">
        <h3 className="text-lg font-semibold text-ink-900">Current address</h3>
        <TextField
          label="Street address"
          required
          autoComplete="address-line1"
          value={values.addressLine1}
          onChange={(v) => set("addressLine1", v)}
          error={err("addressLine1")}
        />
        <TextField
          label="Apartment, suite, etc."
          autoComplete="address-line2"
          value={values.addressLine2}
          onChange={(v) => set("addressLine2", v)}
          error={err("addressLine2")}
        />
        <FieldGrid className="sm:grid-cols-3">
          <TextField
            label="City"
            required
            autoComplete="address-level2"
            value={values.city}
            onChange={(v) => set("city", v)}
            error={err("city")}
          />
          <SelectField
            label="State"
            required
            autoComplete="address-level1"
            options={US_STATES}
            value={values.state}
            onChange={(v) => set("state", v)}
            error={err("state")}
          />
          <TextField
            label="ZIP code"
            required
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={10}
            value={values.postalCode}
            onChange={(v) => set("postalCode", v)}
            error={err("postalCode")}
          />
        </FieldGrid>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function CdlStep({
  values,
  set,
  err,
}: {
  values: FormValues;
  set: SetFn;
  err: ErrFn;
}) {
  return (
    <>
      <FieldGrid>
        <TextField
          label="CDL number"
          required
          value={values.cdlNumber}
          onChange={(v) => set("cdlNumber", v)}
          error={err("cdlNumber")}
          maxLength={40}
        />
        <SelectField
          label="Issuing state"
          required
          options={US_STATES}
          value={values.cdlState}
          onChange={(v) => set("cdlState", v)}
          error={err("cdlState")}
        />
        <TextField
          label="CDL expiration date"
          type="date"
          required
          value={values.cdlExpiration}
          onChange={(v) => set("cdlExpiration", v)}
          error={err("cdlExpiration")}
        />
      </FieldGrid>

      <CheckboxGroup
        legend="Endorsements"
        hint="Select all that apply. None are required for this position."
        options={ENDORSEMENTS}
        values={values.endorsements}
        onChange={(v) => set("endorsements", v)}
        error={err("endorsements")}
      />

      <CheckboxGroup
        legend="Freight you have experience hauling *"
        hint="Select at least one."
        options={FREIGHT_EXPERIENCE}
        values={values.freightExperience}
        onChange={(v) => set("freightExperience", v)}
        error={err("freightExperience")}
        columns={3}
      />

      <div className="space-y-5 rounded-xl bg-ink-50 p-5 ring-1 ring-ink-200">
        <YesNoField
          label="Do you have a current DOT medical card?"
          value={values.hasValidMedicalCard}
          onChange={(v) => set("hasValidMedicalCard", v)}
        />
        {values.hasValidMedicalCard ? (
          <TextField
            label="Medical card expiration date"
            type="date"
            required
            value={values.medicalCardExpiration}
            onChange={(v) => set("medicalCardExpiration", v)}
            error={err("medicalCardExpiration")}
          />
        ) : null}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function AddressHistoryStep({
  values,
  set,
  errors,
}: {
  values: FormValues;
  set: SetFn;
  errors: Record<string, string>;
}) {
  const update = (index: number, patch: Partial<AddressEntry>) => {
    set(
      "addressHistory",
      values.addressHistory.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry,
      ),
    );
  };

  return (
    <>
      <Alert tone="info">
        Federal regulations require 3 years of address history for CDL
        positions. Add previous addresses until the last 3 years are covered.
      </Alert>

      {errors.addressHistory ? (
        <p className="text-sm font-medium text-red-700">
          {errors.addressHistory}
        </p>
      ) : null}

      <div className="space-y-5">
        {values.addressHistory.map((entry, index) => (
          <RepeaterCard
            key={index}
            title={index === 0 ? "Most recent address" : `Address ${index + 1}`}
            removeLabel="Remove address"
            onRemove={
              values.addressHistory.length > 1
                ? () =>
                    set(
                      "addressHistory",
                      values.addressHistory.filter((_, i) => i !== index),
                    )
                : undefined
            }
          >
            <div className="space-y-5">
              <TextField
                label="Street address"
                required
                value={entry.addressLine1}
                onChange={(v) => update(index, { addressLine1: v })}
                error={errors[`addressHistory.${index}.addressLine1`]}
              />
              <FieldGrid className="sm:grid-cols-3">
                <TextField
                  label="City"
                  required
                  value={entry.city}
                  onChange={(v) => update(index, { city: v })}
                  error={errors[`addressHistory.${index}.city`]}
                />
                <SelectField
                  label="State"
                  required
                  options={US_STATES}
                  value={entry.state}
                  onChange={(v) => update(index, { state: v })}
                  error={errors[`addressHistory.${index}.state`]}
                />
                <TextField
                  label="ZIP code"
                  required
                  inputMode="numeric"
                  maxLength={10}
                  value={entry.postalCode}
                  onChange={(v) => update(index, { postalCode: v })}
                  error={errors[`addressHistory.${index}.postalCode`]}
                />
              </FieldGrid>
              <FieldGrid>
                <TextField
                  label="From"
                  type="date"
                  required
                  value={entry.fromDate}
                  onChange={(v) => update(index, { fromDate: v })}
                  error={errors[`addressHistory.${index}.fromDate`]}
                />
                {!entry.isCurrent ? (
                  <TextField
                    label="To"
                    type="date"
                    required
                    value={entry.toDate}
                    onChange={(v) => update(index, { toDate: v })}
                    error={errors[`addressHistory.${index}.toDate`]}
                  />
                ) : null}
              </FieldGrid>
              <CheckboxField
                label="I currently live at this address"
                checked={entry.isCurrent}
                onChange={(v) =>
                  update(index, { isCurrent: v, toDate: v ? "" : entry.toDate })
                }
              />
            </div>
          </RepeaterCard>
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          set("addressHistory", [...values.addressHistory, { ...emptyAddress }])
        }
      >
        + Add another address
      </Button>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function EmploymentStep({
  values,
  set,
  errors,
  err,
}: {
  values: FormValues;
  set: SetFn;
  errors: Record<string, string>;
  err: ErrFn;
}) {
  const update = (index: number, patch: Partial<EmploymentEntry>) => {
    set(
      "employmentHistory",
      values.employmentHistory.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry,
      ),
    );
  };

  return (
    <>
      <Alert tone="info">
        Federal regulations (49 CFR 391.21) require 10 years of employment
        history for CDL positions, including all DOT safety-sensitive work. List
        your most recent employer first.
      </Alert>

      {errors.employmentHistory ? (
        <p className="text-sm font-medium text-red-700">
          {errors.employmentHistory}
        </p>
      ) : null}

      <div className="space-y-5">
        {values.employmentHistory.map((entry, index) => (
          <RepeaterCard
            key={index}
            title={index === 0 ? "Most recent employer" : `Employer ${index + 1}`}
            removeLabel="Remove employer"
            onRemove={
              values.employmentHistory.length > 1
                ? () =>
                    set(
                      "employmentHistory",
                      values.employmentHistory.filter((_, i) => i !== index),
                    )
                : undefined
            }
          >
            <div className="space-y-5">
              <FieldGrid>
                <TextField
                  label="Employer name"
                  required
                  value={entry.employerName}
                  onChange={(v) => update(index, { employerName: v })}
                  error={errors[`employmentHistory.${index}.employerName`]}
                />
                <TextField
                  label="Position held"
                  required
                  value={entry.position}
                  onChange={(v) => update(index, { position: v })}
                  error={errors[`employmentHistory.${index}.position`]}
                />
              </FieldGrid>
              <FieldGrid className="sm:grid-cols-3">
                <TextField
                  label="City"
                  required
                  value={entry.city}
                  onChange={(v) => update(index, { city: v })}
                  error={errors[`employmentHistory.${index}.city`]}
                />
                <SelectField
                  label="State"
                  required
                  options={US_STATES}
                  value={entry.state}
                  onChange={(v) => update(index, { state: v })}
                  error={errors[`employmentHistory.${index}.state`]}
                />
                <TextField
                  label="Employer phone"
                  type="tel"
                  inputMode="tel"
                  value={entry.phone}
                  onChange={(v) => update(index, { phone: v })}
                  error={errors[`employmentHistory.${index}.phone`]}
                />
              </FieldGrid>
              <FieldGrid>
                <TextField
                  label="From"
                  type="date"
                  required
                  value={entry.fromDate}
                  onChange={(v) => update(index, { fromDate: v })}
                  error={errors[`employmentHistory.${index}.fromDate`]}
                />
                {!entry.isCurrent ? (
                  <TextField
                    label="To"
                    type="date"
                    required
                    value={entry.toDate}
                    onChange={(v) => update(index, { toDate: v })}
                    error={errors[`employmentHistory.${index}.toDate`]}
                  />
                ) : null}
              </FieldGrid>
              <CheckboxField
                label="I currently work here"
                checked={entry.isCurrent}
                onChange={(v) =>
                  update(index, { isCurrent: v, toDate: v ? "" : entry.toDate })
                }
              />
              {!entry.isCurrent ? (
                <TextField
                  label="Reason for leaving"
                  value={entry.reasonForLeaving}
                  onChange={(v) => update(index, { reasonForLeaving: v })}
                  error={errors[`employmentHistory.${index}.reasonForLeaving`]}
                  maxLength={300}
                />
              ) : null}
              <div className="space-y-3 border-t border-ink-200 pt-4">
                <CheckboxField
                  label="This was a DOT safety-sensitive position"
                  checked={entry.wasSafetySensitive}
                  onChange={(v) => update(index, { wasSafetySensitive: v })}
                />
                <CheckboxField
                  label="I was subject to DOT drug & alcohol testing in this role"
                  checked={entry.wasSubjectToDrugTesting}
                  onChange={(v) =>
                    update(index, { wasSubjectToDrugTesting: v })
                  }
                />
              </div>
            </div>
          </RepeaterCard>
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          set("employmentHistory", [
            ...values.employmentHistory,
            { ...emptyEmployment, isCurrent: false },
          ])
        }
      >
        + Add another employer
      </Button>

      <div className="space-y-5 rounded-xl bg-ink-50 p-5 ring-1 ring-ink-200">
        <YesNoField
          label="Do you have any gaps of 30 days or more in the last 10 years?"
          value={values.hasEmploymentGaps}
          onChange={(v) => set("hasEmploymentGaps", v)}
        />
        {values.hasEmploymentGaps ? (
          <TextareaField
            label="Please explain the gaps"
            required
            value={values.employmentGapExplanation}
            onChange={(v) => set("employmentGapExplanation", v)}
            error={err("employmentGapExplanation")}
            maxLength={1000}
            hint="Include approximate dates and what you were doing."
          />
        ) : null}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function RecordStep({
  values,
  set,
  errors,
  err,
}: {
  values: FormValues;
  set: SetFn;
  errors: Record<string, string>;
  err: ErrFn;
}) {
  const updateAccident = (index: number, patch: Partial<AccidentEntry>) =>
    set(
      "accidents",
      values.accidents.map((a, i) => (i === index ? { ...a, ...patch } : a)),
    );

  const updateViolation = (index: number, patch: Partial<ViolationEntry>) =>
    set(
      "violations",
      values.violations.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    );

  /** Answering "Yes" should immediately give the driver a row to fill in. */
  const onHasAccidentsChange = (v: boolean) => {
    set("hasAccidents", v);
    if (v && values.accidents.length === 0) {
      set("accidents", [{ ...emptyAccident }]);
    }
  };

  const onHasViolationsChange = (v: boolean) => {
    set("hasViolations", v);
    if (v && values.violations.length === 0) {
      set("violations", [{ ...emptyViolation }]);
    }
  };

  return (
    <>
      <Alert tone="info">
        Answer honestly. A record does not automatically disqualify you, but a
        discrepancy found during verification will.
      </Alert>

      {/* -- Accidents -- */}
      <div className="space-y-5">
        <YesNoField
          label="Have you been involved in any accidents in the last 3 years?"
          value={values.hasAccidents}
          onChange={onHasAccidentsChange}
        />
        {errors.accidents ? (
          <p className="text-sm font-medium text-red-700">{errors.accidents}</p>
        ) : null}

        {values.hasAccidents
          ? values.accidents.map((accident, index) => (
              <RepeaterCard
                key={index}
                title={`Accident ${index + 1}`}
                removeLabel="Remove"
                onRemove={() =>
                  set(
                    "accidents",
                    values.accidents.filter((_, i) => i !== index),
                  )
                }
              >
                <div className="space-y-5">
                  <FieldGrid>
                    <TextField
                      label="Date"
                      type="date"
                      required
                      value={accident.date}
                      onChange={(v) => updateAccident(index, { date: v })}
                      error={errors[`accidents.${index}.date`]}
                    />
                    <TextField
                      label="Nature of accident"
                      required
                      placeholder="e.g. rear-end collision"
                      value={accident.nature}
                      onChange={(v) => updateAccident(index, { nature: v })}
                      error={errors[`accidents.${index}.nature`]}
                    />
                    <TextField
                      label="Fatalities"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={accident.fatalities}
                      onChange={(v) => updateAccident(index, { fatalities: v })}
                      error={errors[`accidents.${index}.fatalities`]}
                    />
                    <TextField
                      label="Injuries"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={accident.injuries}
                      onChange={(v) => updateAccident(index, { injuries: v })}
                      error={errors[`accidents.${index}.injuries`]}
                    />
                  </FieldGrid>
                  <CheckboxField
                    label="Hazmat spill was involved"
                    checked={accident.hazmatSpill}
                    onChange={(v) => updateAccident(index, { hazmatSpill: v })}
                  />
                </div>
              </RepeaterCard>
            ))
          : null}

        {values.hasAccidents ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              set("accidents", [...values.accidents, { ...emptyAccident }])
            }
          >
            + Add another accident
          </Button>
        ) : null}
      </div>

      {/* -- Violations -- */}
      <div className="space-y-5 border-t border-ink-200 pt-7">
        <YesNoField
          label="Have you had any moving violations or traffic convictions in the last 3 years?"
          value={values.hasViolations}
          onChange={onHasViolationsChange}
        />
        {errors.violations ? (
          <p className="text-sm font-medium text-red-700">
            {errors.violations}
          </p>
        ) : null}

        {values.hasViolations
          ? values.violations.map((violation, index) => (
              <RepeaterCard
                key={index}
                title={`Violation ${index + 1}`}
                removeLabel="Remove"
                onRemove={() =>
                  set(
                    "violations",
                    values.violations.filter((_, i) => i !== index),
                  )
                }
              >
                <div className="space-y-5">
                  <FieldGrid>
                    <TextField
                      label="Date"
                      type="date"
                      required
                      value={violation.date}
                      onChange={(v) => updateViolation(index, { date: v })}
                      error={errors[`violations.${index}.date`]}
                    />
                    <TextField
                      label="Violation"
                      required
                      value={violation.violation}
                      onChange={(v) => updateViolation(index, { violation: v })}
                      error={errors[`violations.${index}.violation`]}
                    />
                    <TextField
                      label="Location"
                      required
                      placeholder="City, State"
                      value={violation.location}
                      onChange={(v) => updateViolation(index, { location: v })}
                      error={errors[`violations.${index}.location`]}
                    />
                    <TextField
                      label="Penalty"
                      value={violation.penalty}
                      onChange={(v) => updateViolation(index, { penalty: v })}
                      error={errors[`violations.${index}.penalty`]}
                    />
                  </FieldGrid>
                </div>
              </RepeaterCard>
            ))
          : null}

        {values.hasViolations ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              set("violations", [...values.violations, { ...emptyViolation }])
            }
          >
            + Add another violation
          </Button>
        ) : null}
      </div>

      {/* -- License history -- */}
      <div className="space-y-5 border-t border-ink-200 pt-7">
        <YesNoField
          label="Has your license ever been suspended or revoked?"
          value={values.licenseEverSuspended}
          onChange={(v) => set("licenseEverSuspended", v)}
        />
        <YesNoField
          label="Have you ever been denied a license, permit or privilege to operate a motor vehicle?"
          value={values.licenseEverDenied}
          onChange={(v) => set("licenseEverDenied", v)}
        />
        {values.licenseEverSuspended || values.licenseEverDenied ? (
          <TextareaField
            label="Please explain"
            required
            value={values.recordExplanation}
            onChange={(v) => set("recordExplanation", v)}
            error={err("recordExplanation")}
            maxLength={2000}
          />
        ) : null}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function SignStep({
  values,
  set,
  err,
}: {
  values: FormValues;
  set: SetFn;
  err: ErrFn;
}) {
  const fullName = `${values.firstName} ${values.lastName}`.trim();

  return (
    <>
      <div className="rounded-xl bg-ink-50 p-5 ring-1 ring-ink-200">
        <h3 className="font-semibold text-ink-900">Summary</h3>
        <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <SummaryRow label="Name" value={fullName || "—"} />
          <SummaryRow label="Email" value={values.email || "—"} />
          <SummaryRow label="Phone" value={values.phone || "—"} />
          <SummaryRow
            label="CDL"
            value={
              values.cdlNumber
                ? `${values.cdlNumber} (${values.cdlState})`
                : "—"
            }
          />
          <SummaryRow
            label="CDL-A experience"
            value={`${values.monthsCdlExperience || 0} months`}
          />
          <SummaryRow
            label="OTR experience"
            value={`${values.monthsOtrExperience || 0} months`}
          />
          <SummaryRow
            label="Addresses listed"
            value={String(values.addressHistory.length)}
          />
          <SummaryRow
            label="Employers listed"
            value={String(values.employmentHistory.length)}
          />
        </dl>
      </div>

      <SelectField
        label="How did you hear about us?"
        options={REFERRAL_SOURCES}
        value={values.referralSource}
        onChange={(v) => set("referralSource", v)}
        error={err("referralSource")}
      />

      <TextareaField
        label="Anything else we should know?"
        value={values.notes}
        onChange={(v) => set("notes", v)}
        error={err("notes")}
        maxLength={2000}
        rows={4}
      />

      <div className="space-y-4 rounded-xl bg-ink-50 p-5 ring-1 ring-ink-200">
        <CheckboxField
          label="I certify that the information in this application is true and complete to the best of my knowledge. I understand that false or misleading information may disqualify me from consideration or result in termination."
          checked={values.certifiesAccurate}
          onChange={(v) => set("certifiesAccurate", v)}
          error={err("certifiesAccurate")}
        />
        <CheckboxField
          label={`I authorize ${siteConfig.name} to verify the information in this application, including contacting previous employers and obtaining my motor vehicle record and DOT employment history.`}
          checked={values.consentsToBackgroundCheck}
          onChange={(v) => set("consentsToBackgroundCheck", v)}
          error={err("consentsToBackgroundCheck")}
        />
        <CheckboxField
          label="I consent to a query of the FMCSA Drug & Alcohol Clearinghouse as required by 49 CFR Part 382, Subpart G."
          checked={values.consentsToFmcsaQuery}
          onChange={(v) => set("consentsToFmcsaQuery", v)}
          error={err("consentsToFmcsaQuery")}
        />
      </div>

      <TextField
        label="Electronic signature"
        required
        value={values.signature}
        onChange={(v) => set("signature", v)}
        error={err("signature")}
        hint={
          fullName
            ? `Type your full legal name exactly as: ${fullName}`
            : "Type your full legal name."
        }
        autoComplete="off"
      />
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-900 break-words">{value}</dd>
    </div>
  );
}
