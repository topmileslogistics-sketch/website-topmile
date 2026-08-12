import type { Metadata } from "next";
import Image from "next/image";
import {
  jobDetails,
  jobHighlights,
  jobRequirements,
  sitePhotos,
  siteConfig,
} from "@/config/site";
import { faqs } from "@/content/faq";
import {
  ButtonLink,
  Card,
  CheckIcon,
  Container,
  PhoneIcon,
  Section,
  SectionHeading,
  StatCard,
  cx,
} from "@/components/ui";
import { FaqSchema, JobPostingSchema } from "@/components/StructuredData";

export const metadata: Metadata = {
  title: "OTR CDL-A Truck Driver Jobs in Ohio | Top Miles Logistics",
  description:
    "Top Miles Logistics is hiring OTR CDL-A drivers for Dry Van and Reefer freight. 70–80 CPM based on experience, 3,500–4,500 miles per week, weekly direct deposit. 3 months CDL-A experience required. Apply online.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <TheJob />
      <Photos />
      <Requirements />
      <HowItWorks />
      <Faq />
      <ClosingCta />

      <JobPostingSchema />
      <FaqSchema faqs={faqs} />
    </>
  );
}

/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <div className="relative overflow-hidden bg-ink-900">
      {/* Decorative background — hidden from assistive tech. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(70rem 40rem at 75% -10%, rgba(245,158,11,0.20), transparent 60%), radial-gradient(50rem 30rem at 0% 110%, rgba(115,135,165,0.25), transparent 60%)",
        }}
      />
      <Container className="relative py-16 sm:py-24 lg:py-28">
        <div className="max-w-3xl">
          <p className="inline-flex items-center rounded-full bg-brand-500/15 px-3 py-1 text-sm font-semibold text-brand-300 ring-1 ring-inset ring-brand-500/30">
            Now hiring · {siteConfig.locationLabel}
          </p>

          <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            OTR CDL-A Truck Driver Jobs
            <span className="block text-brand-400">Dry Van &amp; Reefer</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-200 sm:text-xl">
            {siteConfig.name} is hiring over-the-road CDL-A drivers.{" "}
            {siteConfig.payRangeNote} Paid weekly by direct deposit, with
            approximately {siteConfig.weeklyMiles}.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/apply" size="lg" className="w-full sm:w-auto">
              Apply Now
            </ButtonLink>
            
              href={siteConfig.phoneHref}
              className="inline-flex min-h-13 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-7 py-4 text-lg font-semibold text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/10 sm:w-auto"
            >
              <PhoneIcon className="text-brand-400" />
              Call {siteConfig.phoneDisplay}
            </a>
          </div>

          <p className="mt-4 text-sm text-ink-300">
            {siteConfig.employmentTypeNote} {siteConfig.sapPolicy}.
          </p>
        </div>

        <dl className="mt-12 grid grid-cols-2 gap-4 sm:mt-16 lg:grid-cols-4">
          {jobHighlights.map((item) => (
            <StatCard
              key={item.label}
              label={item.label}
              value={item.value}
              detail={item.detail}
            />
          ))}
        </dl>
      </Container>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function TheJob() {
  return (
    <Section id="the-job" tone="light">
      <SectionHeading
        eyebrow="The Position"
        title="What the job looks like"
        description="The details of our current OTR CDL-A opening, laid out in full."
      />

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {jobDetails.map((detail) => (
          <Card key={detail.title}>
            <h3 className="text-lg font-semibold text-ink-900">
              {detail.title}
            </h3>
            <p className="mt-2 leading-relaxed text-ink-600">{detail.body}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

function Photos() {
  // No photos configured yet — render nothing at all rather than empty boxes.
  if (sitePhotos.length === 0) return null;

  return (
    <Section tone="muted">
      <SectionHeading eyebrow="On the Road" title="The equipment you'll run" />
      {/*
        Columns follow the number of photos, so two images sit as a balanced
        pair rather than leaving a hole in a three-wide row.
      */}
      <ul
        className={cx(
          "mt-10 grid gap-5",
          sitePhotos.length === 1 && "mx-auto max-w-2xl",
          sitePhotos.length === 2 && "sm:grid-cols-2",
          sitePhotos.length >= 3 && "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {sitePhotos.map((photo) => (
          <li
            key={photo.src}
            className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink-200 ring-1 ring-ink-200"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              // Tells the browser how wide the image will actually be at each
              // breakpoint, so it downloads a suitably sized file instead of
              // the full-resolution original.
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

function Requirements() {
  return (
    <Section id="requirements" tone="muted">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="Requirements"
            title="What you need to qualify"
            description="If you meet these, you can complete the application today."
          />
          <div className="mt-8">
            <ButtonLink href="/apply" size="lg">
              Start Your Application
            </ButtonLink>
          </div>
        </div>

        <ul className="space-y-3">
          {jobRequirements.map((requirement) => (
            <li
              key={requirement}
              className="flex items-start gap-3 rounded-lg bg-white p-4 ring-1 ring-ink-200"
            >
              <CheckIcon className="mt-0.5 text-brand-600" />
              <span className="font-medium text-ink-800">{requirement}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

const steps = [
  {
    title: "Complete the application",
    body: "About 10–15 minutes online. It covers your CDL, 3 years of address history and 10 years of employment history — the information required for a CDL-A position.",
  },
  {
    title: "We review it",
    body: "Your application goes straight to our recruiting team. Nothing is published or shared publicly.",
  },
  {
    title: "We call you",
    body: `A recruiter follows up by phone to go over the details and answer your questions. You can also reach us any time at ${siteConfig.phoneDisplay}.`,
  },
] as const;

function HowItWorks() {
  return (
    <Section id="how-it-works" tone="light">
      <SectionHeading
        eyebrow="How It Works"
        title="Three steps to get rolling"
      />
      <ol className="mt-10 grid gap-6 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
              {index + 1}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-ink-900">
              {step.title}
            </h3>
            <p className="mt-2 leading-relaxed text-ink-600">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

function Faq() {
  return (
    <Section id="faq" tone="muted">
      <SectionHeading eyebrow="FAQ" title="Common questions" />
      <div className="mt-10 divide-y divide-ink-200 overflow-hidden rounded-xl bg-white ring-1 ring-ink-200">
        {faqs.map((faq) => (
          <details key={faq.question} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-ink-900 hover:bg-ink-50">
              <span>{faq.question}</span>
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-brand-600 transition-transform group-open:rotate-45"
              >
                <path d="M10 4v12M4 10h12" />
              </svg>
            </summary>
            <p className="px-5 pb-5 leading-relaxed text-ink-600">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

function ClosingCta() {
  return (
    <Section tone="dark">
      <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to run miles?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-200">
            Apply online in about 10–15 minutes, or call us and we&apos;ll walk
            you through it.
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row lg:w-auto">
          <ButtonLink href="/apply" size="lg" className="w-full sm:w-auto">
            Apply Now
          </ButtonLink>
          
            href={siteConfig.phoneHref}
            className="inline-flex min-h-13 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-7 py-4 text-lg font-semibold text-white ring-1 ring-inset ring-white/25 hover:bg-white/10 sm:w-auto"
          >
            <PhoneIcon className="text-brand-400" />
            {siteConfig.phoneDisplay}
          </a>
        </div>
      </div>
    </Section>
  );
}
