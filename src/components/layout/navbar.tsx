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
		<nav className="relative bg-[#3b2d1f] text-white" aria-label="Primary">
			<div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
				<div className="flex min-w-0 items-center gap-4 xl:gap-6">
					<Link href="/" className="shrink-0 text-[2rem] font-semibold tracking-tight text-[#f8f2e9]">
						SmartStock
					</Link>

					<div className="hidden min-w-0 flex-1 lg:block">
						<ul className="flex items-center gap-4 whitespace-nowrap">
						{navItems.map((item) => {
							const isActive = pathname === item.href;
							const showInboxCount = item.href === "/notifications" && openNotificationCount > 0;

							return (
								<li key={item.href} className="shrink-0">
									<Link
										href={item.href}
										className={`inline-flex items-center gap-1 text-sm transition-colors ${
											isActive ? "text-[#fff8ef]" : "text-[#eadfce] hover:text-[#fff8ef]"
										}`}
									>
										{item.label}
										{showInboxCount && (
											<span className="inline-flex min-w-5 justify-center rounded-full bg-[#f5e9d8] px-1.5 py-0.5 text-[10px] font-semibold text-[#2f2418]">
												{openNotificationCount > 99 ? "99+" : openNotificationCount}
											</span>
										)}
									</Link>
								</li>
							);
						})}
							<li className="relative" ref={moreMenuRef}>
								<button
									type="button"
									onClick={() => setIsMoreMenuOpen((current) => !current)}
									className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors ${
										moreMenuActive || isMoreMenuOpen
											? "border-[#f5e9d8] text-[#fff8ef]"
											: "border-[#6a533c] text-[#eadfce] hover:text-[#fff8ef]"
									}`}
									aria-expanded={isMoreMenuOpen}
									aria-label="Open more navigation"
								>
									More
								</button>

								{isMoreMenuOpen && (
									<div className="absolute left-0 top-10 z-40 w-52 rounded-xl border border-[#6a533c] bg-[#322517] p-2 shadow-lg">
										{secondaryNavItems.map((item) => {
											const isActive = item.activePaths ? item.activePaths.includes(pathname) : pathname === item.href;
											return (
												<Link
													key={`more-${item.href}`}
													href={item.href}
													onClick={() => setIsMoreMenuOpen(false)}
													className={`block rounded-lg px-2 py-2 text-sm ${
														isActive ? "bg-[#f5e9d8] text-[#2f2418]" : "text-[#fff8ef] hover:bg-[#443321]"
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

				<div className="flex shrink-0 items-center gap-1.5 xl:gap-2">
					<button
						type="button"
						onClick={() => setIsMobileMenuOpen((current) => !current)}
						aria-expanded={isMobileMenuOpen}
						aria-controls="primary-mobile-menu"
						className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#6a533c] text-[#f8f2e9] lg:hidden"
					>
						<span className="sr-only">Toggle navigation menu</span>
						<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
							<path d="M4 7h16M4 12h16M4 17h16" />
						</svg>
					</button>
					<ModeToggle />
					<Link
						href="/dashboard"
						className="rounded-full bg-[#f5e9d8] px-3 py-2 text-sm font-medium text-[#2f2418] transition-colors hover:bg-[#f9efdf] xl:px-5 xl:text-base"
					>
						<span>Dashboard</span>
					</Link>
					<div className="relative" ref={accountMenuRef}>
						{authUser ? (
							<>
								<button
									type="button"
									onClick={() => setIsAccountMenuOpen((current) => !current)}
									className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#6a533c] bg-[#4a3827] text-xs font-semibold text-[#fff8ef]"
									aria-expanded={isAccountMenuOpen}
									aria-label="Open account menu"
								>
									{getUserInitials(authUser.fullName)}
								</button>

								{isAccountMenuOpen && (
									<div className="absolute right-0 top-12 w-52 rounded-xl border border-[#6a533c] bg-[#322517] p-2 shadow-lg">
										<p className="px-2 py-1 text-xs text-[#d8cbb9]">{authUser.email}</p>
										<Link
											href="/account"
											onClick={() => setIsAccountMenuOpen(false)}
											className="block rounded-lg px-2 py-2 text-sm text-[#fff8ef] hover:bg-[#443321]"
										>
											My account
										</Link>
										<Link
											href="/setting"
											onClick={() => setIsAccountMenuOpen(false)}
											className="block rounded-lg px-2 py-2 text-sm text-[#fff8ef] hover:bg-[#443321]"
										>
											Settings
										</Link>
										<button
											type="button"
											onClick={handleSignOut}
											className="mt-1 w-full rounded-lg px-2 py-2 text-left text-sm text-[#fcb0b0] hover:bg-[#443321]"
										>
											Sign out
										</button>
									</div>
								)}
							</>
						) : (
							<Link
								href="/login"
								className="rounded-full border border-[#6a533c] px-3 py-2 text-xs font-medium text-[#fff8ef] hover:bg-[#4a3827] xl:px-4 xl:text-sm"
							>
								Sign in
							</Link>
						)}
					</div>
				</div>
			</div>

			{isMobileMenuOpen && (
				<div id="primary-mobile-menu" className="border-t border-[#4f3c2b] bg-[#322517] px-4 py-3 lg:hidden">
					<ul className="space-y-1">
						{!authUser && (
							<>
								<li>
									<Link
										href="/login"
										onClick={() => setIsMobileMenuOpen(false)}
										className="block rounded-lg px-3 py-2 text-sm text-[#eadfce] hover:bg-[#443321]"
									>
										Sign in
									</Link>
								</li>
								<li>
									<Link
										href="/signup"
										onClick={() => setIsMobileMenuOpen(false)}
										className="block rounded-lg px-3 py-2 text-sm text-[#eadfce] hover:bg-[#443321]"
									>
										Create account
									</Link>
								</li>
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
										className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
											isActive ? "bg-[#f5e9d8] text-[#2f2418]" : "text-[#eadfce] hover:bg-[#443321]"
										}`}
									>
										<span>{item.label}</span>
										{showInboxCount && (
											<span className="inline-flex min-w-5 justify-center rounded-full bg-[#f5e9d8] px-1.5 py-0.5 text-[10px] font-semibold text-[#2f2418]">
												{openNotificationCount > 99 ? "99+" : openNotificationCount}
											</span>
										)}
									</Link>
								</li>
							);
						})}

						{secondaryNavItems.map((item) => {
							const isActive = item.activePaths ? item.activePaths.includes(pathname) : pathname === item.href;

							return (
								<li key={`mobile-secondary-${item.href}`}>
									<Link
										href={item.href}
										onClick={() => setIsMobileMenuOpen(false)}
										className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
											isActive ? "bg-[#f5e9d8] text-[#2f2418]" : "text-[#eadfce] hover:bg-[#443321]"
										}`}
									>
										<span>{item.label}</span>
									</Link>
								</li>
							);
						})}
						<li className="flex items-center justify-between rounded-lg px-3 py-2">
							<span className="text-sm text-[#eadfce]">Theme</span>
							<ModeToggle />
						</li>
					</ul>
				</div>
			)}
		</nav>
	);
}
