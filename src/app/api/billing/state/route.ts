import { NextResponse } from "next/server";
import type { BillingCycle, BillingState, PlanId } from "@/lib/billing";
import { getDefaultBillingState } from "@/lib/billing";

type BillingStore = {
  state: BillingState;
};

declare global {
  var __smartstockBillingStore: BillingStore | undefined;
}

function getStore(): BillingStore {
  if (!globalThis.__smartstockBillingStore) {
    globalThis.__smartstockBillingStore = {
      state: getDefaultBillingState(),
    };
  }

  return globalThis.__smartstockBillingStore;
}

function isPlanId(value: unknown): value is PlanId {
  return value === "starter" || value === "growth" || value === "advanced" || value === "enterprise";
}

function isBillingCycle(value: unknown): value is BillingCycle {
  return value === "monthly" || value === "yearly";
}

export async function GET() {
  const store = getStore();
  return NextResponse.json(store.state);
}

export async function POST(request: Request) {
  const store = getStore();
  const payload = (await request.json()) as Partial<BillingState>;

  const next: BillingState = {
    planId: isPlanId(payload.planId) ? payload.planId : store.state.planId,
    trialStartedAt:
      typeof payload.trialStartedAt === "string" && payload.trialStartedAt.length > 0
        ? payload.trialStartedAt
        : store.state.trialStartedAt,
    billingCycle: isBillingCycle(payload.billingCycle) ? payload.billingCycle : store.state.billingCycle,
    cancelAtPeriodEnd:
      typeof payload.cancelAtPeriodEnd === "boolean" ? payload.cancelAtPeriodEnd : store.state.cancelAtPeriodEnd,
    cancellationRequestedAt:
      payload.cancellationRequestedAt === null || typeof payload.cancellationRequestedAt === "string"
        ? payload.cancellationRequestedAt
        : store.state.cancellationRequestedAt,
  };

  store.state = next;
  return NextResponse.json(next);
}
