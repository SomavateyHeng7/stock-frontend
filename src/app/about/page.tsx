import { PublicPageShell } from "@/components/marketing/public-page-shell";

export default function AboutPage() {
  return (
    <PublicPageShell
      title="About SmartStock"
      subtitle="We help SME retailers move from reactive stock management to proactive inventory decisions."
    >
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Our mission</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Reduce preventable stockouts and overstock for retail teams that do not have enterprise tools or dedicated analysts.
          </p>
        </article>
        <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">What we believe</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Inventory systems should be practical, mobile-friendly, and understandable by frontline operators, not only back-office teams.
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Who we build for</h2>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          <li>• Micro and growing SMEs managing 50 to 300+ SKUs</li>
          <li>• Multi-branch stores that need branch-level visibility</li>
          <li>• Teams that rely on messaging apps and quick operational decisions</li>
        </ul>
      </section>
    </PublicPageShell>
  );
}
