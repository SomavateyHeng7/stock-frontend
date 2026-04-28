"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { readUserPreferences, updateUserPreferences } from "@/lib/user-preferences";
import { writeNotificationSettings } from "@/lib/notification-settings";
import { useTelegramLink } from "@/hooks/use-telegram-link";
import { useSyncExternalStore } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Package,
  Sparkles,
  ShoppingBag,
  Share2,
  Truck,
  Globe,
  Mail,
  Building2,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
      Array.isArray(next.channels) && next.channels.length > 0 ? next.channels : current.channels,
  };
  window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify(merged));
}

/* ── Small components ──────────────────────────────────────────────────── */

function StepDots({ current, total }: { current: StepId; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
              n < current
                ? "bg-blue-600 text-white"
                : n === current
                  ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/50"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-800"
            }`}
          >
            {n < current ? <CheckCircle2 className="h-4 w-4" /> : n}
          </div>
          {n < total && (
            <div
              className={`h-px w-8 transition-all ${n < current ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────── */

export default function OnboardingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [showTutorial, setShowTutorial] = useState(false);

  const hasCompletedBefore = useSyncExternalStore(
    () => () => {},
    () => Boolean(readOnboardingState().completedAt),
    () => false,
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

  const { phase, chatId, activate, stop: stopTelegram } = useTelegramLink();

  useEffect(() => {
    if (phase !== "connected" || !chatId) return;
    writeNotificationSettings({ telegramChatId: chatId, enabled: true });
    showToast({
      title: "Telegram linked!",
      description: `Chat ID ${chatId} saved. Alerts are active.`,
    });
  }, [phase, chatId, showToast]);

  const telegramLinked = phase === "connected";
  const telegramWaiting = phase === "waiting";

  useEffect(() => {
    writeOnboardingState({ ...draft });
  }, [draft]);

  const progress = useMemo(() => Math.round((step / 3) * 100), [step]);

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

  /* ── Shared header bar ─────────────────────────────────────────────── */
  const Header = (
    <header className="flex items-center justify-between px-4 py-4 sm:px-6">
      <Link
        href="/"
        className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 dark:text-white"
      >
        <Package className="h-5 w-5 text-blue-600" />
        Smart<span className="text-blue-600">Stock</span>
      </Link>
      <Link
        href="/"
        className="text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        ← Back to home
      </Link>
    </header>
  );

  /* ── Welcome screen ────────────────────────────────────────────────── */
  if (!showTutorial) {
    return (
      <main className="flex min-h-screen flex-col bg-linear-to-br from-blue-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {Header}

        <div className="flex flex-1 items-start justify-center px-4 py-8 sm:px-6 sm:py-12">
          <div className="w-full max-w-2xl">
            {/* Top section */}
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30">
                <Package className="h-7 w-7 text-white" />
              </div>
              <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Let&apos;s set up your SmartStock
              </h1>
              <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
                Takes about 3 minutes. You can skip or change anything later.
              </p>
            </div>

            {hasCompletedBefore && (
              <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-300">
                You already have setup data. Start the tutorial to review or update your
                preferences.
              </div>
            )}

            {/* Choice cards */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowTutorial(true)}
                className="group flex flex-col items-start rounded-2xl border-2 border-blue-500 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-900"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                  Guided setup tour
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  We&apos;ll walk you through business profile, sales channels, and alert setup.
                  Personalized in 3 steps.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Start guided tour
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              <button
                type="button"
                onClick={skipTutorialForNow}
                className="group flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                  <Globe className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                  Explore on my own
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Go straight to the dashboard and explore at your own pace. Setup is available
                  anytime from the Tutorial menu.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Skip for now
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </div>

            {/* What you'll configure */}
            <div className="mt-6 rounded-xl border border-slate-100 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                What the guided setup covers
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {[
                  { label: "Business profile", step: "Step 1" },
                  { label: "Sales channels & SKU count", step: "Step 2" },
                  { label: "Alert preferences", step: "Step 3" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    <div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-slate-400">{item.step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ── Wizard ────────────────────────────────────────────────────────── */
  const stepMeta = [
    { title: "Business profile", subtitle: "Tell us about your store" },
    { title: "Inventory & channels", subtitle: "Where and what you sell" },
    { title: "Alerts & language", subtitle: "How you want to be notified" },
  ] as const;

  return (
    <main className="flex min-h-screen flex-col bg-linear-to-br from-blue-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {Header}

      <div className="flex flex-1 items-start justify-center px-4 py-6 sm:px-6 sm:py-8">
        <div className="w-full max-w-xl">
          {/* Step progress dots */}
          <div className="flex items-center justify-between">
            <StepDots current={step} total={3} />
            <button
              type="button"
              onClick={skipTutorialForNow}
              className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
            >
              Skip for now
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-linear-to-r from-blue-600 to-indigo-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Card */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/50 dark:bg-slate-900">
            {/* Card header */}
            <div className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-6 py-4 dark:border-slate-700/60 dark:from-slate-800/60 dark:to-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                Step {step} of 3
              </p>
              <h1 className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">
                {stepMeta[step - 1].title}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {stepMeta[step - 1].subtitle}
              </p>
            </div>

            {/* Card body */}
            <div className="px-6 py-5">
              {/* ── Step 1: Business profile ── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      Business name
                    </label>
                    <input
                      value={draft.businessName}
                      onChange={(e) => setDraft((d) => ({ ...d, businessName: e.target.value }))}
                      placeholder="Example: Sokha Mart"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                      <Tag className="h-4 w-4 text-slate-400" />
                      Industry / product type
                    </label>
                    <input
                      value={draft.industry}
                      onChange={(e) => setDraft((d) => ({ ...d, industry: e.target.value }))}
                      placeholder="Example: Grocery and household"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-800"
                    />
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-950/30">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <strong>Why we ask:</strong> This helps SmartStock tailor forecasts and alerts
                      to your specific product category and business size.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Step 2: Inventory scope ── */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Approximate SKU count
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { value: "under-100", label: "Under 100", sub: "Micro" },
                          { value: "100-300", label: "100–300", sub: "Growing" },
                          { value: "300-plus", label: "300+", sub: "Established" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDraft((d) => ({ ...d, skuRange: opt.value }))}
                          className={`rounded-xl border px-3 py-3 text-left transition-all ${
                            draft.skuRange === opt.value
                              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 dark:bg-blue-950/40"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                          }`}
                        >
                          <p
                            className={`text-sm font-bold ${draft.skuRange === opt.value ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-200"}`}
                          >
                            {opt.label}
                          </p>
                          <p className="text-[11px] text-slate-400">{opt.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Where do you sell? <span className="text-slate-400">(select all that apply)</span>
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-3">
                      {[
                        {
                          id: "Walk-in",
                          label: "Walk-in",
                          sub: "Physical store",
                          icon: <ShoppingBag className="h-5 w-5" />,
                        },
                        {
                          id: "Facebook",
                          label: "Facebook",
                          sub: "Marketplace / page",
                          icon: <Share2 className="h-5 w-5" />,
                        },
                        {
                          id: "Delivery",
                          label: "Delivery",
                          sub: "Online orders",
                          icon: <Truck className="h-5 w-5" />,
                        },
                      ].map((ch) => {
                        const active = draft.channels.includes(ch.id);
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => toggleChannel(ch.id)}
                            className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all ${
                              active
                                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 dark:bg-blue-950/40"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                            }`}
                          >
                            <span
                              className={`${active ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}
                            >
                              {ch.icon}
                            </span>
                            <span>
                              <p
                                className={`text-sm font-semibold ${active ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}
                              >
                                {ch.label}
                              </p>
                              <p className="text-[11px] text-slate-400">{ch.sub}</p>
                            </span>
                            {active && (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 3: Alerts & language ── */}
              {step === 3 && (
                <div className="space-y-5">
                  {/* Language */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Preferred language
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {(["english", "khmer"] as const).map((lang) => {
                        const active = draft.preferredLanguage === lang;
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setDraft((d) => ({ ...d, preferredLanguage: lang }))}
                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                              active
                                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 dark:bg-blue-950/40"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                            }`}
                          >
                            <span className="text-xl">{lang === "english" ? "🇬🇧" : "🇰🇭"}</span>
                            <span>
                              <p
                                className={`text-sm font-semibold ${active ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}
                              >
                                {lang === "english" ? "English" : "ខ្មែរ (Khmer)"}
                              </p>
                            </span>
                            {active && (
                              <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-blue-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Alert channel */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      How should we send you alerts?
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        {
                          id: "telegram" as const,
                          label: "Telegram",
                          sub: "Recommended",
                          icon: (
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
                            </svg>
                          ),
                          color: "text-[#2AABEE]",
                        },
                        {
                          id: "email" as const,
                          label: "Email",
                          sub: "Inbox alerts",
                          icon: <Mail className="h-5 w-5" />,
                          color: "text-slate-500",
                        },
                      ].map((ch) => {
                        const active = draft.alertChannel === ch.id;
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => {
                              if (ch.id !== "telegram") stopTelegram();
                              setDraft((d) => ({ ...d, alertChannel: ch.id }));
                            }}
                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                              active
                                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 dark:bg-blue-950/40"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                            }`}
                          >
                            <span className={active ? "text-blue-600 dark:text-blue-400" : ch.color}>
                              {ch.icon}
                            </span>
                            <span>
                              <p
                                className={`text-sm font-semibold ${active ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}
                              >
                                {ch.label}
                              </p>
                              <p className="text-[11px] text-slate-400">{ch.sub}</p>
                            </span>
                            {active && (
                              <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-blue-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Telegram linking */}
                  {draft.alertChannel === "telegram" && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 dark:border-slate-700/60 dark:bg-slate-800/50">
                      {telegramLinked ? (
                        <p className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
                          <CheckCircle2 className="h-4 w-4" />
                          Telegram linked — alerts are active.
                        </p>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {telegramWaiting
                              ? "Waiting for your message in Telegram…"
                              : "Connect Telegram to receive your daily reorder alerts"}
                          </p>
                          {!telegramWaiting && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Click below — it opens the bot with a secure link. Just send any
                              message and you&apos;re done.
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={activate}
                              disabled={telegramWaiting}
                              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2AABEE] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#239DD5] disabled:opacity-60"
                            >
                              {telegramWaiting ? (
                                <>
                                  <svg
                                    className="h-4 w-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                  </svg>
                                  Waiting for message…
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
                                  </svg>
                                  Open @
                                  {process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ??
                                    "SmartStock Bot"}
                                </>
                              )}
                            </button>
                            {phase === "error" && (
                              <span className="text-xs text-amber-600 dark:text-amber-400">
                                Network error — still retrying…
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            You can also do this later from the{" "}
                            <Link
                              href="/integrations"
                              className="underline underline-offset-2 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              Integrations page
                            </Link>
                            .
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Email input */}
                  {draft.alertChannel === "email" && (
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                        <Mail className="h-4 w-4 text-slate-400" />
                        Email address
                      </label>
                      <input
                        value={draft.phoneOrEmail}
                        onChange={(e) => setDraft((d) => ({ ...d, phoneOrEmail: e.target.value }))}
                        placeholder="name@company.com"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-800"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card footer: nav buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-700/60">
              <button
                type="button"
                onClick={previousStep}
                disabled={step === 1}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition-colors hover:bg-blue-700"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={completeOnboarding}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition-colors hover:bg-blue-700"
                >
                  Finish setup
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
