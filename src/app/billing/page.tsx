"use client";

import { useEffect, useMemo, useState } from "react";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { SmartStockShell } from "@/components/smartstock-shell";
import { ErrorState, HelpHint, LoadingState } from "@/components/ui/data-state";
import { useToast } from "@/components/ui/toast-provider";
import {
  getPlanById,
  getPlanPrice,
  getPlanSavingsPercent,
  getTrialDaysLeft,
  plans,
  readBillingStateRemote,
  readPaymentMethodRemote,
  type BillingState,
  type BillingCycle,
  type PaymentMethodType,
  writeBillingStateRemote,
  writePaymentMethodRemote,
  type PlanId,
} from "@/lib/billing";
import { formatCurrencyAmount, formatDateTime } from "@/lib/user-preferences";
import {
  AlertCircle,
  ArrowRight,
  Building,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Shield,
  Smartphone,
  X,
} from "lucide-react";

type ProrationPreview = {
  type: "charge" | "credit" | "none" | "unavailable";
  amount: number;
  message: string;
};

export default function BillingPage() {
  const { showToast } = useToast();
  const preferences = useUserPreferences();
  const [billingState, setBillingState] = useState<BillingState>(() => ({
    planId: "starter" as PlanId,
    trialStartedAt: new Date().toISOString(),
    billingCycle: "monthly" as BillingCycle,
    cancelAtPeriodEnd: false,
    cancellationRequestedAt: null,
  }));
  const [paymentMethod, setPaymentMethod] = useState<Awaited<ReturnType<typeof readPaymentMethodRemote>>>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [planModalTarget, setPlanModalTarget] = useState<PlanId | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);

  const [paymentType, setPaymentType] = useState<PaymentMethodType>("card");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [walletProvider, setWalletProvider] = useState("");
  const [walletNumber, setWalletNumber] = useState("");

  const hydrateBilling = async () => {
    setIsHydrating(true);
    try {
      const [nextBillingState, nextPaymentMethod] = await Promise.all([
        readBillingStateRemote(),
        readPaymentMethodRemote(),
      ]);
      setBillingState(nextBillingState);
      setPaymentMethod(nextPaymentMethod);
      setLoadError(null);
    } catch {
      setLoadError("We couldn't load your billing profile. Please retry.");
    } finally {
      setIsHydrating(false);
    }
  };

  useEffect(() => {
    void hydrateBilling();
  }, []);

  const trialDaysLeft = getTrialDaysLeft(billingState);
  const trialActive = trialDaysLeft > 0;
  const trialProgress = trialActive ? ((30 - trialDaysLeft) / 30) * 100 : 100;
  const currentPlan = getPlanById(billingState.planId);
  const planModalNext = planModalTarget ? getPlanById(planModalTarget) : null;

  const planRank = (planId: PlanId) => plans.findIndex((item) => item.id === planId);
  const changeDirection = useMemo(() => {
    if (!planModalTarget) return "";
    const current = planRank(billingState.planId);
    const next = planRank(planModalTarget);
    if (next > current) return "upgrade";
    if (next < current) return "downgrade";
    return "change";
  }, [billingState.planId, planModalTarget]);

  const prorationPreview = useMemo<ProrationPreview>(() => {
    if (!planModalTarget) {
      return {
        type: "none",
        amount: 0,
        message: "No pending plan change.",
      };
    }

    if (trialActive) {
      return {
        type: "none",
        amount: 0,
        message: "No proration during trial. Plan change will apply immediately and billing starts after trial.",
      };
    }

    const currentAmount = getPlanPrice(currentPlan, billingState.billingCycle);
    const targetAmount = getPlanPrice(getPlanById(planModalTarget), billingState.billingCycle);

    if (currentAmount === null || targetAmount === null) {
      return {
        type: "unavailable",
        amount: 0,
        message: "Proration is unavailable for custom-priced plans. Sales will confirm your quote.",
      };
    }

    const remainingRatio = 0.5;
    const delta = (targetAmount - currentAmount) * remainingRatio;

    if (Math.abs(delta) < 0.01) {
      return {
        type: "none",
        amount: 0,
        message: "No proration adjustment expected for this change.",
      };
    }

    if (delta > 0) {
      return {
        type: "charge",
        amount: Math.abs(delta),
        message: `Estimated immediate charge: ${formatCurrencyAmount(Math.abs(delta), preferences)} (remaining period).`,
      };
    }

    return {
      type: "credit",
      amount: Math.abs(delta),
      message: `Estimated credit: ${formatCurrencyAmount(Math.abs(delta), preferences)} applied to next invoice.`,
    };
  }, [billingState.billingCycle, currentPlan, planModalTarget, preferences, trialActive]);

  const formatPlanDisplay = (amount: number | null, cycle: BillingCycle) => {
    if (amount === null) return "Custom";
    const priceText = formatCurrencyAmount(amount, preferences);
    return cycle === "monthly" ? `${priceText}/month` : `${priceText}/year`;
  };

  const switchCycle = async (nextCycle: BillingCycle) => {
    if (nextCycle === billingState.billingCycle) return;
    const next = await writeBillingStateRemote({ billingCycle: nextCycle });
    setBillingState(next);
    showToast({
      title: "Billing cycle updated",
      description: `Plan comparison now shows ${nextCycle} pricing.`,
    });
  };

  const beginPlanChange = (planId: PlanId) => {
    if (planId === billingState.planId) return;
    setPlanModalTarget(planId);
  };

  const confirmPlanChange = async () => {
    if (!planModalTarget) return;

    const next = await writeBillingStateRemote({
      planId: planModalTarget,
      billingCycle: billingState.billingCycle,
      cancelAtPeriodEnd: false,
      cancellationRequestedAt: null,
    });

    setBillingState(next);
    setPlanModalTarget(null);
    showToast({
      title: "Subscription updated",
      description: `Switched to ${getPlanById(next.planId).name} (${next.billingCycle}).`,
    });
  };

  const confirmCancelSubscription = async () => {
    const next = await writeBillingStateRemote({
      cancelAtPeriodEnd: true,
      cancellationRequestedAt: new Date().toISOString(),
    });

    setBillingState(next);
    setShowCancelModal(false);
    showToast({
      title: "Cancellation scheduled",
      description: "Your subscription will end at the end of current billing period.",
    });
  };

  const confirmReactivateSubscription = async () => {
    const next = await writeBillingStateRemote({
      cancelAtPeriodEnd: false,
      cancellationRequestedAt: null,
    });

    setBillingState(next);
    setShowReactivateModal(false);
    showToast({
      title: "Subscription reactivated",
      description: "Automatic renewal is active again.",
    });
  };

  const scrollToPaymentMethod = () => {
    document.getElementById("payment-method")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const savePaymentMethod = async () => {
    const now = new Date().toISOString();

    if (paymentType === "card") {
      const normalizedCard = cardNumber.replace(/\s+/g, "");
      if (cardholderName.trim().length === 0 || normalizedCard.length < 12 || cardExpiry.trim().length < 4) {
        showToast({
          title: "Invalid card details",
          description: "Please enter cardholder name, valid card number, and expiry date.",
        });
        return;
      }

      const method = {
        type: "card" as const,
        label: `Card · ${cardholderName.trim()}`,
        last4: normalizedCard.slice(-4),
        updatedAt: now,
      };

      const next = await writePaymentMethodRemote(method);
      setPaymentMethod(next);
      setCardholderName("");
      setCardNumber("");
      setCardExpiry("");

      showToast({
        title: "Payment method saved",
        description: `Card ending in ${method.last4} has been added successfully.`,
      });
      return;
    }

    if (paymentType === "bank_transfer") {
      const normalizedAccount = bankAccount.replace(/\s+/g, "");
      if (bankName.trim().length === 0 || normalizedAccount.length < 6) {
        showToast({
          title: "Invalid bank details",
          description: "Please enter bank name and account number.",
        });
        return;
      }

      const method = {
        type: "bank_transfer" as const,
        label: `Bank transfer · ${bankName.trim()}`,
        last4: normalizedAccount.slice(-4),
        updatedAt: now,
      };

      const next = await writePaymentMethodRemote(method);
      setPaymentMethod(next);
      setBankName("");
      setBankAccount("");

      showToast({
        title: "Payment method saved",
        description: `Bank account ending in ${method.last4} has been added.`,
      });
      return;
    }

    const normalizedWallet = walletNumber.replace(/\s+/g, "");
    if (walletProvider.trim().length === 0 || normalizedWallet.length < 6) {
      showToast({
        title: "Invalid wallet details",
        description: "Please enter wallet provider and number.",
      });
      return;
    }

    const method = {
      type: "mobile_wallet" as const,
      label: `Mobile wallet · ${walletProvider.trim()}`,
      last4: normalizedWallet.slice(-4),
      updatedAt: now,
    };

    const next = await writePaymentMethodRemote(method);
    setPaymentMethod(next);
    setWalletProvider("");
    setWalletNumber("");

    showToast({
      title: "Payment method saved",
      description: `Wallet ending in ${method.last4} has been added.`,
    });
  };

  const getPaymentIcon = () => {
    switch (paymentType) {
      case "card":
        return <CreditCard className="h-5 w-5" />;
      case "bank_transfer":
        return <Building className="h-5 w-5" />;
      case "mobile_wallet":
        return <Smartphone className="h-5 w-5" />;
    }
  };

  if (isHydrating) {
    return (
      <SmartStockShell title="Billing & Plans" subtitle="Manage your subscription lifecycle, payment methods, and pricing.">
        <section className="space-y-4" aria-label="Billing loading">
          <LoadingState title="Loading billing details" description="Fetching your plan and payment setup." rows={4} />
        </section>
      </SmartStockShell>
    );
  }

  if (loadError) {
    return (
      <SmartStockShell title="Billing & Plans" subtitle="Manage your subscription lifecycle, payment methods, and pricing.">
        <section className="space-y-4" aria-label="Billing error">
          <ErrorState
            description={loadError}
            onRetry={() => {
              void hydrateBilling();
            }}
            retryLabel="Retry loading"
            hint="If this keeps happening, refresh the page and check browser storage permissions."
          />
        </section>
      </SmartStockShell>
    );
  }

  return (
    <SmartStockShell title="Billing & Plans" subtitle="Manage your subscription lifecycle, payment methods, and pricing.">
      <section className="space-y-6" aria-label="Billing">
        {trialActive ? (
          <article className="overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-r from-primary/5 to-primary/10 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">Free Trial Active</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  You have <span className="font-semibold text-foreground">{trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"}</span> left in your trial period.
                </p>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-primary/20">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${trialProgress}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Day {30 - trialDaysLeft} of 30-day trial</p>
              </div>
            </div>
          </article>
        ) : (
          <article className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-yellow-500/10 p-3">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Trial Ended</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your free trial has ended. Add a payment method to continue using SmartStock.
                </p>
              </div>
            </div>
          </article>
        )}

        {trialActive && trialDaysLeft <= 7 && !paymentMethod && (
          <article className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Trial ending soon: action required</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a payment method before your trial expires to avoid feature lockouts.
            </p>
            <button
              type="button"
              onClick={scrollToPaymentMethod}
              className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Add payment method now
            </button>
          </article>
        )}

        <article className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
              <div className="mt-2 flex items-center gap-2">
                <h3 className="text-2xl font-bold text-foreground">{currentPlan.name}</h3>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {formatPlanDisplay(getPlanPrice(currentPlan, billingState.billingCycle), billingState.billingCycle)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{currentPlan.targetCustomer}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Billing cycle: <span className="font-medium text-foreground">{billingState.billingCycle}</span>
                {billingState.cancelAtPeriodEnd ? " · Cancellation scheduled" : " · Auto-renew active"}
              </p>
            </div>

            {paymentMethod && (
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                <div className="mt-2 flex items-center gap-2 text-foreground">
                  {paymentMethod.type === "card" && <CreditCard className="h-4 w-4" />}
                  {paymentMethod.type === "bank_transfer" && <Building className="h-4 w-4" />}
                  {paymentMethod.type === "mobile_wallet" && <Smartphone className="h-4 w-4" />}
                  <span className="text-sm font-semibold">•••• {paymentMethod.last4}</span>
                </div>
              </div>
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="border-b border-border/70 bg-muted/10 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Plan comparison</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Compare monthly and yearly pricing, then confirm upgrade or downgrade with proration preview.
                </p>
              </div>

              <div className="inline-flex w-full items-center gap-1 rounded-xl border border-border bg-background p-1 sm:w-auto">
                <button
                  type="button"
                  onClick={() => void switchCycle("monthly")}
                  className={`h-10 flex-1 rounded-lg px-4 text-sm font-medium transition-colors sm:h-9 sm:flex-none sm:px-3 sm:text-xs ${
                    billingState.billingCycle === "monthly"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => void switchCycle("yearly")}
                  className={`h-10 flex-1 rounded-lg px-4 text-sm font-medium transition-colors sm:h-9 sm:flex-none sm:px-3 sm:text-xs ${
                    billingState.billingCycle === "yearly"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan, index) => {
              const selected = plan.id === billingState.planId;
              const isPopular = index === 1;
              const savings = getPlanSavingsPercent(plan);
              const nextRank = planRank(plan.id);
              const currentRank = planRank(billingState.planId);
              const buttonLabel = nextRank > currentRank ? "Upgrade" : nextRank < currentRank ? "Downgrade" : "Current Plan";

              return (
                <div
                  key={plan.id}
                  className={`relative flex h-full flex-col rounded-2xl border-2 p-5 transition-all ${
                    selected
                      ? "border-primary bg-primary/5 shadow-lg"
                      : isPopular
                      ? "border-primary/30 bg-background shadow-md"
                      : "border-border/70 bg-background hover:border-primary/30 hover:shadow-sm"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-primary bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      Most Popular
                    </div>
                  )}

                  {selected && (
                    <div className="absolute right-3 top-3 rounded-full bg-primary p-1">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-foreground">
                        {getPlanPrice(plan, billingState.billingCycle) === null
                          ? "Custom"
                          : formatCurrencyAmount(getPlanPrice(plan, billingState.billingCycle) ?? 0, preferences)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /{billingState.billingCycle === "monthly" ? "month" : "year"}
                      </span>
                    </div>
                    {billingState.billingCycle === "yearly" && savings > 0 && (
                      <p className="mt-1 inline-flex rounded-full bg-green-500/10 px-2 py-1 text-xs font-semibold text-green-700">Save {savings}% vs monthly</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">{plan.targetCustomer}</p>
                  </div>

                  <ul className="mb-6 flex-1 space-y-2">
                    {plan.features.slice(0, 5).map((feature) => (
                      <li key={`${plan.id}-${feature}`} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => beginPlanChange(plan.id)}
                    disabled={selected}
                    className={`mt-auto flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all ${
                      selected
                        ? "cursor-default border border-primary/20 bg-primary/10 text-primary"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                  >
                    {selected ? (
                      <>
                        <Check className="h-4 w-4" />
                        Current Plan
                      </>
                    ) : (
                      <>
                        {buttonLabel}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border/70 bg-muted/30 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" />
                <span>Secure payments</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Proration preview before confirmation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                <span>Cancel or reactivate anytime</span>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Subscription lifecycle</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Control cancellation and reactivation without losing your current setup.
          </p>

          {!billingState.cancelAtPeriodEnd ? (
            <div className="mt-4 rounded-xl border border-border/70 bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">
                Subscription status: <span className="font-semibold text-foreground">Active</span>
              </p>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="mt-3 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground"
              >
                Cancel subscription
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <p className="text-sm text-muted-foreground">
                Subscription status: <span className="font-semibold text-foreground">Cancellation scheduled</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Requested at {billingState.cancellationRequestedAt ? formatDateTime(billingState.cancellationRequestedAt, preferences) : "-"}
              </p>
              <button
                type="button"
                onClick={() => setShowReactivateModal(true)}
                className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Reactivate subscription
              </button>
            </div>
          )}
        </article>

        <article id="payment-method" className="rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="border-b border-border/70 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Payment Method</h2>
                <p className="text-sm text-muted-foreground">
                  {paymentMethod ? "Update your payment information below" : "Add a payment method to continue after trial"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {paymentMethod && (
              <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-500/10 p-2">
                      {paymentMethod.type === "card" && <CreditCard className="h-5 w-5 text-green-600" />}
                      {paymentMethod.type === "bank_transfer" && <Building className="h-5 w-5 text-green-600" />}
                      {paymentMethod.type === "mobile_wallet" && <Smartphone className="h-5 w-5 text-green-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{paymentMethod.label}</p>
                      <p className="text-xs text-muted-foreground">Ending in {paymentMethod.last4}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium text-foreground">Select Payment Type</label>
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setPaymentType("card")}
                  className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                    paymentType === "card" ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <CreditCard className={`h-5 w-5 ${paymentType === "card" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Card</p>
                    <p className="text-xs text-muted-foreground">Credit/Debit</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType("bank_transfer")}
                  className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                    paymentType === "bank_transfer"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <Building className={`h-5 w-5 ${paymentType === "bank_transfer" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Bank</p>
                    <p className="text-xs text-muted-foreground">Transfer</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType("mobile_wallet")}
                  className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                    paymentType === "mobile_wallet"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <Smartphone className={`h-5 w-5 ${paymentType === "mobile_wallet" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Wallet</p>
                    <p className="text-xs text-muted-foreground">ABA/Wing</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/20 p-5">
              {paymentType === "card" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Cardholder Name</label>
                    <input
                      value={cardholderName}
                      onChange={(event) => setCardholderName(event.target.value)}
                      placeholder="John Doe"
                      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Card Number</label>
                      <input
                        value={cardNumber}
                        onChange={(event) => setCardNumber(event.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Expiry Date</label>
                      <input
                        value={cardExpiry}
                        onChange={(event) => setCardExpiry(event.target.value)}
                        placeholder="MM/YY"
                        className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentType === "bank_transfer" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Bank Name</label>
                    <input
                      value={bankName}
                      onChange={(event) => setBankName(event.target.value)}
                      placeholder="e.g., ABA Bank, ACLEDA Bank"
                      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Account Number</label>
                    <input
                      value={bankAccount}
                      onChange={(event) => setBankAccount(event.target.value)}
                      placeholder="Enter your account number"
                      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground"
                    />
                  </div>
                </div>
              )}

              {paymentType === "mobile_wallet" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Wallet Provider</label>
                    <input
                      value={walletProvider}
                      onChange={(event) => setWalletProvider(event.target.value)}
                      placeholder="ABA Pay, Wing, Pi Pay"
                      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Phone / Wallet Number</label>
                    <input
                      value={walletNumber}
                      onChange={(event) => setWalletNumber(event.target.value)}
                      placeholder="Enter your wallet number"
                      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-xs text-muted-foreground">
                Your payment information is encrypted and secure. We never store your full card details.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void savePaymentMethod()}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {getPaymentIcon()}
              Save Payment Method
            </button>
          </div>
        </article>

        <HelpHint description="Upgrade and downgrade changes show proration estimates before confirmation. Scheduled cancellations can be reactivated anytime before period end." />
      </section>

      {planModalTarget && planModalNext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Confirm {changeDirection}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {currentPlan.name} to {planModalNext.name} ({billingState.billingCycle})
                </p>
              </div>
              <button type="button" onClick={() => setPlanModalTarget(null)} className="rounded-lg border border-border p-1 text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-border/70 bg-muted/20 p-3 text-sm">
              <p className="text-muted-foreground">Current: <span className="font-medium text-foreground">{formatPlanDisplay(getPlanPrice(currentPlan, billingState.billingCycle), billingState.billingCycle)}</span></p>
              <p className="text-muted-foreground">Next: <span className="font-medium text-foreground">{formatPlanDisplay(getPlanPrice(planModalNext, billingState.billingCycle), billingState.billingCycle)}</span></p>
            </div>

            <div className="mt-3 rounded-lg border border-border/70 bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proration preview</p>
              <p className="mt-1 text-sm text-foreground">{prorationPreview.message}</p>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPlanModalTarget(null)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void confirmPlanChange()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Confirm change
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">Cancel subscription?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your subscription will remain active until the end of the current billing period.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground"
              >
                Keep active
              </button>
              <button
                type="button"
                onClick={() => void confirmCancelSubscription()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Confirm cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showReactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">Reactivate subscription?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will remove cancellation and continue automatic renewal.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReactivateModal(false)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={() => void confirmReactivateSubscription()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Reactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </SmartStockShell>
  );
}
