import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Recruiting Dashboard",
    template: "%s | Recruiting Dashboard",
  },
  // Belt and braces alongside robots.ts and the X-Robots-Tag header: the
  // dashboard shows applicant data and must never appear in search results.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh w-full bg-ink-50">{children}</div>;
}
