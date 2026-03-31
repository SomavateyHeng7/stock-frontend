import Link from "next/link";
import { PublicPageShell } from "@/components/marketing/public-page-shell";

export default function LegalPage() {
  return (
    <PublicPageShell title="Legal" subtitle="Policy and legal terms for using SmartStock.">
      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Privacy Policy</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Learn how we collect, use, and protect your business and account data.
          </p>
          <Link href="/legal/privacy" className="mt-3 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline">
            Read privacy policy
          </Link>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Terms of Service</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Understand account usage terms, service scope, and customer responsibilities.
          </p>
          <Link href="/legal/terms" className="mt-3 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline">
            Read terms
          </Link>
        </article>
      </section>
    </PublicPageShell>
  );
}
