import { PublicPageShell } from "@/components/marketing/public-page-shell";

export default function AboutPage() {
  return (
    <PublicPageShell
      title="About SmartStock"
      subtitle="We help SME retailers move from reactive stock management to proactive inventory decisions."
    >
      <div className="space-y-5">

        {/* Mission + Belief row */}
        <section className="grid gap-5 lg:grid-cols-2">

          {/* Mission */}
          <article className="relative overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-sky-50/40 p-6 shadow-sm dark:border-blue-800/40 dark:from-blue-950/40 dark:to-blue-900/20">
            {/* Decorative circle */}
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-100/60 dark:bg-blue-800/20" />
            <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-blue-200/40 dark:bg-blue-700/20" />

            <div className="relative">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm dark:bg-blue-500">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-blue-900 dark:text-blue-100">Our mission</h2>
              <p className="mt-2 text-sm leading-relaxed text-blue-800/70 dark:text-blue-200/70">
                Reduce preventable stockouts and overstock for retail teams that do not have enterprise tools or dedicated analysts.
              </p>
            </div>
          </article>

          {/* Belief */}
          <article className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-slate-100/80 dark:bg-slate-800/40" />
            <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-slate-200/50 dark:bg-slate-700/30" />

            <div className="relative">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-foreground">What we believe</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Inventory systems should be practical, mobile-friendly, and understandable by frontline operators — not only back-office teams.
              </p>
            </div>
          </article>
        </section>

        {/* Who we build for */}
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Who we build for</h2>
              <p className="text-xs text-muted-foreground">Real teams. Real constraints.</p>
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: (
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                ),
                title: "Growing SMEs",
                description: "Micro and growing retailers managing 50 to 300+ SKUs without dedicated analysts.",
              },
              {
                icon: (
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                ),
                title: "Multi-branch stores",
                description: "Businesses that need branch-level visibility and cross-location stock insights.",
              },
              {
                icon: (
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                ),
                title: "Ops-first teams",
                description: "Teams that rely on messaging apps and need fast, no-friction operational decisions.",
              },
            ].map((item) => (
              <li
                key={item.title}
                className="rounded-xl border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/60"
              >
                <svg viewBox="0 0 24 24" className="mb-3 h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon}
                </svg>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Stats strip */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { value: "50–300+", label: "SKUs supported" },
            { value: "Multi-branch", label: "Visibility" },
            { value: "Mobile-first", label: "Experience" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border/60 bg-card p-4 text-center shadow-sm"
            >
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </section>

      </div>
    </PublicPageShell>
  );
}