"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { AUTH_CHANGED_EVENT, getUserInitials, readAuthUser, signOut, type AuthUser } from "@/lib/auth";
import {
  NOTIFICATION_CENTER_CHANGED_EVENT,
  getOpenNotificationCount,
  readNotificationCenter,
} from "@/lib/notification-center";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inventory", label: "Inventory" },
  { href: "/reorder-queue", label: "Reorder" },
  { href: "/alerts", label: "Alerts" },
  { href: "/notifications", label: "Inbox" },
  { href: "/reports", label: "Reports" },
  { href: "/billing", label: "Billing" },
];

const secondaryNavItems = [
  { href: "/suppliers", label: "Suppliers & Delivery", activePaths: ["/suppliers", "/delivery"] },
  { href: "/integrations", label: "Integrations & Sync", activePaths: ["/integrations", "/sync"] },
  { href: "/forecast", label: "Forecast" },
  { href: "/sales", label: "Sales" },
  { href: "/onboarding", label: "Tutorial" },
  { href: "/setting", label: "Settings" },
];

export function Navbar() {
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

  useEffect(() => {
    setAuthUser(readAuthUser());
    setOpenNotificationCount(getOpenNotificationCount(readNotificationCenter()));

    const refreshCount = () => {
      setOpenNotificationCount(getOpenNotificationCount(readNotificationCenter()));
    };
    const refreshAuth = () => {
      setAuthUser(readAuthUser());
    };
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    window.addEventListener("storage", refreshCount);
    window.addEventListener("storage", refreshAuth);
    window.addEventListener(NOTIFICATION_CENTER_CHANGED_EVENT, refreshCount);
    window.addEventListener(AUTH_CHANGED_EVENT, refreshAuth);
    window.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      window.removeEventListener("storage", refreshCount);
      window.removeEventListener("storage", refreshAuth);
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
    router.push("/login");
  };

  const moreMenuActive = secondaryNavItems.some((item) =>
    item.activePaths ? item.activePaths.includes(pathname) : pathname === item.href,
  );

  return (
    <nav className="relative bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800" aria-label="Primary">
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
                const isActive = pathname === item.href;
                const showInboxCount = item.href === "/notifications" && openNotificationCount > 0;

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
                      {item.label}
                      {showInboxCount && (
                        <span className="inline-flex min-w-[1.125rem] justify-center rounded-full bg-blue-600 px-1 py-0.5 text-[10px] font-semibold leading-none text-white dark:bg-blue-500">
													{openNotificationCount > 99 ? "99+" : openNotificationCount}
												</span>
                      )}
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
                  More
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 opacity-60" fill="currentColor" aria-hidden="true">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute left-0 top-10 z-40 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    {secondaryNavItems.map((item) => {
                      const isActive = item.activePaths ? item.activePaths.includes(pathname) : pathname === item.href;
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
                          {item.label}
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

          <ModeToggle />

          <Link
            href="/dashboard"
            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 xl:px-4"
          >
            Dashboard
          </Link>

          {/* Account menu */}
          <div className="relative" ref={accountMenuRef}>
            {authUser ? (
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
                      My account
                    </Link>
                    <Link
                      href="/setting"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Settings
                    </Link>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 xl:px-4"
              >
                Sign in
              </Link>
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
            {!authUser && (
              <>
                <li>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Create account
                  </Link>
                </li>
                <li className="my-1 border-t border-slate-100 dark:border-slate-800" />
              </>
            )}

            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const showInboxCount = item.href === "/notifications" && openNotificationCount > 0;

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
                    <span>{item.label}</span>
                    {showInboxCount && (
                      <span className="inline-flex min-w-[1.125rem] justify-center rounded-full bg-blue-600 px-1 py-0.5 text-[10px] font-semibold leading-none text-white dark:bg-blue-500">
												{openNotificationCount > 99 ? "99+" : openNotificationCount}
											</span>
                    )}
                  </Link>
                </li>
              );
            })}

            <li className="my-1 border-t border-slate-100 dark:border-slate-800" />

            {secondaryNavItems.map((item) => {
              const isActive = item.activePaths ? item.activePaths.includes(pathname) : pathname === item.href;

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
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}

            <li className="my-1 border-t border-slate-100 dark:border-slate-800" />
            <li className="flex items-center justify-between rounded-lg px-3 py-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Theme</span>
              <ModeToggle />
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
