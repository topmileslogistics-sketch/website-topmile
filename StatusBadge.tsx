import { cx } from "@/components/ui";

const styles: Record<string, string> = {
  NEW: "bg-brand-100 text-brand-900 ring-brand-300",
  REVIEWING: "bg-blue-100 text-blue-900 ring-blue-300",
  CONTACTED: "bg-violet-100 text-violet-900 ring-violet-300",
  HIRED: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  NOT_A_FIT: "bg-red-100 text-red-900 ring-red-300",
  ARCHIVED: "bg-ink-100 text-ink-700 ring-ink-300",
};

export const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  REVIEWING: "Reviewing",
  CONTACTED: "Contacted",
  HIRED: "Hired",
  NOT_A_FIT: "Not a fit",
  ARCHIVED: "Archived",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        styles[status] ?? styles.ARCHIVED,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
