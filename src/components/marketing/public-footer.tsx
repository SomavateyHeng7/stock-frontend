import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="mt-12 border-t border-border/70 bg-card/60">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} SmartStock. Built for retail SMEs.</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/features" className="hover:text-foreground">Features</Link>
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/faq" className="hover:text-foreground">FAQ</Link>
          <Link href="/legal/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-foreground">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
