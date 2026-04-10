"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { useToast } from "@/components/ui/toast-provider";

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showToast({ title: "Invalid email", description: "Please enter a valid email address.", source: "Auth", severity: "warning" });
      return;
    }

    showToast({
      title: "Reset link sent",
      description: `If ${email.trim()} exists, a reset link is on the way.`,
      source: "Auth",
      severity: "info",
    });
    setEmail("");
  };

  return (
    <PublicPageShell title="Forgot Password" subtitle="Request a password reset link to regain access.">
      <section className="mx-auto max-w-xl rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <form className="grid gap-3" onSubmit={onSubmit}>
          <label className="grid gap-1 text-sm text-muted-foreground">
            Account email
            <input
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@business.com"
              required
            />
          </label>

          <button type="submit" className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Send reset link
          </button>

          <p className="text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </section>
    </PublicPageShell>
  );
}
