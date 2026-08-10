import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { MaybePlaceholder } from "@/components/Placeholder";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Top Miles Logistics collects, uses and protects the information submitted through the driver application.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <Container className="py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-ink-500">
          Applies to {siteConfig.url.replace(/^https?:\/\//, "")}
        </p>

        <div className="mt-10 space-y-8 leading-relaxed text-ink-700">
          <section>
            <h2 className="text-xl font-bold text-ink-900">
              What we collect
            </h2>
            <p className="mt-3">
              When you submit a driver application we collect the information
              you enter on the form: your name, contact details, date of birth,
              address history, CDL information, employment history, driving
              record answers and your electronic signature. We also record the
              date and time of submission, your browser&apos;s user agent, and a
              one-way cryptographic hash of your IP address.
            </p>
            <p className="mt-3">
              We do not store your raw IP address. The hash is used only to
              limit automated submissions and to investigate abuse.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900">
              How we use it
            </h2>
            <p className="mt-3">
              Application information is used to evaluate your candidacy for the
              OTR CDL-A driver position, to contact you about your application,
              and to carry out the verification steps required for CDL
              positions, including contacting previous employers and obtaining
              your motor vehicle record and DOT employment history where you
              have authorized us to do so.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900">
              Who can see it
            </h2>
            <p className="mt-3">
              Applications are never published and are not visible to other
              applicants or to the public. Access is limited to{" "}
              {siteConfig.name} recruiting staff through a password-protected
              dashboard. Information may be shared with third parties only where
              required to verify your application or where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900">
              How it is protected
            </h2>
            <p className="mt-3">
              The site is served over HTTPS, so information you submit is
              encrypted in transit. Applications are stored in an access-
              controlled database. The recruiting dashboard requires
              authentication, is excluded from search engines, and is never
              cached by shared caches.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900">Cookies</h2>
            <p className="mt-3">
              This site does not use advertising or analytics cookies. A single
              cookie is set only when a member of our recruiting staff signs in
              to the dashboard; it stores nothing about applicants and is
              required for that sign-in to work.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900">
              Access, correction and deletion
            </h2>
            <p className="mt-3">
              You can ask us for a copy of the information you submitted, ask us
              to correct it, or ask us to delete it. Call{" "}
              <a
                href={siteConfig.phoneHref}
                className="font-semibold text-brand-700 underline underline-offset-2"
              >
                {siteConfig.phoneDisplay}
              </a>{" "}
              or email <MaybePlaceholder value={siteConfig.email} />.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900">Contact</h2>
            <p className="mt-3">
              {siteConfig.name}
              <br />
              {siteConfig.locationLabel}
              <br />
              Phone:{" "}
              <a
                href={siteConfig.phoneHref}
                className="font-semibold text-brand-700 underline underline-offset-2"
              >
                {siteConfig.phoneDisplay}
              </a>
              <br />
              Email: <MaybePlaceholder value={siteConfig.email} />
              <br />
              Address: <MaybePlaceholder value={siteConfig.officeAddress} />
            </p>
          </section>
        </div>
      </div>
    </Container>
  );
}
