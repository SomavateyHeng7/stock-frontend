"use client";

import { useEffect, useMemo, useState } from "react";
import {
	AddSupplierPanel,
	type SupplierRow,
} from "@/components/suppliers/add-supplier-panel";
import { SmartStockShell } from "@/components/smartstock-shell";
import { useToast } from "@/components/ui/toast-provider";
import {
	appendMovements,
	getInventoryLedgerState,
	saveInventoryLedgerState,
} from "@/lib/inventory-ledger";
import {
	getReliabilityClass,
	readSmartStockState,
	writeSmartStockSuppliers,
	type SupplierReliability,
} from "@/lib/smartstock-data";
import {
	applyPurchaseOrderReceipt,
	getOpenPurchaseOrders,
	PROCUREMENT_ORDERS_CHANGED_EVENT,
	readPurchaseOrders,
	updatePurchaseOrderStatus,
	type PurchaseOrder,
	type PurchaseOrderStatus,
} from "@/lib/procurement-orders";

type SuppliersView = "directory" | "receiving";

type ReceiptInput = {
	received: number;
	damaged: number;
	missing: number;
};

const emptyReceiptInput: ReceiptInput = {
	received: 0,
	damaged: 0,
	missing: 0,
};

const parseQuantity = (value: string) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

export default function SuppliersPage() {
	const { showToast } = useToast();

	const [activeView, setActiveView] = useState<SuppliersView>("directory");
	const [addPanelKey, setAddPanelKey] = useState(0);

	const [suppliers, setSuppliers] = useState<SupplierRow[]>(() =>
		readSmartStockState().suppliers.map((supplier) => ({
			...supplier,
			contactVerified: true,
			leadTimeHistory: [],
		})),
	);

	const [searchQuery, setSearchQuery] = useState("");
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editName, setEditName] = useState("");
	const [editPhone, setEditPhone] = useState("");
	const [editLeadTime, setEditLeadTime] = useState<number>(1);
	const [editReliability, setEditReliability] =
		useState<SupplierReliability>("Medium");

	const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() =>
		readPurchaseOrders(),
	);
	const [ledgerState, setLedgerState] = useState(() =>
		getInventoryLedgerState(),
	);
	const [selectedBranchId, setSelectedBranchId] = useState<string>(
		() => getInventoryLedgerState().branches[0]?.id ?? "",
	);
	const [actor, setActor] = useState("Receiving clerk");
	const [receiptInputs, setReceiptInputs] = useState<
		Record<string, ReceiptInput>
	>({});
	const [receiptReasons, setReceiptReasons] = useState<Record<string, string>>(
		{},
	);

	const canSaveEdit =
		editingId !== null &&
		editName.trim().length > 0 &&
		editPhone.trim().length > 0 &&
		Number.isFinite(editLeadTime) &&
		editLeadTime > 0;

	const filteredSuppliers = useMemo(() => {
		const keyword = searchQuery.trim().toLowerCase();

		if (!keyword) return suppliers;

		return suppliers.filter(
			(supplier) =>
				supplier.name.toLowerCase().includes(keyword) ||
				supplier.phone.toLowerCase().includes(keyword),
		);
	}, [suppliers, searchQuery]);

	const purchaseOrdersBySupplier = useMemo(() => {
		const grouped = new Map<string, PurchaseOrder[]>();

		for (const order of purchaseOrders) {
			const key = order.supplierName || "Unassigned";
			const current = grouped.get(key) ?? [];

			current.push(order);
			grouped.set(key, current);
		}

		return Array.from(grouped.entries())
			.map(([supplierName, orders]) => ({
				supplierName,
				orders: orders.sort(
					(a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
				),
			}))
			.sort((a, b) => a.supplierName.localeCompare(b.supplierName));
	}, [purchaseOrders]);

	const branchById = useMemo(() => {
		return Object.fromEntries(
			ledgerState.branches.map((branch) => [branch.id, branch.name]),
		);
	}, [ledgerState.branches]);

	const openPurchaseOrders = useMemo(
		() => getOpenPurchaseOrders(purchaseOrders),
		[purchaseOrders],
	);

	const startEdit = (supplier: SupplierRow) => {
		setEditingId(supplier.id);
		setEditName(supplier.name);
		setEditPhone(supplier.phone);
		setEditLeadTime(supplier.leadTimeDays);
		setEditReliability(supplier.reliability);
	};

	const cancelEdit = () => {
		setEditingId(null);
		setEditName("");
		setEditPhone("");
		setEditLeadTime(1);
		setEditReliability("Medium");
	};

	const saveEdit = (supplierId: number) => {
		if (!canSaveEdit) return;

		setSuppliers((current) =>
			current.map((supplier) => {
				if (supplier.id !== supplierId) return supplier;

				const leadTimeDays = Math.max(1, editLeadTime);
				const leadTimeChanged = supplier.leadTimeDays !== leadTimeDays;

				return {
					...supplier,
					name: editName.trim(),
					phone: editPhone.trim(),
					leadTimeDays,
					reliability: editReliability,
					leadTimeHistory: leadTimeChanged
						? [
								{
									from: supplier.leadTimeDays,
									to: leadTimeDays,
									changedAt: new Date().toISOString(),
								},
								...supplier.leadTimeHistory,
							]
						: supplier.leadTimeHistory,
				};
			}),
		);

		showToast({
			title: "Supplier updated",
			description: `${editName.trim()} details saved successfully.`,
		});

		cancelEdit();
	};

	const deleteSupplier = (supplierId: number) => {
		const target = suppliers.find((item) => item.id === supplierId);
		if (!target) return;

		const shouldDelete = window.confirm(
			`Delete supplier "${target.name}"? This action cannot be undone.`,
		);

		if (!shouldDelete) return;

		setSuppliers((current) =>
			current.filter((supplier) => supplier.id !== supplierId),
		);

		if (editingId === supplierId) {
			cancelEdit();
		}

		showToast({
			title: "Supplier deleted",
			description: `${target.name} removed from supplier list.`,
		});
	};

	const toggleContactVerification = (supplierId: number) => {
		setSuppliers((current) =>
			current.map((supplier) =>
				supplier.id === supplierId
					? {
							...supplier,
							contactVerified: !supplier.contactVerified,
						}
					: supplier,
			),
		);
	};

	useEffect(() => {
		writeSmartStockSuppliers(
			suppliers.map((supplier) => ({
				id: supplier.id,
				name: supplier.name,
				leadTimeDays: supplier.leadTimeDays,
				phone: supplier.phone,
				nextDelivery: supplier.nextDelivery,
				reliability: supplier.reliability,
			})),
		);
	}, [suppliers]);

	useEffect(() => {
		const refreshOrders = () => setPurchaseOrders(readPurchaseOrders());

		window.addEventListener("storage", refreshOrders);
		window.addEventListener(PROCUREMENT_ORDERS_CHANGED_EVENT, refreshOrders);

		return () => {
			window.removeEventListener("storage", refreshOrders);
			window.removeEventListener(
				PROCUREMENT_ORDERS_CHANGED_EVENT,
				refreshOrders,
			);
		};
	}, []);

	useEffect(() => {
		const syncViewFromUrl = () => {
			const params = new URLSearchParams(window.location.search);

			setActiveView(
				params.get("view") === "receiving" ? "receiving" : "directory",
			);
		};

		syncViewFromUrl();
		window.addEventListener("popstate", syncViewFromUrl);

		return () => window.removeEventListener("popstate", syncViewFromUrl);
	}, []);

	useEffect(() => {
		saveInventoryLedgerState(ledgerState);
	}, [ledgerState]);

	const getVerificationClass = (verified: boolean) => {
		if (verified) {
			return "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
		}

		return "border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
	};

	const getOrderStatusClass = (status: PurchaseOrderStatus) => {
		if (status === "placed") {
			return "border-slate-400/40 bg-slate-500/10 text-slate-700 dark:text-slate-300";
		}

		if (status === "acknowledged") {
			return "border-blue-400/40 bg-blue-500/10 text-blue-700 dark:text-blue-300";
		}

		if (status === "partially_received") {
			return "border-yellow-400/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300";
		}

		if (status === "received") {
			return "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
		}

		return "border-rose-400/40 bg-rose-500/10 text-rose-700 dark:text-rose-300";
	};

	const formatOrderStatus = (status: PurchaseOrderStatus) =>
		status.replaceAll("_", " ");

	const getRemainingQty = (order: PurchaseOrder) =>
		Math.max(
			0,
			order.quantity - order.receivedQty - order.damagedQty - order.missingQty,
		);

	const getInputForOrder = (orderId: string) =>
		receiptInputs[orderId] ?? emptyReceiptInput;

	const updateInput = (
		orderId: string,
		field: keyof ReceiptInput,
		value: number,
	) => {
		setReceiptInputs((current) => ({
			...current,
			[orderId]: {
				...(current[orderId] ?? emptyReceiptInput),
				[field]: Math.max(0, value),
			},
		}));
	};

	const updateReason = (orderId: string, value: string) => {
		setReceiptReasons((current) => ({
			...current,
			[orderId]: value,
		}));
	};

	const postReceipt = (order: PurchaseOrder) => {
		const input = getInputForOrder(order.id);
		const remaining = getRemainingQty(order);
		const totalInput = input.received + input.damaged + input.missing;
		const effectiveBranchId = selectedBranchId || ledgerState.branches[0]?.id;

		if (!effectiveBranchId) {
			showToast({
				title: "Branch required",
				description: "Select a branch before posting a receipt.",
			});
			return;
		}

		if (totalInput <= 0) {
			showToast({
				title: "No receipt posted",
				description: "Enter received, damaged, or missing units.",
			});
			return;
		}

		if (input.damaged > input.received) {
			showToast({
				title: "Invalid receipt",
				description: "Damaged units cannot exceed received units.",
			});
			return;
		}

		if (totalInput > remaining) {
			showToast({
				title: "Invalid receipt",
				description: `Only ${remaining} units remaining for ${order.id}.`,
			});
			return;
		}

		const accepted = Math.max(0, input.received - input.damaged);
		const reason =
			(receiptReasons[order.id] ?? "").trim() || "Delivery receiving posted";
		const result = applyPurchaseOrderReceipt(order.id, input);

		setPurchaseOrders(result.orders);

		setLedgerState((current) =>
			appendMovements(current, {
				branchId: effectiveBranchId,
				actor: actor.trim() || "Receiving clerk",
				reason,
				entries: [
					...(accepted > 0
						? [
								{
									productId: order.productId,
									type: "delivery_accepted" as const,
									quantity: accepted,
									stockDelta: accepted,
									reference: `delivery:${order.id}`,
								},
							]
						: []),
					...(input.damaged > 0
						? [
								{
									productId: order.productId,
									type: "delivery_damaged" as const,
									quantity: input.damaged,
									stockDelta: 0,
									reference: `delivery:${order.id}`,
								},
							]
						: []),
					...(input.missing > 0
						? [
								{
									productId: order.productId,
									type: "delivery_missing" as const,
									quantity: input.missing,
									stockDelta: 0,
									reference: `delivery:${order.id}`,
								},
							]
						: []),
				],
			}),
		);

		setReceiptInputs((current) => ({
			...current,
			[order.id]: emptyReceiptInput,
		}));

		setReceiptReasons((current) => ({
			...current,
			[order.id]: "",
		}));

		showToast({
			title:
				result.updatedOrder?.status === "received"
					? "Receipt posted and PO closed"
					: "Receipt posted",
			description: `${order.productName}: +${accepted} accepted (${input.damaged} damaged, ${input.missing} missing).`,
		});
	};

	const cancelOrder = (orderId: string) => {
		const orders = updatePurchaseOrderStatus(orderId, "cancelled");

		setPurchaseOrders(orders);

		showToast({
			title: "Order cancelled",
			description: `Purchase order ${orderId} has been cancelled.`,
		});
	};

	const changeView = (nextView: SuppliersView) => {
		setActiveView(nextView);

		const url = new URL(window.location.href);

		if (nextView === "receiving") {
			url.searchParams.set("view", "receiving");
		} else {
			url.searchParams.delete("view");
		}

		window.history.replaceState({}, "", `${url.pathname}${url.search}`);
	};

	return (
		<SmartStockShell
			title="Supplier tracking"
			subtitle="Lead time, reliability, and contact details."
		>
			<section className="space-y-6 pb-24 sm:pb-0" aria-label="Suppliers">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-xl font-semibold text-foreground">
							Supplier tracking
						</h1>
						<p className="text-sm text-muted-foreground">
							Manage suppliers, delivery receiving, and purchase orders.
						</p>
					</div>

					<div className="flex items-center gap-2">
						{activeView === "directory" && (
							<button
								type="button"
								onClick={() => {
									setAddPanelKey((k) => k + 1);
									changeView("directory");
								}}
								className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
							>
								+ Add Supplier
							</button>
						)}

						<div className="inline-flex rounded-lg border border-border bg-background p-1">
							<button
								type="button"
								onClick={() => changeView("directory")}
								className={`h-9 rounded-md px-3 text-sm font-medium ${
									activeView === "directory"
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								Directory
							</button>

							<button
								type="button"
								onClick={() => changeView("receiving")}
								className={`h-9 rounded-md px-3 text-sm font-medium ${
									activeView === "receiving"
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								Receiving
							</button>
						</div>
					</div>
				</div>

				{activeView === "directory" && (
					<>
						<AddSupplierPanel
							key={addPanelKey}
							setSuppliers={setSuppliers}
							initialMode={addPanelKey > 0 ? "manual" : "choose"}
							initialFormOpen={addPanelKey > 0}
						/>

						<article className="rounded-2xl border border-border/70 bg-card shadow-sm">
							<div className="border-b border-border/70 p-4">
								<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<h2 className="text-lg font-semibold text-foreground">
											Suppliers
										</h2>
										<p className="text-sm text-muted-foreground">
											{filteredSuppliers.length} of {suppliers.length} suppliers
											shown
										</p>
									</div>

									<input
										id="supplier-search"
										value={searchQuery}
										onChange={(event) => setSearchQuery(event.target.value)}
										placeholder="Search name or phone"
										className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground sm:w-72"
									/>
								</div>
							</div>

							{filteredSuppliers.length === 0 ? (
								<div className="p-6 text-center text-sm text-muted-foreground">
									No suppliers match your search.
								</div>
							) : (
								<ul className="divide-y divide-border/70">
									{filteredSuppliers.map((supplier) => (
										<li key={supplier.id} className="p-4">
											{editingId === supplier.id ? (
												<div className="grid gap-3 sm:grid-cols-2">
													<input
														value={editName}
														onChange={(event) =>
															setEditName(event.target.value)
														}
														placeholder="Supplier name"
														className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
													/>

													<input
														value={editPhone}
														onChange={(event) =>
															setEditPhone(event.target.value)
														}
														placeholder="Phone"
														className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
													/>

													<input
														type="number"
														inputMode="numeric"
														min={1}
														value={editLeadTime}
														onChange={(event) =>
															setEditLeadTime(parseQuantity(event.target.value))
														}
														placeholder="Lead time"
														className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
													/>

													<select
														value={editReliability}
														onChange={(event) =>
															setEditReliability(
																event.target.value as SupplierReliability,
															)
														}
														className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
													>
														<option value="High">High</option>
														<option value="Medium">Medium</option>
														<option value="Low">Low</option>
													</select>

													<div className="flex gap-2 sm:col-span-2">
														<button
															type="button"
															disabled={!canSaveEdit}
															onClick={() => saveEdit(supplier.id)}
															className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
														>
															Save
														</button>

														<button
															type="button"
															onClick={cancelEdit}
															className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
														>
															Cancel
														</button>
													</div>
												</div>
											) : (
												<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
													<div className="min-w-0">
														<div className="flex flex-wrap items-center gap-2">
															<p className="font-medium text-foreground">
																{supplier.name}
															</p>

															<span
																className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getReliabilityClass(
																	supplier.reliability,
																)}`}
															>
																{supplier.reliability}
															</span>

															<span
																className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getVerificationClass(
																	supplier.contactVerified,
																)}`}
															>
																{supplier.contactVerified
																	? "Verified"
																	: "Needs verification"}
															</span>
														</div>

														<p className="mt-1 text-sm text-muted-foreground">
															{supplier.phone} · Lead time{" "}
															{supplier.leadTimeDays} days · Next delivery{" "}
															{supplier.nextDelivery}
														</p>
													</div>

													<div className="flex shrink-0 flex-wrap gap-2">
														<button
															type="button"
															onClick={() => startEdit(supplier)}
															className="inline-flex h-9 items-center justify-center rounded-lg border border-blue-400/40 bg-blue-500/10 px-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-500/15 dark:text-blue-300"
														>
															Edit
														</button>

														<button
															type="button"
															onClick={() =>
																toggleContactVerification(supplier.id)
															}
															className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
														>
															{supplier.contactVerified ? "Unverify" : "Verify"}
														</button>

														<button
															type="button"
															onClick={() => deleteSupplier(supplier.id)}
															className="inline-flex h-9 items-center justify-center rounded-lg border border-red-400/40 bg-red-500/10 px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-500/15 dark:text-red-400"
														>
															Delete
														</button>
													</div>
												</div>
											)}
										</li>
									))}
								</ul>
							)}
						</article>

						<article className="rounded-2xl border border-border/70 bg-card shadow-sm">
							<div className="border-b border-border/70 p-4">
								<h2 className="text-lg font-semibold text-foreground">
									Purchase orders
								</h2>
								<p className="text-sm text-muted-foreground">
									Grouped by supplier for quick review.
								</p>
							</div>

							{purchaseOrdersBySupplier.length === 0 ? (
								<div className="p-6 text-center text-sm text-muted-foreground">
									No purchase orders yet. Create reorders to start procurement
									tracking.
								</div>
							) : (
								<div className="divide-y divide-border/70">
									{purchaseOrdersBySupplier.map((group) => {
										const openCount = group.orders.filter(
											(order) =>
												order.status !== "received" &&
												order.status !== "cancelled",
										).length;

										const totalUnits = group.orders.reduce(
											(sum, order) => sum + order.quantity,
											0,
										);

										return (
											<section key={group.supplierName} className="p-4">
												<div className="flex flex-wrap items-center justify-between gap-2">
													<div>
														<h3 className="font-medium text-foreground">
															{group.supplierName}
														</h3>
														<p className="text-sm text-muted-foreground">
															{group.orders.length} PO(s) · {openCount} open ·{" "}
															{totalUnits} units total
														</p>
													</div>
												</div>

												<ul className="mt-3 divide-y divide-border/70">
													{group.orders.slice(0, 6).map((order) => {
														const remaining = getRemainingQty(order);
														const isCancellable =
															order.status !== "received" &&
															order.status !== "cancelled";

														return (
															<li
																key={order.id}
																className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
															>
																<div>
																	<div className="flex flex-wrap items-center gap-2">
																		<p className="text-sm font-medium text-foreground">
																			{order.id}
																		</p>

																		<span
																			className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getOrderStatusClass(
																				order.status,
																			)}`}
																		>
																			{formatOrderStatus(order.status)}
																		</span>
																	</div>

																	<p className="mt-1 text-sm text-muted-foreground">
																		{order.productName} · Qty {order.quantity} ·
																		Remaining {remaining}
																	</p>

																	<p className="text-xs text-muted-foreground">
																		Received {order.receivedQty}, Damaged{" "}
																		{order.damagedQty}, Missing {order.missingQty}
																	</p>
																</div>

																{isCancellable && (
																	<button
																		type="button"
																		onClick={() => cancelOrder(order.id)}
																		className="inline-flex h-9 items-center justify-center self-start rounded-lg border border-red-400/40 bg-red-500/10 px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-500/15 dark:text-red-400 sm:self-center"
																	>
																		Cancel
																	</button>
																)}
															</li>
														);
													})}
												</ul>
											</section>
										);
									})}
								</div>
							)}
						</article>

						{editingId !== null && (
							<div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 p-3 backdrop-blur sm:hidden">
								<div className="mx-auto flex max-w-6xl gap-2">
									<button
										type="button"
										onClick={cancelEdit}
										className="flex h-12 flex-1 items-center justify-center rounded-lg border border-border bg-background text-base font-medium text-foreground"
									>
										Cancel Edit
									</button>

									<button
										type="button"
										onClick={() => editingId !== null && saveEdit(editingId)}
										disabled={!canSaveEdit}
										className="flex h-12 flex-1 items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground disabled:opacity-50"
									>
										Save Supplier
									</button>
								</div>
							</div>
						)}
					</>
				)}

				{activeView === "receiving" && (
					<>
						<article className="rounded-2xl border border-border/70 bg-card shadow-sm">
							<div className="border-b border-border/70 p-4">
								<h2 className="text-lg font-semibold text-foreground">
									Delivery receiving
								</h2>
								<p className="mt-1 text-sm text-muted-foreground">
									Post received, damaged, or missing quantities from open
									purchase orders.
								</p>
							</div>

							<div className="grid gap-3 p-4 sm:grid-cols-2">
								<label className="grid gap-1 text-sm font-medium text-foreground">
									Branch
									<select
										value={selectedBranchId}
										onChange={(event) =>
											setSelectedBranchId(event.target.value)
										}
										className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
									>
										{ledgerState.branches.map((branch) => (
											<option key={branch.id} value={branch.id}>
												{branch.name}
											</option>
										))}
									</select>
								</label>

								<label className="grid gap-1 text-sm font-medium text-foreground">
									Receiver
									<input
										value={actor}
										onChange={(event) => setActor(event.target.value)}
										placeholder="Receiving clerk"
										className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
									/>
								</label>
							</div>
						</article>

						<article className="rounded-2xl border border-border/70 bg-card shadow-sm">
							<div className="border-b border-border/70 p-4">
								<div className="flex items-center justify-between gap-3">
									<div>
										<h3 className="text-lg font-semibold text-foreground">
											Open purchase orders
										</h3>
										<p className="text-sm text-muted-foreground">
											{openPurchaseOrders.length} order(s) pending receiving
										</p>
									</div>
								</div>
							</div>

							{openPurchaseOrders.length === 0 ? (
								<div className="p-6 text-center text-sm text-muted-foreground">
									No open orders to receive. New reorders will appear here
									automatically.
								</div>
							) : (
								<ul className="divide-y divide-border/70">
									{openPurchaseOrders.map((order) => {
										const input = getInputForOrder(order.id);
										const remaining = getRemainingQty(order);

										return (
											<li key={order.id} className="p-4">
												<div className="flex flex-col gap-3">
													<div className="flex flex-wrap items-center justify-between gap-2">
														<div>
															<div className="flex flex-wrap items-center gap-2">
																<p className="font-medium text-foreground">
																	{order.id} · {order.productName}
																</p>

																<span
																	className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getOrderStatusClass(
																		order.status,
																	)}`}
																>
																	{formatOrderStatus(order.status)}
																</span>
															</div>

															<p className="mt-1 text-sm text-muted-foreground">
																Supplier {order.supplierName} · Qty{" "}
																{order.quantity} · Remaining {remaining} · Branch{" "}
																{branchById[selectedBranchId] ?? selectedBranchId}
															</p>
														</div>
													</div>

													<div className="grid gap-3 sm:grid-cols-3">
														<label className="grid gap-1 text-sm font-medium text-foreground">
															Received
															<input
																type="number"
																min={0}
																inputMode="numeric"
																value={input.received}
																onChange={(event) =>
																	updateInput(
																		order.id,
																		"received",
																		parseQuantity(event.target.value),
																	)
																}
																className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
															/>
														</label>

														<label className="grid gap-1 text-sm font-medium text-foreground">
															Damaged
															<input
																type="number"
																min={0}
																inputMode="numeric"
																value={input.damaged}
																onChange={(event) =>
																	updateInput(
																		order.id,
																		"damaged",
																		parseQuantity(event.target.value),
																	)
																}
																className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
															/>
														</label>

														<label className="grid gap-1 text-sm font-medium text-foreground">
															Missing
															<input
																type="number"
																min={0}
																inputMode="numeric"
																value={input.missing}
																onChange={(event) =>
																	updateInput(
																		order.id,
																		"missing",
																		parseQuantity(event.target.value),
																	)
																}
																className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
															/>
														</label>
													</div>

													<label className="grid gap-1 text-sm font-medium text-foreground">
														Reason
														<input
															value={receiptReasons[order.id] ?? ""}
															onChange={(event) =>
																updateReason(order.id, event.target.value)
															}
															placeholder="Delivery receiving posted"
															className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
														/>
													</label>

													<div className="flex flex-col gap-2 sm:flex-row">
														<button
															type="button"
															onClick={() => postReceipt(order)}
															className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
														>
															Post receipt
														</button>

														<button
															type="button"
															onClick={() => cancelOrder(order.id)}
															className="inline-flex h-10 items-center justify-center rounded-lg border border-red-400/40 bg-red-500/10 px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-500/15 dark:text-red-400"
														>
															Cancel order
														</button>
													</div>
												</div>
											</li>
										);
									})}
								</ul>
							)}
						</article>
					</>
				)}
			</section>
		</SmartStockShell>
	);
}