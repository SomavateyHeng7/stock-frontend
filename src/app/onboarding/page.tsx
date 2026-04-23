"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { readUserPreferences, updateUserPreferences } from "@/lib/user-preferences";
import { writeNotificationSettings } from "@/lib/notification-settings";
import { useTelegramLink } from "@/hooks/use-telegram-link";
import { useSyncExternalStore } from "react";

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
				parsed.skuRange === "100-300" || parsed.skuRange === "300-plus"
					? parsed.skuRange
					: "under-100",
			preferredLanguage: parsed.preferredLanguage === "khmer" ? "khmer" : "english",
			channels:
				Array.isArray(parsed.channels) && parsed.channels.length > 0
					? parsed.channels
					: defaultDraft.channels,
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
		channels:
			Array.isArray(next.channels) && next.channels.length > 0
				? next.channels
				: current.channels,
	};
	window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify(merged));
}

export default function OnboardingPage() {
	const router = useRouter();
	const { showToast } = useToast();
	const [showTutorial, setShowTutorial] = useState(false);
	const hasCompletedBefore = useSyncExternalStore(
		() => () => {},                                    // no subscription needed
		() => Boolean(readOnboardingState().completedAt),  // client: reads localStorage
		() => false,                                       // server: always false
	);
	const [step, setStep] = useState<StepId>(1);
	const [draft, setDraft] = useState<OnboardingDraft>(() => {
		const saved = readOnboardingState();
		const preferences = readUserPreferences();
		return {
			businessName: saved.businessName,
			industry: saved.industry,
			skuRange: saved.skuRange,
			preferredLanguage: saved.completedAt
				? saved.preferredLanguage
				: preferences.language === "km"
					? "khmer"
					: "english",
			channels: saved.channels,
			alertChannel: saved.alertChannel,
			phoneOrEmail: saved.phoneOrEmail,
		};
	});

	// ── Telegram linking ─────────────────────────────────────────────────────
	// phase: "idle" | "waiting" | "connected" | "error"
	// activate() mints a token, opens t.me/bot?start=TOKEN, then polls /status?token=...
	const { phase, chatId, activate, stop: stopTelegram } = useTelegramLink();

	// When Telegram confirms, persist the chat ID and show toast
	useEffect(() => {
		if (phase !== "connected" || !chatId) return;
		writeNotificationSettings({ telegramChatId: chatId, enabled: true });
		showToast({
			title: "Telegram linked!",
			description: `Chat ID ${chatId} saved. Alerts are active.`,
		});
	}, [phase, chatId, showToast]);

	const telegramLinked  = phase === "connected";
	const telegramWaiting = phase === "waiting";

	// ── Persist draft ────────────────────────────────────────────────────────
	useEffect(() => {
		writeOnboardingState({ ...draft });
	}, [draft]);

	const progress = useMemo(() => Math.round(((step - 1) / 3) * 100), [step]);

	const toggleChannel = (channel: string) => {
		setDraft((current) => {
			if (current.channels.includes(channel)) {
				const next = current.channels.filter((c) => c !== channel);
				return { ...current, channels: next.length > 0 ? next : ["Walk-in"] };
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
		}
	};

	const previousStep = () => {
		if (step === 1) return;
		stopTelegram();
		setStep((s) => (s - 1) as StepId);
	};

	const completeOnboarding = () => {
		if (draft.alertChannel === "email" && draft.phoneOrEmail.trim().length < 4) {
			showToast({
				title: "Add your email",
				description: "Enter an email address to receive alerts.",
			});
			return;
		}
		writeOnboardingState({ ...draft, completedAt: new Date().toISOString() });
		updateUserPreferences({ language: draft.preferredLanguage === "khmer" ? "km" : "en" });
		stopTelegram();
		showToast({
			title: "Onboarding complete",
			description: "Your workspace is ready. Opening dashboard...",
		});
		router.push("/dashboard");
	};

	const skipTutorialForNow = () => {
		writeOnboardingState({ ...draft, completedAt: new Date().toISOString() });
		updateUserPreferences({ language: draft.preferredLanguage === "khmer" ? "km" : "en" });
		stopTelegram();
		showToast({
			title: "Setup skipped",
			description: "You can return to onboarding anytime from the Tutorial link.",
		});
		router.push("/dashboard");
	};

	// ── Welcome screen ───────────────────────────────────────────────────────
	if (!showTutorial) {
		return (
			<main className="min-h-screen bg-muted/20 px-4 py-8 sm:px-6 lg:py-10">
				<section className="mx-auto w-full max-w-3xl rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
					<p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
						SmartStock Setup
					</p>
					<h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
						Choose how you want to start
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Pick a guided tutorial or jump straight to the app. You can always revisit onboarding
						later.
					</p>

					{hasCompletedBefore && (
						<p className="mt-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-foreground">
							You already have setup data. Start the tutorial to review or update your preferences.
						</p>
					)}

					<div className="mt-6 grid gap-3 sm:grid-cols-2">
						<button
							type="button"
							onClick={() => setShowTutorial(true)}
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

	// ── Onboarding wizard ────────────────────────────────────────────────────
	return (
		<main className="min-h-screen bg-muted/20 px-4 py-8 sm:px-6 lg:py-10">
			<section className="mx-auto w-full max-w-3xl rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
							SmartStock Setup
						</p>
						<h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
							Complete your onboarding
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Step {step} of 3 to personalize your inventory workspace.
						</p>
					</div>
					<button
						type="button"
						onClick={skipTutorialForNow}
						className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground"
					>
						Skip for now
					</button>
				</div>

				<div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
					<div
						className="h-full rounded-full bg-primary transition-all"
						style={{ width: `${progress}%` }}
					/>
				</div>

				{/* ── Step 1 ── */}
				{step === 1 && (
					<article className="mt-6 space-y-4">
						<h2 className="text-lg font-semibold text-foreground">Business profile</h2>
						<label className="grid gap-1 text-sm text-foreground">
							Business name
							<input
								value={draft.businessName}
								onChange={(e) => setDraft((d) => ({ ...d, businessName: e.target.value }))}
								placeholder="Example: Sokha Mart"
								className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
							/>
						</label>
						<label className="grid gap-1 text-sm text-foreground">
							Industry
							<input
								value={draft.industry}
								onChange={(e) => setDraft((d) => ({ ...d, industry: e.target.value }))}
								placeholder="Example: Grocery and household"
								className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
							/>
						</label>
					</article>
				)}

				{/* ── Step 2 ── */}
				{step === 2 && (
					<article className="mt-6 space-y-4">
						<h2 className="text-lg font-semibold text-foreground">Inventory scope</h2>
						<label className="grid gap-1 text-sm text-foreground">
							Approximate SKU count
							<select
								value={draft.skuRange}
								onChange={(e) =>
									setDraft((d) => ({ ...d, skuRange: e.target.value as OnboardingDraft["skuRange"] }))
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

				{/* ── Step 3 ── */}
				{step === 3 && (
					<article className="mt-6 space-y-4">
						<h2 className="text-lg font-semibold text-foreground">Alerts and language</h2>

						<fieldset className="space-y-2">
							<legend className="text-sm font-medium text-foreground">Preferred language</legend>
							<div className="grid gap-2 sm:grid-cols-2">
								{(["english", "khmer"] as const).map((lang) => (
									<label
										key={lang}
										className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm text-foreground"
									>
										<input
											type="radio"
											name="preferred-language"
											checked={draft.preferredLanguage === lang}
											onChange={() => setDraft((d) => ({ ...d, preferredLanguage: lang }))}
										/>
										{lang === "english" ? "English" : "Khmer"}
									</label>
								))}
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
										onChange={() => setDraft((d) => ({ ...d, alertChannel: "telegram" }))}
									/>
									Telegram
								</label>
								<label className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm text-foreground">
									<input
										type="radio"
										name="alert-channel"
										checked={draft.alertChannel === "email"}
										onChange={() => {
											stopTelegram();
											setDraft((d) => ({ ...d, alertChannel: "email" }));
										}}
									/>
									Email
								</label>
							</div>
						</fieldset>

						{/* ── Telegram block ── */}
						{draft.alertChannel === "telegram" && (
							<div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
								<p className="text-sm font-medium text-foreground">
									Link your Telegram to receive alerts
								</p>

								{telegramLinked ? (
									/* ── Connected state ── */
									<p className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
										<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
											<polyline points="20 6 9 17 4 12" />
										</svg>
										Telegram linked — alerts are active.
									</p>
								) : (
									<>
										<p className="text-sm text-muted-foreground">
											{telegramWaiting
												? "Waiting for your message in Telegram…"
												: "Click the button below — it opens the bot with a secure link. Just send any message and you're done."}
										</p>

										<div className="flex flex-wrap items-center gap-2">
											{/*
                        ── ONE button does everything ──
                        activate() from useTelegramLink:
                          1. Calls POST /api/integrations/telegram/init → gets { token, botUrl }
                          2. Opens t.me/bot?start=TOKEN  (token rides back in /start payload)
                          3. Polls GET /api/integrations/telegram/status?token=TOKEN every 2s
                      */}
											<button
												type="button"
												onClick={activate}
												disabled={telegramWaiting}
												className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2AABEE] px-4 text-sm font-semibold text-white hover:bg-[#239DD5] disabled:opacity-60 transition-colors"
											>
												{telegramWaiting ? (
													<>
														<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
															<path d="M21 12a9 9 0 1 1-6.219-8.56" />
														</svg>
														Waiting for message…
													</>
												) : (
													<>
														<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
															<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
														</svg>
														Open @{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "SmartStock Bot"}
													</>
												)}
											</button>

											{phase === "error" && (
												<span className="text-xs text-amber-600 dark:text-amber-400">
                          Network error — still retrying…
                        </span>
											)}
										</div>

										<p className="text-xs text-muted-foreground">
											You can also do this later from the{" "}
											<Link
												href="/integrations"
												className="underline underline-offset-2 hover:text-foreground"
											>
												Integrations page
											</Link>
											.
										</p>
									</>
								)}
							</div>
						)}

						{/* ── Email block ── */}
						{draft.alertChannel === "email" && (
							<label className="grid gap-1 text-sm text-foreground">
								Email address
								<input
									value={draft.phoneOrEmail}
									onChange={(e) => setDraft((d) => ({ ...d, phoneOrEmail: e.target.value }))}
									placeholder="name@company.com"
									className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
								/>
							</label>
						)}
					</article>
				)}

				{/* ── Navigation ── */}
				<div className="mt-8 flex items-center justify-between gap-2">
					<button
						type="button"
						onClick={previousStep}
						disabled={step === 1}
						className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground disabled:opacity-40"
					>
						Back
					</button>

					{step < 3 ? (
						<button
							type="button"
							onClick={nextStep}
							className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
						>
							Next
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