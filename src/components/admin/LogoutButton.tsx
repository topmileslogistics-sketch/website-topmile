"use client";

import { useState } from "react";

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } finally {
          // Hard navigation on purpose: it drops every cached RSC payload
          // containing applicant data, which a client-side route change would
          // leave sitting in the router cache after sign-out.
          window.location.assign("/admin/login");
        }
      }}
      className="rounded-lg px-3 py-2 font-semibold text-ink-700 ring-1 ring-inset ring-ink-300 hover:bg-ink-50 disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
