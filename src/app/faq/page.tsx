import { PublicPageShell } from "@/components/marketing/public-page-shell";

const faqs = [
  {
    q: "Do I need a credit card to start?",
    a: "No. Every account starts with a 1-month free trial and can add payment details later.",
  },
  {
    q: "Can I manage multiple branches?",
    a: "Yes. SmartStock supports branch/location scoped inventory and movement tracking on higher plans.",
  },
  {
    q: "Can I import existing product data?",
    a: "Yes. You can add products manually or import with CSV/Excel templates from the inventory page.",
  },
  {
    q: "Do you provide alerts for low stock?",
    a: "Yes. Alerts and SLA checks are available, with settings configurable inside the app.",
  },
  {
    q: "How long does setup take?",
    a: "Most teams can complete initial setup in under 30 minutes, including first product import.",
  },
];

export default function FaqPage() {
  return (
    <PublicPageShell title="FAQ" subtitle="Answers to common questions from operators, managers, and founders.">
      <section className="space-y-3">
        {faqs.map((item) => (
          <article key={item.q} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">{item.q}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
          </article>
        ))}
      </section>
    </PublicPageShell>
  );
}
