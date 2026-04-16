"use client";

import { useEffect, useState } from "react";
import { SmartStockShell } from "@/components/smartstock-shell";
import { EmptyState, ErrorState, HelpHint, LoadingState } from "@/components/ui/data-state";
import { useToast } from "@/components/ui/toast-provider";
import { getEnrichedProducts, getStatusClass, getWeeklyTotals } from "@/lib/smartstock-data";

/* ------------------------------------------------------------------ */
/*  Inline icons (consistent with other redesigned pages)              */
/* ------------------------------------------------------------------ */
const Icon = ({ d, size = 16 }: { d: string; size?: number }) => (
	<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d={d} />
	</svg>
);

const IconPackage = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" /></svg>
);
const IconTrendDown = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></svg>
);
const IconTrendUp = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
);
const IconXCircle = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
);
const IconShoppingCart = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
);
const IconDollar = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
);
const IconZap = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></svg>
);
const IconCheck = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const IconCheckCircle = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
);
const IconChevronRight = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
);
const IconArrowLeft = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
);
const IconMinus = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
);
const IconPlus = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
);
const IconX = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);
const IconBell = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
);
const IconArrowRight = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);
const IconBarChart = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>
);

/* ------------------------------------------------------------------ */
/*  Smooth area chart (matches forecast page style)                    */
/* ------------------------------------------------------------------ */
function buildSmoothPath(points: { x: number; y: number }[]): string {
	if (points.length < 2) return "";
	let d = `M ${points[0].x},${points[0].y}`;
	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[i];
		const p1 = points[i + 1];
		const cpx = (p0.x + p1.x) / 2;
		d += ` C ${cpx},${p0.y} ${cpx},${p1.y} ${p1.x},${p1.y}`;
	}
	return d;
}

function WeeklySalesChart({ data }: { data: number[] }) {
	const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
	const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	const w = 400;
	const h = 160;
	const padX = 30;
	const padTop = 20;
	const padBot = 28;

	const min = 0;
	const max = Math.max(...data, 1);

	const pts = data.map((v, i) => ({
		x: padX + (i / Math.max(1, data.length - 1)) * (w - padX * 2),
		y: padTop + (1 - (v - min) / Math.max(1, max - min)) * (h - padTop - padBot),
	}));

	const linePath = buildSmoothPath(pts);
	const areaPath = `${linePath} L ${pts[pts.length - 1].x},${h - padBot} L ${pts[0].x},${h - padBot} Z`;

	const gridYs = [0.25, 0.5, 0.75].map((frac) => padTop + frac * (h - padTop - padBot));

	return (
		<svg
			viewBox={`0 0 ${w} ${h}`}
			className="h-40 w-full sm:h-44"
			preserveAspectRatio="xMidYMid meet"
			onMouseLeave={() => setHoveredIdx(null)}
		>
			<defs>
				<linearGradient id="weekly-grad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
					<stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
				</linearGradient>
			</defs>

			{/* Grid lines */}
			{gridYs.map((y, i) => (
				<line key={i} x1={padX} y1={y} x2={w - padX} y2={y} stroke="currentColor" className="text-border/30" strokeWidth="0.5" strokeDasharray="3 3" />
			))}

			{/* Area + line */}
			<path d={areaPath} fill="url(#weekly-grad)" />
			<path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />

			{/* Dots */}
			{pts.map((p, i) => (
				<circle key={i} cx={p.x} cy={p.y} r={hoveredIdx === i ? 5 : 3} fill="var(--color-primary)" opacity={hoveredIdx === i ? 1 : 0.7} className="transition-all" />
			))}

			{/* Day labels */}
			{pts.map((p, i) => (
				<text key={`label-${i}`} x={p.x} y={h - 8} textAnchor="middle" fill="currentColor" className="text-muted-foreground" fontSize="10" fontWeight="500">
					{days[i]}
				</text>
			))}

			{/* Hit areas */}
			{pts.map((p, i) => (
				<rect key={`hit-${i}`} x={p.x - (w / data.length) / 2} y={0} width={w / data.length} height={h} fill="transparent" onMouseEnter={() => setHoveredIdx(i)} />
			))}

			{/* Tooltip */}
			{hoveredIdx !== null && pts[hoveredIdx] && (
				<>
					<line x1={pts[hoveredIdx].x} y1={padTop} x2={pts[hoveredIdx].x} y2={h - padBot} stroke="var(--color-primary)" strokeWidth="0.75" opacity="0.3" strokeDasharray="2 2" />
					<rect x={pts[hoveredIdx].x - 28} y={Math.max(2, pts[hoveredIdx].y - 24)} width="56" height="18" rx="4" fill="var(--color-foreground)" opacity="0.9" />
					<text x={pts[hoveredIdx].x} y={Math.max(2, pts[hoveredIdx].y - 24) + 12.5} textAnchor="middle" fill="var(--color-background)" fontSize="10" fontWeight="600">
						{days[hoveredIdx]}: {data[hoveredIdx]}
					</text>
				</>
			)}
		</svg>
	);
}

/* ------------------------------------------------------------------ */
/*  Status badge helper                                                */
/* ------------------------------------------------------------------ */
const statusBadge = (status: string) => {
	const base = "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide uppercase ring-1 ring-inset";
	switch (status) {
		case "Out of Stock":
			return <span className={`${base} bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20`}>{status}</span>;
		case "Low Stock":
			return <span className={`${base} bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20`}>{status}</span>;
		case "Overstocked":
			return <span className={`${base} bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20`}>{status}</span>;
		default:
			return <span className={`${base} bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20`}>{status}</span>;
	}
};

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function DashboardPage() {
	const [expanded, setExpanded] = useState(false);
	const [orderedQuantities, setOrderedQuantities] = useState<Record<number, number>>({});
	const [enrichedProducts, setEnrichedProducts] = useState<ReturnType<typeof getEnrichedProducts>>([]);
	const [reorderDialogItem, setReorderDialogItem] = useState<ReturnType<typeof getEnrichedProducts>[number] | null>(null);
	const [reorderDialogStep, setReorderDialogStep] = useState<1 | 2>(1);
	const [reorderAmount, setReorderAmount] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const { showToast } = useToast();

	const getUnitPrice = (item: unknown) => {
		if (item && typeof item === "object" && "unitPrice" in item && typeof (item as { unitPrice: unknown }).unitPrice === "number") {
			return (item as { unitPrice: number }).unitPrice;
		}
		return 0;
	};

	const loadDashboard = () => {
		setIsLoading(true);
		try {
			setEnrichedProducts(getEnrichedProducts());
			setLoadError(null);
		} catch {
			setLoadError("Failed to load dashboard inventory metrics.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => { loadDashboard(); }, []);

	const lowStockItems = enrichedProducts.filter((i) => i.status === "Low Stock");
	const stockoutItems = enrichedProducts.filter((i) => i.status === "Out of Stock");
	const goodStockItems = enrichedProducts.filter((i) => i.status === "In Stock");
	const reorderItems = enrichedProducts.filter((i) => (i.status === "Low Stock" || i.status === "Out of Stock") && i.reorderQty > 0);
	const weeklyTotals = getWeeklyTotals();
	const salesThisWeek = weeklyTotals.reduce((s, v) => s + v, 0);
	const totalInventoryValue = enrichedProducts.reduce((s, i) => s + i.currentStock * getUnitPrice(i), 0);
	const reorderValue = reorderItems.reduce((s, i) => s + i.reorderQty * getUnitPrice(i), 0);

	const urgentItems = enrichedProducts.filter((i) => i.status === "Low Stock" || i.status === "Out of Stock" || i.status === "Overstocked");
	const visibleItems = expanded ? urgentItems : urgentItems.slice(0, 5);

	const topProducts = [...enrichedProducts].sort((a, b) => b.currentStock - a.currentStock).slice(0, 3);

	/* ---- dialog actions ---- */
	const openReorderDialog = (item: ReturnType<typeof getEnrichedProducts>[number]) => {
		if (orderedQuantities[item.id]) return;
		setReorderDialogItem(item);
		setReorderAmount(Math.max(1, item.reorderQty));
		setReorderDialogStep(1);
	};
	const closeReorderDialog = () => { setReorderDialogItem(null); setReorderDialogStep(1); setReorderAmount(1); };
	const confirmReorder = () => {
		if (!reorderDialogItem) return;
		const qty = Math.max(1, Math.floor(reorderAmount));
		setOrderedQuantities((c) => ({ ...c, [reorderDialogItem.id]: qty }));
		showToast({ title: "Reorder confirmed", description: `${reorderDialogItem.name}: ${qty} units marked as ordered.` });
		closeReorderDialog();
	};

	/* ---- loading / error / empty states ---- */
	if (isLoading) {
		return (
			<SmartStockShell title="Dashboard" subtitle="Real-time inventory intelligence at a glance.">
				<LoadingState title="Loading dashboard" description="Crunching inventory metrics and alerts." rows={5} />
			</SmartStockShell>
		);
	}
	if (loadError) {
		return (
			<SmartStockShell title="Dashboard" subtitle="Real-time inventory intelligence at a glance.">
				<ErrorState description={loadError} onRetry={loadDashboard} retryLabel="Retry dashboard" hint="If this persists, confirm inventory data exists and reload the app." />
			</SmartStockShell>
		);
	}
	if (enrichedProducts.length === 0) {
		return (
			<SmartStockShell title="Dashboard" subtitle="Real-time inventory intelligence at a glance.">
				<EmptyState title="No inventory data yet" description="Add your first products to unlock alerts, reorder insights, and sales trends." actionLabel="Go to inventory" onAction={() => { window.location.href = "/inventory"; }} hint="Use Import CSV in Inventory for faster setup." />
			</SmartStockShell>
		);
	}

	/* ------------------------------------------------------------------ */
	/*  Render                                                             */
	/* ------------------------------------------------------------------ */
	return (
		<SmartStockShell title="Dashboard" subtitle="Real-time inventory intelligence at a glance.">

			{/* ── Primary KPI strip ────────────────────────────────── */}
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
				{[
					{ label: "Total products", value: enrichedProducts.length, sub: `${goodStockItems.length} in stock`, icon: <IconPackage />, color: "text-blue-600 dark:text-blue-400" },
					{ label: "Low stock", value: lowStockItems.length, sub: "Requires attention", icon: <IconTrendDown />, color: "text-amber-600 dark:text-amber-400" },
					{ label: "Out of stock", value: stockoutItems.length, sub: "Lost sales risk", icon: <IconXCircle />, color: stockoutItems.length > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400" },
					{ label: "Sales this week", value: salesThisWeek, sub: "Units sold", icon: <IconShoppingCart />, color: "text-emerald-600 dark:text-emerald-400" },
				].map((kpi) => (
					<div key={kpi.label} className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-md">
						<div className={`mb-2 ${kpi.color}`}>{kpi.icon}</div>
						<p className="text-2xl font-bold tracking-tight text-foreground">{kpi.value}</p>
						<p className="mt-0.5 text-sm font-medium text-muted-foreground">{kpi.label}</p>
						<p className="text-xs text-muted-foreground/70">{kpi.sub}</p>
					</div>
				))}
			</div>

			{/* ── Financial row ────────────────────────────────────── */}
			<div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
				{[
					{ label: "Inventory value", value: `$${totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: <IconDollar />, color: "text-blue-600 dark:text-blue-400" },
					{ label: "Reorder queue", value: `${reorderItems.length} items`, icon: <IconShoppingCart />, color: "text-violet-600 dark:text-violet-400" },
					{ label: "Reorder value", value: `$${reorderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: <IconDollar />, color: "text-amber-600 dark:text-amber-400" },
				].map((kpi) => (
					<div key={kpi.label} className="group rounded-xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-md">
						<div className={`mb-1.5 ${kpi.color}`}>{kpi.icon}</div>
						<p className="text-lg font-bold tracking-tight text-foreground sm:text-xl">{kpi.value}</p>
						<p className="mt-0.5 text-sm font-medium text-muted-foreground">{kpi.label}</p>
					</div>
				))}
			</div>

			{/* ── Main content grid ────────────────────────────────── */}
			<div className="mt-6 grid gap-6 lg:grid-cols-3">

				{/* Left column – 2/3 width */}
				<div className="space-y-6 lg:col-span-2">

					{/* Action required table */}
					<section>
						<div className="mb-3 flex items-center justify-between">
							<h2 className="flex items-center gap-2 text-base font-semibold uppercase tracking-wider text-muted-foreground">
								<IconZap /> Action required
								{urgentItems.length > 0 && (
									<span className="ml-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-red-600 dark:text-red-400 ring-1 ring-inset ring-red-500/20">
										{urgentItems.length}
									</span>
								)}
							</h2>
							{urgentItems.length > 5 && (
								<button
									type="button"
									onClick={() => setExpanded((p) => !p)}
									className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
								>
									{expanded ? "Show less" : `View all ${urgentItems.length}`}
								</button>
							)}
						</div>

						<div className="overflow-hidden rounded-xl border border-border/60 bg-card">
							{visibleItems.length === 0 ? (
								<div className="flex flex-col items-center justify-center px-4 py-12 text-center">
									<div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
										<IconCheckCircle />
									</div>
									<p className="text-base font-medium text-foreground">All clear</p>
									<p className="mt-0.5 text-sm text-muted-foreground">No urgent stock issues right now.</p>
								</div>
							) : (
								<>
									{/* Header – desktop */}
									<div className="hidden border-b border-border/40 bg-muted/30 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid sm:grid-cols-[1fr_80px_90px_90px_110px]">
										<span>Product</span>
										<span className="text-center">Stock</span>
										<span className="text-center">Status</span>
										<span className="text-center">Reorder</span>
										<span className="text-right">Action</span>
									</div>

									<ul className="divide-y divide-border/40">
										{visibleItems.map((item) => {
											const isOrdered = Boolean(orderedQuantities[item.id]);
											return (
												<li
													key={item.id}
													className="px-4 py-3 transition-colors hover:bg-muted/20 sm:grid sm:grid-cols-[1fr_80px_90px_90px_110px] sm:items-center"
												>
													{/* Product */}
													<div className="min-w-0">
														<p className="truncate font-medium text-foreground">{item.name}</p>
														<p className="truncate text-sm text-muted-foreground">{item.reason}</p>
													</div>

													{/* Stock */}
													<p className="hidden text-center text-base tabular-nums text-muted-foreground sm:block">
														{item.currentStock}
													</p>

													{/* Status */}
													<div className="mt-1.5 sm:mt-0 sm:text-center">
														{statusBadge(item.status)}
													</div>

													{/* Reorder qty */}
													<p className="hidden text-center text-base font-semibold tabular-nums text-foreground sm:block">
														{item.reorderQty > 0 ? item.reorderQty : "—"}
													</p>

													{/* Action */}
													<div className="mt-2 sm:mt-0 sm:text-right">
														{item.reorderQty > 0 ? (
															<button
																type="button"
																disabled={isOrdered}
																onClick={() => openReorderDialog(item)}
																className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
																	isOrdered
																		? "cursor-not-allowed bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20"
																		: "bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.97]"
																}`}
															>
																{isOrdered ? <><IconCheck /> Ordered</> : <>Reorder <IconChevronRight /></>}
															</button>
														) : (
															<span className="text-sm text-muted-foreground/50">No action</span>
														)}
													</div>
												</li>
											);
										})}
									</ul>
								</>
							)}
						</div>
					</section>

					{/* Weekly sales chart */}
					<section>
						<h2 className="mb-3 flex items-center gap-2 text-base font-semibold uppercase tracking-wider text-muted-foreground">
							<IconBarChart /> Weekly sales
						</h2>
						<div className="rounded-xl border border-border/60 bg-card p-4">
							<div className="mb-2 flex items-baseline justify-between">
								<p className="text-sm text-muted-foreground">Daily unit sales</p>
								<p className="text-base font-bold tabular-nums text-foreground">{salesThisWeek} total</p>
							</div>
							<WeeklySalesChart data={weeklyTotals} />
						</div>
					</section>
				</div>

				{/* Right sidebar – 1/3 width */}
				<div className="space-y-5">

					{/* Top stock items */}
					<section>
						<h2 className="mb-3 flex items-center gap-2 text-base font-semibold uppercase tracking-wider text-muted-foreground">
							<IconTrendUp /> Top stock
						</h2>
						<div className="overflow-hidden rounded-xl border border-border/60 bg-card">
							<ul className="divide-y divide-border/40">
								{topProducts.map((item, idx) => (
									<li key={item.id} className="flex items-center gap-3 px-4 py-3">
										<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
											{idx + 1}
										</span>
										<div className="min-w-0 flex-1">
											<p className="truncate text-base font-medium text-foreground">{item.name}</p>
											<p className="text-sm text-muted-foreground">{item.currentStock} units</p>
										</div>
									</li>
								))}
							</ul>
						</div>
					</section>

					{/* Quick actions */}
					<section>
						<h2 className="mb-3 flex items-center gap-2 text-base font-semibold uppercase tracking-wider text-muted-foreground">
							<IconZap /> Quick actions
						</h2>
						<div className="space-y-1.5">
							{[
								{ label: "View all products", href: "/inventory" },
								{ label: "Add new product", href: "/inventory" },
								{ label: "Adjust stock levels", href: "/inventory" },
								{ label: "View reports", href: "/forecast" },
							].map((action) => (
								<button
									key={action.label}
									type="button"
									onClick={() => { window.location.href = action.href; }}
									className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-card px-4 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted/30"
								>
									{action.label}
									<IconArrowRight />
								</button>
							))}
						</div>
					</section>

					{/* Alert summary */}
					<section>
						<h2 className="mb-3 flex items-center gap-2 text-base font-semibold uppercase tracking-wider text-muted-foreground">
							<IconBell /> Alert summary
						</h2>
						<div className="overflow-hidden rounded-xl border border-border/60 bg-card">
							<ul className="divide-y divide-border/40">
								{[
									{ label: "Critical", count: stockoutItems.length, dotColor: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]" },
									{ label: "Warning", count: lowStockItems.length, dotColor: "bg-amber-500" },
									{ label: "Normal", count: goodStockItems.length, dotColor: "bg-emerald-500" },
								].map((row) => (
									<li key={row.label} className="flex items-center justify-between px-4 py-3">
										<div className="flex items-center gap-2.5">
											<span className={`flex h-2 w-2 shrink-0 rounded-full ${row.dotColor}`} />
											<span className="text-base text-foreground">{row.label}</span>
										</div>
										<span className="text-base font-bold tabular-nums text-foreground">{row.count}</span>
									</li>
								))}
							</ul>
						</div>
					</section>
				</div>
			</div>

			<HelpHint description="Prioritize 'Out of Stock' items first, then clear low-stock items with highest reorder value to protect weekly sales." />

			{/* ── Reorder dialog ───────────────────────────────────── */}
			{reorderDialogItem && (
				<div
					className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
					role="dialog"
					aria-modal="true"
					aria-label="Reorder product"
					onClick={(e) => e.target === e.currentTarget && closeReorderDialog()}
				>
					<div className="w-full max-w-md rounded-t-2xl border border-border/60 bg-card shadow-2xl sm:rounded-2xl">
						{/* Header */}
						<div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
							<div>
								<h2 className="text-base font-semibold text-foreground">Reorder product</h2>
								<p className="mt-0.5 text-sm text-muted-foreground">{reorderDialogItem.name}</p>
							</div>
							<button type="button" onClick={closeReorderDialog} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground" aria-label="Close">
								<IconX />
							</button>
						</div>

						{/* Step indicator */}
						<div className="flex gap-2 px-5 pt-4">
							{[1, 2].map((step) => (
								<div key={step} className="flex flex-1 flex-col items-center gap-1">
									<div className={`h-1 w-full rounded-full transition-colors ${step <= reorderDialogStep ? "bg-primary" : "bg-muted"}`} />
									<span className="text-xs font-medium text-muted-foreground">{step === 1 ? "Quantity" : "Confirm"}</span>
								</div>
							))}
						</div>

						<div className="px-5 pb-5 pt-4">
							{reorderDialogStep === 1 ? (
								<div className="space-y-4">
									<div className="rounded-lg bg-muted/30 px-3 py-2.5">
										<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Suggested quantity</p>
										<p className="mt-0.5 text-lg font-bold text-foreground">
											{reorderDialogItem.reorderQty} <span className="text-base font-normal text-muted-foreground">units</span>
										</p>
									</div>

									<label htmlFor="dashboard-reorder-amount" className="block text-base font-medium text-foreground">
										Order quantity
										<div className="mt-2 flex items-center gap-1.5">
											<button type="button" onClick={() => setReorderAmount((c) => Math.max(1, c - 1))} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background text-foreground transition-colors hover:bg-muted/40"><IconMinus /></button>
											<input
												id="dashboard-reorder-amount"
												type="number"
												min={1}
												value={reorderAmount}
												onChange={(e) => setReorderAmount(Math.max(1, Number(e.target.value) || 1))}
												className="h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-center text-base font-semibold text-foreground tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
											/>
											<button type="button" onClick={() => setReorderAmount((c) => c + 1)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background text-foreground transition-colors hover:bg-muted/40"><IconPlus /></button>
										</div>
									</label>

									{getUnitPrice(reorderDialogItem) > 0 && (
										<p className="text-sm text-muted-foreground">
											Est. cost: <span className="font-semibold text-foreground">${(reorderAmount * getUnitPrice(reorderDialogItem)).toFixed(2)}</span>
										</p>
									)}

									<div className="flex justify-end gap-2 pt-2">
										<button type="button" onClick={closeReorderDialog} className="rounded-lg border border-border/70 bg-background px-4 py-2 text-base font-medium text-foreground transition-colors hover:bg-muted/40">Cancel</button>
										<button type="button" onClick={() => setReorderDialogStep(2)} className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-base font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90">Next <IconChevronRight /></button>
									</div>
								</div>
							) : (
								<div className="space-y-4">
									<div className="divide-y divide-border/40 rounded-lg border border-border/60 bg-muted/20">
										{[
											{ label: "Product", value: reorderDialogItem.name },
											{ label: "Quantity", value: `${reorderAmount} units` },
											...(getUnitPrice(reorderDialogItem) > 0 ? [{ label: "Est. cost", value: `$${(reorderAmount * getUnitPrice(reorderDialogItem)).toFixed(2)}` }] : []),
										].map((row) => (
											<div key={row.label} className="flex items-center justify-between px-3 py-2.5">
														<span className="text-sm text-muted-foreground">{row.label}</span>
												<span className="text-base font-semibold text-foreground">{row.value}</span>
											</div>
										))}
									</div>

									<div className="flex justify-end gap-2 pt-2">
										<button type="button" onClick={() => setReorderDialogStep(1)} className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background px-4 py-2 text-base font-medium text-foreground transition-colors hover:bg-muted/40"><IconArrowLeft /> Back</button>
										<button type="button" onClick={confirmReorder} className="inline-flex items-center gap-1 rounded-lg bg-primary px-5 py-2 text-base font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"><IconCheck /> Confirm</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</SmartStockShell>
	);
}