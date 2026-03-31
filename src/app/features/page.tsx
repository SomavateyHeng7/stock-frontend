import { PublicPageShell } from "@/components/marketing/public-page-shell";

const featureGroups = [
  {
    title: "Forecasting and planning",
    items: [
      "30-day demand forecast",
      "Seasonal demand trend support",
      "Smart reorder quantity suggestions",
      "Low-stock and stockout risk signals",
    ],
  },
  {
    title: "Inventory operations",
    items: [
      "Branch/location scoped stock",
      "Ledger-backed stock movements",
      "Delivery receiving with accepted/damaged/missing units",
      "Inventory movement history with actor and reason",
    ],
  },
  {
    title: "Supplier and procurement",
    items: [
      "Supplier tracking and verification",
      "Lead-time history",
      "Reorder queue management",
      "Manual and bulk supplier import",
    ],
  },
  {
    title: "Reporting and alerts",
    items: [
      "Low-stock SLA checks",
      "In-app notification engine",
      "CSV and printable report export",
      "Role-ready billing plan gating",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <PublicPageShell
      title="Features"
      subtitle="SmartStock combines forecasting, inventory control, supplier workflows, and alerts in one workspace."
    >
      <section className="grid gap-4 lg:grid-cols-2">
        {featureGroups.map((group) => (
          <article key={group.title} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">{group.title}</h2>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {group.items.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </PublicPageShell>
  );
}
