import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  // Only ever accept a relative path inside the dashboard — an absolute URL
  // here would turn the login page into an open redirect.
  const next =
    params.next && /^\/admin(?:\/|$)/.test(params.next) && !params.next.startsWith("//")
      ? params.next
      : "/admin";

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            {siteConfig.name}
          </h1>
          <p className="mt-1 text-sm text-ink-500">Recruiting dashboard</p>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-200">
          <LoginForm next={next} />
        </div>

        <p className="mt-6 text-center text-xs text-ink-500">
          Authorized staff only. All access is logged.
        </p>
      </div>
    </div>
  );
}
