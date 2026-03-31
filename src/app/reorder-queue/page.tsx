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

export default function ReorderQueuePage() {
	const { showToast } = useToast();
	const reorderItems = useMemo(
		() =>
			getEnrichedProducts().filter(
				(item) => (item.status === "Low Stock" || item.status === "Out of Stock") && item.reorderQty > 0,
			),
		[],
	);
	const [orders, setOrders] = useState<PurchaseOrder[]>(() => readPurchaseOrders());

	const activeOrderByProduct = useMemo(() => getActiveOrderByProduct(orders), [orders]);
	const openOrders = orders.filter((item) => item.status === "placed" || item.status === "acknowledged");
	const openOrderQty = openOrders.reduce((sum, item) => sum + item.quantity, 0);

	const markOrdered = (productId: number, productName: string, reorderQty: number) => {
		const existing = activeOrderByProduct.get(productId);
		if (existing) {
			showToast({
				title: "Order already open",
				description: `${productName} is already in PO ${existing.id}.`,
			});
			return;
		}

		const item = reorderItems.find((row) => row.id === productId);
		const order = createPurchaseOrder({
			productId,
			productName,
			supplierId: item?.supplier?.id ?? null,
			supplierName: item?.supplier?.name ?? "Unassigned",
			quantity: reorderQty,
		});

		const refreshed = readPurchaseOrders();
		setOrders(refreshed);

		showToast({
			title: "Reorder placed",
			description: `${productName}: ${reorderQty} units in ${order.id}.`,
		});
	};

	const setOrderStatus = (orderId: string, nextStatus: "acknowledged" | "received" | "cancelled") => {
		const updated = updatePurchaseOrderStatus(orderId, nextStatus);
		setOrders(updated);

		showToast({
			title: "Order updated",
			description: `PO ${orderId} marked as ${nextStatus}.`,
		});
	};

	return (
		<SmartStockShell title="Smart reorder recommendations" subtitle="Suggested quantity from demand and lead-time signals.">
			<section className="space-y-4" aria-label="Reorder queue">
				<article className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:grid-cols-4">
					<div className="rounded-lg border border-border/70 bg-muted/20 p-3">
						<p className="text-xs text-muted-foreground">Open purchase orders</p>
						<p className="text-xl font-semibold text-foreground">{openOrders.length}</p>
					</div>
					<div className="rounded-lg border border-border/70 bg-muted/20 p-3">
						<p className="text-xs text-muted-foreground">Units on order</p>
						<p className="text-xl font-semibold text-foreground">{openOrderQty}</p>
					</div>
					<div className="rounded-lg border border-border/70 bg-muted/20 p-3">
						<p className="text-xs text-muted-foreground">Recommendations</p>
						<p className="text-xl font-semibold text-foreground">{reorderItems.length}</p>
					</div>
					<div className="rounded-lg border border-border/70 bg-muted/20 p-3">
						<p className="text-xs text-muted-foreground">Received orders</p>
						<p className="text-xl font-semibold text-foreground">
							{orders.filter((item) => item.status === "received").length}
						</p>
					</div>
				</article>

				<article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
					<h2 className="mb-3 text-lg font-semibold text-foreground">Reorder recommendations</h2>
					<ul className="space-y-3">
						{reorderItems.map((item) => (
							<li key={item.id} className="rounded-xl border border-border/70 bg-muted/20 p-3">
								<div className="flex items-start justify-between gap-2">
									<div>
										<p className="font-medium text-foreground">{item.name}</p>
										<p className="text-sm text-muted-foreground">{item.reason}</p>
										<p className="text-sm text-muted-foreground">
											Supplier: {item.supplier?.name ?? "Unassigned"} · Lead time: {item.supplier?.leadTimeDays ?? 0} days
										</p>
										{activeOrderByProduct.has(item.id) && (
											<p className="mt-1 text-xs text-muted-foreground">
												Open PO: {activeOrderByProduct.get(item.id)?.id} · Qty {activeOrderByProduct.get(item.id)?.quantity}
											</p>
										)}
									</div>
									<span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getStatusClass(item.status)}`}>
										{item.status}
									</span>
								</div>
								<button
									type="button"
									className="mt-3 w-full rounded-lg bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
									onClick={() => markOrdered(item.id, item.name, item.reorderQty)}
									disabled={activeOrderByProduct.has(item.id)}
								>
									{activeOrderByProduct.has(item.id) ? "Already in open PO" : `Create PO for ${item.reorderQty} units`}
								</button>
							</li>
						))}
					</ul>
				</article>

				<article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
					<h2 className="mb-3 text-lg font-semibold text-foreground">Purchase orders</h2>
					{orders.length === 0 ? (
						<p className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
							No purchase orders yet. Create one from the recommendations above.
						</p>
					) : (
						<ul className="space-y-3">
							{orders.slice(0, 12).map((order) => (
								<li key={order.id} className="rounded-xl border border-border/70 bg-muted/20 p-3">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<div>
											<p className="font-medium text-foreground">{order.id}</p>
											<p className="text-sm text-muted-foreground">
												{order.productName} · {order.quantity} units · {order.supplierName}
											</p>
										</div>
										<span className="inline-flex rounded-full border border-border bg-background px-2 py-1 text-xs font-medium text-foreground">
											{order.status}
										</span>
									</div>

									<div className="mt-2 flex flex-wrap gap-2">
										{order.status === "placed" && (
											<button
												type="button"
												onClick={() => setOrderStatus(order.id, "acknowledged")}
												className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-medium text-foreground"
											>
												Mark acknowledged
											</button>
										)}
										{order.status !== "received" && order.status !== "cancelled" && (
											<>
												<button
													type="button"
													onClick={() => setOrderStatus(order.id, "received")}
													className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
												>
													Mark received
												</button>
												<button
													type="button"
													onClick={() => setOrderStatus(order.id, "cancelled")}
													className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-medium text-foreground"
												>
													Cancel
												</button>
											</>
										)}
									</div>
								</li>
							))}
						</ul>
					)}
				</article>
			</section>
		</SmartStockShell>
	);
}
