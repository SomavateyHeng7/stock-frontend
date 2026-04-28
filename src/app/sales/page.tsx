"use client";

import { useEffect, useState } from "react";
import { SmartStockShell } from "@/components/smartstock-shell";
import { EmptyState, ErrorState, HelpHint, LoadingState } from "@/components/ui/data-state";
import { useToast } from "@/components/ui/toast-provider";
import { exportLowStockCsv, exportLowStockPdf } from "@/lib/report-export";
import { readNotificationSettings } from "@/lib/notification-settings";
import { getEnrichedProducts, getLowStockSlaRows, getWeeklyTotals } from "@/lib/smartstock-data";

type Tab = "sales" | "reports";

export default function SalesPage() {
	const { showToast } = useToast();

	const [activeTab, setActiveTab] = useState<Tab>("sales");

	// Sales data
	const [enrichedProducts] = useState(() => getEnrichedProducts());
	const [weeklyTotals] = useState(() => getWeeklyTotals());

	// Reports data
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [settings, setSettings] = useState(() => readNotificationSettings());
	const [rows, setRows] = useState(() => getLowStockSlaRows(readNotificationSettings().slaHours));

	const salesThisWeek = weeklyTotals.reduce((sum, value) => sum + value, 0);
	const salesLastWeek = Math.max(1, salesThisWeek - 17);
	const salesTrendPct = Math.round(((salesThisWeek - salesLastWeek) / salesLastWeek) * 100);

	const breachedCount = rows.filter((item) => item.slaBreached).length;
	const reorderTotal = rows.reduce((sum, row) => sum + row.reorderQty, 0);

	const changeTab = (tab: Tab) => {
		setActiveTab(tab);
		const url = new URL(window.location.href);
		if (tab === "reports") {
			url.searchParams.set("tab", "reports");
		} else {
			url.searchParams.delete("tab");
		}
		window.history.replaceState({}, "", `${url.pathname}${url.search}`);
	};

	const loadReports = () => {
		setIsLoading(true);
		try {
			const nextSettings = readNotificationSettings();
			const nextRows = getLowStockSlaRows(nextSettings.slaHours);
			setSettings(nextSettings);
			setRows(nextRows);
			setLoadError(null);
		} catch {
			setLoadError("Unable to load reporting data.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (params.get("tab") === "reports") setActiveTab("reports");
		loadReports();
	}, []);

	const handleCsvExport = () => {
		try {
			exportLowStockCsv(rows);
			showToast({ title: "CSV export started", description: "Your low-stock report is downloading." });
		} catch {
			showToast({ title: "CSV export failed", description: "Please retry export." });
		}
	};

	const handlePdfExport = () => {
		try {
			exportLowStockPdf(rows, settings.slaHours);
			showToast({ title: "PDF export opened", description: "Use your print dialog to save the report." });
		} catch {
			showToast({ title: "PDF export failed", description: "Please retry export." });
		}
	};

	return (
		<SmartStockShell title="Sales & Reports" subtitle="Sales trend analytics and low-stock SLA export.">
			<section className="space-y-4" aria-label="Sales and Reports">
				{/* Tab switcher */}
				<div className="inline-flex rounded-lg border border-border bg-background p-1">
					<button
						type="button"
						onClick={() => changeTab("sales")}
						className={`h-9 rounded-md px-4 text-sm font-medium transition-colors ${
							activeTab === "sales"
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						Sales Analytics
					</button>
					<button
						type="button"
						onClick={() => changeTab("reports")}
						className={`h-9 rounded-md px-4 text-sm font-medium transition-colors ${
							activeTab === "reports"
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						Reports & Export
					</button>
				</div>

				{/* ── Sales Analytics ── */}
				{activeTab === "sales" && (
					<article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
						<div className="grid grid-cols-2 gap-3">
							<div className="rounded-xl border border-border/70 bg-muted/30 p-3">
								<p className="text-base text-muted-foreground">Sales This Week</p>
								<p className="text-2xl font-semibold text-foreground">{salesThisWeek}</p>
							</div>
							<div className="rounded-xl border border-border/70 bg-muted/30 p-3">
								<p className="text-base text-muted-foreground">Trend vs Last Week</p>
								<p className="text-2xl font-semibold text-foreground">{salesTrendPct}%</p>
							</div>
						</div>

						<div className="mt-4 flex items-end gap-2 rounded-xl border border-border/70 bg-muted/30 p-3">
							{weeklyTotals.map((value, index) => (
								<div key={index} className="flex w-full flex-col items-center gap-2">
									<div className="w-full rounded-sm bg-primary" style={{ height: `${Math.max(16, value * 1.8)}px` }} />
									<span className="text-sm text-muted-foreground">D{index + 1}</span>
								</div>
							))}
						</div>

						<h3 className="mt-4 text-lg font-semibold text-foreground">Top movers</h3>
						<ul className="mt-2 space-y-2">
							{[...enrichedProducts]
								.sort((a, b) => b.todaySales - a.todaySales)
								.slice(0, 3)
								.map((item) => (
									<li key={item.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-3 py-2">
										<span className="text-base font-medium text-foreground">{item.name}</span>
										<span className="text-base text-muted-foreground">Today: {item.todaySales}</span>
									</li>
								))}
						</ul>
					</article>
				)}

				{/* ── Reports & Export ── */}
				{activeTab === "reports" && (
					<>
						{isLoading ? (
							<LoadingState
								title="Loading reports"
								description="Preparing SLA metrics and export rows."
								rows={3}
							/>
						) : loadError ? (
							<ErrorState
								description={loadError}
								onRetry={loadReports}
								retryLabel="Retry reports"
								hint="Confirm notification settings are available, then retry."
							/>
						) : (
							<>
								<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
									<article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
										<p className="text-sm text-muted-foreground">Low/Out Items</p>
										<p className="mt-1 text-2xl font-semibold text-foreground">{rows.length}</p>
									</article>
									<article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
										<p className="text-sm text-muted-foreground">SLA Breaches</p>
										<p className="mt-1 text-2xl font-semibold text-foreground">{breachedCount}</p>
									</article>
									<article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
										<p className="text-sm text-muted-foreground">Reorder Qty</p>
										<p className="mt-1 text-2xl font-semibold text-foreground">{reorderTotal}</p>
									</article>
									<article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
										<p className="text-sm text-muted-foreground">SLA Threshold</p>
										<p className="mt-1 text-2xl font-semibold text-foreground">{settings.slaHours}h</p>
									</article>
								</div>

								<article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<h2 className="text-lg font-semibold text-foreground">Low-stock SLA report</h2>
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={handleCsvExport}
												className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground"
											>
												Export CSV
											</button>
											<button
												type="button"
												onClick={handlePdfExport}
												className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
											>
												Export PDF
											</button>
										</div>
									</div>

									{rows.length === 0 ? (
										<EmptyState
											className="mt-3"
											title="No low-stock SLA rows"
											description="All tracked products are currently within healthy stock levels."
											actionLabel="Refresh report"
											onAction={loadReports}
											hint="Rows appear automatically once products fall below threshold."
										/>
									) : (
										<div className="mt-3 overflow-x-auto">
											<table className="min-w-full border-collapse text-sm">
												<thead>
													<tr className="border-b border-border/70 text-left text-muted-foreground">
														<th className="px-2 py-2 font-medium">Product</th>
														<th className="px-2 py-2 font-medium">Status</th>
														<th className="px-2 py-2 font-medium">Stock</th>
														<th className="px-2 py-2 font-medium">Reorder</th>
														<th className="px-2 py-2 font-medium">Age (h)</th>
														<th className="px-2 py-2 font-medium">SLA</th>
													</tr>
												</thead>
												<tbody>
													{rows.map((row) => (
														<tr key={row.id} className="border-b border-border/40 text-foreground">
															<td className="px-2 py-2">{row.name}</td>
															<td className="px-2 py-2">{row.status}</td>
															<td className="px-2 py-2">{row.currentStock}</td>
															<td className="px-2 py-2">{row.reorderQty}</td>
															<td className="px-2 py-2">{row.ageHours}</td>
															<td className="px-2 py-2">
																<span className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-xs">
																	{row.slaBreached ? "Breached" : "OK"}
																</span>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									)}
								</article>

								<HelpHint description="Use CSV for spreadsheet analysis and PDF for supplier review calls and compliance snapshots." />
							</>
						)}
					</>
				)}
			</section>
		</SmartStockShell>
	);
}
