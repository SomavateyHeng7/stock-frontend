"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast-provider";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { AUTH_CHANGED_EVENT, getUserInitials, readAuthUser, signOut, type AuthUser } from "@/lib/auth";
import {
  NOTIFICATION_CENTER_CHANGED_EVENT,
  getOpenNotificationCount,
  readNotificationCenter,
} from "@/lib/notification-center";

const navItems = [
  { href: "/inventory", label: "Inventory", key: "inventory" },
  { href: "/reorder-queue", label: "Reorder", key: "reorder" },
  { href: "/sales", label: "Sales & Reports", key: "sales" },
  { href: "/suppliers", label: "Suppliers & Delivery", key: "suppliers", activePaths: ["/suppliers", "/delivery"] },
];

const secondaryNavItems = [
  { href: "/forecast", label: "Forecast", key: "forecast" },
  { href: "/integrations", label: "Integrations & Sync", key: "integrations", activePaths: ["/integrations", "/sync"] },
  { href: "/billing", label: "Billing", key: "billing" },
  { href: "/onboarding", label: "Tutorial", key: "tutorial" },
];

export function Navbar() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const moreMenuRef = useRef<HTMLLIElement | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [openNotificationCount, setOpenNotificationCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setAuthUser(readAuthUser());
    setOpenNotificationCount(getOpenNotificationCount(readNotificationCenter()));

    const refreshCount = () => {
      setOpenNotificationCount(getOpenNotificationCount(readNotificationCenter()));
    };
    const refreshAuth = () => {
      setAuthUser(readAuthUser());
    };
    const refreshFromStorage = () => {
      refreshCount();
      refreshAuth();
    };
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    window.addEventListener("storage", refreshFromStorage);
    window.addEventListener(NOTIFICATION_CENTER_CHANGED_EVENT, refreshCount);
    window.addEventListener(AUTH_CHANGED_EVENT, refreshAuth);
    window.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      window.removeEventListener("storage", refreshFromStorage);
      window.removeEventListener(NOTIFICATION_CENTER_CHANGED_EVENT, refreshCount);
      window.removeEventListener(AUTH_CHANGED_EVENT, refreshAuth);
      window.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  const handleSignOut = () => {
    signOut();
    setIsAccountMenuOpen(false);
    showToast({
      title: "Signed out",
      description: "You have been signed out of SmartStock.",
      source: "Auth",
      severity: "info",
    });
    router.push("/auth/login");
  };

  // pathname is stable between server and client in App Router — no isMounted needed
  const moreMenuActive = secondaryNavItems.some((item) =>
    item.activePaths ? item.activePaths.includes(pathname) : pathname === item.href,
  );

  return (
    <nav
      suppressHydrationWarning
      className="relative bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
      aria-label="Primary"
    >
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">

        {/* Left — Logo + Nav links */}
        <div className="flex min-w-0 items-center gap-6 xl:gap-8">
          <Link
            href="/"
            className="shrink-0 text-lg font-bold tracking-tight text-slate-900 dark:text-white"
          >
            Smart<span className="text-blue-600 dark:text-blue-400">Stock</span>
          </Link>

          <div className="hidden min-w-0 flex-1 lg:block">
            <ul className="flex items-center gap-1 whitespace-nowrap">
              {navItems.map((item) => {
                // No isMounted guard — pathname is stable in App Router
                const isActive = pathname === item.href;

                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        isActive
                           ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                           : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                      }`}
                    >
                      {t(`nav.${item.key}`, item.label)}
                    </Link>
                  </li>
                );
              })}

              {/* More dropdown */}
              <li className="relative shrink-0" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen((current) => !current)}
                  className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    moreMenuActive || isMoreMenuOpen
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                  aria-expanded={isMoreMenuOpen}
                  aria-label="Open more navigation"
                >
                  {t("nav.more", "More")}
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 opacity-60" fill="currentColor" aria-hidden="true">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute left-0 top-10 z-40 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    {secondaryNavItems.map((item) => {
                      const isActive = item.activePaths
                        ? item.activePaths.includes(pathname)
                        : pathname === item.href;
                      return (
                        <Link
                          key={`more-${item.href}`}
                          href={item.href}
                          onClick={() => setIsMoreMenuOpen(false)}
                          className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                        >
                          {t(`nav.${item.key}`, item.label)}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </li>
            </ul>
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex shrink-0 items-center gap-1.5 xl:gap-2">
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="primary-mobile-menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          >
            <span className="sr-only">Toggle navigation menu</span>
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <LanguageToggle />
          <ModeToggle />

          <Link
            href="/alerts"
            aria-label="Open alerts"
            className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
              pathname === "/alerts"
                ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                : "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <span className="sr-only">{t("nav.notifications", "Notifications")}</span>
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 17H9m9-4V11a6 6 0 10-12 0v2l-2 2h16l-2-2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {/* isMounted guard needed here — reads from localStorage */}
            {isMounted && openNotificationCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-w-4.5 justify-center rounded-full bg-blue-600 px-1 py-0.5 text-[10px] font-semibold leading-none text-white dark:bg-blue-500">
                {openNotificationCount > 99 ? "99+" : openNotificationCount}
              </span>
            )}
          </Link>

          <Link
            href="/dashboard"
            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 xl:px-4"
          >
            {t("nav.dashboard", "Dashboard")}
          </Link>

          {/* Account menu — isMounted guard needed, reads from localStorage */}
          <div className="relative" ref={accountMenuRef}>
            {isMounted ? (
              authUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsAccountMenuOpen((current) => !current)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    aria-expanded={isAccountMenuOpen}
                    aria-label="Open account menu"
                  >
                    {getUserInitials(authUser.fullName)}
                  </button>

                  {isAccountMenuOpen && (
                    <div className="absolute right-0 top-11 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                      <p className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{authUser.email}</p>
                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                      <Link
                        href="/account"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {t("nav.myAccount", "My account")}
                      </Link>
                      <Link
                        href="/setting"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {t("nav.settings", "Settings")}
                      </Link>
                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        {t("nav.signOut", "Sign out")}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 xl:px-4"
                >
                  {t("nav.signIn", "Sign in")}
                </Link>
              )
            ) : (
              // Stable placeholder rendered on both server and client before mount
              <div className="h-9 w-9 rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800" />
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {isMobileMenuOpen && (
        <div
          id="primary-mobile-menu"
          className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 lg:hidden"
        >
          <ul className="space-y-0.5">
            {isMounted && !authUser && (
              <>
                <li>
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {t("nav.signIn", "Sign in")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {t("nav.createAccount", "Create account")}
                  </Link>
                </li>
                <li className="my-1 border-t border-slate-100 dark:border-slate-800" />
              </>
            )}

            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <li key={`mobile-${item.href}`}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{t(`nav.${item.key}`, item.label)}</span>
                  </Link>
                </li>
              );
            })}

            <li className="my-1 border-t border-slate-100 dark:border-slate-800" />

            {secondaryNavItems.map((item) => {
              const isActive = item.activePaths
                ? item.activePaths.includes(pathname)
                : pathname === item.href;

              return (
                <li key={`mobile-secondary-${item.href}`}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{t(`nav.${item.key}`, item.label)}</span>
                  </Link>
                </li>
              );
            })}

            <li className="my-1 border-t border-slate-100 dark:border-slate-800" />
            <li className="flex items-center justify-between rounded-lg px-3 py-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{t("settings.language", "Language")}</span>
              <LanguageToggle />
            </li>
            <li className="flex items-center justify-between rounded-lg px-3 py-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{t("nav.theme", "Theme")}</span>
              <ModeToggle />
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}