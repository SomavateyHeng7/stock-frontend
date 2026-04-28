"use client";

import { useEffect, useMemo, useState } from "react";
import { SmartStockShell } from "@/components/smartstock-shell";
import { useToast } from "@/components/ui/toast-provider";
import {
	readNotificationSettings,
	writeNotificationSettings,
} from "@/lib/notification-settings";
import {
	NOTIFICATION_CENTER_CHANGED_EVENT,
	acknowledgeNotification,
	clearResolvedNotifications,
	pushNotification,
	readNotificationCenter,
	reopenNotification,
	resolveNotification,
	type NotificationItem,
} from "@/lib/notification-center";
import { getLowStockSlaRows } from "@/lib/smartstock-data";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { formatDateTime } from "@/lib/user-preferences";

/* ------------------------------------------------------------------ */
/*  Icons                                                               */
/* ------------------------------------------------------------------ */
const IconShieldAlert = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
);
const IconBell = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
);
const IconClock = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const IconCheck = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const IconPackage = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" /></svg>
);
const IconPlay = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3" /></svg>
);
const IconSave = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" /><path d="M7 3v4a1 1 0 0 0 1 1h7" /></svg>
);
const IconChevronDown = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
);
const IconRefresh = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
);

/* ------------------------------------------------------------------ */
/*  Severity helpers                                                    */
/* ------------------------------------------------------------------ */
const SEV_CFG = {
	critical: {
		dot: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]",
		badge: "border-red-400/40 bg-red-500/10 text-red-700 dark:text-red-400",
		border: "border-l-red-500",
	},
	warning: {
		dot: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]",
		badge: "border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
		border: "border-l-amber-500",
	},
	info: {
		dot: "bg-blue-500",
		badge: "border-border bg-muted text-foreground",
		border: "border-l-blue-400",
	},
} as const;

type LogFilter = "open" | "resolved" | "all";

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */
export default function AlertsPage() {
	const preferences = useUserPreferences();
	const { showToast } = useToast();

	const [settings, setSettings]             = useState(readNotificationSettings);
	const [notifications, setNotifications]   = useState<NotificationItem[]>(() => readNotificationCenter());
	const [orderedIds, setOrderedIds]         = useState<number[]>([]);
	const [logFilter, setLogFilter]           = useState<LogFilter>("open");
	const [settingsOpen, setSettingsOpen]     = useState(false);

	/* Live-sync notification center from other tabs / other parts of the app */
	useEffect(() => {
		const sync = () => setNotifications(readNotificationCenter());
		window.addEventListener("storage", sync);
		window.addEventListener(NOTIFICATION_CENTER_CHANGED_EVENT, sync);
		return () => {
			window.removeEventListener("storage", sync);
			window.removeEventListener(NOTIFICATION_CENTER_CHANGED_EVENT, sync);
		};
	}, []);

	/* ---- derived data ---- */
	const slaItems    = useMemo(() => getLowStockSlaRows(settings.slaHours), [settings.slaHours]);
	const slaBreaches = slaItems.filter((i) => i.slaBreached);

	// Urgent notifications (not stock-specific, unresolved, critical/warning)
	const urgentNotifs = notifications.filter(
		(n) => !n.resolvedAt && (n.severity === "critical" || n.severity === "warning"),
	);

	const actionCount = slaBreaches.length + urgentNotifs.length;

	const logItems = useMemo(() => {
		if (logFilter === "all") return notifications;
		if (logFilter === "resolved") return notifications.filter((n) => n.resolvedAt);
		return notifications.filter((n) => !n.resolvedAt);
	}, [notifications, logFilter]);

	const unackedCount = notifications.filter((n) => !n.acknowledgedAt).length;

	/* ---- SLA item actions ---- */
	const markOrdered = (productId: number, name: string, qty: number) => {
		if (orderedIds.includes(productId)) return;
		setOrderedIds((prev) => [...prev, productId]);
		pushNotification({
			title: "Reorder placed",
			description: `${name}: ${qty} units added to reorder queue.`,
			source: "Alerts",
			severity: "info",
		});
		showToast({ title: "Order confirmed", description: `${name}: ${qty} units queued.` });
	};

	/* ---- Notification actions ---- */
	const acknowledge = (id: string) => {
		setNotifications(acknowledgeNotification(id));
		showToast({ title: "Acknowledged", severity: "success", persistToCenter: false });
	};
	const resolve = (id: string) => {
		setNotifications(resolveNotification(id));
		showToast({ title: "Resolved", severity: "success", persistToCenter: false });
	};
	const reopen = (id: string) => {
		setNotifications(reopenNotification(id));
		showToast({ title: "Reopened", severity: "info", persistToCenter: false });
	};
	const clearResolved = () => {
		const count = notifications.filter((n) => n.resolvedAt).length;
		clearResolvedNotifications();
		setNotifications(readNotificationCenter());
		if (count > 0) showToast({ title: `Cleared ${count} resolved item${count !== 1 ? "s" : ""}`, persistToCenter: false });
	};

	/* ---- SLA settings ---- */
	const saveSettings = () => {
		const next = { ...settings, intervalMinutes: Math.max(5, settings.intervalMinutes), slaHours: Math.max(1, settings.slaHours) };
		setSettings(next);
		writeNotificationSettings(next);
		pushNotification({ title: "Alert settings updated", description: `SLA ${next.slaHours}h, every ${next.intervalMinutes} min.`, source: "System", severity: "info" });
		showToast({ title: "Settings saved", persistToCenter: false });
	};

	const runCheckNow = () => {
		const fresh   = getLowStockSlaRows(settings.slaHours);
		const hits    = fresh.filter((i) => i.slaBreached);
		writeNotificationSettings({ ...settings, lastRunAt: new Date().toISOString() });
		if (hits.length === 0) {
			pushNotification({ title: "Manual SLA check — all clear", source: "Alerts", severity: "info" });
			showToast({ title: "SLA check complete — all clear", persistToCenter: false });
		} else {
			pushNotification({ title: `Manual SLA alert: ${hits.length} breach${hits.length > 1 ? "es" : ""}`, description: `Threshold ${settings.slaHours}h exceeded.`, source: "Alerts", severity: "warning" });
			showToast({ title: `SLA alert: ${hits.length} breach${hits.length > 1 ? "es" : ""}`, persistToCenter: false });
		}
	};

	/* ---------------------------------------------------------------- */
	/*  Render                                                           */
	/* ---------------------------------------------------------------- */
	return (
		<SmartStockShell
			title="Alerts & Activity"
			subtitle="Action items, SLA breaches, and system activity — all in one place."
		>
			{/* ── KPI strip ──────────────────────────────────────────── */}
			<div className="grid grid-cols-3 gap-2 sm:gap-3">
				{[
					{
						label: "Needs attention",
						value: actionCount,
						icon: <IconShieldAlert />,
						color: actionCount > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400",
						bg:    actionCount > 0 ? "bg-red-500/10" : "bg-emerald-500/10",
					},
					{
						label: "Unacknowledged",
						value: unackedCount,
						icon: <IconBell />,
						color: unackedCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
						bg:    unackedCount > 0 ? "bg-amber-500/10" : "bg-muted/30",
					},
					{
						label: "SLA threshold",
						value: `${settings.slaHours}h`,
						icon: <IconClock />,
						color: "text-blue-600 dark:text-blue-400",
						bg:    "bg-blue-500/10",
					},
				].map((k) => (
					<div key={k.label} className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-md">
						<div className={`mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg ${k.bg} ${k.color}`}>
							{k.icon}
						</div>
						<p className="text-2xl font-bold tracking-tight text-foreground">{k.value}</p>
						<p className="mt-0.5 text-xs font-medium text-muted-foreground">{k.label}</p>
					</div>
				))}
			</div>

			{/* ── Action Required ────────────────────────────────────── */}
			<section className="mt-6">
				<h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					<IconShieldAlert /> Action required
					{actionCount > 0 && (
						<span className="ml-auto inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
							{actionCount}
						</span>
					)}
				</h2>

				<div className="overflow-hidden rounded-xl border border-border/60 bg-card">
					{actionCount === 0 ? (
						<div className="flex flex-col items-center justify-center px-4 py-10 text-center">
							<div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
								<IconCheck />
							</div>
							<p className="text-sm font-medium text-foreground">All clear</p>
							<p className="mt-0.5 text-xs text-muted-foreground">No SLA breaches or urgent alerts right now.</p>
						</div>
					) : (
						<ul className="divide-y divide-border/40">
							{/* SLA breach rows */}
							{slaBreaches.map((item) => {
								const ordered = orderedIds.includes(item.id);
								return (
									<li key={`sla-${item.id}`} className={`flex flex-wrap items-center gap-3 border-l-[3px] border-l-red-500 px-4 py-3 transition-colors hover:bg-muted/20 ${ordered ? "opacity-50" : ""}`}>
										<span className="flex h-2 w-2 shrink-0 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium text-foreground">{item.name}</p>
											<p className="text-xs text-muted-foreground">
												Low stock · SLA exceeded by {item.ageHours}h · {item.currentStock} units left · {item.coverageDays}d coverage
											</p>
										</div>
										<div className="flex shrink-0 items-center gap-2">
											<span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">Reorder {item.reorderQty} units</span>
											<button
												type="button"
												disabled={ordered}
												onClick={() => markOrdered(item.id, item.name, item.reorderQty)}
												className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
													ordered
														? "cursor-not-allowed bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-400"
														: "bg-primary text-primary-foreground shadow-sm hover:opacity-90"
												}`}
											>
												{ordered ? <><IconCheck /> Ordered</> : <><IconPackage /> Reorder</>}
											</button>
										</div>
									</li>
								);
							})}

							{/* Urgent notification rows */}
							{urgentNotifs.map((n) => {
								const cfg = SEV_CFG[n.severity as keyof typeof SEV_CFG] ?? SEV_CFG.info;
								return (
									<li key={`notif-${n.id}`} className={`flex flex-wrap items-start gap-3 border-l-[3px] ${cfg.border} px-4 py-3 transition-colors hover:bg-muted/20`}>
										<span className={`mt-1.5 flex h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<p className="font-medium text-foreground">{n.title}</p>
												<span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.badge}`}>{n.severity}</span>
											</div>
											{n.description && <p className="mt-0.5 text-xs text-muted-foreground">{n.description}</p>}
											<p className="mt-0.5 text-[11px] text-muted-foreground">{formatDateTime(n.createdAt, preferences)} · {n.source}</p>
										</div>
										<div className="flex shrink-0 flex-wrap gap-1.5">
											{!n.acknowledgedAt && (
												<button type="button" onClick={() => acknowledge(n.id)} className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-300">
													Acknowledge
												</button>
											)}
											<button type="button" onClick={() => resolve(n.id)} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
												Resolve
											</button>
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</section>

			{/* ── Activity Log ───────────────────────────────────────── */}
			<section className="mt-6">
				<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
					<h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
						<IconBell /> Activity log
					</h2>

					<div className="flex flex-wrap items-center gap-2">
						{/* Filter tabs */}
						<div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
							{(["open", "resolved", "all"] as LogFilter[]).map((f) => (
								<button
									key={f}
									type="button"
									onClick={() => setLogFilter(f)}
									className={`rounded px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
										logFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
									}`}
								>
									{f}
								</button>
							))}
						</div>

						{/* Actions */}
						<button
							type="button"
							onClick={() => setNotifications(readNotificationCenter())}
							title="Refresh"
							className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
						>
							<IconRefresh />
						</button>
						<button
							type="button"
							onClick={clearResolved}
							className="rounded-lg border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/40"
						>
							Clear resolved
						</button>
					</div>
				</div>

				<div className="overflow-hidden rounded-xl border border-border/60 bg-card">
					{logItems.length === 0 ? (
						<p className="px-4 py-8 text-center text-sm text-muted-foreground">
							No activity in this view.
						</p>
					) : (
						<ul className="divide-y divide-border/40">
							{logItems.map((n) => {
								const cfg = SEV_CFG[n.severity as keyof typeof SEV_CFG] ?? SEV_CFG.info;
								return (
									<li key={n.id} className={`flex flex-wrap items-start gap-3 border-l-[3px] ${cfg.border} px-4 py-3 transition-colors hover:bg-muted/20 ${n.resolvedAt ? "opacity-60" : ""}`}>
										<span className={`mt-1.5 flex h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<p className="font-medium text-foreground">{n.title}</p>
												<span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.badge}`}>{n.severity}</span>
												{n.resolvedAt && (
													<span className="inline-flex rounded-full border border-emerald-300/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
														resolved
													</span>
												)}
												{!n.resolvedAt && n.acknowledgedAt && (
													<span className="inline-flex rounded-full border border-sky-300/50 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-400">
														acknowledged
													</span>
												)}
											</div>
											{n.description && <p className="mt-0.5 text-xs text-muted-foreground">{n.description}</p>}
											<p className="mt-0.5 text-[11px] text-muted-foreground">{formatDateTime(n.createdAt, preferences)} · {n.source}</p>
										</div>
										<div className="flex shrink-0 flex-wrap gap-1.5">
											{!n.resolvedAt ? (
												<>
													{!n.acknowledgedAt && (
														<button type="button" onClick={() => acknowledge(n.id)} className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-300">
															Acknowledge
														</button>
													)}
													<button type="button" onClick={() => resolve(n.id)} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
														Resolve
													</button>
												</>
											) : (
												<button type="button" onClick={() => reopen(n.id)} className="rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-700/50 dark:bg-blue-950/40 dark:text-blue-300">
													Reopen
												</button>
											)}
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</section>

			{/* ── Alert Settings (collapsible) ───────────────────────── */}
			<section className="mt-6">
				<button
					type="button"
					onClick={() => setSettingsOpen((v) => !v)}
					className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/20"
				>
					<span className="flex items-center gap-2 text-muted-foreground">
						<IconClock /> Alert settings
					</span>
					<span className={`transition-transform ${settingsOpen ? "rotate-180" : ""}`}>
						<IconChevronDown />
					</span>
				</button>

				{settingsOpen && (
					<div className="mt-1 overflow-hidden rounded-xl border border-border/60 bg-card">
						<div className="p-4 space-y-4">
							{/* Toggle */}
							<label className="flex cursor-pointer items-center justify-between rounded-lg bg-muted/25 px-4 py-3 transition-colors hover:bg-muted/40">
								<div>
									<p className="text-sm font-medium text-foreground">Scheduled SLA checks</p>
									<p className="mt-0.5 text-xs text-muted-foreground">Automatically run checks on a timer</p>
								</div>
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

							{/* Inputs */}
							<div className="grid gap-3 sm:grid-cols-2">
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
								onClick={runCheckNow}
								className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40 active:scale-[0.97]"
							>
								<IconPlay /> Run check now
							</button>
							{settings.lastRunAt && (
								<span className="ml-auto text-xs text-muted-foreground">
									Last run: {formatDateTime(settings.lastRunAt, preferences)}
								</span>
							)}
						</div>
					</div>
				)}
			</section>
		</SmartStockShell>
	);
}
