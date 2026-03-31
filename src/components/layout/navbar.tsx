"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
	NOTIFICATION_CENTER_CHANGED_EVENT,
	getOpenNotificationCount,
	readNotificationCenter,
} from "@/lib/notification-center";

const navItems = [
	{ href: "/dashboard", label: "Dashboard" },
	{ href: "/sync", label: "Sync" },
	{ href: "/inventory", label: "Inventory" },
	{ href: "/reorder-queue", label: "Reorder" },
	{ href: "/alerts", label: "Alerts" },
	{ href: "/notifications", label: "Inbox" },
	{ href: "/integrations", label: "Integrations" },
	{ href: "/forecast", label: "Forecast" },
	{ href: "/sales", label: "Sales" },
	{ href: "/reports", label: "Reports" },
	{ href: "/delivery", label: "Delivery" },
	{ href: "/suppliers", label: "Suppliers" },
	{ href: "/billing", label: "Billing" },
];

export function Navbar() {
	const pathname = usePathname();
	const [openNotificationCount, setOpenNotificationCount] = useState(() =>
		getOpenNotificationCount(readNotificationCenter()),
	);

	useEffect(() => {
		const refreshCount = () => {
			setOpenNotificationCount(getOpenNotificationCount(readNotificationCenter()));
		};

		window.addEventListener("storage", refreshCount);
		window.addEventListener(NOTIFICATION_CENTER_CHANGED_EVENT, refreshCount);
		return () => {
			window.removeEventListener("storage", refreshCount);
			window.removeEventListener(NOTIFICATION_CENTER_CHANGED_EVENT, refreshCount);
		};
	}, []);

	return (
		<nav className="bg-[#3b2d1f] text-white" aria-label="Primary">
			<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
				<div className="flex min-w-0 items-center gap-6">
					<Link href="/" className="shrink-0 text-[2rem] font-semibold tracking-tight text-[#f8f2e9]">
						SmartStock
					</Link>

					<ul className="hidden items-center gap-4 lg:flex">
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
					</ul>
				</div>

				<div className="flex shrink-0 items-center gap-2">
					<Link
						href="/billing"
						className="hidden rounded-full bg-[#5a4631] px-5 py-2 text-base font-medium text-[#fff8ef] transition-colors hover:bg-[#6a533c] sm:inline-flex"
					>
						Billing
					</Link>
					<Link
						href="/dashboard"
						className="rounded-full bg-[#f5e9d8] px-5 py-2 text-base font-medium text-[#2f2418] transition-colors hover:bg-[#f9efdf]"
					>
						Open App ↗
					</Link>
				</div>
			</div>
		</nav>
	);
}
