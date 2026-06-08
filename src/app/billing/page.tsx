"use client";

import { useEffect, useMemo, useState } from "react";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useT } from "@/lib/i18n";
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
	Pencil,
	Plus,
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
	const t = useT();

	const [billingState, setBillingState] = useState<BillingState>(() => ({
		planId: "starter" as PlanId,
		trialStartedAt: new Date().toISOString(),
		billingCycle: "monthly" as BillingCycle,
		cancelAtPeriodEnd: false,
		cancellationRequestedAt: null,
	}));

	const [paymentMethod, setPaymentMethod] =
		useState<Awaited<ReturnType<typeof readPaymentMethodRemote>>>(null);

	const [isHydrating, setIsHydrating] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);

	const [planModalTarget, setPlanModalTarget] = useState<PlanId | null>(null);
	const [showCancelModal, setShowCancelModal] = useState(false);
	const [showReactivateModal, setShowReactivateModal] = useState(false);
	const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);

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
			setLoadError(t("billing.errorLoad", "We couldn't load your billing profile. Please retry."));
		} finally {
			setIsHydrating(false);
		}
	};

	useEffect(() => {
		void hydrateBilling();
	}, []);

	const currentPlan = getPlanById(billingState.planId);
	const planModalNext = planModalTarget ? getPlanById(planModalTarget) : null;
	const trialDaysLeft = getTrialDaysLeft(billingState);
	const trialActive = trialDaysLeft > 0;
	const trialProgress = trialActive ? ((30 - trialDaysLeft) / 30) * 100 : 100;

	const planRank = (planId: PlanId) =>
		plans.findIndex((item) => item.id === planId);

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
				message:
					"No proration during trial. Plan change applies immediately and billing starts after trial.",
			};
		}

		const currentAmount = getPlanPrice(
			currentPlan,
			billingState.billingCycle,
		);
		const targetAmount = getPlanPrice(
			getPlanById(planModalTarget),
			billingState.billingCycle,
		);

		if (currentAmount === null || targetAmount === null) {
			return {
				type: "unavailable",
				amount: 0,
				message:
					"Proration is unavailable for custom-priced plans. Sales will confirm your quote.",
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
				message: `Estimated immediate charge: ${formatCurrencyAmount(
					Math.abs(delta),
					preferences,
				)} for the remaining period.`,
			};
		}

		return {
			type: "credit",
			amount: Math.abs(delta),
			message: `Estimated credit: ${formatCurrencyAmount(
				Math.abs(delta),
				preferences,
			)} applied to next invoice.`,
		};
	}, [
		billingState.billingCycle,
		currentPlan,
		planModalTarget,
		preferences,
		trialActive,
	]);

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
			description:
				"Your subscription will end at the end of current billing period.",
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

	const openPaymentDrawer = () => {
		if (paymentMethod) {
			setPaymentType(paymentMethod.type);
		}

		setShowPaymentDrawer(true);
	};

	const closePaymentDrawer = () => {
		setShowPaymentDrawer(false);
		setCardholderName("");
		setCardNumber("");
		setCardExpiry("");
		setBankName("");
		setBankAccount("");
		setWalletProvider("");
		setWalletNumber("");
	};

	const savePaymentMethod = async () => {
		const now = new Date().toISOString();

		if (paymentType === "card") {
			const normalizedCard = cardNumber.replace(/\s+/g, "");

			if (
				cardholderName.trim().length === 0 ||
				normalizedCard.length < 12 ||
				cardExpiry.trim().length < 4
			) {
				showToast({
					title: "Invalid card details",
					description:
						"Please enter cardholder name, valid card number, and expiry date.",
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
			closePaymentDrawer();

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
			closePaymentDrawer();

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
		closePaymentDrawer();

		showToast({
			title: "Payment method saved",
			description: `Wallet ending in ${method.last4} has been added.`,
		});
	};

	const paymentTypeIcon = (
		type: PaymentMethodType,
		className = "h-5 w-5",
	) => {
		switch (type) {
			case "card":
				return <CreditCard className={className} />;
			case "bank_transfer":
				return <Building className={className} />;
			case "mobile_wallet":
				return <Smartphone className={className} />;
		}
	};

	if (isHydrating) {
		return (
			<SmartStockShell
				title={t("billing.title", "Billing & Plans")}
				subtitle={t("billing.subtitle", "Manage your subscription lifecycle, payment methods, and pricing.")}
			>
				<section className="space-y-4" aria-label="Billing loading">
					<LoadingState
						title={t("billing.loadingDetails", "Loading billing details")}
						description={t("billing.fetchingSetup", "Fetching your plan and payment setup.")}
						rows={4}
					/>
				</section>
			</SmartStockShell>
		);
	}

	if (loadError) {
		return (
			<SmartStockShell
				title={t("billing.title", "Billing & Plans")}
				subtitle={t("billing.subtitle", "Manage your subscription lifecycle, payment methods, and pricing.")}
			>
				<section className="space-y-4" aria-label="Billing error">
					<ErrorState
						description={loadError}
						onRetry={() => {
							void hydrateBilling();
						}}
						retryLabel={t("billing.retryLoading", "Retry loading")}
						hint={t("billing.errorRetryHint", "If this keeps happening, refresh the page and check browser storage permissions.")}
					/>
				</section>
			</SmartStockShell>
		);
	}

	return (
		<SmartStockShell
			title={t("billing.title", "Billing & Plans")}
			subtitle={t("billing.subtitle", "Manage your subscription lifecycle, payment methods, and pricing.")}
		>
			<section className="space-y-6" aria-label="Billing">
				<div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
					<article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<div className="flex flex-wrap items-center gap-2">
									<span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
										{currentPlan.name}
									</span>

									{trialActive ? (
										<span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
											<Clock className="h-3.5 w-3.5" />
											{t("billing.trialLeft", "{{days}}d trial left", { days: trialDaysLeft })}
										</span>
									) : (
										<span className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
											{t("billing.trialEnded", "Trial ended")}
										</span>
									)}

									{billingState.cancelAtPeriodEnd && (
										<span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
											{t("billing.cancellationScheduled", "Cancellation scheduled")}
										</span>
									)}
								</div>

								<h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
									{formatPlanDisplay(
										getPlanPrice(currentPlan, billingState.billingCycle),
										billingState.billingCycle,
									)}
								</h2>

								<p className="mt-1 text-sm text-muted-foreground">
									{currentPlan.targetCustomer}
								</p>
							</div>

							<div className="inline-flex rounded-xl border border-border bg-background p-1">
								<button
									type="button"
									onClick={() => void switchCycle("monthly")}
									className={`h-9 rounded-lg px-4 text-sm font-medium transition-colors ${
										billingState.billingCycle === "monthly"
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									{t("billing.monthly", "Monthly")}
								</button>

								<button
									type="button"
									onClick={() => void switchCycle("yearly")}
									className={`h-9 rounded-lg px-4 text-sm font-medium transition-colors ${
										billingState.billingCycle === "yearly"
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									{t("billing.yearly", "Yearly")}
								</button>
							</div>
						</div>

						{trialActive && (
							<div className="mt-5">
								<div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
									<span>{t("billing.trialProgress", "Trial progress")}</span>
									<span>{t("billing.dayOf", "Day {{current}} of {{total}}", { current: 30 - trialDaysLeft, total: 30 })}</span>
								</div>

								<div className="h-2 overflow-hidden rounded-full bg-primary/15">
									<div
										className="h-full rounded-full bg-primary transition-all duration-500"
										style={{ width: `${trialProgress}%` }}
									/>
								</div>
							</div>
						)}

						<div className="mt-5 grid gap-3 sm:grid-cols-3">
							<div className="rounded-xl bg-muted/30 p-3">
								<p className="text-xs text-muted-foreground">{t("billing.renewal", "Renewal")}</p>
								<p className="mt-1 text-sm font-semibold text-foreground">
									{billingState.cancelAtPeriodEnd
										? t("billing.endsThisPeriod", "Ends this period")
										: t("billing.autoRenewActive", "Auto renew active")}
								</p>
							</div>

							<div className="rounded-xl bg-muted/30 p-3">
								<p className="text-xs text-muted-foreground">{t("billing.billingCycle", "Billing cycle")}</p>
								<p className="mt-1 text-sm font-semibold capitalize text-foreground">
									{billingState.billingCycle === "monthly" ? t("billing.monthly", "Monthly") : t("billing.yearly", "Yearly")}
								</p>
							</div>

							<div className="rounded-xl bg-muted/30 p-3">
								<p className="text-xs text-muted-foreground">{t("billing.planStatus", "Plan status")}</p>
								<p className="mt-1 text-sm font-semibold text-foreground">
									{billingState.cancelAtPeriodEnd ? t("billing.cancelling", "Cancelling") : t("billing.active", "Active")}
								</p>
							</div>
						</div>

						{billingState.cancellationRequestedAt && (
							<p className="mt-4 text-xs text-muted-foreground">
								{t("billing.cancellationRequested", "Cancellation requested")} ·{" "}
								{formatDateTime(
									billingState.cancellationRequestedAt,
									preferences,
								)}
							</p>
						)}
					</article>

					<article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
						<div className="flex items-start justify-between gap-3">
							<div>
								<h2 className="text-lg font-semibold text-foreground">
									{t("billing.payment", "Payment")}
								</h2>
								<p className="mt-1 text-sm text-muted-foreground">
									{t("billing.manageMethod", "Manage the method used for renewals.")}
								</p>
							</div>

							{/* <button
								type="button"
								onClick={openPaymentDrawer}
								className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
							>
								{paymentMethod ? "Update" : "Add"}
							</button> */}
						</div>

						<div className="mt-5">
							{paymentMethod ? (
								<div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
									<div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
										{paymentTypeIcon(paymentMethod.type, "h-5 w-5")}
									</div>

									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-semibold text-foreground">
											{paymentMethod.label}
										</p>
										<p className="text-xs text-muted-foreground">
											{t("billing.endingIn", "Ending in {{last4}}", { last4: paymentMethod.last4 ?? "" })}
										</p>
									</div>

									<CheckCircle2 className="h-5 w-5 text-emerald-600" />
								</div>
							) : (
								<button
									type="button"
									onClick={openPaymentDrawer}
									className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-background p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
								>
									<div className="rounded-lg bg-primary/10 p-2 text-primary">
										<Plus className="h-5 w-5" />
									</div>

									<div>
										<p className="text-sm font-semibold text-foreground">
											{t("billing.addPaymentMethod", "Add payment method")}
										</p>
										<p className="text-xs text-muted-foreground">
											{t("billing.paymentTypesDesc", "Card, bank transfer, or mobile wallet.")}
										</p>
									</div>
								</button>
							)}
						</div>

						<div className="mt-5">
							{!billingState.cancelAtPeriodEnd ? (
								<button
									type="button"
									onClick={() => setShowCancelModal(true)}
									className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-red-400/40 bg-red-500/10 px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-500/15 dark:text-red-400"
								>
									{t("billing.cancelSubscription", "Cancel subscription")}
								</button>
							) : (
								<button
									type="button"
									onClick={() => setShowReactivateModal(true)}
									className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
								>
									{t("billing.reactivateSubscription", "Reactivate subscription")}
								</button>
							)}
						</div>
					</article>
				</div>

				{trialActive && trialDaysLeft <= 7 && !paymentMethod && (
					<div className="flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center">
						<AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />

						<div className="flex-1">
							<p className="text-sm font-semibold text-foreground">
								{trialDaysLeft === 1
									? t("billing.trialEndingIn", "Trial ending in {{days}} day", { days: trialDaysLeft })
									: t("billing.trialEndingInPlural", "Trial ending in {{days}} days", { days: trialDaysLeft })}
							</p>
							<p className="text-sm text-muted-foreground">
								{t("billing.addPaymentAvoidRestrictions", "Add a payment method to avoid access restrictions.")}
							</p>
						</div>

						<button
							type="button"
							onClick={openPaymentDrawer}
							className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700"
						>
							{t("billing.addNow", "Add now")}
						</button>
					</div>
				)}

				{!trialActive && !paymentMethod && (
					<div className="flex flex-col gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 sm:flex-row sm:items-center">
						<AlertCircle className="h-5 w-5 shrink-0 text-red-500" />

						<div className="flex-1">
							<p className="text-sm font-semibold text-foreground">
								{t("billing.trialEnded", "Trial ended")}
							</p>
							<p className="text-sm text-muted-foreground">
								{t("billing.addPaymentRestoreAccess", "Add a payment method to restore full access.")}
							</p>
						</div>

						<button
							type="button"
							onClick={openPaymentDrawer}
							className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
						>
							{t("billing.addNow", "Add now")}
						</button>
					</div>
				)}

				<article className="rounded-2xl border border-border/70 bg-card shadow-sm">
					<div className="flex flex-col gap-3 border-b border-border/70 p-5 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h2 className="text-xl font-semibold text-foreground">
								{t("billing.choosePlan", "Choose a plan")}
							</h2>
							<p className="mt-1 text-sm text-muted-foreground">
								{t("billing.compareFeatures", "Compare features and change plans with a proration preview.")}
							</p>
						</div>

						<div className="inline-flex rounded-xl border border-border bg-background p-1 sm:hidden">
							<button
								type="button"
								onClick={() => void switchCycle("monthly")}
								className={`h-9 rounded-lg px-4 text-sm font-medium transition-colors ${
									billingState.billingCycle === "monthly"
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{t("billing.monthly", "Monthly")}
							</button>

							<button
								type="button"
								onClick={() => void switchCycle("yearly")}
								className={`h-9 rounded-lg px-4 text-sm font-medium transition-colors ${
									billingState.billingCycle === "yearly"
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{t("billing.yearly", "Yearly")}
							</button>
						</div>
					</div>

					<div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
						{plans.map((plan, index) => {
							const selected = plan.id === billingState.planId;
							const isPopular = index === 1;
							const savings = getPlanSavingsPercent(plan);
							const nextRank = planRank(plan.id);
							const currentRank = planRank(billingState.planId);
							const buttonLabel =
								nextRank > currentRank
									? t("billing.upgrade", "Upgrade")
									: nextRank < currentRank
										? t("billing.downgrade", "Downgrade")
										: t("billing.currentPlan", "Current plan");

							return (
								<div
									key={plan.id}
									className={`relative flex min-h-full flex-col rounded-2xl border p-4 transition-colors ${
										selected
											? "border-primary bg-primary/5"
											: "border-border/70 bg-background hover:border-primary/40"
									}`}
								>
									<div className="flex items-start justify-between gap-3">
										<div>
											<div className="flex items-center gap-2">
												<h3 className="text-base font-semibold text-foreground">
													{plan.name}
												</h3>

												{isPopular && (
													<span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
														{t("billing.popular", "Popular")}
													</span>
												)}
											</div>

											<p className="mt-1 text-xs text-muted-foreground">
												{plan.targetCustomer}
											</p>
										</div>

										{selected && (
											<div className="rounded-full bg-primary p-1 text-primary-foreground">
												<Check className="h-3.5 w-3.5" />
											</div>
										)}
									</div>

									<div className="mt-4">
										<div className="flex items-end gap-1">
											<span className="text-2xl font-bold text-foreground">
												{getPlanPrice(plan, billingState.billingCycle) === null
													? t("billing.custom", "Custom")
													: formatCurrencyAmount(
															getPlanPrice(
																plan,
																billingState.billingCycle,
															) ?? 0,
															preferences,
														)}
											</span>

											<span className="pb-1 text-xs text-muted-foreground">
												/
												{billingState.billingCycle === "monthly" ? t("billing.mo", "mo") : t("billing.yr", "yr")}
											</span>
										</div>

										{billingState.billingCycle === "yearly" && savings > 0 && (
											<span className="mt-2 inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
												Save {savings}%
											</span>
										)}
									</div>

									<ul className="mt-4 flex-1 space-y-2">
										{plan.features.slice(0, 5).map((feature) => (
											<li
												key={`${plan.id}-${feature}`}
												className="flex items-start gap-2"
											>
												<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
												<span className="text-sm leading-snug text-foreground">
													{feature}
												</span>
											</li>
										))}
									</ul>

									<button
										type="button"
										onClick={() => beginPlanChange(plan.id)}
										disabled={selected}
										className={`mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors ${
											selected
												? "cursor-default border border-primary/30 bg-primary/10 text-primary"
												: "bg-primary text-primary-foreground hover:opacity-90"
										}`}
									>
										{selected ? (
											<>
												<Check className="h-4 w-4" />
												Current plan
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

					<div className="border-t border-border/70 p-4">
						<div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
							<div className="flex items-center gap-1.5">
								<Shield className="h-4 w-4" />
								<span>Secure payments</span>
							</div>

							<div className="flex items-center gap-1.5">
								<Clock className="h-4 w-4" />
								<span>Proration before confirmation</span>
							</div>

							<div className="flex items-center gap-1.5">
								<Check className="h-4 w-4" />
								<span>Cancel or reactivate anytime</span>
							</div>
						</div>
					</div>
				</article>

				<HelpHint description="Plan changes show proration estimates before confirmation. Scheduled cancellations can be reactivated before period end." />
			</section>

			{showPaymentDrawer && (
				<div className="fixed inset-0 z-50 flex">
					<button
						type="button"
						className="flex-1 bg-black/50"
						onClick={closePaymentDrawer}
						aria-label="Close payment drawer"
					/>

					<div className="flex h-full w-full max-w-md flex-col bg-card shadow-2xl">
						<div className="flex items-center justify-between border-b border-border px-6 py-5">
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-primary/10 p-2 text-primary">
									<CreditCard className="h-5 w-5" />
								</div>

								<div>
									<h2 className="text-lg font-semibold text-foreground">
										{paymentMethod
											? "Update payment method"
											: "Add payment method"}
									</h2>
									<p className="text-sm text-muted-foreground">
										Choose how you want to pay.
									</p>
								</div>
							</div>

							<button
								type="button"
								onClick={closePaymentDrawer}
								className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
								aria-label="Close panel"
							>
								<X className="h-4 w-4" />
							</button>
						</div>

						<div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
							{paymentMethod && (
								<div className="rounded-xl border border-border/70 bg-muted/20 p-4">
									<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										Current method
									</p>

									<div className="flex items-center gap-3">
										<div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
											{paymentTypeIcon(paymentMethod.type)}
										</div>

										<div>
											<p className="text-sm font-semibold text-foreground">
												{paymentMethod.label}
											</p>
											<p className="text-xs text-muted-foreground">
												Ending in {paymentMethod.last4}
											</p>
										</div>

										<CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600" />
									</div>
								</div>
							)}

							<div>
								<p className="mb-3 text-sm font-medium text-foreground">
									Payment type
								</p>

								<div className="grid grid-cols-3 gap-3">
									{(
										[
											"card",
											"bank_transfer",
											"mobile_wallet",
										] as PaymentMethodType[]
									).map((type) => {
										const labels: Record<
											PaymentMethodType,
											{ title: string; sub: string }
										> = {
											card: { title: "Card", sub: "Credit/Debit" },
											bank_transfer: { title: "Bank", sub: "Transfer" },
											mobile_wallet: { title: "Wallet", sub: "ABA/Wing" },
										};

										const active = paymentType === type;

										return (
											<button
												key={type}
												type="button"
												onClick={() => setPaymentType(type)}
												className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors ${
													active
														? "border-primary bg-primary/5"
														: "border-border bg-background hover:border-primary/30"
												}`}
											>
												<div
													className={
														active ? "text-primary" : "text-muted-foreground"
													}
												>
													{paymentTypeIcon(type, "h-5 w-5")}
												</div>

												<div className="text-center">
													<p className="text-xs font-semibold text-foreground">
														{labels[type].title}
													</p>
													<p className="text-xs text-muted-foreground">
														{labels[type].sub}
													</p>
												</div>
											</button>
										);
									})}
								</div>
							</div>

							<div className="space-y-4">
								{paymentType === "card" && (
									<>
										<div>
											<label className="mb-2 block text-sm font-medium text-foreground">
												Cardholder name
											</label>

											<input
												value={cardholderName}
												onChange={(event) =>
													setCardholderName(event.target.value)
												}
												placeholder="John Doe"
												className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
											/>
										</div>

										<div>
											<label className="mb-2 block text-sm font-medium text-foreground">
												Card number
											</label>

											<input
												value={cardNumber}
												onChange={(event) => setCardNumber(event.target.value)}
												placeholder="4242 4242 4242 4242"
												className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
											/>
										</div>

										<div>
											<label className="mb-2 block text-sm font-medium text-foreground">
												Expiry date
											</label>

											<input
												value={cardExpiry}
												onChange={(event) => setCardExpiry(event.target.value)}
												placeholder="MM/YY"
												className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
											/>
										</div>
									</>
								)}

								{paymentType === "bank_transfer" && (
									<>
										<div>
											<label className="mb-2 block text-sm font-medium text-foreground">
												Bank name
											</label>

											<input
												value={bankName}
												onChange={(event) => setBankName(event.target.value)}
												placeholder="ABA Bank, ACLEDA Bank"
												className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
											/>
										</div>

										<div>
											<label className="mb-2 block text-sm font-medium text-foreground">
												Account number
											</label>

											<input
												value={bankAccount}
												onChange={(event) =>
													setBankAccount(event.target.value)
												}
												placeholder="Enter your account number"
												className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
											/>
										</div>
									</>
								)}

								{paymentType === "mobile_wallet" && (
									<>
										<div>
											<label className="mb-2 block text-sm font-medium text-foreground">
												Wallet provider
											</label>

											<input
												value={walletProvider}
												onChange={(event) =>
													setWalletProvider(event.target.value)
												}
												placeholder="ABA Pay, Wing, Pi Pay"
												className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
											/>
										</div>

										<div>
											<label className="mb-2 block text-sm font-medium text-foreground">
												Phone or wallet number
											</label>

											<input
												value={walletNumber}
												onChange={(event) =>
													setWalletNumber(event.target.value)
												}
												placeholder="Enter your wallet number"
												className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
											/>
										</div>
									</>
								)}
							</div>

							<div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
								<Shield className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
								<p className="text-xs text-muted-foreground">
									Your payment information is encrypted. Full card details are
									never stored.
								</p>
							</div>
						</div>

						<div className="border-t border-border px-6 py-4">
							<button
								type="button"
								onClick={() => void savePaymentMethod()}
								className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
							>
								{paymentTypeIcon(paymentType)}
								Save payment method
							</button>
						</div>
					</div>
				</div>
			)}

			{planModalTarget && planModalNext && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-xl">
						<div className="flex items-start justify-between gap-2">
							<div>
								<h2 className="text-lg font-semibold text-foreground">
									Confirm {changeDirection}
								</h2>
								<p className="mt-1 text-sm text-muted-foreground">
									{currentPlan.name} to {planModalNext.name} (
									{billingState.billingCycle})
								</p>
							</div>

							<button
								type="button"
								onClick={() => setPlanModalTarget(null)}
								className="rounded-lg border border-border p-1 text-muted-foreground"
							>
								<X className="h-4 w-4" />
							</button>
						</div>

						<div className="mt-4 rounded-lg border border-border/70 bg-muted/20 p-3 text-sm">
							<p className="text-muted-foreground">
								Current:{" "}
								<span className="font-medium text-foreground">
									{formatPlanDisplay(
										getPlanPrice(currentPlan, billingState.billingCycle),
										billingState.billingCycle,
									)}
								</span>
							</p>

							<p className="text-muted-foreground">
								Next:{" "}
								<span className="font-medium text-foreground">
									{formatPlanDisplay(
										getPlanPrice(planModalNext, billingState.billingCycle),
										billingState.billingCycle,
									)}
								</span>
							</p>
						</div>

						<div className="mt-3 rounded-lg border border-border/70 bg-background p-3">
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Proration preview
							</p>
							<p className="mt-1 text-sm text-foreground">
								{prorationPreview.message}
							</p>
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
						<h2 className="text-lg font-semibold text-foreground">
							Cancel subscription?
						</h2>

						<p className="mt-2 text-sm text-muted-foreground">
							Your subscription will remain active until the end of the current
							billing period.
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
								className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500"
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
						<h2 className="text-lg font-semibold text-foreground">
							Reactivate subscription?
						</h2>

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