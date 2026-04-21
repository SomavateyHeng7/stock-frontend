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
	Search,
	TrendingUp,
} from "lucide-react";

function Sparkline({ data, barColorClass = "bg-primary/80" }: { data: number[]; barColorClass?: string }) {
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

function StatusBadge({ status }: { status: string }) {
	const base = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium";
	if (status === "Out of Stock") {
		return (
			<span className={`${base} border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400`}>
				{status}
			</span>
		);
	}
	if (status === "Low Stock") {
		return (
			<span className={`${base} border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400`}>
				{status}
			</span>
		);
	}
	return (
		<span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400`}>
			{status}
		</span>
	);
}

function RiskBar({ score }: { score: number }) {
	const pct = Math.min(100, Math.round((score / 130) * 100));
	const color = pct >= 70 ? "bg-red-500" : pct >= 45 ? "bg-amber-500" : "bg-emerald-500";
	return (
		<div className="flex items-center gap-2">
			<div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted/40">
				<div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
			</div>
			<span className="min-w-[2ch] text-sm tabular-nums text-muted-foreground">{score}</span>
		</div>
	);
}

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
		<SmartStockShell title="Demand Forecast" subtitle="30-day projections driven by velocity, trend, and seasonality signals.">
			{/* KPI strip */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
					<div className="flex items-center gap-3">
						<div className="rounded-lg bg-blue-500/10 p-3">
							<TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">30-day demand</p>
							<p className="text-2xl font-bold text-foreground">{totalProjectedDemand.toLocaleString()}</p>
						</div>
					</div>
				</div>

				<div
					className={`rounded-2xl border p-5 shadow-sm ${
						highRiskCount > 0
							? "border-red-200/60 bg-red-50/30 dark:border-red-900/40 dark:bg-red-950/20"
							: "border-border/70 bg-card"
					}`}
				>
					<div className="flex items-center gap-3">
						<div className={`rounded-lg p-3 ${highRiskCount > 0 ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
							<AlertTriangle
								className={`h-5 w-5 ${highRiskCount > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600"}`}
							/>
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">High-risk SKUs</p>
							<p
								className={`text-2xl font-bold ${
									highRiskCount > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"
								}`}
							>
								{highRiskCount}
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-2xl border border-amber-200/60 bg-amber-50/30 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
					<div className="flex items-center gap-3">
						<div className="rounded-lg bg-amber-500/10 p-3">
							<Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
						</div>
						<div className="min-w-0">
							<p className="text-sm font-medium text-muted-foreground">Top SKU</p>
							<p className="truncate text-lg font-bold text-foreground">{highestDemandItem?.name ?? "—"}</p>
							<p className="text-xs text-muted-foreground">{highestDemandItem?.total30 ?? 0} units</p>
						</div>
					</div>
				</div>

				<div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
					<div className="flex items-center gap-3">
						<div className="rounded-lg bg-violet-500/10 p-3">
							<Activity className="h-5 w-5 text-violet-600 dark:text-violet-400" />
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Avg daily (all)</p>
							<p className="text-2xl font-bold text-foreground">{avgDailyPortfolio}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Toolbar */}
			<div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
				<div className="relative flex-1">
					<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search products…"
						className="h-10 w-full rounded-xl border border-border/70 bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
					/>
				</div>
				<div className="relative">
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value as "risk" | "demand" | "name")}
						className="h-10 appearance-none rounded-xl border border-border/70 bg-card pl-3 pr-8 text-sm font-medium text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
					>
						<option value="risk">Sort: Risk priority</option>
						<option value="demand">Sort: 30-day demand</option>
						<option value="name">Sort: Name A–Z</option>
					</select>
					<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
				</div>
			</div>

			{/* Table */}
			<section className="mt-4">
				<div className="mb-3 flex items-center gap-2">
					<BarChart3 className="h-4 w-4 text-muted-foreground" />
					<h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Product Forecast</h2>
					<span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
						{visibleRows.length}
					</span>
				</div>

				<div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
					<div className="hidden border-b border-border/40 bg-muted/30 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid sm:grid-cols-[1fr_120px_80px_80px_120px_130px]">
						<span>Product</span>
						<span>14-day trend</span>
						<span className="text-center">30-day</span>
						<span className="text-center">Avg/day</span>
						<span className="text-center">Status</span>
						<span className="text-right">Risk score</span>
					</div>

					{visibleRows.length === 0 ? (
						<p className="px-5 py-12 text-center text-sm text-muted-foreground">No products match your search.</p>
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
								const dotColor =
									item.status === "Out of Stock"
										? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]"
										: item.status === "Low Stock"
											? "bg-amber-500"
											: "bg-emerald-500";

								return (
									<li key={item.id}>
										<button
											type="button"
											onClick={() => setExpandedId(isExpanded ? null : item.id)}
											className="w-full px-5 py-4 text-left transition-colors hover:bg-muted/20 sm:grid sm:grid-cols-[1fr_120px_80px_80px_120px_130px] sm:items-center"
										>
											<div className="flex min-w-0 items-center gap-3">
												<span className={`flex h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
												<div className="min-w-0">
													<p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
													<p className="mt-0.5 truncate text-xs text-muted-foreground sm:hidden">
														30d: {item.total30} · {item.avgDailyForecast}/day
													</p>
												</div>
												{isExpanded ? (
													<ChevronUp className="ml-auto h-4 w-4 shrink-0 text-muted-foreground sm:hidden" />
												) : (
													<ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground sm:hidden" />
												)}
											</div>

											<div className="mt-2 sm:mt-0">
												<Sparkline data={item.preview} barColorClass={barColor} />
											</div>

											<p className="hidden text-center text-sm font-bold tabular-nums text-foreground sm:block">
												{item.total30}
											</p>

											<p className="hidden text-center text-sm tabular-nums text-muted-foreground sm:block">
												{item.avgDailyForecast}
											</p>

											<div className="mt-2 sm:mt-0 sm:text-center">
												<StatusBadge status={item.status} />
											</div>

											<div className="mt-2 flex justify-end sm:mt-0">
												<RiskBar score={item.riskScore} />
											</div>
										</button>

										{isExpanded && (
											<div className="border-t border-border/30 bg-muted/10 px-5 py-5">
												<div className="grid gap-5 sm:grid-cols-2">
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
																				className={`w-full rounded-sm ${barColor} transition-all hover:opacity-80`}
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
																<div key={row.label} className="flex items-center justify-between px-4 py-2.5">
																	<span className="text-sm text-muted-foreground">{row.label}</span>
																	<span className="text-sm font-semibold tabular-nums text-foreground">{row.value}</span>
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
