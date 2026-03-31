"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import {
  BILLING_CHANGED_EVENT,
  canAccessPlan,
  getPlanById,
  getTrialDaysLeft,
  readBillingState,
  routeMinimumPlan,
} from "@/lib/billing";

type SmartStockShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function SmartStockShell({ title, subtitle, children }: SmartStockShellProps) {
  const pathname = usePathname();
  const [billingState, setBillingState] = useState(() => readBillingState());

  useEffect(() => {
    const refresh = () => setBillingState(readBillingState());
    window.addEventListener(BILLING_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(BILLING_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const currentPlan = getPlanById(billingState.planId);
  const trialDaysLeft = getTrialDaysLeft(billingState);

  const requiredPlan = useMemo(() => {
    const direct = routeMinimumPlan[pathname];
    if (direct) return direct;

    const match = Object.entries(routeMinimumPlan).find(([route]) => pathname.startsWith(`${route}/`));
    return match?.[1] ?? "starter";
  }, [pathname]);

  const isAllowed = canAccessPlan(billingState, requiredPlan);
  const requiredPlanName = getPlanById(requiredPlan).name;

  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-30 shadow-sm">
        <div className="border-b border-[#2f2418]">
          <Navbar />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">SmartStock</p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <p className="rounded-full border border-border/70 bg-muted/20 px-3 py-1 text-xs font-medium text-muted-foreground">
              Real-time inventory workspace
            </p>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Plan: <span className="font-semibold text-foreground">{currentPlan.name}</span>
            {trialDaysLeft > 0 ? ` · Trial ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left` : " · Trial ended"}
          </p>
        </section>

        {isAllowed ? (
          children
        ) : (
          <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Feature locked for current plan</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This page requires <span className="font-semibold text-foreground">{requiredPlanName}</span> or higher.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Upgrade your plan to unlock this feature.
            </p>
            <Link
              href="/billing"
              className="mt-3 inline-flex rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              View billing plans
            </Link>
          </article>
        )}
      </main>
    </div>
  );
}