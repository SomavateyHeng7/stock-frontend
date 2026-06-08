"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ModeToggle } from "@/components/ui/mode-toggle";

const links = [
  { href: "/features", labelKey: "nav.features", defaultLabel: "Features" },
  { href: "/pricing", labelKey: "nav.billing", defaultLabel: "Pricing" },
  { href: "/onboarding", labelKey: "nav.tutorial", defaultLabel: "Tutorial" },
  { href: "/about", labelKey: "nav.about", defaultLabel: "About" },
  { href: "/contact", labelKey: "nav.contact", defaultLabel: "Contact" },
  { href: "/faq", labelKey: "nav.faq", defaultLabel: "FAQ" },
  { href: "/legal", labelKey: "nav.legal", defaultLabel: "Legal" },
];

export function PublicHeader() {
  const t = useT();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">

        {/* Logo + Nav */}
        <div className="flex min-w-0 items-center gap-8">
          <Link
            href="/"
            className="shrink-0 text-lg font-bold tracking-tight text-slate-900 dark:text-white"
          >
            Smart<span className="text-blue-600 dark:text-blue-400">Stock</span>
          </Link>

          <nav aria-label="Public" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {links.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                      }`}
                    >
                      {t(item.labelKey, item.defaultLabel)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-2">
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="public-mobile-menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          >
            <span className="sr-only">{t("nav.toggleNav", "Toggle public navigation menu")}</span>
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <LanguageToggle />
          <ModeToggle />

          <Link
            href="/auth/login"
            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            {t("nav.signIn", "Sign in")}
          </Link>
        </div>
      </div>

      {/* Mobile menu panel */}
      {isMobileMenuOpen && (
        <div
          id="public-mobile-menu"
          className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 lg:hidden"
        >
          <ul className="space-y-0.5">
            {links.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={`mobile-${item.href}`}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {t(item.labelKey, item.defaultLabel)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}