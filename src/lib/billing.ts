export type PlanId = "starter" | "growth" | "advanced" | "enterprise";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  monthlyPriceLabel: string;
  monthlyPriceUsd: number | null;
  yearlyPriceUsd: number | null;
  targetCustomer: string;
  features: string[];
};

export type BillingCycle = "monthly" | "yearly";

export type BillingState = {
  planId: PlanId;
  trialStartedAt: string;
  billingCycle: BillingCycle;
  cancelAtPeriodEnd: boolean;
  cancellationRequestedAt: string | null;
};

export type PaymentMethodType = "card" | "bank_transfer" | "mobile_wallet";

export type PaymentMethod = {
  type: PaymentMethodType;
  label: string;
  last4?: string;
  updatedAt: string;
};

const BILLING_STATE_API = "/api/billing/state";
const BILLING_PAYMENT_METHOD_API = "/api/billing/payment-method";

// Module-level cache — avoids repeated JSON.parse on every call within the same tab.
// Cross-tab writes invalidate via the native "storage" event.
let _billingCache: BillingState | null = null;
let _paymentCache: PaymentMethod | null | undefined = undefined; // undefined = not yet loaded

let _billingListenerAttached = false;
function ensureBillingListener() {
  if (_billingListenerAttached || typeof window === "undefined") return;
  _billingListenerAttached = true;
  window.addEventListener("storage", (e) => {
    if (e.key === BILLING_STATE_KEY) _billingCache = null;
    if (e.key === PAYMENT_METHOD_KEY) _paymentCache = undefined;
  });
}

export const BILLING_STATE_KEY = "smartstock.billing.state.v1";
export const PAYMENT_METHOD_KEY = "smartstock.billing.payment-method.v1";
export const BILLING_CHANGED_EVENT = "smartstock:billing-changed";
export const FREE_TRIAL_DAYS = 30;

const PLAN_ORDER: Record<PlanId, number> = {
  starter: 1,
  growth: 2,
  advanced: 3,
  enterprise: 4,
};

export const plans: PlanDefinition[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPriceLabel: "$15/month",
    monthlyPriceUsd: 15,
    yearlyPriceUsd: 144,
    targetCustomer: "Micro SMEs (50–100 SKUs)",
    features: [
      "Basic AI demand forecasting (30-day forecast)",
      "Stockout alerts",
      "Email notifications",
      "1 sales channel integration",
      "Simple dashboard",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPriceLabel: "$25/month",
    monthlyPriceUsd: 25,
    yearlyPriceUsd: 240,
    targetCustomer: "Growing SMEs (100–300 SKUs)",
    features: [
      "Advanced AI forecasting (seasonality-aware)",
      "Smart reorder recommendations",
      "Multi-channel sync (up to 3 platforms)",
      "Real-time alerts (Email + Telegram)",
      "Sales trend analytics",
      "Basic supplier tracking",
    ],
  },
  {
    id: "advanced",
    name: "Advanced",
    monthlyPriceLabel: "$40/month",
    monthlyPriceUsd: 40,
    yearlyPriceUsd: 384,
    targetCustomer: "Mini-marts & established SMEs",
    features: [
      "Unlimited SKUs",
      "AI reorder quantity optimization",
      "Supplier lead-time modeling",
      "Promotion demand simulation",
      "Advanced analytics dashboard",
      "Priority support",
      "Multi-location support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPriceLabel: "Custom pricing",
    monthlyPriceUsd: null,
    yearlyPriceUsd: null,
    targetCustomer: "Multi-branch retailers / marts",
    features: [
      "Custom AI models",
      "API integration for POS providers",
      "Dedicated onboarding",
      "SLA support",
      "Data export & reporting tools",
      "White-label options",
    ],
  },
];

export const routeMinimumPlan: Record<string, PlanId> = {
  "/dashboard": "starter",
  "/inventory": "starter",
  "/alerts": "starter",
  "/forecast": "starter",
  "/reorder-queue": "growth",
  "/sync": "growth",
  "/sales": "growth",
  "/suppliers": "growth",
  "/delivery": "advanced",
  "/reports": "enterprise",
  "/billing": "starter",
};

export function getDefaultBillingState(): BillingState {
  return {
    planId: "starter",
    trialStartedAt: new Date().toISOString(),
    billingCycle: "monthly",
    cancelAtPeriodEnd: false,
    cancellationRequestedAt: null,
  };
}

export function readBillingState(): BillingState {
  if (typeof window === "undefined") return getDefaultBillingState();

  ensureBillingListener();
  if (_billingCache !== null) return _billingCache;

  try {
    const raw = window.localStorage.getItem(BILLING_STATE_KEY);
    if (!raw) {
      _billingCache = getDefaultBillingState();
      return _billingCache;
    }

    const parsed = JSON.parse(raw) as Partial<BillingState>;
    const planId = parsed.planId && PLAN_ORDER[parsed.planId] ? parsed.planId : "starter";
    const trialStartedAt = parsed.trialStartedAt || getDefaultBillingState().trialStartedAt;
    const billingCycle: BillingCycle = parsed.billingCycle === "yearly" ? "yearly" : "monthly";
    const cancelAtPeriodEnd = Boolean(parsed.cancelAtPeriodEnd);
    const cancellationRequestedAt =
      typeof parsed.cancellationRequestedAt === "string" ? parsed.cancellationRequestedAt : null;

    _billingCache = { planId, trialStartedAt, billingCycle, cancelAtPeriodEnd, cancellationRequestedAt };
    return _billingCache;
  } catch {
    return getDefaultBillingState();
  }
}

export function writeBillingState(next: Partial<BillingState>) {
  if (typeof window === "undefined") return;

  const current = readBillingState();
  const merged: BillingState = {
    planId: next.planId ?? current.planId,
    trialStartedAt: next.trialStartedAt ?? current.trialStartedAt,
    billingCycle: next.billingCycle ?? current.billingCycle,
    cancelAtPeriodEnd: next.cancelAtPeriodEnd ?? current.cancelAtPeriodEnd,
    cancellationRequestedAt:
      next.cancellationRequestedAt === undefined
        ? current.cancellationRequestedAt
        : next.cancellationRequestedAt,
  };

  _billingCache = merged;
  window.localStorage.setItem(BILLING_STATE_KEY, JSON.stringify(merged));
  window.dispatchEvent(new CustomEvent(BILLING_CHANGED_EVENT));
}

export function getTrialDaysLeft(state: BillingState) {
  const startedAtMs = new Date(state.trialStartedAt).getTime();
  const elapsedMs = Math.max(0, Date.now() - startedAtMs);
  const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
  return Math.max(0, FREE_TRIAL_DAYS - elapsedDays);
}

export function isTrialActive(state: BillingState) {
  return getTrialDaysLeft(state) > 0;
}

export function canAccessPlan(state: BillingState, requiredPlan: PlanId) {
  if (isTrialActive(state)) return true;
  return PLAN_ORDER[state.planId] >= PLAN_ORDER[requiredPlan];
}

export function getPlanById(planId: PlanId) {
  return plans.find((plan) => plan.id === planId) ?? plans[0];
}

export function formatPlanPrice(price: number | null, cycle: BillingCycle) {
  if (price === null) return "Custom";
  return cycle === "monthly" ? `$${price}/month` : `$${price}/year`;
}

export function getPlanPrice(plan: PlanDefinition, cycle: BillingCycle) {
  return cycle === "monthly" ? plan.monthlyPriceUsd : plan.yearlyPriceUsd;
}

export function getPlanSavingsPercent(plan: PlanDefinition) {
  if (plan.monthlyPriceUsd === null || plan.yearlyPriceUsd === null) return 0;
  const monthlyYearCost = plan.monthlyPriceUsd * 12;
  if (monthlyYearCost <= 0) return 0;
  return Math.max(0, Math.round(((monthlyYearCost - plan.yearlyPriceUsd) / monthlyYearCost) * 100));
}

export function readPaymentMethod(): PaymentMethod | null {
  if (typeof window === "undefined") return null;

  ensureBillingListener();
  if (_paymentCache !== undefined) return _paymentCache;

  try {
    const raw = window.localStorage.getItem(PAYMENT_METHOD_KEY);
    if (!raw) { _paymentCache = null; return null; }

    const parsed = JSON.parse(raw) as Partial<PaymentMethod>;
    if (!parsed.type || !parsed.label || !parsed.updatedAt) { _paymentCache = null; return null; }
    if (!["card", "bank_transfer", "mobile_wallet"].includes(parsed.type)) { _paymentCache = null; return null; }

    _paymentCache = {
      type: parsed.type as PaymentMethodType,
      label: parsed.label,
      last4: parsed.last4,
      updatedAt: parsed.updatedAt,
    };
    return _paymentCache;
  } catch {
    return null;
  }
}

export function writePaymentMethod(method: PaymentMethod) {
  if (typeof window === "undefined") return;
  _paymentCache = method;
  window.localStorage.setItem(PAYMENT_METHOD_KEY, JSON.stringify(method));
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Billing API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function readBillingStateRemote() {
  if (typeof window === "undefined") {
    return getDefaultBillingState();
  }

  try {
    const remote = await requestJson<BillingState>(BILLING_STATE_API, { method: "GET" });
    writeBillingState(remote);
    return readBillingState();
  } catch {
    return readBillingState();
  }
}

export async function writeBillingStateRemote(next: Partial<BillingState>) {
  if (typeof window === "undefined") {
    return getDefaultBillingState();
  }

  try {
    const remote = await requestJson<BillingState>(BILLING_STATE_API, {
      method: "POST",
      body: JSON.stringify(next),
    });
    writeBillingState(remote);
    return readBillingState();
  } catch {
    writeBillingState(next);
    return readBillingState();
  }
}

export async function readPaymentMethodRemote() {
  if (typeof window === "undefined") return null;

  try {
    const remote = await requestJson<PaymentMethod | null>(BILLING_PAYMENT_METHOD_API, { method: "GET" });
    if (remote) {
      writePaymentMethod(remote);
      return readPaymentMethod();
    }
    return null;
  } catch {
    return readPaymentMethod();
  }
}

export async function writePaymentMethodRemote(method: PaymentMethod) {
  if (typeof window === "undefined") return null;

  try {
    const remote = await requestJson<PaymentMethod>(BILLING_PAYMENT_METHOD_API, {
      method: "POST",
      body: JSON.stringify(method),
    });
    writePaymentMethod(remote);
    return readPaymentMethod();
  } catch {
    writePaymentMethod(method);
    return readPaymentMethod();
  }
}