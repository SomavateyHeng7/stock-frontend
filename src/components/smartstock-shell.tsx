"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import {
    BILLING_CHANGED_EVENT,
    canAccessPlan,
    getDefaultBillingState,
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
    const [billingState, setBillingState] = useState(() => getDefaultBillingState());

    useEffect(() => {
        const refresh = () => setBillingState(readBillingState());
        refresh();
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
        <div className="min-h-screen w-full bg-background">
            {/* Sticky top bar */}
            <header className="sticky top-0 z-30 border-b border-border bg-white/95 shadow-sm backdrop-blur-sm dark:bg-slate-900/95">
                <Navbar />
            </header>

            <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
                {/* Page heading card */}
                <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                        SmartStock
                    </p>
                    <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
                        </div>
                        <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              Real-time workspace
            </span>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                        Plan:{" "}
                        <span className="font-semibold text-foreground">{currentPlan.name}</span>
                        {trialDaysLeft > 0
                            ? ` · Trial ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`
                            : " · Trial ended"}
                    </p>
                </section>

                {isAllowed ? (
                    children
                ) : (
                    <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="mt-0.5 rounded-lg bg-amber-50 p-2.5 dark:bg-amber-950/40">
                                <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-foreground">Feature locked</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    This page requires the{" "}
                                    <span className="font-semibold text-foreground">{requiredPlanName}</span> plan or higher.
                                </p>
                                <Link
                                    href="/billing"
                                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                                >
                                    View billing plans
                                </Link>
                            </div>
                        </div>
                    </article>
                )}
            </main>
        </div>
    );
}