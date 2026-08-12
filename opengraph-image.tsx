"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { ButtonLink, Container, PhoneIcon, cx } from "./ui";

const navigation = [
  { href: "/#the-job", label: "The Job" },
  { href: "/#requirements", label: "Requirements" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#faq", label: "FAQ" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape — expected behaviour for a disclosure menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4 sm:h-20">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2.5"
            aria-label={`${siteConfig.name} — home`}
          >
            {/*
              The emblem only — the full artwork's wordmark reads "TOP MILE"
              (singular), which contradicts the company name used everywhere
              else on the site. The text beside it supplies the correct name.
            */}
            <Image
              src="/logo-emblem.png"
              alt=""
              width={280}
              height={144}
              priority
              className="h-9 w-auto sm:h-10"
            />
            <span className="text-base font-bold leading-tight text-ink-900 sm:text-lg">
              Top Miles
              <span className="block text-[0.7em] font-semibold uppercase tracking-widest text-brand-700">
                Logistics
              </span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={siteConfig.phoneHref}
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-100 sm:inline-flex"
            >
              <PhoneIcon className="text-brand-600" />
              <span>{siteConfig.phoneDisplay}</span>
            </a>
            {/* Primary CTA: kept at a 44px minimum height even on the
                smallest phone, per the WCAG 2.5.5 target-size guidance. */}
            <ButtonLink
              href="/apply"
              size="sm"
              className="min-h-11 px-4 sm:px-5"
            >
              Apply Now
            </ButtonLink>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="-mr-1 inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">
                {open ? "Close main menu" : "Open main menu"}
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                aria-hidden="true"
                className="h-6 w-6"
              >
                {open ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </Container>

      <div
        id="mobile-menu"
        hidden={!open}
        className={cx("border-t border-ink-200 bg-white lg:hidden")}
      >
        <Container>
          <nav aria-label="Mobile" className="py-3">
            <ul className="flex flex-col">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-lg px-3 py-3 text-base font-medium text-ink-800 hover:bg-ink-100"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={siteConfig.phoneHref}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-semibold text-ink-800 hover:bg-ink-100"
                >
                  <PhoneIcon className="text-brand-600" />
                  Call {siteConfig.phoneDisplay}
                </a>
              </li>
            </ul>
          </nav>
        </Container>
      </div>
    </header>
  );
}
