import Link from "next/link";
import { siteConfig } from "@/config/site";

/**
 * Rendered inside the root layout for any unmatched URL, so it must not
 * declare <html> or <body> of its own.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-ink-900 p-6 text-center">
      <div className="max-w-md">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
          404
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 text-ink-300">
          That page doesn&apos;t exist. If you were trying to apply, the
          application is right here.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/apply"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700"
          >
            Apply Now
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-3 font-semibold text-white ring-1 ring-inset ring-white/25 hover:bg-white/10"
          >
            Back to home
          </Link>
        </div>
        <p className="mt-8 text-sm text-ink-400">
          Or call {siteConfig.phoneDisplay}
        </p>
      </div>
    </div>
  );
}
