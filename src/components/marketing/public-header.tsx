"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/onboarding", label: "Tutorial" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/legal", label: "Legal" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[#2f2418] bg-[#3b2d1f] text-white shadow-sm">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="shrink-0 text-3xl font-semibold tracking-tight text-[#f8f2e9]">
            SmartStock
          </Link>
          <nav aria-label="Public" className="hidden lg:block">
            <ul className="flex items-center gap-4">
              {links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-[#eadfce] transition-colors hover:text-[#fff8ef]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="public-mobile-menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#6a533c] text-[#f8f2e9] lg:hidden"
          >
            <span className="sr-only">Toggle public navigation menu</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <Link
            href="/billing"
            className="hidden rounded-full bg-[#5a4631] px-4 py-2 text-sm font-medium text-[#fff8ef] transition-colors hover:bg-[#6a533c] sm:inline-flex"
          >
            Billing
          </Link>
          <Link
            href="/onboarding"
            className="rounded-full bg-[#f5e9d8] px-4 py-2 text-sm font-semibold text-[#2f2418] transition-colors hover:bg-[#f9efdf]"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div id="public-mobile-menu" className="border-t border-[#4f3c2b] bg-[#322517] px-4 py-3 lg:hidden">
          <ul className="space-y-1">
            {links.map((item) => {
              const isActive = pathname === item.href;

              return (
                <li key={`mobile-${item.href}`}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      isActive ? "bg-[#f5e9d8] text-[#2f2418]" : "text-[#eadfce] hover:bg-[#443321]"
                    }`}
                  >
                    {item.label}
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
