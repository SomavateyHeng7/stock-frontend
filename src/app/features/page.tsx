import { PublicPageShell } from "@/components/marketing/public-page-shell";
import { FeatureGroupGrid } from "@/components/marketing/feature-group-grid";

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
      <FeatureGroupGrid groups={featureGroups} />
    </PublicPageShell>
  );
}
