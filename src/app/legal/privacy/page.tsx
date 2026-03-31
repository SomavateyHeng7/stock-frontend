import { PublicPageShell } from "@/components/marketing/public-page-shell";

export default function PrivacyPolicyPage() {
  return (
    <PublicPageShell
      title="Privacy Policy"
      subtitle="How SmartStock handles account information and operational data."
    >
      <section className="rounded-2xl border border-border/70 bg-card p-5 text-sm text-muted-foreground shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Summary</h2>
        <p className="mt-2">
          We collect data needed to provide inventory analytics, alerts, and billing features. We do not sell personal data.
        </p>

        <h2 className="mt-5 text-base font-semibold text-foreground">Data we process</h2>
        <ul className="mt-2 space-y-1">
          <li>• Account and contact information</li>
          <li>• Inventory, supplier, and movement records you enter</li>
          <li>• Billing preferences and plan data</li>
        </ul>

        <h2 className="mt-5 text-base font-semibold text-foreground">Retention and deletion</h2>
        <p className="mt-2">
          Data retention depends on your subscription state and legal obligations. You can request data deletion via support.
        </p>
      </section>
    </PublicPageShell>
  );
}
