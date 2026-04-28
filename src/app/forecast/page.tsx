"use client";

import { useMemo, useState } from "react";
import { SmartStockShell } from "@/components/smartstock-shell";
import { getEnrichedProducts, getThirtyDayForecast } from "@/lib/smartstock-data";
import {
	Activity,
	AlertTriangle,
	BarChart3,
	ChevronDown,
	ChevronUp,
	Crown,
	PackageCheck,
	Search,
	SlidersHorizontal,
	TrendingUp,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function Sparkline({ data, barColorClass = "bg-primary/80" }: { data: number[]; barColorClass?: string }) {
	const min = Math.min(...data);
	const max = Math.max(...data);
	const range = Math.max(1, max - min);
	return (
		<div className="flex h-8 items-end gap-px" aria-hidden="true">
			{data.map((v, i) => (
				<div
					key={i}
					className={`flex-1 rounded-sm ${barColorClass} opacity-80`}
					style={{ height: `${15 + ((v - min) / range) * 85}%` }}
				/>
			))}
		</div>
	);
}

function RiskBar({ score }: { score: number }) {
	const pct = Math.min(100, Math.round((score / 130) * 100));
	const color = pct >= 70 ? "bg-red-500" : pct >= 45 ? "bg-amber-500" : "bg-emerald-500";
	return (
		<div className="flex items-center gap-2">
			<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/40">
				<div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
			</div>
			<span className="w-6 text-right text-xs tabular-nums text-muted-foreground">{score}</span>
		</div>
	);
}

const STATUS_CFG = {
	"Out of Stock": {
		dot: "bg-red-500",
		bar: "bg-red-400/70 dark:bg-red-500/60",
		border: "border-l-red-500",
		badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400",
		filterBorder: "border-red-500/40 bg-red-500/10 text-red-600",
		dot2: "bg-red-500",
		count: "bg-red-500/10 text-red-600",
	},
	"Low Stock": {
		dot: "bg-amber-500",
		bar: "bg-amber-400/70 dark:bg-amber-500/60",
		border: "border-l-amber-500",
		badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400",
		filterBorder: "border-amber-500/40 bg-amber-500/10 text-amber-600",
		dot2: "bg-amber-500",
		count: "bg-amber-500/10 text-amber-600",
	},
	"In Stock": {
		dot: "bg-emerald-500",
		bar: "bg-primary/70",
		border: "border-l-emerald-500",
		badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400",
		filterBorder: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
		dot2: "bg-emerald-500",
		count: "bg-emerald-500/10 text-emerald-600",
	},
} as const;

type StatusKey = keyof typeof STATUS_CFG;
type FilterType = "all" | "Low Stock" | "Out of Stock";

function StatusBadge({ status }: { status: string }) {
	const cfg = STATUS_CFG[status as StatusKey] ?? STATUS_CFG["In Stock"];
	return (
		<span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.badge}`}>
			{status}
		</span>
	);
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ForecastPage() {
	const [search, setSearch] = useState("");
	const [sortBy, setSortBy] = useState<"risk" | "demand" | "name">("risk");
	const [filter, setFilter] = useState<FilterType>("all");
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
		const rows = forecastRows.filter((item) => {
			const matchSearch = item.name.toLowerCase().includes(keyword);
			const matchFilter = filter === "all" || item.status === filter;
			return matchSearch && matchFilter;
		});
		if (sortBy === "name") return rows.sort((a, b) => a.name.localeCompare(b.name));
		if (sortBy === "demand") return rows.sort((a, b) => b.total30 - a.total30);
		return rows.sort((a, b) => b.riskScore - a.riskScore);
	}, [forecastRows, search, sortBy, filter]);

	const totalProjectedDemand = forecastRows.reduce((sum, r) => sum + r.total30, 0);
	const outOfStockCount  = forecastRows.filter((r) => r.status === "Out of Stock").length;
	const lowStockCount    = forecastRows.filter((r) => r.status === "Low Stock").length;
	const inStockCount     = forecastRows.filter((r) => r.status === "In Stock").length;
	const highestDemandItem = forecastRows.reduce(
		(top, r) => (r.total30 > top.total30 ? r : top),
		forecastRows[0],
	);
	const avgDailyPortfolio = Math.round(
		forecastRows.reduce((sum, r) => sum + r.avgDailyForecast, 0) / Math.max(1, forecastRows.length),
	);

	return (
		<SmartStockShell title="Demand Forecast" subtitle="30-day projections driven by velocity, trend, and seasonality signals.">

			{/* ── KPI strip ──────────────────────────────────────────────────── */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{[
					{
						icon: TrendingUp,
						iconColor: "text-blue-600 dark:text-blue-400",
						bg: "bg-blue-500/10",
						label: "30-day demand",
						value: totalProjectedDemand.toLocaleString(),
						sub: "projected units",
						urgent: false,
						truncate: false,
					},
					{
						icon: AlertTriangle,
						iconColor: outOfStockCount > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600",
						bg: outOfStockCount > 0 ? "bg-red-500/10" : "bg-emerald-500/10",
						label: "Out of stock",
						value: String(outOfStockCount),
						sub: outOfStockCount === 0 ? "All clear" : "needs reorder",
						urgent: outOfStockCount > 0,
						truncate: false,
					},
					{
						icon: Crown,
						iconColor: "text-amber-600 dark:text-amber-400",
						bg: "bg-amber-500/10",
						label: "Top demand SKU",
						value: highestDemandItem?.name ?? "—",
						sub: `${highestDemandItem?.total30 ?? 0} units`,
						urgent: false,
						truncate: true,
					},
					{
						icon: Activity,
						iconColor: "text-violet-600 dark:text-violet-400",
						bg: "bg-violet-500/10",
						label: "Avg daily (all)",
						value: String(avgDailyPortfolio),
						sub: "units across portfolio",
						urgent: false,
						truncate: false,
					},
				].map((kpi) => (
					<div
						key={kpi.label}
						className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${
							kpi.urgent
								? "border-red-200/60 bg-red-50/30 dark:border-red-900/40 dark:bg-red-950/20"
								: "border-border/70 bg-card"
						}`}
					>
						<div className={`mb-3 inline-flex rounded-lg p-2 ${kpi.bg}`}>
							<kpi.icon className={`h-4 w-4 ${kpi.iconColor}`} />
						</div>
						<p
							className={`font-bold leading-tight text-foreground ${
								kpi.truncate ? "truncate text-base sm:text-lg" : "text-2xl"
							}`}
						>
							{kpi.value}
						</p>
						<p className="mt-0.5 text-xs font-medium text-muted-foreground">{kpi.label}</p>
						<p className="mt-1 text-[11px] text-muted-foreground/70">{kpi.sub}</p>
					</div>
				))}
			</div>

			{/* ── Status filter strip ─────────────────────────────────────────── */}
			<div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-3">
				<span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
					Portfolio:
				</span>

				<button
					type="button"
					onClick={() => setFilter("all")}
					className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
						filter === "all"
							? "border-primary/40 bg-primary/10 text-primary"
							: "border-border/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
					}`}
				>
					All
					<span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-bold">
						{forecastRows.length}
					</span>
				</button>

				{(["Out of Stock", "Low Stock"] as const).map((s) => {
					const count = s === "Out of Stock" ? outOfStockCount : lowStockCount;
					const cfg = STATUS_CFG[s];
					return (
						<button
							key={s}
							type="button"
							onClick={() => setFilter(s)}
							className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
								filter === s
									? cfg.filterBorder
									: "border-border/60 text-muted-foreground hover:text-foreground"
							}`}
						>
							<span className={`h-1.5 w-1.5 rounded-full ${cfg.dot2}`} />
							{s}
							<span className={`rounded-full px-1.5 py-px text-[10px] font-bold ${count > 0 ? cfg.count : "bg-muted text-muted-foreground"}`}>
								{count}
							</span>
						</button>
					);
				})}

				<span className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground">
					<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
					In stock
					<span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-bold">{inStockCount}</span>
				</span>

				{highestDemandItem && (
					<span className="ml-auto hidden text-xs text-muted-foreground sm:block">
						Top mover:{" "}
						<span className="font-semibold text-foreground">{highestDemandItem.name}</span>
					</span>
				)}
			</div>

			{/* ── Toolbar ─────────────────────────────────────────────────────── */}
			<div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search products…"
						className="h-10 w-full rounded-xl border border-border/70 bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
					/>
				</div>
				<div className="relative shrink-0">
					<SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value as "risk" | "demand" | "name")}
						className="h-10 appearance-none rounded-xl border border-border/70 bg-card pl-8 pr-7 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
					>
						<option value="risk">Risk priority</option>
						<option value="demand">30-day demand</option>
						<option value="name">Name A–Z</option>
					</select>
					<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
				</div>
			</div>

			{/* ── Product list ────────────────────────────────────────────────── */}
			<section className="mt-4">
				<div className="mb-3 flex items-center gap-2">
					<BarChart3 className="h-4 w-4 text-muted-foreground" />
					<h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
						Product Forecast
					</h2>
					<span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
						{visibleRows.length}
					</span>
				</div>

				<div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
					{/* Desktop header */}
					<div className="hidden border-b border-border/40 bg-muted/30 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:grid lg:grid-cols-[minmax(200px,1fr)_160px_80px_80px_130px_150px_24px]">
						<span>Product</span>
						<span>14-day trend</span>
						<span className="text-center">30-day</span>
						<span className="text-center">Avg/day</span>
						<span className="text-center">Status</span>
						<span>Risk score</span>
						<span />
					</div>

					{visibleRows.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-center">
							<PackageCheck className="mb-3 h-8 w-8 text-muted-foreground/30" />
							<p className="text-sm text-muted-foreground">No products match your search.</p>
						</div>
					) : (
						<ul className="divide-y divide-border/40">
							{visibleRows.map((item) => {
								const isExpanded = expandedId === item.id;
								const cfg = STATUS_CFG[item.status as StatusKey] ?? STATUS_CFG["In Stock"];

								return (
									<li key={item.id} className={`border-l-[3px] ${cfg.border}`}>
										{/* Row button */}
										<button
											type="button"
											onClick={() => setExpandedId(isExpanded ? null : item.id)}
											className="w-full px-5 py-4 text-left transition-colors hover:bg-muted/20 lg:grid lg:grid-cols-[minmax(200px,1fr)_160px_80px_80px_130px_150px_24px] lg:items-center"
										>
											{/* Product info */}
											<div className="min-w-0 pr-2">
												<div className="flex items-center gap-2">
													<span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
													<p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
												</div>
												<p className="mt-0.5 truncate pl-4 text-xs text-muted-foreground">{item.reason}</p>

												{/* Mobile: quick stats */}
												<div className="mt-2 flex flex-wrap items-center gap-2 pl-4 lg:hidden">
													<StatusBadge status={item.status} />
													<span className="text-xs text-muted-foreground">
														30d: <span className="font-semibold text-foreground">{item.total30}</span>
													</span>
													<span className="text-xs text-muted-foreground">
														avg: <span className="font-semibold text-foreground">{item.avgDailyForecast}/day</span>
													</span>
												</div>

												{/* Mobile: sparkline */}
												<div className="mt-2 rounded-lg border border-border/30 bg-muted/10 px-2 py-1.5 pl-4 lg:hidden">
													<Sparkline data={item.preview} barColorClass={cfg.bar} />
												</div>
											</div>

											{/* Desktop: sparkline */}
											<div className="hidden rounded-lg border border-border/30 bg-muted/10 px-2 py-1.5 lg:block">
												<Sparkline data={item.preview} barColorClass={cfg.bar} />
											</div>

											{/* Desktop: 30-day */}
											<p className="hidden text-center text-sm font-bold tabular-nums text-foreground lg:block">
												{item.total30}
											</p>

											{/* Desktop: avg/day */}
											<p className="hidden text-center text-sm tabular-nums text-muted-foreground lg:block">
												{item.avgDailyForecast}
											</p>

											{/* Desktop: status badge */}
											<div className="hidden text-center lg:block">
												<StatusBadge status={item.status} />
											</div>

											{/* Desktop: risk bar */}
											<div className="hidden lg:block">
												<RiskBar score={item.riskScore} />
											</div>

											{/* Chevron */}
											<div className="hidden shrink-0 text-muted-foreground lg:block">
												{isExpanded ? (
													<ChevronUp className="h-4 w-4" />
												) : (
													<ChevronDown className="h-4 w-4" />
												)}
											</div>
										</button>

										{/* Expanded detail */}
										{isExpanded && (
											<div className="border-t border-border/30 bg-muted/10 px-5 py-5">
												<div className="grid gap-5 sm:grid-cols-2">
													{/* Chart */}
													<div>
														<p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
															14-day demand curve
														</p>
														<div className="rounded-xl border border-border/40 bg-background p-4">
															<div className="flex h-28 items-end gap-0.5">
																{item.preview.map((v, i) => {
																	const min = Math.min(...item.preview);
																	const range = Math.max(1, Math.max(...item.preview) - min);
																	const pct = 10 + ((v - min) / range) * 90;
																	return (
																		<div key={i} className="group/bar relative flex-1">
																			<div
																				className={`w-full rounded-sm ${cfg.bar} transition-all hover:opacity-80`}
																				style={{ height: `${pct}%` }}
																			/>
																			<span className="absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-foreground/90 px-1.5 py-0.5 text-[10px] font-medium text-background opacity-0 transition-opacity group-hover/bar:opacity-100">
																				{v}
																			</span>
																		</div>
																	);
																})}
															</div>
															<div className="mt-2 flex justify-between text-xs text-muted-foreground/60">
																<span>Day 1</span>
																<span>Day 7</span>
																<span>Day 14</span>
															</div>
														</div>
													</div>

													{/* Details */}
													<div>
														<p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
															Details
														</p>
														<div className="divide-y divide-border/40 rounded-xl border border-border/40 bg-background">
															{[
																{ label: "Current stock", value: `${item.currentStock} units` },
																{ label: "Reorder qty", value: `${item.reorderQty} units` },
																{ label: "Coverage", value: `${item.coverageDays} days` },
																{ label: "Risk score", value: `${item.riskScore} / 130` },
															].map((row) => (
																<div
																	key={row.label}
																	className="flex items-center justify-between px-4 py-2.5"
																>
																	<span className="text-sm text-muted-foreground">{row.label}</span>
																	<span className="text-sm font-semibold tabular-nums text-foreground">
																		{row.value}
																	</span>
																</div>
															))}
														</div>
														<p className="mt-3 rounded-xl border border-border/40 bg-background px-4 py-3 text-sm text-muted-foreground">
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
