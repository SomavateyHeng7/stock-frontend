"use client";

import { useMemo, useState } from "react";
import { SmartStockShell } from "@/components/smartstock-shell";
import { getEnrichedProducts, getThirtyDayForecast } from "@/lib/smartstock-data";

/* ------------------------------------------------------------------ */
/*  Inline icons                                                       */
/* ------------------------------------------------------------------ */
const IconTrendUp = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
);
const IconShieldAlert = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
);
const IconCrown = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" /><path d="M5 21h14" /></svg>
);
const IconActivity = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" /></svg>
);
const IconSearch = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);
const IconBarChart = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>
);
const IconChevronDown = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
);

/* ------------------------------------------------------------------ */
/*  Sparkline component – pure CSS bars, no SVG overhead               */
/* ------------------------------------------------------------------ */
function Sparkline({
	data,
	barColorClass = "bg-primary/80",
}: {
	data: number[];
	barColorClass?: string;
}) {
	const min = Math.min(...data);
	const max = Math.max(...data);
	const range = Math.max(1, max - min);

	return (
		<div className="flex h-10 items-end gap-px" aria-hidden="true">
			{data.map((v, i) => {
				const pct = 15 + ((v - min) / range) * 85;
				return (
					<div
						key={i}
						className={`flex-1 rounded-sm ${barColorClass} transition-all`}
						style={{ height: `${pct}%` }}
						title={`Day ${i + 1}: ${v}`}
					/>
				);
			})}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */
const statusBadge = (status: string) => {
	const base = "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide uppercase ring-1 ring-inset";
	switch (status) {
		case "Out of Stock":
			return <span className={`${base} bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20`}>{status}</span>;
		case "Low Stock":
			return <span className={`${base} bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20`}>{status}</span>;
		default:
			return <span className={`${base} bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20`}>{status}</span>;
	}
};

const riskBar = (score: number) => {
	const maxScore = 130;
	const pct = Math.min(100, Math.round((score / maxScore) * 100));
	const color =
		pct >= 70 ? "bg-red-500" : pct >= 45 ? "bg-amber-500" : "bg-emerald-500";

	return (
		<div className="flex items-center gap-2">
			<div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted/40">
				<div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
			</div>
			<span className="text-sm tabular-nums text-muted-foreground">{score}</span>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function ForecastPage() {
	const [search, setSearch] = useState("");
	const [sortBy, setSortBy] = useState<"risk" | "demand" | "name">("risk");
	const [expandedId, setExpandedId] = useState<number | null>(null);

	const forecastRows = useMemo(() => {
		return getEnrichedProducts().map((item) => {
			const forecast30 = getThirtyDayForecast(item);
			const total30 = forecast30.reduce((sum, v) => sum + v, 0);
			const preview = forecast30.slice(0, 14);
			const avgDailyForecast = Math.round(total30 / 30);

			return {
				...item,
				forecast30,
				total30,
				preview,
				avgDailyForecast,
				riskScore:
					(item.status === "Out of Stock" ? 100 : item.status === "Low Stock" ? 70 : 30) +
					Math.min(30, Math.round(item.avgDaily)),
			};
		});
	}, []);

	const visibleRows = useMemo(() => {
		const keyword = search.trim().toLowerCase();
		const filtered = forecastRows.filter((item) => item.name.toLowerCase().includes(keyword));
		if (sortBy === "name") return filtered.sort((a, b) => a.name.localeCompare(b.name));
		if (sortBy === "demand") return filtered.sort((a, b) => b.total30 - a.total30);
		return filtered.sort((a, b) => b.riskScore - a.riskScore);
	}, [forecastRows, search, sortBy]);

	const totalProjectedDemand = forecastRows.reduce((sum, r) => sum + r.total30, 0);
	const highRiskCount = forecastRows.filter((r) => r.status === "Low Stock" || r.status === "Out of Stock").length;
	const highestDemandItem = forecastRows.reduce((top, r) => (r.total30 > top.total30 ? r : top), forecastRows[0]);
	const avgDailyPortfolio = Math.round(
		forecastRows.reduce((sum, r) => sum + r.avgDailyForecast, 0) / Math.max(1, forecastRows.length),
	);

	return (
		<SmartStockShell title="Demand forecast" subtitle="30-day projections driven by velocity, trend, and seasonality signals.">
			{/* ── KPI strip ─────────────────────────────────────────── */}
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
				{[
					{ label: "30-day demand", value: totalProjectedDemand.toLocaleString(), icon: <IconTrendUp />, color: "text-blue-600 dark:text-blue-400" },
					{ label: "High-risk SKUs", value: highRiskCount, icon: <IconShieldAlert />, color: highRiskCount > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400" },
					{ label: "Top SKU", value: highestDemandItem?.name ?? "—", sub: `${highestDemandItem?.total30 ?? 0} units`, icon: <IconCrown />, color: "text-amber-600 dark:text-amber-400" },
					{ label: "Avg daily (all)", value: avgDailyPortfolio, icon: <IconActivity />, color: "text-violet-600 dark:text-violet-400" },
				].map((kpi) => (
					<div
						key={kpi.label}
						className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-md"
					>
						<div className={`mb-2 ${kpi.color}`}>{kpi.icon}</div>
						<p className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
							{kpi.value}
						</p>
						{"sub" in kpi && kpi.sub && (
							<p className="text-sm text-muted-foreground">{kpi.sub}</p>
						)}
						<p className="mt-0.5 text-sm font-medium text-muted-foreground">{kpi.label}</p>
					</div>
				))}
			</div>

			{/* ── Toolbar ──────────────────────────────────────────── */}
			<div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
				<div className="relative flex-1">
					<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
						<IconSearch />
					</span>
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search products…"
						className="h-10 w-full rounded-lg border border-border/70 bg-card pl-9 pr-3 text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
					/>
				</div>
				<div className="relative">
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value as "risk" | "demand" | "name")}
						className="h-10 appearance-none rounded-lg border border-border/70 bg-card pl-3 pr-8 text-base font-medium text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
					>
						<option value="risk">Sort: Risk priority</option>
						<option value="demand">Sort: 30-day demand</option>
						<option value="name">Sort: Name A–Z</option>
					</select>
					<span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
						<IconChevronDown />
					</span>
				</div>
			</div>

			{/* ── Forecast table ───────────────────────────────────── */}
			<section className="mt-4">
				<h2 className="mb-3 flex items-center gap-2 text-base font-semibold uppercase tracking-wider text-muted-foreground">
					<IconBarChart /> Demand forecast
				</h2>

				<div className="overflow-hidden rounded-xl border border-border/60 bg-card">
					{/* Header – desktop */}
					<div className="hidden border-b border-border/40 bg-muted/30 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid sm:grid-cols-[1fr_120px_90px_100px_100px_140px]">
						<span>Product</span>
						<span>14-day trend</span>
						<span className="text-center">30-day</span>
						<span className="text-center">Avg/day</span>
						<span className="text-center">Status</span>
						<span className="text-right">Risk</span>
					</div>

					{visibleRows.length === 0 ? (
						<p className="px-4 py-10 text-center text-base text-muted-foreground">
							No products match your search.
						</p>
					) : (
						<ul className="divide-y divide-border/40">
							{visibleRows.map((item) => {
								const isExpanded = expandedId === item.id;
								const barColor =
									item.status === "Out of Stock"
										? "bg-red-400/70 dark:bg-red-500/60"
										: item.status === "Low Stock"
											? "bg-amber-400/70 dark:bg-amber-500/60"
											: "bg-primary/70";

								return (
									<li key={item.id} className="group">
										{/* Main row */}
										<button
											type="button"
											onClick={() => setExpandedId(isExpanded ? null : item.id)}
											className="w-full px-4 py-3 text-left transition-colors hover:bg-muted/20 sm:grid sm:grid-cols-[1fr_120px_90px_100px_100px_140px] sm:items-center"
										>
											{/* Product */}
											<div className="flex min-w-0 items-center gap-2">
												<span
													className={`flex h-2 w-2 shrink-0 rounded-full ${
														item.status === "Out of Stock"
															? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]"
															: item.status === "Low Stock"
																? "bg-amber-500"
																: "bg-emerald-500"
													}`}
												/>
												<div className="min-w-0">
													<p className="truncate text-base font-medium text-foreground">{item.name}</p>
													<p className="truncate text-sm text-muted-foreground sm:hidden">
														30d: {item.total30} · {item.avgDailyForecast}/day
													</p>
												</div>
											</div>

											{/* Sparkline */}
											<div className="mt-2 sm:mt-0">
												<Sparkline data={item.preview} barColorClass={barColor} />
											</div>

											{/* 30-day total */}
											<p className="hidden text-center text-base font-semibold tabular-nums text-foreground sm:block">
												{item.total30}
											</p>

											{/* Avg/day */}
											<p className="hidden text-center text-base tabular-nums text-muted-foreground sm:block">
												{item.avgDailyForecast}
											</p>

											{/* Status */}
											<div className="mt-1.5 sm:mt-0 sm:text-center">
												{statusBadge(item.status)}
											</div>

											{/* Risk */}
											<div className="mt-1.5 flex justify-end sm:mt-0">
												{riskBar(item.riskScore)}
											</div>
										</button>

										{/* Expanded detail */}
										{isExpanded && (
											<div className="border-t border-border/30 bg-muted/10 px-4 py-4">
												<div className="grid gap-4 sm:grid-cols-2">
													{/* Larger chart */}
													<div>
														<p className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
															14-day demand curve
														</p>
														<div className="rounded-lg border border-border/40 bg-background p-3">
															<div className="flex h-28 items-end gap-0.5">
																{item.preview.map((v, i) => {
																	const min = Math.min(...item.preview);
																	const range = Math.max(1, Math.max(...item.preview) - min);
																	const pct = 10 + ((v - min) / range) * 90;
																	return (
																		<div key={i} className="group/bar relative flex-1">
																			<div
																				className={`w-full rounded-sm ${barColor} transition-all hover:opacity-80`}
																				style={{ height: `${pct}%` }}
																			/>
																			<span className="absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-foreground/90 px-1.5 py-0.5 text-xs font-medium text-background opacity-0 transition-opacity group-hover/bar:opacity-100">
																				{v}
																			</span>
																		</div>
																	);
																})}
															</div>
															<div className="mt-1.5 flex justify-between text-xs text-muted-foreground/60">
																<span>Day 1</span>
																<span>Day 7</span>
																<span>Day 14</span>
															</div>
														</div>
													</div>

													{/* Detail cards */}
													<div className="space-y-2">
														<p className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
															Details
														</p>
														<div className="divide-y divide-border/40 rounded-lg border border-border/40 bg-background">
															{[
																{ label: "Current stock", value: `${item.currentStock} units` },
																{ label: "Reorder qty", value: `${item.reorderQty} units` },
																{ label: "Coverage", value: `${item.coverageDays} days` },
																{ label: "Risk score", value: `${item.riskScore} / 130` },
															].map((row) => (
																<div key={row.label} className="flex items-center justify-between px-3 py-2">
																	<span className="text-sm text-muted-foreground">{row.label}</span>
																	<span className="text-base font-semibold tabular-nums text-foreground">{row.value}</span>
																</div>
															))}
														</div>
														<p className="rounded-lg bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
															{item.reason}
														</p>
													</div>
												</div>
											</div>
										)}
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