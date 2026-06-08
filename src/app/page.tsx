"use client";

import Link from "next/link";
import { plans } from "@/lib/billing";
import { PublicHeader } from "@/components/marketing/public-header";
import { PublicFooter } from "@/components/marketing/public-footer";
import { useT } from "@/lib/i18n";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Package,
  TrendingUp,
  CheckCircle2,
  Zap,
  Globe,
  MessageSquare,
  Star,
  Users,
} from "lucide-react";

export default function Home() {
  const t = useT();

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-linear-to-br from-blue-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-16 sm:py-24 lg:py-28">
          <div className="absolute inset-0 bg-grid-pattern text-slate-900 opacity-[0.025]" />
          <div className="absolute top-20 left-1/4 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Left: headline + CTAs */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/60 dark:text-blue-300">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
                  </span>
                  {t("landing.tagline", "Built for Cambodia's SME retailers")}
                </div>

                <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl leading-[1.1]">
                  {t("landing.headlineStop", "Stop guessing.")}
                  <br />
                  <span className="bg-linear-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                    {t("landing.headlineStart", "Start knowing")}
                  </span>{" "}
                  {t("landing.headlineWhen", "when to reorder.")}
                </h1>

                <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">
                  {t("landing.heroDesc", "SmartStock uses AI to predict demand 30 days ahead, flag low stock, and send reorder alerts directly to your Telegram — so you never run out during Khmer New Year again.")}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/onboarding"
                    className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30"
                  >
                    {t("landing.trialCta", "Start free — 1 month trial")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {t("landing.seeHow", "See how it works")}
                  </Link>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> {t("landing.noCc", "No credit card")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> {t("landing.setupTime", "Setup in 10 min")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> {t("landing.cancelAnytime", "Cancel anytime")}
                  </span>
                </div>
              </div>

              {/* Right: product mockup */}
              <div className="relative lg:pl-4">
                {/* Floating Telegram notification */}
                <div className="absolute -right-2 -top-5 z-10 hidden w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800 sm:block">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2AABEE] text-[11px] font-bold text-white">
                      S
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                        {t("landing.telegramBot", "SmartStock Bot")}
                      </p>
                      <p className="text-[9px] text-slate-400">{t("landing.telegramJustNow", "Telegram · just now")}</p>
                    </div>
                    <span className="relative ml-auto flex h-2 w-2 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {t("landing.telegramAlertText", "📦 Blue T-Shirt (M) is running low. Order 25 units by Tuesday to avoid stockout.")}
                  </p>
                </div>

                {/* Main dashboard card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-700/50 dark:bg-slate-800/90">
                  {/* Fake browser chrome */}
                  <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-700/60 dark:bg-slate-800">
                    <div className="flex gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    </div>
                    <span className="ml-2 text-[10px] font-medium text-slate-400">
                      {t("landing.reorderQueueMock", "SmartStock · Reorder Queue")}
                    </span>
                  </div>

                  <div className="p-4 space-y-2.5">
                    {/* Urgent item */}
                    <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 dark:border-red-900/40 dark:bg-red-950/30">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
                          <Package className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {t("landing.mockItems.blueShirt", "Blue T-Shirt (M)")}
                          </p>
                          <p className="text-[10px] font-medium text-red-600 dark:text-red-400">
                            {t("landing.mockItems.blueShirtAlert", "3 left — Order 25 units by Tue")}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900/60 dark:text-red-300">
                        {t("landing.mockItems.urgent", "URGENT")}
                      </span>
                    </div>

                    {/* Warning item */}
                    <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/30">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                          <Package className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {t("landing.mockItems.rice", "Jasmine Rice (5kg)")}
                          </p>
                          <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                            {t("landing.mockItems.riceAlert", "12 left — Order 40 bags by Fri")}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                        {t("landing.mockItems.low", "LOW")}
                      </span>
                    </div>

                    {/* OK item */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-700/40 dark:bg-slate-700/30">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                          <Package className="h-3.5 w-3.5 text-slate-500" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {t("landing.mockItems.coconut", "Coconut Water (24pk)")}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {t("landing.mockItems.coconutAlert", "47 in stock · Forecast +18 this week")}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/60 dark:text-green-300">
                        {t("landing.mockItems.ok", "OK")}
                      </span>
                    </div>
                  </div>

                  {/* Mini forecast */}
                  <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-700/60">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {t("landing.forecastTitle", "30-Day Demand Forecast")}
                      </p>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                        <CheckCircle2 className="h-3 w-3" /> {t("landing.forecastAccuracy", "87% accuracy")}
                      </span>
                    </div>
                    <div className="flex h-10 items-end gap-0.5">
                      {[55, 70, 60, 85, 72, 90, 65, 88, 75, 92, 68, 95].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-blue-500/70 dark:bg-blue-400/60"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating stats pill */}
                <div className="absolute -bottom-3 -left-3 hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800 sm:flex">
                  <TrendingUp className="h-4 w-4 shrink-0 text-green-600" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("landing.stats.fewerStockouts", "70% fewer stockouts")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats bar ────────────────────────────────────────────────── */}
        <section className="border-y border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
              {[
                { value: "70%", labelKey: "landing.stats.fewerStockouts", defaultLabel: "Fewer stockouts" },
                { value: "5 hrs", labelKey: "landing.stats.hoursSaved", defaultLabel: "Saved per week" },
                { value: "85%+", labelKey: "landing.stats.accuracy", defaultLabel: "Forecast accuracy" },
                { value: "$15/mo", labelKey: "landing.stats.startingPrice", defaultLabel: "Starting price" },
              ].map((stat) => (
                <div key={stat.labelKey}>
                  <p className="bg-linear-to-r from-blue-600 to-indigo-500 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t(stat.labelKey, stat.defaultLabel)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Problem statement ────────────────────────────────────────── */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {t("landing.problemTag", "The problem")}
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                {t("landing.problemTitle", "Running out of stock costs you money. Especially when you can't afford it.")}
              </h2>
              <p className="mt-4 text-base text-slate-500 dark:text-slate-400 sm:text-lg">
                {t("landing.problemDesc", "70% of Cambodian SMEs still track inventory with notebooks and Excel. When Khmer New Year hits, they either run out of best-sellers or lock up cash in overstock.")}
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              {[
                {
                  emoji: "😰",
                  titleKey: "landing.problems.0.title",
                  defaultTitle: "Guesswork reordering",
                  descKey: "landing.problems.0.desc",
                  defaultDesc: '"Should I call my supplier? I think we\'re low…" Then customers start asking and it\'s too late.',
                },
                {
                  emoji: "📉",
                  titleKey: "landing.problems.1.title",
                  defaultTitle: "Peak season disasters",
                  descKey: "landing.problems.1.desc",
                  defaultDesc: "Run out during Pchum Ben or 11.11 when demand spikes. Lost sales you'll never get back.",
                },
                {
                  emoji: "💸",
                  titleKey: "landing.problems.2.title",
                  defaultTitle: "Cash locked in overstock",
                  descKey: "landing.problems.2.desc",
                  defaultDesc: "Order too much to avoid stockouts, but now your money sits on shelves instead of working for you.",
                },
              ].map((item) => (
                <div
                  key={item.titleKey}
                  className="group rounded-2xl border border-red-100 bg-linear-to-b from-red-50 to-white p-6 transition-all hover:border-red-200 hover:shadow-md dark:border-red-900/30 dark:from-red-950/30 dark:to-transparent"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-xl dark:bg-red-900/40">
                    {item.emoji}
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-800 dark:text-slate-200">
                    {t(item.titleKey, item.defaultTitle)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {t(item.descKey, item.defaultDesc)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section
          id="how-it-works"
          className="bg-linear-to-b from-slate-50 to-white py-16 dark:from-slate-900/60 dark:to-transparent sm:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {t("landing.howItWorksTag", "How it works")}
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                {t("landing.howItWorksTitle", "From manual tracking to intelligent decisions")}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500 dark:text-slate-400">
                {t("landing.howItWorksDesc", "Built for sellers who live on their phones, not desktop dashboards.")}
              </p>
            </div>

            <div className="relative mt-14 grid gap-8 lg:grid-cols-3">
              {/* Connector line (desktop) */}
              <div className="absolute left-[calc(16.7%+24px)] right-[calc(16.7%+24px)] top-6 hidden h-px bg-linear-to-r from-blue-200 via-indigo-300 to-blue-200 dark:from-blue-800/50 dark:via-indigo-700/50 dark:to-blue-800/50 lg:block" />

              {[
                {
                  step: 1,
                  titleKey: "landing.steps.0.title",
                  defaultTitle: "Upload your sales data",
                  descKey: "landing.steps.0.desc",
                  defaultDesc: "Import from CSV, connect your POS, or paste Facebook Messenger orders. Our AI understands Khmer and English mixed messages.",
                  detailKey: "landing.steps.0.detail",
                  defaultDetail: "Facebook Messenger parsing included",
                  icon: <MessageSquare className="h-4 w-4" />,
                },
                {
                  step: 2,
                  titleKey: "landing.steps.1.title",
                  defaultTitle: "AI predicts demand",
                  descKey: "landing.steps.1.desc",
                  defaultDesc: "Get 30-day forecasts for every product. Our model knows Cambodia's calendar — Khmer New Year, Pchum Ben, 11.11 shopping events.",
                  detailKey: "landing.steps.1.detail",
                  defaultDetail: "85%+ accuracy after 60 days",
                  icon: <TrendingUp className="h-4 w-4" />,
                },
                {
                  step: 3,
                  titleKey: "landing.steps.2.title",
                  defaultTitle: "Get alerts on Telegram",
                  descKey: "landing.steps.2.desc",
                  defaultDesc: 'Every morning at 8 AM: "Blue T-Shirt (M) — Order 25 units by Tuesday." No desktop needed. Just tap, call your supplier, done.',
                  detailKey: "landing.steps.2.detail",
                  defaultDetail: "Alerts in English or Khmer",
                  icon: <Bell className="h-4 w-4" />,
                },
              ].map((item) => (
                <div key={item.step} className="relative flex flex-col items-start">
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-500/30">
                    {item.step}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                    {t(item.titleKey, item.defaultTitle)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {t(item.descKey, item.defaultDesc)}
                  </p>
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    {item.icon}
                    {t(item.detailKey, item.defaultDetail)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {t("landing.featuresTag", "Features")}
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                {t("landing.featuresTitle", "Everything you need to stop stockouts")}
              </h2>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: <BarChart3 className="h-6 w-6" />,
                  titleKey: "landing.features.0.title",
                  defaultTitle: "AI Demand Forecasting",
                  descKey: "landing.features.0.desc",
                  defaultDesc: "30-day predictions with seasonal awareness for Cambodia's peak shopping periods.",
                  color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
                },
                {
                  icon: <Bell className="h-6 w-6" />,
                  titleKey: "landing.features.1.title",
                  defaultTitle: "Smart Reorder Alerts",
                  descKey: "landing.features.1.desc",
                  defaultDesc: "Automatic notifications with recommended quantities before you run out.",
                  color: "text-violet-600 bg-violet-50 dark:bg-violet-950/50 dark:text-violet-400",
                },
                {
                  icon: <MessageSquare className="h-6 w-6" />,
                  titleKey: "landing.features.2.title",
                  defaultTitle: "Messenger Parsing",
                  descKey: "landing.features.2.desc",
                  defaultDesc: "Paste order messages, AI extracts products and quantities. Khmer + English supported.",
                  color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400",
                },
                {
                  icon: <Package className="h-6 w-6" />,
                  titleKey: "landing.features.3.title",
                  defaultTitle: "Multi-Channel Sync",
                  descKey: "landing.features.3.desc",
                  defaultDesc: "One view of stock across Facebook, walk-in, and online sales channels.",
                  color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50 dark:text-cyan-400",
                },
                {
                  icon: <Globe className="h-6 w-6" />,
                  titleKey: "landing.features.4.title",
                  defaultTitle: "Khmer Language Support",
                  descKey: "landing.features.4.desc",
                  defaultDesc: "Full UI and alerts in Khmer or English. Switch anytime.",
                  color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
                },
                {
                  icon: <TrendingUp className="h-6 w-6" />,
                  titleKey: "landing.features.5.title",
                  defaultTitle: "Seasonal Trend Detection",
                  descKey: "landing.features.5.desc",
                  defaultDesc: "Built-in awareness of Khmer New Year, Pchum Ben, and 11.11 shopping events.",
                  color: "text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400",
                },
                {
                  icon: <BarChart3 className="h-6 w-6" />,
                  titleKey: "landing.features.6.title",
                  defaultTitle: "Sales Analytics",
                  descKey: "landing.features.6.desc",
                  defaultDesc: "Track trends, top sellers, and forecast accuracy in one dashboard.",
                  color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
                },
                {
                  icon: <Zap className="h-6 w-6" />,
                  titleKey: "landing.features.7.title",
                  defaultTitle: "10-Minute Setup",
                  descKey: "landing.features.7.desc",
                  defaultDesc: "Guided onboarding with demo mode. No tech skills required.",
                  color: "text-orange-600 bg-orange-50 dark:bg-orange-950/50 dark:text-orange-400",
                },
              ].map((f) => (
                <div
                  key={f.titleKey}
                  className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${f.color}`}>
                    {f.icon}
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-800 dark:text-slate-200">{t(f.titleKey, f.defaultTitle)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{t(f.descKey, f.defaultDesc)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────────────────── */}
        <section className="bg-linear-to-b from-slate-50 to-white py-16 dark:from-slate-900/60 dark:to-transparent sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {t("landing.pricingTag", "Pricing")}
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                {t("landing.pricingTitle", "Enterprise AI at SME pricing")}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500 dark:text-slate-400">
                {t("landing.pricingDesc", "Start with 1 month free. No credit card required. Cancel anytime.")}
              </p>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-4 lg:gap-6">
              {plans.map((plan, idx) => (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border p-6 shadow-sm transition-all hover:shadow-lg ${
                    idx === 1
                      ? "border-blue-500 bg-linear-to-b from-blue-600 to-blue-700 text-white ring-4 ring-blue-500/20"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  }`}
                >
                  {idx === 1 && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900 shadow">
                      {t("billing.mostPopular", "Most Popular")}
                    </div>
                  )}

                  <div>
                    <h3
                      className={`text-lg font-bold ${idx === 1 ? "text-white" : "text-slate-900 dark:text-white"}`}
                    >
                      {t(`billing.plans.${plan.id}.name`, plan.name)}
                    </h3>
                    <p
                      className={`mt-1 text-xs ${idx === 1 ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}
                    >
                      {t(`billing.plans.${plan.id}.targetCustomer`, plan.targetCustomer)}
                    </p>
                  </div>

                  <div className="mt-5">
                    <p className="flex items-baseline gap-1">
                      <span
                        className={`text-3xl font-bold ${idx === 1 ? "text-white" : "text-slate-900 dark:text-white"}`}
                      >
                        {plan.monthlyPriceLabel.split("/")[0]}
                      </span>
                      {plan.monthlyPriceUsd && (
                        <span
                          className={`text-sm ${idx === 1 ? "text-blue-100" : "text-slate-400"}`}
                        >
                          {t("billing.cycleMonth", "/month")}
                        </span>
                      )}
                    </p>
                  </div>

                  <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                    {plan.features.map((feature, featureIdx) => (
                      <li key={`${plan.id}-${feature}`} className="flex items-start gap-2.5">
                        <CheckCircle2
                          className={`mt-0.5 h-4 w-4 shrink-0 ${idx === 1 ? "text-blue-200" : "text-blue-500"}`}
                        />
                        <span className={idx === 1 ? "text-blue-50" : "text-slate-500 dark:text-slate-400"}>
                          {t(`billing.plans.${plan.id}.features.${featureIdx}`, feature)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/billing"
                    className={`mt-7 block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all ${
                      idx === 1
                        ? "bg-white text-blue-700 hover:bg-blue-50"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    {t("billing.startTrial", "Start free trial")}
                  </Link>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-sm text-slate-400">
              {t("landing.pricingDisclaimer", "All plans include 1 month free trial · Annual plans save 20% · Custom enterprise pricing available")}
            </p>
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────────────────── */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {t("landing.testimonialsTag", "Testimonials")}
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                {t("landing.testimonialsTitle", "Trusted by retailers across Phnom Penh")}
              </h2>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  quoteKey: "landing.testimonials.0.quote",
                  defaultQuote: "I only realize I'm out of stock when customers start asking. By then it's already too late. SmartStock tells me before I run out — saved me during last Khmer New Year.",
                  nameKey: "landing.testimonials.0.name",
                  defaultName: "Lika",
                  roleKey: "landing.testimonials.0.role",
                  defaultRole: "Clothing seller via Facebook, Phnom Penh",
                  initial: "L",
                },
                {
                  quoteKey: "landing.testimonials.1.quote",
                  defaultQuote: "Setting up took less than 15 minutes. Now I get a Telegram message every morning telling me what to order. I don't even look at my Excel file anymore.",
                  nameKey: "landing.testimonials.1.name",
                  defaultName: "Dara",
                  roleKey: "landing.testimonials.1.role",
                  defaultRole: "Grocery store owner, Toul Kork",
                  initial: "D",
                },
                {
                  quoteKey: "landing.testimonials.2.quote",
                  defaultQuote: "During the 11.11 sale, SmartStock predicted the spike 2 weeks early. I ordered extra stock and sold out completely — best sale day ever.",
                  nameKey: "landing.testimonials.2.name",
                  defaultName: "Sreymom",
                  roleKey: "landing.testimonials.2.role",
                  defaultRole: "Cosmetics & beauty shop, BKK1",
                  initial: "S",
                },
              ].map((testi) => (
                <div
                  key={testi.defaultName}
                  className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    &ldquo;{t(testi.quoteKey, testi.defaultQuote)}&rdquo;
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {testi.initial}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t(testi.nameKey, testi.defaultName)}</p>
                      <p className="text-xs text-slate-400">{t(testi.roleKey, testi.defaultRole)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <section className="pb-16 sm:pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-600 via-blue-700 to-indigo-700 px-6 py-14 text-center sm:px-12 sm:py-20">
              <div className="absolute inset-0 bg-grid-pattern text-white opacity-[0.07]" />
              <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
              <div className="absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-indigo-400/20 blur-2xl" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                  <Users className="h-3.5 w-3.5" />
                  {t("landing.finalCtaTag", "Join retailers across Cambodia")}
                </div>

                <h2 className="mt-5 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                  {t("landing.finalCtaTitle", "Stop running out of stock during peak season")}
                </h2>

                <p className="mx-auto mt-4 max-w-xl text-base text-blue-100 sm:text-lg">
                  {t("landing.finalCtaDesc", "Join Cambodian SMEs using SmartStock to reduce stockouts, free up cash, and make smarter reorder decisions every day.")}
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-blue-700 shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                  >
                    {t("landing.finalCtaButton", "Start your free trial")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/billing"
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-7 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    {t("landing.finalCtaPricing", "View pricing")}
                  </Link>
                </div>

                <p className="mt-6 text-sm text-blue-200">
                  {t("landing.finalCtaSubtext", "✓ No credit card required  ·  ✓ Setup in 10 minutes  ·  ✓ Cancel anytime")}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
