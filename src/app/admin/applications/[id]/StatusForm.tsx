"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateApplication, type UpdateState } from "./actions";
import { APPLICATION_STATUSES } from "@/lib/validation";
import { STATUS_LABELS } from "@/components/admin/StatusBadge";
import { Alert } from "@/components/ui";

export function StatusForm({
  id,
  status,
  adminNotes,
}: {
  id: string;
  status: string;
  adminNotes: string;
}) {
  const [state, formAction] = useActionState<UpdateState, FormData>(
    updateApplication,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={id} />

      {state ? (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      ) : null}

      <div>
        <label
          htmlFor="status"
          className="block text-sm font-semibold text-ink-800"
        >
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="mt-1.5 block w-full rounded-lg border-0 px-3 py-2.5 text-ink-900 ring-1 ring-inset ring-ink-300 focus:ring-2 focus:ring-inset focus:ring-brand-600"
        >
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="adminNotes"
          className="block text-sm font-semibold text-ink-800"
        >
          Internal notes
        </label>
        <p className="mt-1 text-sm text-ink-500">
          Only visible to recruiting staff. Never shown to the applicant.
        </p>
        <textarea
          id="adminNotes"
          name="adminNotes"
          rows={6}
          maxLength={5000}
          defaultValue={adminNotes}
          className="mt-1.5 block w-full rounded-lg border-0 px-3 py-2.5 text-ink-900 ring-1 ring-inset ring-ink-300 focus:ring-2 focus:ring-inset focus:ring-brand-600"
        />
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 w-full rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}
