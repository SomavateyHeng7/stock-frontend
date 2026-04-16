"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { useToast } from "@/components/ui/toast-provider";
import { signInWithEmail } from "@/lib/auth";

export default function SignUpPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (fullName.trim().length < 2) {
      showToast({ title: "Name required", description: "Please enter your full name.", source: "Auth", severity: "warning" });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showToast({ title: "Invalid email", description: "Please enter a valid email address.", source: "Auth", severity: "warning" });
      return;
    }

    if (password.trim().length < 8) {
      showToast({ title: "Weak password", description: "Password must be at least 8 characters.", source: "Auth", severity: "warning" });
      return;
    }

    const user = signInWithEmail(email, fullName);
    showToast({ title: "Account created", description: `Welcome to SmartStock, ${user.fullName}.`, source: "Auth", severity: "info" });
    router.push("/onboarding");
  };

  return (
    <PublicPageShell title="Create Account" subtitle="Start your free SmartStock account in under a minute.">
      <section className="mx-auto max-w-xl rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <form className="grid gap-3" onSubmit={onSubmit}>
          <label className="grid gap-1 text-sm text-muted-foreground">
            Full Name
            <input
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Sokha Chan"
              required
            />
          </label>

          <label className="grid gap-1 text-sm text-muted-foreground">
            Work Email
            <input
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@business.com"
              required
            />
          </label>

          <label className="grid gap-1 text-sm text-muted-foreground">
            Password
            <input
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </label>

          <button type="submit" className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Create account
          </button>

          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </section>
    </PublicPageShell>
  );
}
