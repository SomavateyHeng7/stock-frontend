"use client";

import { useMemo, useState } from "react";
import { SmartStockShell } from "@/components/smartstock-shell";
import { useToast } from "@/components/ui/toast-provider";
import {
	readNotificationSettings,
	writeNotificationSettings,
} from "@/lib/notification-settings";
import { pushNotification } from "@/lib/notification-center";
import { getLowStockSlaRows } from "@/lib/smartstock-data";

/* ------------------------------------------------------------------ */
/*  Inline icons                                                       */
/* ------------------------------------------------------------------ */
const IconBell = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
);
const IconShieldAlert = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
);
const IconClock = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const IconPlay = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3" /></svg>
);
const IconSave = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" /><path d="M7 3v4a1 1 0 0 0 1 1h7" /></svg>
);
const IconCheck = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const IconAlertTriangle = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
);
const IconPackage = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" /></svg>
);

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function AlertsPage() {
	const [orderedIds, setOrderedIds] = useState<number[]>([]);
	const { showToast } = useToast();
	const [settings, setSettings] = useState(readNotificationSettings());

	const alertItems = useMemo(
		() => getLowStockSlaRows(settings.slaHours),
		[settings.slaHours],
	);
	const breachedItems = alertItems.filter((item) => item.slaBreached);

	/* ---- actions ---- */
	const markOrdered = (productId: number, productName: string, reorderQty: number) => {
		if (orderedIds.includes(productId)) return;
		setOrderedIds((current) => [...current, productId]);
		showToast({
			title: "Order confirmed",
			description: `${productName}: ${reorderQty} units added to reorder queue.`,
		});
	};

	const saveSettings = () => {
		const next = {
			...settings,
			intervalMinutes: Math.max(5, settings.intervalMinutes),
			slaHours: Math.max(1, settings.slaHours),
		};
		setSettings(next);
		writeNotificationSettings(next);

		pushNotification({
			title: "Notification settings updated",
			description: `SLA ${next.slaHours}h, every ${next.intervalMinutes} minutes, schedule ${next.enabled ? "enabled" : "disabled"}.`,
			source: "Alerts",
			severity: "info",
		});

		showToast({
			title: "Notification settings saved",
			description: `SLA ${next.slaHours}h, every ${next.intervalMinutes} min.`,
			persistToCenter: false,
		});
	};

	const runSlaCheckNow = () => {
		const refreshed = getLowStockSlaRows(settings.slaHours);
		const breaches = refreshed.filter((item) => item.slaBreached);

		writeNotificationSettings({
			...settings,
			lastRunAt: new Date().toISOString(),
		});

		if (breaches.length === 0) {
			pushNotification({
				title: "Manual SLA check complete",
				description: "No low-stock SLA breaches detected.",
				source: "Alerts",
				severity: "info",
			});
			showToast({
				title: "SLA check complete",
				description: "No low-stock SLA breaches detected.",
				persistToCenter: false,
			});
			return;
		}

		pushNotification({
			title: `Manual SLA alert: ${breaches.length} item${breaches.length > 1 ? "s" : ""}`,
			description: `Threshold exceeded (${settings.slaHours}h).`,
			source: "Alerts",
			severity: "warning",
		});

		showToast({
			title: `SLA alert: ${breaches.length} item${breaches.length > 1 ? "s" : ""}`,
			description: `Threshold exceeded (${settings.slaHours}h).`,
			persistToCenter: false,
		});
	};

	/* ------------------------------------------------------------------ */
	/*  Render                                                             */
	/* ------------------------------------------------------------------ */
	return (
		<SmartStockShell title="Alerts" subtitle="Monitor SLA breaches, configure notification schedules, and act on low-stock warnings.">
			{/* ── KPI strip ─────────────────────────────────────────── */}
			<div className="grid grid-cols-3 gap-2 sm:gap-3">
				{[
					{
						label: "SLA breaches",
						value: breachedItems.length,
						icon: <IconShieldAlert />,
						color: breachedItems.length > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400",
					},
					{
						label: "Monitored items",
						value: alertItems.length,
						icon: <IconBell />,
						color: "text-amber-600 dark:text-amber-400",
					},
					{
						label: "SLA threshold",
						value: `${settings.slaHours}h`,
						icon: <IconClock />,
						color: "text-blue-600 dark:text-blue-400",
					},
				].map((kpi) => (
					<div
						key={kpi.label}
						className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-md"
					>
						<div className={`mb-2 ${kpi.color}`}>{kpi.icon}</div>
						<p className="text-2xl font-bold tracking-tight text-foreground">{kpi.value}</p>
						<p className="mt-0.5 text-xs font-medium text-muted-foreground">{kpi.label}</p>
					</div>
				))}
			</div>

			{/* ── SLA breaches ─────────────────────────────────────── */}
			<section className="mt-6">
				<h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					<IconShieldAlert /> SLA breaches
				</h2>

				<div className="overflow-hidden rounded-xl border border-border/60 bg-card">
					{breachedItems.length === 0 ? (
						<div className="flex flex-col items-center justify-center px-4 py-10 text-center">
							<div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
								<IconCheck />
							</div>
							<p className="text-sm font-medium text-foreground">All clear</p>
							<p className="mt-0.5 text-xs text-muted-foreground">No SLA breaches at the {settings.slaHours}h threshold.</p>
						</div>
					) : (
						<>
							<div className="hidden border-b border-border/40 bg-muted/30 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid sm:grid-cols-[1fr_100px_100px]">
								<span>Product</span>
								<span className="text-center">Open duration</span>
								<span className="text-center">Reorder qty</span>
							</div>
							<ul className="divide-y divide-border/40">
								{breachedItems.map((item) => (
									<li
										key={item.id}
										className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/20 sm:grid sm:grid-cols-[1fr_100px_100px]"
									>
										<div className="flex min-w-0 flex-1 items-center gap-2.5">
											<span className="flex h-2 w-2 shrink-0 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
											<span className="truncate font-medium text-foreground">{item.name}</span>
										</div>
										<p className="hidden text-center text-sm tabular-nums text-muted-foreground sm:block">
											{item.ageHours}h
										</p>
										<p className="hidden text-center text-sm font-semibold tabular-nums text-foreground sm:block">
											{item.reorderQty}
										</p>
									</li>
								))}
							</ul>
						</>
					)}
				</div>
			</section>

			{/* ── Notification engine ──────────────────────────────── */}
			<section className="mt-6">
				<h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					<IconClock /> Notification schedule
				</h2>

				<div className="overflow-hidden rounded-xl border border-border/60 bg-card">
					<div className="p-4">
						{/* Toggle row */}
						<label className="flex cursor-pointer items-center justify-between rounded-lg bg-muted/25 px-4 py-3 transition-colors hover:bg-muted/40">
							<div>
								<p className="text-sm font-medium text-foreground">Scheduled checks</p>
								<p className="mt-0.5 text-xs text-muted-foreground">Automatically run SLA checks on a timer</p>
							</div>
							{/* Custom toggle */}
							<span className="relative">
								<input
									type="checkbox"
									checked={settings.enabled}
									onChange={(e) => setSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
									className="peer sr-only"
								/>
								<span className="block h-6 w-10 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
								<span className="absolute left-0.5 top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
							</span>
						</label>

						{/* Inputs row */}
						<div className="mt-4 grid gap-3 sm:grid-cols-2">
							<label className="block text-sm font-medium text-foreground">
								SLA threshold (hours)
								<input
									type="number"
									min={1}
									value={settings.slaHours}
									onChange={(e) => setSettings((prev) => ({ ...prev, slaHours: Number(e.target.value) }))}
									className="mt-1.5 block h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm tabular-nums text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
								/>
							</label>
							<label className="block text-sm font-medium text-foreground">
								Check interval (minutes)
								<input
									type="number"
									min={5}
									value={settings.intervalMinutes}
									onChange={(e) => setSettings((prev) => ({ ...prev, intervalMinutes: Number(e.target.value) }))}
									className="mt-1.5 block h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm tabular-nums text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
								/>
							</label>
						</div>
					</div>

					{/* Action bar */}
					<div className="flex flex-wrap items-center gap-2 border-t border-border/40 bg-muted/15 px-4 py-3">
						<button
							type="button"
							onClick={saveSettings}
							className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 active:scale-[0.97]"
						>
							<IconSave /> Save settings
						</button>
						<button
							type="button"
							onClick={runSlaCheckNow}
							className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40 active:scale-[0.97]"
						>
							<IconPlay /> Run check now
						</button>
					</div>
				</div>
			</section>

			{/* ── Reorder alerts table ─────────────────────────────── */}
			<section className="mt-6">
				<h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					<IconPackage /> All reorder alerts
				</h2>

				<div className="overflow-hidden rounded-xl border border-border/60 bg-card">
					{/* Header – desktop */}
					<div className="hidden border-b border-border/40 bg-muted/30 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid sm:grid-cols-[1fr_90px_90px_80px_120px]">
						<span>Product</span>
						<span className="text-center">Stock</span>
						<span className="text-center">Coverage</span>
						<span className="text-center">Age</span>
						<span className="text-right">Action</span>
					</div>

					{alertItems.length === 0 ? (
						<p className="px-4 py-8 text-center text-sm text-muted-foreground">
							No reorder alerts at the moment.
						</p>
					) : (
						<ul className="divide-y divide-border/40">
							{alertItems.map((item) => {
								const isOrdered = orderedIds.includes(item.id);

								return (
									<li
										key={item.id}
										className={`px-4 py-3 transition-colors hover:bg-muted/20 sm:grid sm:grid-cols-[1fr_90px_90px_80px_120px] sm:items-center ${isOrdered ? "opacity-50" : ""}`}
									>
										{/* Product */}
										<div className="flex min-w-0 items-center gap-2.5">
											{item.slaBreached ? (
												<span className="shrink-0 text-red-500 dark:text-red-400"><IconAlertTriangle /></span>
											) : (
												<span className="flex h-2 w-2 shrink-0 rounded-full bg-amber-500" />
											)}
											<div className="min-w-0">
												<p className="truncate font-medium text-foreground">{item.name}</p>
												<p className="truncate text-xs text-muted-foreground">
													{item.status}{item.slaBreached ? " · SLA breached" : ""}
												</p>
											</div>
										</div>

										{/* Stock */}
										<p className="hidden text-center text-sm tabular-nums text-muted-foreground sm:block">
											{item.currentStock}
										</p>

										{/* Coverage */}
										<p className="hidden text-center text-sm tabular-nums text-muted-foreground sm:block">
											{item.coverageDays}d
										</p>

										{/* Age */}
										<p className="hidden text-center text-sm tabular-nums text-muted-foreground sm:block">
											{item.ageHours}h
										</p>

										{/* Action */}
										<div className="mt-2 sm:mt-0 sm:text-right">
											<button
												type="button"
												disabled={isOrdered}
												onClick={() => markOrdered(item.id, item.name, item.reorderQty)}
												className={`
													inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all
													${isOrdered
														? "cursor-not-allowed bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20"
														: "bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.97]"
													}
												`}
											>
												{isOrdered ? (
													<><IconCheck /> Ordered</>
												) : (
													<>Reorder {item.reorderQty}</>
												)}
											</button>
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</section>
		</SmartStockShell>
	);
}