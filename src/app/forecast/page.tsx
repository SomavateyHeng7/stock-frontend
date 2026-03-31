"use client";

import { useMemo, useState } from "react";
import { SmartStockShell } from "@/components/smartstock-shell";
import { getEnrichedProducts, getThirtyDayForecast } from "@/lib/smartstock-data";

export default function ForecastPage() {
	const [search, setSearch] = useState("");
	const [sortBy, setSortBy] = useState<"risk" | "demand" | "name">("risk");

	const forecastRows = useMemo(() => {
		return getEnrichedProducts().map((item) => {
			const forecast30 = getThirtyDayForecast(item);
			const total30 = forecast30.reduce((sum, value) => sum + value, 0);
			const preview = forecast30.slice(0, 14);
			const previewMin = Math.min(...preview);
			const previewMax = Math.max(...preview);
			const previewRange = Math.max(1, previewMax - previewMin);
			const avgDailyForecast = Math.round(total30 / 30);

			return {
				...item,
				forecast30,
				total30,
				preview,
				previewMin,
				previewMax,
				previewRange,
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

		if (sortBy === "name") {
			return filtered.sort((a, b) => a.name.localeCompare(b.name));
		}

		if (sortBy === "demand") {
			return filtered.sort((a, b) => b.total30 - a.total30);
		}

		return filtered.sort((a, b) => b.riskScore - a.riskScore);
	}, [forecastRows, search, sortBy]);

	const totalProjectedDemand = forecastRows.reduce((sum, item) => sum + item.total30, 0);
	const highRiskCount = forecastRows.filter((item) => item.status === "Low Stock" || item.status === "Out of Stock").length;
	const highestDemandItem = forecastRows.reduce((top, item) => (item.total30 > top.total30 ? item : top), forecastRows[0]);
	const avgDailyPortfolio = Math.round(
		forecastRows.reduce((sum, item) => sum + item.avgDailyForecast, 0) / Math.max(1, forecastRows.length),
	);

	return (
		<SmartStockShell title="30-day demand forecasting" subtitle="See demand early and reorder before stockouts.">
			<section className="space-y-4" aria-label="Forecast">
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
						<p className="text-sm text-muted-foreground">Projected 30-day demand</p>
						<p className="mt-1 text-2xl font-semibold text-foreground">{totalProjectedDemand}</p>
					</article>
					<article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
						<p className="text-sm text-muted-foreground">High-risk SKUs</p>
						<p className="mt-1 text-2xl font-semibold text-foreground">{highRiskCount}</p>
					</article>
					<article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
						<p className="text-sm text-muted-foreground">Highest demand item</p>
						<p className="mt-1 text-sm font-semibold text-foreground">{highestDemandItem?.name ?? "-"}</p>
						<p className="text-sm text-muted-foreground">{highestDemandItem?.total30 ?? 0} units</p>
					</article>
					<article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
						<p className="text-sm text-muted-foreground">Avg daily portfolio</p>
						<p className="mt-1 text-2xl font-semibold text-foreground">{avgDailyPortfolio}</p>
					</article>
				</div>

				<article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
					<div className="grid gap-3 sm:grid-cols-2">
						<label className="grid gap-1 text-sm text-muted-foreground">
							Search SKU
							<input
								type="text"
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder="Type product name..."
								className="h-10 rounded-lg border border-border bg-background px-3 text-foreground"
							/>
						</label>

						<label className="grid gap-1 text-sm text-muted-foreground">
							Sort by
							<select
								value={sortBy}
								onChange={(event) => setSortBy(event.target.value as "risk" | "demand" | "name")}
								className="h-10 rounded-lg border border-border bg-background px-3 text-foreground"
							>
								<option value="risk">Risk priority</option>
								<option value="demand">30-day demand</option>
								<option value="name">Name A-Z</option>
							</select>
						</label>
					</div>
				</article>

				<article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
					<h2 className="text-lg font-semibold text-foreground">Actionable demand forecast</h2>
					<p className="mt-1 text-sm text-muted-foreground">Sorted by priority so urgent products appear first.</p>
					<ul className="mt-3 space-y-3">
						{visibleRows.map((item) => (
							<li key={item.id} className="rounded-xl border border-border/70 bg-muted/20 p-3">
								<div className="flex items-center justify-between gap-2">
									<div>
										<p className="font-medium text-foreground">{item.name}</p>
										<p className="text-xs text-muted-foreground">
											Avg daily {item.avgDailyForecast} · Reorder {item.reorderQty}
										</p>
									</div>
									<span className="rounded-full border border-border bg-background px-2 py-1 text-xs text-foreground">
										30-day: {item.total30}
									</span>
								</div>

								<div className="mt-2 rounded-xl border border-border/70 bg-background p-3">
									<div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
										<span>Next 14 days demand curve</span>
										<span>
											Range: {item.previewMin} - {item.previewMax}
										</span>
									</div>
									<div className="flex h-24 items-end gap-1 rounded-lg border border-border/60 bg-muted/20 p-2">
										{item.preview.map((value, index) => {
											const normalized = (value - item.previewMin) / item.previewRange;
											const barHeight = 20 + normalized * 60;

											return (
												<div key={index} className="flex h-full w-full flex-col items-center justify-end gap-1">
													<div
														className="w-full rounded-sm bg-primary/90"
														style={{ height: `${barHeight}%` }}
														title={`Day ${index + 1}: ${value}`}
													/>
												</div>
											);
										})}
									</div>
									<div className="mt-2 flex justify-between text-xs text-muted-foreground">
										<span>D1</span>
										<span>D7</span>
										<span>D14</span>
									</div>
								</div>

								<p className="mt-2 text-sm text-muted-foreground">
									Reason: {item.reason}
								</p>
							</li>
						))}
						{visibleRows.length === 0 && (
							<li className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
								No products found for this filter.
							</li>
						)}
					</ul>
				</article>
			</section>
		</SmartStockShell>
	);
}
