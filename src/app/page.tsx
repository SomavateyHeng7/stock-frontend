import Link from "next/link";
import { plans } from "@/lib/billing";
import { ArrowRight, BarChart3, Bell, Package, TrendingUp, CheckCircle2, Zap, Globe, MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-background via-background to-muted/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
              <Zap className="h-3 w-3" />
              <span>Built for Cambodia's SME retailers</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-8 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Stop guessing.
              <br />
              <span className="bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Start knowing
              </span>{" "}
              when to reorder.
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
              SmartStock uses AI to predict demand 30 days ahead, automatically flag low stock, and send reorder alerts
              directly to your Telegram — so you never run out during Khmer New Year again.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                Start free trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                See how it works
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>1 month free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Setup in 10 minutes</span>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-16 rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
            <p className="text-center text-sm font-medium text-muted-foreground">
              Trusted by retailers across Phnom Penh
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-center text-sm sm:grid-cols-4">
              <div>
                <p className="text-2xl font-bold text-foreground">70%</p>
                <p className="text-xs text-muted-foreground">Fewer stockouts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">5 hrs</p>
                <p className="text-xs text-muted-foreground">Saved per week</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">85%+</p>
                <p className="text-xs text-muted-foreground">Forecast accuracy</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">$15/mo</p>
                <p className="text-xs text-muted-foreground">Starting price</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Running out of stock costs you money.
              <br />
              <span className="text-muted-foreground">Especially when you can't afford it.</span>
            </h2>
            <p className="mt-6 text-base text-muted-foreground sm:text-lg">
              70% of Cambodian SMEs still track inventory with notebooks and Excel. When Khmer New Year hits, they either
              run out of best-sellers or lock up cash in overstock. There's a better way.
            </p>
          </div>

          {/* Pain Points */}
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <span className="text-lg font-bold">😰</span>
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Guesswork reordering</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                "Should I call my supplier? I think we're low..." Then customers start asking and it's too late.
              </p>
            </div>

            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <span className="text-lg font-bold">📉</span>
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Peak season disasters</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Run out during Pchum Ben or 11.11 when demand spikes. Lost sales you'll never get back.
              </p>
            </div>

            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <span className="text-lg font-bold">💸</span>
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Cash locked in overstock</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Order too much to avoid stockouts, but now your money is sitting on shelves instead of working.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">How it works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              From manual tracking to intelligent decisions
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
              SmartStock turns your sales history into actionable forecasts and alerts — built for sellers who live on
              their phones, not desktop dashboards.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                1
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">Upload your sales data</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Import from CSV, connect your POS, or paste Facebook Messenger orders. Our AI understands Khmer and
                English mixed messages.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-primary">
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">Facebook Messenger parsing included</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                2
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">AI predicts demand</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get 30-day forecasts for every product. Our model knows Cambodia's calendar — Khmer New Year, Pchum Ben,
                11.11 shopping events.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-primary">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">85%+ accuracy after 60 days</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                3
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">Get alerts on Telegram</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every morning at 8 AM: "Blue T-Shirt (M) — Order 25 units by Tuesday." No desktop needed. Just tap, call
                your supplier, done.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-primary">
                <Bell className="h-4 w-4" />
                <span className="font-medium">Alerts in English or Khmer</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to stop stockouts
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">AI Demand Forecasting</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                30-day predictions with seasonal awareness for Cambodia's peak shopping periods.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Smart Reorder Alerts</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Automatic notifications with recommended quantities before you run out.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Facebook Messenger Parsing</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Paste order messages, AI extracts products and quantities. Khmer + English supported.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Multi-Channel Sync</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                One view of stock across Facebook, walk-in, and online sales channels.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Khmer Language Support</h3>
              <p className="mt-2 text-sm text-muted-foreground">Full UI and alerts in Khmer or English. Switch anytime.</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Seasonal Trend Detection</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Built-in awareness of Khmer New Year, Pchum Ben, and shopping events.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Sales Analytics</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Track trends, top sellers, and forecast accuracy in one dashboard.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">10-Minute Setup</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Guided onboarding with demo mode. No tech skills required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Pricing</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Enterprise AI at SME pricing
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
              Start with 1 month free. No credit card required. Cancel anytime.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-4 lg:gap-8">
            {plans.map((plan, idx) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 shadow-sm transition-all hover:shadow-lg ${
                  idx === 1
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card"
                }`}
              >
                {idx === 1 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full border border-primary bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.targetCustomer}</p>
                </div>

                <div className="mt-6">
                  <p className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{plan.monthlyPriceLabel.split("/")[0]}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </p>
                </div>

                <ul className="mt-6 space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={`${plan.id}-${feature}`} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/billing"
                  className={`mt-8 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                    idx === 1
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  Start free trial
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            All plans include 1 month free trial • Annual plans save 20% • Custom enterprise pricing available
          </p>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-12">
            <div className="flex items-start gap-1 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <blockquote className="mt-6 text-lg text-foreground sm:text-xl">
              "I only realize I'm out of stock when customers start asking. By then it's already too late. SmartStock
              tells me <strong>before</strong> I run out — saved me during last Khmer New Year."
            </blockquote>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                L
              </div>
              <div>
                <p className="font-semibold text-foreground">Lika</p>
                <p className="text-sm text-muted-foreground">Clothing seller via Facebook, Phnom Penh</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary to-primary/80 px-6 py-12 text-center sm:px-12 sm:py-16">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Stop running out of stock during peak season
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-primary-foreground/90 sm:text-lg">
                Join Cambodian SMEs using SmartStock to reduce stockouts, free up cash, and make smarter reorder
                decisions every day.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary shadow-lg transition-transform hover:scale-105"
                >
                  Start your free trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/billing"
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-white/30 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  View pricing
                </Link>
              </div>

              <p className="mt-6 text-sm text-primary-foreground/80">
                ✓ No credit card required • ✓ Setup in 10 minutes • ✓ Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">SmartStock</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 SomaTech. Built for Cambodia's SME retailers.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/features" className="hover:text-foreground">
                Features
              </Link>
              <Link href="/pricing" className="hover:text-foreground">
                Pricing
              </Link>
              <Link href="/faq" className="hover:text-foreground">
                FAQ
              </Link>
              <Link href="/legal/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/legal/terms" className="hover:text-foreground">
                Terms
              </Link>
              <a href="mailto:somatech18@gmail.com" className="hover:text-foreground">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}