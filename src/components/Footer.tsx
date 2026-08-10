import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Container, PhoneIcon } from "./ui";
import { MaybePlaceholder } from "./Placeholder";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink-900 text-ink-200">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="text-lg font-bold text-white">{siteConfig.name}</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-300">
              Hiring {siteConfig.positionPlural} for Dry Van and Reefer freight.
              Based in {siteConfig.locationLabel}.
            </p>
            <a
              href={siteConfig.phoneHref}
              className="mt-5 inline-flex items-center gap-2 text-base font-semibold text-white hover:text-brand-300"
            >
              <PhoneIcon className="text-brand-400" />
              {siteConfig.phoneDisplay}
            </a>
          </div>

          <nav aria-labelledby="footer-nav-heading">
            <h2
              id="footer-nav-heading"
              className="text-sm font-semibold uppercase tracking-wider text-white"
            >
              Site
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-ink-300 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#the-job" className="text-ink-300 hover:text-white">
                  The Job
                </Link>
              </li>
              <li>
                <Link
                  href="/#requirements"
                  className="text-ink-300 hover:text-white"
                >
                  Requirements
                </Link>
              </li>
              <li>
                <Link href="/apply" className="text-ink-300 hover:text-white">
                  Driver Application
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-ink-300 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Contact
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-300">
              <li>
                <span className="block text-ink-400">Phone</span>
                <a
                  href={siteConfig.phoneHref}
                  className="hover:text-white"
                >
                  {siteConfig.phoneDisplay}
                </a>
              </li>
              <li>
                <span className="block text-ink-400">Email</span>
                <MaybePlaceholder value={siteConfig.email} />
              </li>
              <li>
                <span className="block text-ink-400">Office</span>
                <MaybePlaceholder value={siteConfig.officeAddress} />
              </li>
              <li>
                <span className="block text-ink-400">MC / DOT</span>
                <MaybePlaceholder value={siteConfig.mcNumber} />{" "}
                <MaybePlaceholder value={siteConfig.dotNumber} />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {siteConfig.legalName}. All rights reserved.
          </p>
          <p>All applicant information is kept confidential.</p>
        </div>
      </Container>
    </footer>
  );
}
