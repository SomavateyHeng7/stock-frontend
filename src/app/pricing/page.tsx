import Link from "next/link";
import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { plans } from "@/lib/billing";

export default function PricingPage() {
  return (
    <PublicPageShell
      title="Pricing"
      subtitle="Simple monthly pricing with a 1-month free trial for every plan."
    >
      <section className="grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => (
          <article key={plan.id} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground">{plan.name}</h2>
            <p className="mt-1 text-sm font-medium text-foreground">{plan.monthlyPriceLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">{plan.targetCustomer}</p>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {plan.features.map((feature) => (
                <li key={`${plan.id}-${feature}`}>• {feature}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Ready to start? Begin with the free trial and select your plan when you are ready.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/dashboard" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Start free trial
          </Link>
          <Link href="/billing" className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground">
            Manage billing
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
