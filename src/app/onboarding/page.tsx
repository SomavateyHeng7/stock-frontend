"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { readUserPreferences, updateUserPreferences } from "@/lib/user-preferences";

type StepId = 1 | 2 | 3;

type OnboardingDraft = {
	businessName: string;
	industry: string;
	skuRange: "under-100" | "100-300" | "300-plus";
	preferredLanguage: "english" | "khmer";
	channels: string[];
	alertChannel: "telegram" | "email";
	phoneOrEmail: string;
};

type OnboardingState = OnboardingDraft & {
	completedAt: string | null;
};

const ONBOARDING_KEY = "smartstock.onboarding.v1";

const defaultDraft: OnboardingDraft = {
	businessName: "",
	industry: "",
	skuRange: "under-100",
	preferredLanguage: "english",
	channels: ["Walk-in"],
	alertChannel: "telegram",
	phoneOrEmail: "",
};

function readOnboardingState(): OnboardingState {
	if (typeof window === "undefined") {
		return { ...defaultDraft, completedAt: null };
	}

	try {
		const raw = window.localStorage.getItem(ONBOARDING_KEY);
		if (!raw) return { ...defaultDraft, completedAt: null };

		const parsed = JSON.parse(raw) as Partial<OnboardingState>;
		return {
			businessName: parsed.businessName ?? defaultDraft.businessName,
			industry: parsed.industry ?? defaultDraft.industry,
			skuRange:
				parsed.skuRange === "100-300" || parsed.skuRange === "300-plus" ? parsed.skuRange : "under-100",
			preferredLanguage: parsed.preferredLanguage === "khmer" ? "khmer" : "english",
			channels: Array.isArray(parsed.channels) && parsed.channels.length > 0 ? parsed.channels : defaultDraft.channels,
			alertChannel: parsed.alertChannel === "email" ? "email" : "telegram",
			phoneOrEmail: parsed.phoneOrEmail ?? defaultDraft.phoneOrEmail,
			completedAt: typeof parsed.completedAt === "string" ? parsed.completedAt : null,
		};
	} catch {
		return { ...defaultDraft, completedAt: null };
	}
}

function writeOnboardingState(next: Partial<OnboardingState>) {
	if (typeof window === "undefined") return;

	const current = readOnboardingState();
	const merged: OnboardingState = {
		...current,
		...next,
		channels: Array.isArray(next.channels) && next.channels.length > 0 ? next.channels : current.channels,
	};

	window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify(merged));
}

export default function OnboardingPage() {
	const router = useRouter();
	const { showToast } = useToast();
	const [showTutorial, setShowTutorial] = useState(false);
	const [hasCompletedBefore, setHasCompletedBefore] = useState(() => {
		const saved = readOnboardingState();
		return Boolean(saved.completedAt);
	});
	const [step, setStep] = useState<StepId>(1);
	const [draft, setDraft] = useState<OnboardingDraft>(() => {
		const saved = readOnboardingState();
		const preferences = readUserPreferences();
		const preferredLanguage = preferences.language === "km" ? "khmer" : "english";
		return {
			businessName: saved.businessName,
			industry: saved.industry,
			skuRange: saved.skuRange,
			preferredLanguage: saved.completedAt ? saved.preferredLanguage : preferredLanguage,
			channels: saved.channels,
			alertChannel: saved.alertChannel,
			phoneOrEmail: saved.phoneOrEmail,
		};
	});

	useEffect(() => {
		writeOnboardingState({ ...draft });
	}, [draft]);

	const progress = useMemo(() => Math.round((step / 3) * 100), [step]);

	const toggleChannel = (channel: string) => {
		setDraft((current) => {
			if (current.channels.includes(channel)) {
				const nextChannels = current.channels.filter((item) => item !== channel);
				return {
					...current,
					channels: nextChannels.length > 0 ? nextChannels : ["Walk-in"],
				};
			}

			return { ...current, channels: [...current.channels, channel] };
		});
	};

	const nextStep = () => {
		if (step === 1) {
			if (draft.businessName.trim().length < 2 || draft.industry.trim().length < 2) {
				showToast({
					title: "Add business details",
					description: "Please provide business name and industry to continue.",
				});
				return;
			}
			setStep(2);
			return;
		}

		if (step === 2) {
			if (draft.channels.length === 0) {
				showToast({
					title: "Select at least one channel",
					description: "Choose where you sell so SmartStock can tailor alerts.",
				});
				return;
			}
			setStep(3);
			return;
		}
	};

	const previousStep = () => {
		if (step === 1) return;
		setStep((current) => (current - 1) as StepId);
	};

	const completeOnboarding = () => {
		const contact = draft.phoneOrEmail.trim();
		if (contact.length < 4) {
			showToast({
				title: "Add contact for alerts",
				description: "Enter Telegram number/username or an email address.",
			});
			return;
		}

		writeOnboardingState({
			...draft,
			phoneOrEmail: contact,
			completedAt: new Date().toISOString(),
		});
		updateUserPreferences({
			language: draft.preferredLanguage === "khmer" ? "km" : "en",
		});
		setHasCompletedBefore(true);

		showToast({
			title: "Onboarding complete",
			description: "Your workspace is ready. Opening dashboard...",
		});

		router.push("/dashboard");
	};

	const startTutorial = () => {
		setStep(1);
		setShowTutorial(true);
	};

	const skipTutorialForNow = () => {
		writeOnboardingState({
			...draft,
			completedAt: new Date().toISOString(),
		});
		updateUserPreferences({
			language: draft.preferredLanguage === "khmer" ? "km" : "en",
		});
		setHasCompletedBefore(true);
		showToast({
			title: "Setup skipped",
			description: "You can return to onboarding anytime from the Tutorial link.",
		});
		router.push("/dashboard");
	};

	if (!showTutorial) {
		return (
			<main className="min-h-screen bg-muted/20 px-4 py-8 sm:px-6 lg:py-10">
				<section className="mx-auto w-full max-w-3xl rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
					<p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">SmartStock Setup</p>
					<h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Choose how you want to start</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Pick a guided tutorial or jump straight to the app. You can always revisit onboarding later.
					</p>

					{hasCompletedBefore && (
						<p className="mt-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-foreground">
							You already have setup data. Start the tutorial to review or update your preferences.
						</p>
					)}

					<div className="mt-6 grid gap-3 sm:grid-cols-2">
						<button
							type="button"
							onClick={startTutorial}
							className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
						>
							Start guided tutorial
						</button>
						<button
							type="button"
							onClick={skipTutorialForNow}
							className="rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground"
						>
							I am fine on my own
						</button>
					</div>

					<div className="mt-4">
						<Link
							href="/dashboard"
							className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
						>
							Back to dashboard
						</Link>
					</div>
				</section>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-muted/20 px-4 py-8 sm:px-6 lg:py-10">
			<section className="mx-auto w-full max-w-3xl rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">SmartStock Setup</p>
						<h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Complete your onboarding</h1>
						<p className="mt-1 text-sm text-muted-foreground">Step {step} of 3 to personalize your inventory workspace.</p>
					</div>
					<Link
						href="/dashboard"
						className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground"
					>
						Skip for now
					</Link>
				</div>

				<div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
					<div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
				</div>

				{step === 1 && (
					<article className="mt-6 space-y-4">
						<h2 className="text-lg font-semibold text-foreground">Business profile</h2>
						<label className="grid gap-1 text-sm text-foreground">
							Business name
							<input
								value={draft.businessName}
								onChange={(event) => setDraft((current) => ({ ...current, businessName: event.target.value }))}
								placeholder="Example: Sokha Mart"
								className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
							/>
						</label>

						<label className="grid gap-1 text-sm text-foreground">
							Industry
							<input
								value={draft.industry}
								onChange={(event) => setDraft((current) => ({ ...current, industry: event.target.value }))}
								placeholder="Example: Grocery and household"
								className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
							/>
						</label>
					</article>
				)}

				{step === 2 && (
					<article className="mt-6 space-y-4">
						<h2 className="text-lg font-semibold text-foreground">Inventory scope</h2>

						<label className="grid gap-1 text-sm text-foreground">
							Approximate SKU count
							<select
								value={draft.skuRange}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										skuRange: event.target.value as OnboardingDraft["skuRange"],
									}))
								}
								className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
							>
								<option value="under-100">Under 100 SKUs</option>
								<option value="100-300">100 to 300 SKUs</option>
								<option value="300-plus">More than 300 SKUs</option>
							</select>
						</label>

						<fieldset className="space-y-2">
							<legend className="text-sm font-medium text-foreground">Sales channels</legend>
							<div className="grid gap-2 sm:grid-cols-3">
								{["Walk-in", "Facebook", "Delivery"].map((channel) => (
									<label
										key={channel}
										className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm text-foreground"
									>
										<input
											type="checkbox"
											checked={draft.channels.includes(channel)}
											onChange={() => toggleChannel(channel)}
										/>
										{channel}
									</label>
								))}
							</div>
						</fieldset>
					</article>
				)}

				{step === 3 && (
					<article className="mt-6 space-y-4">
						<h2 className="text-lg font-semibold text-foreground">Alerts and language</h2>

						<fieldset className="space-y-2">
							<legend className="text-sm font-medium text-foreground">Preferred language</legend>
							<div className="grid gap-2 sm:grid-cols-2">
								<label className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm text-foreground">
									<input
										type="radio"
										name="preferred-language"
										checked={draft.preferredLanguage === "english"}
										onChange={() => setDraft((current) => ({ ...current, preferredLanguage: "english" }))}
									/>
									English
								</label>
								<label className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm text-foreground">
									<input
										type="radio"
										name="preferred-language"
										checked={draft.preferredLanguage === "khmer"}
										onChange={() => setDraft((current) => ({ ...current, preferredLanguage: "khmer" }))}
									/>
									Khmer
								</label>
							</div>
						</fieldset>

						<fieldset className="space-y-2">
							<legend className="text-sm font-medium text-foreground">Primary alert channel</legend>
							<div className="grid gap-2 sm:grid-cols-2">
								<label className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm text-foreground">
									<input
										type="radio"
										name="alert-channel"
										checked={draft.alertChannel === "telegram"}
										onChange={() => setDraft((current) => ({ ...current, alertChannel: "telegram" }))}
									/>
									Telegram
								</label>
								<label className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm text-foreground">
									<input
										type="radio"
										name="alert-channel"
										checked={draft.alertChannel === "email"}
										onChange={() => setDraft((current) => ({ ...current, alertChannel: "email" }))}
									/>
									Email
								</label>
							</div>
						</fieldset>

						<label className="grid gap-1 text-sm text-foreground">
							{draft.alertChannel === "telegram" ? "Telegram number or username" : "Email address"}
							<input
								value={draft.phoneOrEmail}
								onChange={(event) => setDraft((current) => ({ ...current, phoneOrEmail: event.target.value }))}
								placeholder={draft.alertChannel === "telegram" ? "Example: @sokhamart or +855..." : "name@company.com"}
								className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
							/>
						</label>
					</article>
				)}

				<div className="mt-8 flex items-center justify-between gap-2">
					<button
						type="button"
						onClick={previousStep}
						disabled={step === 1}
						className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-50"
					>
						Back
					</button>

					{step < 3 ? (
						<button
							type="button"
							onClick={nextStep}
							className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
						>
							Continue
						</button>
					) : (
						<button
							type="button"
							onClick={completeOnboarding}
							className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
						>
							Finish setup
						</button>
					)}
				</div>
			</section>
		</main>
	);
}
