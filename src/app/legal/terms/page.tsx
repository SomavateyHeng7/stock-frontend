import { PublicPageShell } from "@/components/marketing/public-page-shell";

export default function TermsPage() {
  return (
    <PublicPageShell title="Terms of Service" subtitle="Rules and conditions for using SmartStock.">
      <section className="rounded-2xl border border-border/70 bg-card p-5 text-sm text-muted-foreground shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Service usage</h2>
        <p className="mt-2">
          You are responsible for maintaining accurate account information and using the service in compliance with local laws.
        </p>

        <h2 className="mt-5 text-base font-semibold text-foreground">Billing terms</h2>
        <p className="mt-2">
          Paid plans renew according to selected billing terms. Plan access and limits follow the active subscription tier.
        </p>

        <h2 className="mt-5 text-base font-semibold text-foreground">Availability and support</h2>
        <p className="mt-2">
          We aim for high service availability. Support response times may vary by plan tier.
        </p>
      </section>
    </PublicPageShell>
  );
}
