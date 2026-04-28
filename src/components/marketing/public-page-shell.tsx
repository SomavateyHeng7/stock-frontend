import { ReactNode } from "react";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicHeader } from "@/components/marketing/public-header";

type PublicPageShellProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

export function PublicPageShell({ title, subtitle, children }: PublicPageShellProps) {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:py-12">
        {(title || subtitle) && (
          <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
            {title && <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>}
            {subtitle && <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
          </section>
        )}
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
