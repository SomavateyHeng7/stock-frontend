"use client";

import { useMemo, useState } from "react";
import { SmartStockShell } from "@/components/smartstock-shell";
import { useToast } from "@/components/ui/toast-provider";
import { getEnrichedProducts, getStatusClass } from "@/lib/smartstock-data";
import {
	createPurchaseOrder,
	getActiveOrderByProduct,
	readPurchaseOrders,
	updatePurchaseOrderStatus,
	type PurchaseOrder,
} from "@/lib/procurement-orders";

/* ------------------------------------------------------------------ */
/*  Tiny icon components – avoids an icon-library dependency          */
/* ------------------------------------------------------------------ */
const IconPackage = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" /></svg>
);
const IconTruck = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.684-.948V8h4.868a1 1 0 0 1 .868.504l1.04 1.8A3 3 0 0 1 22 12.12V17a1 1 0 0 1-1 1h-1" /><circle cx="7" cy="18" r="2" /><circle cx="19" cy="18" r="2" /></svg>
);
const IconCheck = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const IconX = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);
const IconMinus = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
);
const IconPlus = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
);
const IconChevronRight = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
);
const IconArrowLeft = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
);
const IconClipboard = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>
);
const IconInbox = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
);

/* ------------------------------------------------------------------ */
/*  Status badge helper                                                */
/* ------------------------------------------------------------------ */
const statusBadge = (status: string) => {
	const base = "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase";
	switch (status) {
		case "Out of Stock":
			return <span className={`${base} bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-inset ring-red-500/20`}>{status}</span>;
		case "Low Stock":
			return <span className={`${base} bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20`}>{status}</span>;
		default:
			return <span className={`${base} bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20`}>{status}</span>;
	}
};

const orderStatusBadge = (status: string) => {
	const base = "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase";
	switch (status) {
		case "placed":
			return <span className={`${base} bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500/20`}>{status}</span>;
		case "acknowledged":
			return <span className={`${base} bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-inset ring-violet-500/20`}>{status}</span>;
		case "received":
			return <span className={`${base} bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20`}>{status}</span>;
		case "cancelled":
			return <span className={`${base} bg-neutral-500/10 text-neutral-500 ring-1 ring-inset ring-neutral-500/20 line-through`}>{status}</span>;
		default:
			return <span className={`${base} bg-neutral-500/10 text-neutral-500 ring-1 ring-inset ring-neutral-500/20`}>{status}</span>;
	}
};

/* ------------------------------------------------------------------ */
/*  Main page                                                         */
/* ------------------------------------------------------------------ */
export default function ReorderQueuePage() {
	const { showToast } = useToast();

	const reorderItems = useMemo(
		() =>
			getEnrichedProducts().filter(
				(item) => (item.status === "Low Stock" || item.status === "Out of Stock") && item.reorderQty > 0,
			),
		[],
	);

	const [reorderDialogItem, setReorderDialogItem] = useState<(typeof reorderItems)[number] | null>(null);
	const [reorderDialogStep, setReorderDialogStep] = useState<1 | 2>(1);
	const [reorderAmount, setReorderAmount] = useState(1);
	const [orders, setOrders] = useState<PurchaseOrder[]>(() => readPurchaseOrders());

	const activeOrderByProduct = useMemo(() => getActiveOrderByProduct(orders), [orders]);
	const openOrders = orders.filter((o) => o.status === "placed" || o.status === "acknowledged");
	const openOrderQty = openOrders.reduce((sum, o) => sum + o.quantity, 0);
	const receivedCount = orders.filter((o) => o.status === "received").length;

	/* ---- actions ---- */
	const markOrdered = (productId: number, productName: string, reorderQty: number) => {
		const existing = activeOrderByProduct.get(productId);
		if (existing) {
			showToast({ title: "Order already open", description: `${productName} is already in PO ${existing.id}.` });
			return;
		}
		const item = reorderItems.find((row) => row.id === productId);
		createPurchaseOrder({
			productId,
			productName,
			supplierId: item?.supplier?.id ?? null,
			supplierName: item?.supplier?.name ?? "Unassigned",
			quantity: reorderQty,
		});
		setOrders(readPurchaseOrders());
		showToast({ title: "Reorder placed", description: `${productName}: ${reorderQty} units ordered.` });
	};

	const openReorderDialog = (item: (typeof reorderItems)[number]) => {
		if (activeOrderByProduct.has(item.id)) return;
		setReorderDialogItem(item);
		setReorderAmount(Math.max(1, item.reorderQty));
		setReorderDialogStep(1);
	};

	const closeReorderDialog = () => {
		setReorderDialogItem(null);
		setReorderDialogStep(1);
		setReorderAmount(1);
	};

	const confirmReorderDialog = () => {
		if (!reorderDialogItem) return;
		markOrdered(reorderDialogItem.id, reorderDialogItem.name, Math.max(1, Math.floor(reorderAmount)));
		closeReorderDialog();
	};

	const setOrderStatus = (orderId: string, nextStatus: "acknowledged" | "received" | "cancelled") => {
		const updated = updatePurchaseOrderStatus(orderId, nextStatus);
		setOrders(updated);
		showToast({ title: "Order updated", description: `PO ${orderId} → ${nextStatus}.` });
	};

	/* ------------------------------------------------------------------ */
	/*  Render                                                             */
	/* ------------------------------------------------------------------ */
	return (
		<SmartStockShell
			title="Reorder queue"
			subtitle="AI-powered reorder recommendations based on demand trends and supplier lead times."
		>
			{/* ── KPI strip ─────────────────────────────────────────── */}
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
				{[
					{ label: "Open POs", value: openOrders.length, icon: <IconClipboard />, color: "text-blue-600 dark:text-blue-400" },
					{ label: "Units on order", value: openOrderQty, icon: <IconTruck />, color: "text-violet-600 dark:text-violet-400" },
					{ label: "Recommendations", value: reorderItems.length, icon: <IconInbox />, color: "text-amber-600 dark:text-amber-400" },
					{ label: "Received", value: receivedCount, icon: <IconPackage />, color: "text-emerald-600 dark:text-emerald-400" },
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

			{/* ── Recommendations table ────────────────────────────── */}
			<section className="mt-6">
				<h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					<IconInbox /> Recommendations
				</h2>

				<div className="overflow-hidden rounded-xl border border-border/60 bg-card">
					{/* Header – desktop only */}
					<div className="hidden border-b border-border/40 bg-muted/30 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid sm:grid-cols-[1fr_140px_120px_100px_120px]">
						<span>Product</span>
						<span>Supplier</span>
						<span className="text-center">Lead time</span>
						<span className="text-center">Status</span>
						<span className="text-right">Action</span>
					</div>

					{reorderItems.length === 0 && (
						<p className="px-4 py-8 text-center text-sm text-muted-foreground">
							All products are sufficiently stocked. Nothing to reorder.
						</p>
					)}

					<ul className="divide-y divide-border/40">
						{reorderItems.map((item) => {
							const hasOpenPO = activeOrderByProduct.has(item.id);
							const activePO = activeOrderByProduct.get(item.id);

							return (
								<li
									key={item.id}
									className="group px-4 py-3 transition-colors hover:bg-muted/20 sm:grid sm:grid-cols-[1fr_140px_120px_100px_120px] sm:items-center"
								>
									{/* Product info */}
									<div className="min-w-0">
										<p className="truncate font-medium text-foreground">{item.name}</p>
										<p className="truncate text-xs text-muted-foreground">{item.reason}</p>
										{hasOpenPO && (
											<p className="mt-0.5 text-[11px] text-muted-foreground/70">
												Open: {activePO?.id} · {activePO?.quantity} units
											</p>
										)}
									</div>

									{/* Supplier */}
									<p className="mt-1 truncate text-sm text-muted-foreground sm:mt-0">
										{item.supplier?.name ?? <span className="italic opacity-50">Unassigned</span>}
									</p>

									{/* Lead time */}
									<p className="hidden text-center text-sm text-muted-foreground sm:block">
										{item.supplier?.leadTimeDays ?? 0}d
									</p>

									{/* Status */}
									<div className="mt-1.5 sm:mt-0 sm:text-center">{statusBadge(item.status)}</div>

									{/* Action */}
									<div className="mt-2 sm:mt-0 sm:text-right">
										<button
											type="button"
											disabled={hasOpenPO}
											onClick={() => openReorderDialog(item)}
											className={`
												inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all
												${hasOpenPO
													? "cursor-not-allowed bg-muted/40 text-muted-foreground/50"
													: "bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.97]"
												}
											`}
										>
											{hasOpenPO ? "PO open" : <>Create PO <IconChevronRight /></>}
										</button>
									</div>
								</li>
							);
						})}
					</ul>
				</div>
			</section>

			{/* ── Purchase orders ──────────────────────────────────── */}
			<section className="mt-6">
				<h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					<IconClipboard /> Purchase orders
				</h2>

				<div className="overflow-hidden rounded-xl border border-border/60 bg-card">
					{orders.length === 0 ? (
						<p className="px-4 py-8 text-center text-sm text-muted-foreground">
							No purchase orders yet. Create one from the recommendations above.
						</p>
					) : (
						<>
							{/* Header – desktop */}
							<div className="hidden border-b border-border/40 bg-muted/30 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid sm:grid-cols-[100px_1fr_80px_100px_1fr]">
								<span>PO #</span>
								<span>Product · Supplier</span>
								<span className="text-center">Qty</span>
								<span className="text-center">Status</span>
								<span className="text-right">Actions</span>
							</div>

							<ul className="divide-y divide-border/40">
								{orders.slice(0, 12).map((order) => (
									<li
										key={order.id}
										className="px-4 py-3 transition-colors hover:bg-muted/20 sm:grid sm:grid-cols-[100px_1fr_80px_100px_1fr] sm:items-center"
									>
										<p className="text-sm font-semibold text-foreground">{order.id}</p>

										<div className="mt-0.5 min-w-0 sm:mt-0">
											<p className="truncate text-sm text-foreground">{order.productName}</p>
											<p className="truncate text-xs text-muted-foreground">{order.supplierName}</p>
										</div>

										<p className="hidden text-center text-sm font-medium text-foreground sm:block">
											{order.quantity}
										</p>

										<div className="mt-1.5 sm:mt-0 sm:text-center">
											{orderStatusBadge(order.status)}
										</div>

										{/* Action buttons */}
										<div className="mt-2 flex flex-wrap justify-end gap-1.5 sm:mt-0">
											{order.status === "placed" && (
												<button
													type="button"
													onClick={() => setOrderStatus(order.id, "acknowledged")}
													className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted/40"
												>
													Acknowledge
												</button>
											)}
											{order.status !== "received" && order.status !== "cancelled" && (
												<>
													<button
														type="button"
														onClick={() => setOrderStatus(order.id, "received")}
														className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
													>
														<IconCheck /> Received
													</button>
													<button
														type="button"
														onClick={() => setOrderStatus(order.id, "cancelled")}
														className="inline-flex items-center gap-1 rounded-md border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-2.5 py-1 text-[11px] font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-950/50"
													>
														<IconX /> Cancel
													</button>
												</>
											)}
										</div>
									</li>
								))}
							</ul>
						</>
					)}
				</div>
			</section>

			{/* ── Reorder dialog ───────────────────────────────────── */}
			{reorderDialogItem && (
				<div
					className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
					role="dialog"
					aria-modal="true"
					aria-label="Create purchase order"
					onClick={(e) => e.target === e.currentTarget && closeReorderDialog()}
				>
					<div className="w-full max-w-md rounded-t-2xl border border-border/60 bg-card shadow-2xl sm:rounded-2xl">
						{/* Dialog header */}
						<div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
							<div>
								<h2 className="text-base font-semibold text-foreground">Create purchase order</h2>
								<p className="mt-0.5 text-xs text-muted-foreground">{reorderDialogItem.name}</p>
							</div>
							<button
								type="button"
								onClick={closeReorderDialog}
								className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
								aria-label="Close"
							>
								<IconX />
							</button>
						</div>

						{/* Steps indicator */}
						<div className="flex gap-2 px-5 pt-4">
							{[1, 2].map((step) => (
								<div key={step} className="flex flex-1 flex-col items-center gap-1">
									<div
										className={`h-1 w-full rounded-full transition-colors ${
											step <= reorderDialogStep ? "bg-primary" : "bg-muted"
										}`}
									/>
									<span className="text-[10px] font-medium text-muted-foreground">
										{step === 1 ? "Quantity" : "Confirm"}
									</span>
								</div>
							))}
						</div>

						{/* Step content */}
						<div className="px-5 pb-5 pt-4">
							{reorderDialogStep === 1 ? (
								<div className="space-y-4">
									<div className="rounded-lg bg-muted/30 px-3 py-2.5">
										<p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
											Suggested quantity
										</p>
										<p className="mt-0.5 text-lg font-bold text-foreground">
											{reorderDialogItem.reorderQty} <span className="text-sm font-normal text-muted-foreground">units</span>
										</p>
									</div>

									<label htmlFor="reorder-queue-amount" className="block text-sm font-medium text-foreground">
										Order quantity
										<div className="mt-2 flex items-center gap-1.5">
											<button
												type="button"
												onClick={() => setReorderAmount((c) => Math.max(1, c - 1))}
												className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background text-foreground transition-colors hover:bg-muted/40"
											>
												<IconMinus />
											</button>
											<input
												id="reorder-queue-amount"
												type="number"
												min={1}
												value={reorderAmount}
												onChange={(e) => setReorderAmount(Math.max(1, Number(e.target.value) || 1))}
												className="h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-center text-sm font-semibold text-foreground tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
											/>
											<button
												type="button"
												onClick={() => setReorderAmount((c) => c + 1)}
												className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background text-foreground transition-colors hover:bg-muted/40"
											>
												<IconPlus />
											</button>
										</div>
									</label>

									<div className="flex justify-end gap-2 pt-2">
										<button
											type="button"
											onClick={closeReorderDialog}
											className="rounded-lg border border-border/70 bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
										>
											Cancel
										</button>
										<button
											type="button"
											onClick={() => setReorderDialogStep(2)}
											className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
										>
											Next <IconChevronRight />
										</button>
									</div>
								</div>
							) : (
								<div className="space-y-4">
									<div className="divide-y divide-border/40 rounded-lg border border-border/60 bg-muted/20">
										{[
											{ label: "Product", value: reorderDialogItem.name },
											{ label: "Supplier", value: reorderDialogItem.supplier?.name ?? "Unassigned" },
											{ label: "Quantity", value: `${reorderAmount} units` },
										].map((row) => (
											<div key={row.label} className="flex items-center justify-between px-3 py-2.5">
												<span className="text-xs text-muted-foreground">{row.label}</span>
												<span className="text-sm font-semibold text-foreground">{row.value}</span>
											</div>
										))}
									</div>

									<div className="flex justify-end gap-2 pt-2">
										<button
											type="button"
											onClick={() => setReorderDialogStep(1)}
											className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
										>
											<IconArrowLeft /> Back
										</button>
										<button
											type="button"
											onClick={confirmReorderDialog}
											className="inline-flex items-center gap-1 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
										>
											<IconCheck /> Confirm PO
										</button>
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