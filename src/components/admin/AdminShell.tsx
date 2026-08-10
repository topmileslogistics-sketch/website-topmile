import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { siteConfig } from "@/config/site";

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-baseline gap-3">
            <Link href="/admin" className="font-bold text-ink-900">
              {siteConfig.name}
            </Link>
            <span className="text-sm text-ink-500">Recruiting dashboard</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-ink-500 sm:inline">{email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </>
  );
}
