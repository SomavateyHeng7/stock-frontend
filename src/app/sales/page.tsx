import { SmartStockShell } from "@/components/smartstock-shell";
import { getEnrichedProducts, getWeeklyTotals } from "@/lib/smartstock-data";

export default function SalesPage() {
	const enrichedProducts = getEnrichedProducts();
	const weeklyTotals = getWeeklyTotals();
	const salesThisWeek = weeklyTotals.reduce((sum, value) => sum + value, 0);
	const salesLastWeek = Math.max(1, salesThisWeek - 17);
	const salesTrendPct = Math.round(((salesThisWeek - salesLastWeek) / salesLastWeek) * 100);

	return (
		<SmartStockShell title="Sales trend analytics" subtitle="Simple trend signals and top movers.">
			<section className="space-y-4" aria-label="Sales">
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
			</section>
		</SmartStockShell>
	);
}
