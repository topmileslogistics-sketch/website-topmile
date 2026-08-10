import type { Metadata } from "next";
import { ApplicationForm } from "@/components/form/ApplicationForm";
import { Container, PhoneIcon } from "@/components/ui";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Driver Application — OTR CDL-A Jobs",
  description:
    "Apply online for OTR CDL-A truck driver jobs with Top Miles Logistics. Dry Van and Reefer freight, 70–80 CPM based on experience, weekly direct deposit. Takes about 10–15 minutes.",
  alternates: { canonical: "/apply" },
  openGraph: {
    title: "Driver Application | Top Miles Logistics",
    description:
      "Apply online for OTR CDL-A truck driver jobs. Dry Van & Reefer, 70–80 CPM, weekly pay.",
    url: `${siteConfig.url}/apply`,
  },
  robots: { index: true, follow: true },
};

export default function ApplyPage() {
  return (
    <>
      <div className="bg-ink-900">
        <Container className="py-12 sm:py-16">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            CDL-A Driver Application
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-200">
            About 10–15 minutes. This is the full application required for a
            CDL-A position, so have your CDL, address history and employment
            history handy.
          </p>
          <a
            href={siteConfig.phoneHref}
            className="mt-6 inline-flex items-center gap-2 text-base font-semibold text-white hover:text-brand-300"
          >
            <PhoneIcon className="text-brand-400" />
            Questions? Call {siteConfig.phoneDisplay}
          </a>
        </Container>
      </div>

      <div className="bg-ink-50 py-10 sm:py-14">
        <Container className="max-w-4xl">
          <ApplicationForm />
        </Container>
      </div>
    </>
  );
}
