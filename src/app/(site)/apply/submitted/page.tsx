import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Container, PhoneIcon } from "@/components/ui";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Application Received",
  description:
    "Thanks for applying to Top Miles Logistics. Our recruiting team will review your application and follow up by phone.",
  // A confirmation page has no value in search results and can leak referrer
  // context, so keep it out of the index.
  robots: { index: false, follow: false },
};

export default async function SubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  // Show only a short, sanitised reference — never anything from the record.
  const reference = (params.ref ?? "").replace(/[^A-Z0-9]/gi, "").slice(0, 12);

  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-8 w-8 text-emerald-700"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
          Application received
        </h1>

        <p className="mt-4 text-lg leading-relaxed text-ink-600">
          Thanks for applying to {siteConfig.name}. Your application is with our
          recruiting team, and a recruiter will follow up by phone.
        </p>

        {reference ? (
          <p className="mt-6 inline-block rounded-lg bg-ink-100 px-4 py-3 text-sm text-ink-700">
            Your reference number:{" "}
            <span className="font-mono font-bold text-ink-900">
              {reference}
            </span>
          </p>
        ) : null}

        <div className="mt-10 rounded-xl bg-ink-50 p-6 text-left ring-1 ring-ink-200">
          <h2 className="font-semibold text-ink-900">What happens next</h2>
          <ol className="mt-3 space-y-2 text-ink-600">
            <li>1. Our recruiting team reviews your application.</li>
            <li>2. A recruiter calls you to go over the details.</li>
            <li>
              3. If you have questions before then, call us at{" "}
              <a
                href={siteConfig.phoneHref}
                className="font-semibold text-brand-700 underline underline-offset-2"
              >
                {siteConfig.phoneDisplay}
              </a>
              .
            </li>
          </ol>
        </div>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={siteConfig.phoneHref}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700"
          >
            <PhoneIcon />
            Call {siteConfig.phoneDisplay}
          </a>
          <ButtonLink href="/" variant="secondary">
            Back to home
          </ButtonLink>
        </div>

        <p className="mt-8 text-sm text-ink-500">
          Your information is kept confidential and is only used to evaluate
          your application. See our{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </Container>
  );
}
