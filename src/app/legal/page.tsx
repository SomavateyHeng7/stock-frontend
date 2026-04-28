import Link from "next/link";
import { PublicPageShell } from "@/components/marketing/public-page-shell";

export default function LegalPage() {
  return (
    <PublicPageShell title="Legal" subtitle="Policy and legal terms for using SmartStock.">
      <div className="space-y-10">

        {/* Section header */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
            Legal Documents
          </span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        {/* Cards */}
        <section className="grid gap-5 sm:grid-cols-2">

          {/* Privacy Policy */}
          <Link href="/legal/privacy" className="group relative block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:border-blue-300/60 hover:shadow-md dark:hover:border-blue-700/50">
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-400 to-sky-400 opacity-80" />

            <div className="p-6">
              {/* Icon */}
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200/60 bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100 dark:border-blue-800/60 dark:bg-blue-950/60 dark:text-blue-400 dark:group-hover:bg-blue-950">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>

              {/* Text */}
              <h2 className="text-base font-semibold text-foreground">Privacy Policy</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Learn how we collect, use, and protect your business and account data.
              </p>

              {/* Footer */}
              <div className="mt-5 flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400">
                <span>Read privacy policy</span>
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Terms of Service */}
          <Link href="/legal/terms" className="group relative block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:border-slate-300/80 hover:shadow-md dark:hover:border-slate-600/50">
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-slate-500 via-slate-400 to-slate-300 opacity-70" />

            <div className="p-6">
              {/* Icon */}
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-600 transition-colors group-hover:bg-slate-100 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-400 dark:group-hover:bg-slate-800">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
              </div>

              {/* Text */}
              <h2 className="text-base font-semibold text-foreground">Terms of Service</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Understand account usage terms, service scope, and customer responsibilities.
              </p>

              {/* Footer */}
              <div className="mt-5 flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400">
                <span>Read terms of service</span>
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </div>
            </div>
          </Link>
        </section>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground/60">
          Last updated January 2025 &middot; Questions?{" "}
          <Link href="/contact" className="underline underline-offset-4 hover:text-muted-foreground transition-colors">
            Contact us
          </Link>
        </p>

      </div>
    </PublicPageShell>
  );
}