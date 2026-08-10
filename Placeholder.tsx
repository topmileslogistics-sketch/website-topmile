import { isPlaceholder } from "@/config/site";

/**
 * Renders an unconfirmed value so it is impossible to miss before launch.
 *
 * Top Miles Logistics did not supply an office address, company email, or
 * MC/DOT number. Rather than invent them, the site shows the placeholder in a
 * dashed outline — obvious to anyone reviewing the staging site, and a clear
 * signal that the value in `src/config/site.ts` still needs filling in.
 */
export function Placeholder({ value }: { value: string }) {
  return (
    <span
      className="rounded border border-dashed border-current px-1.5 py-0.5 font-mono text-[0.85em] opacity-80"
      title="Placeholder — replace this value in src/config/site.ts before launch"
    >
      {value}
    </span>
  );
}

/**
 * Renders `value` normally, or as a flagged placeholder when it has not been
 * filled in yet.
 */
export function MaybePlaceholder({ value }: { value: string }) {
  return isPlaceholder(value) ? <Placeholder value={value} /> : <>{value}</>;
}
