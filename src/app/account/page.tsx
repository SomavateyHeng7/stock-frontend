"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SmartStockShell } from "@/components/smartstock-shell";
import { useToast } from "@/components/ui/toast-provider";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { getUserInitials, readAuthUser, signOut, type AuthUser } from "@/lib/auth";
import { formatDateOnly } from "@/lib/user-preferences";

export default function AccountPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const preferences = useUserPreferences();
  const [user] = useState<AuthUser | null>(() => readAuthUser());

  const handleSignOut = () => {
    signOut();
    showToast({ title: "Signed out", description: "You have been signed out of SmartStock.", source: "Auth", severity: "info" });
    router.push("/login");
  };

  if (!user) {
    return (
      <SmartStockShell title="Account" subtitle="Manage your SmartStock account profile.">
        <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">You are not signed in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to view account details and security settings.</p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Go to sign in
          </button>
        </article>
      </SmartStockShell>
    );
  }

  return (
    <SmartStockShell title="Account" subtitle="Manage your identity and session preferences.">
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          <dl className="mt-3 grid gap-3 text-sm">
            <div className="grid gap-1 rounded-lg border border-border/70 bg-background/60 p-3">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Full Name</dt>
              <dd className="font-medium text-foreground">{user.fullName}</dd>
            </div>
            <div className="grid gap-1 rounded-lg border border-border/70 bg-background/60 p-3">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Email</dt>
              <dd className="font-medium text-foreground">{user.email}</dd>
            </div>
            <div className="grid gap-1 rounded-lg border border-border/70 bg-background/60 p-3">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Role</dt>
              <dd className="font-medium text-foreground">{user.role}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Session</h2>
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-border/70 bg-background/60 p-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-foreground">
              {getUserInitials(user.fullName)}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Current session</p>
              <p className="text-xs text-muted-foreground">Created {formatDateOnly(user.createdAt, preferences)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-4 w-full rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive"
          >
            Sign out
          </button>
        </article>
      </div>
    </SmartStockShell>
  );
}
