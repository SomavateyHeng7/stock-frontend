import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-white dark:bg-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-white">
            Smart<span className="text-blue-600 dark:text-blue-400">Stock</span>
          </span>
          <span>· © {new Date().getFullYear()} · Built for retail SMEs.</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/features" className="transition-colors hover:text-foreground">Features</Link>
          <Link href="/pricing" className="transition-colors hover:text-foreground">Pricing</Link>
          <Link href="/faq" className="transition-colors hover:text-foreground">FAQ</Link>
          <Link href="/legal/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
          <Link href="/legal/terms" className="transition-colors hover:text-foreground">Terms</Link>
        </div>
      </div>
    </footer>
  );
}