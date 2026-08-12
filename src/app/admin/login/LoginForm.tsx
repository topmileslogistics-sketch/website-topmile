"use client";

import { useState } from "react";
import { Alert, Button } from "@/components/ui";
import { TextField } from "@/components/form/Fields";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;

    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // A full page load, not router.replace() + router.refresh().
        //
        // Those two race: refresh() can abort the pending replace and leave the
        // user staring at the login form after a successful sign-in. A hard
        // navigation also guarantees middleware re-runs with the new cookie and
        // that no stale unauthenticated RSC payload is reused.
        window.location.assign(next);
        return;
      }

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setError(data.error ?? "Invalid email or password.");
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <TextField
        label="Email"
        type="email"
        required
        autoComplete="username"
        value={email}
        onChange={setEmail}
      />
      <TextField
        label="Password"
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
      />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
