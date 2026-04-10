"use client";

import { useEffect, useMemo, useState } from "react";
import { AddSupplierPanel, SupplierRow } from "@/components/suppliers/add-supplier-panel";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { SmartStockShell } from "@/components/smartstock-shell";
import { useToast } from "@/components/ui/toast-provider";
import { appendMovements, getInventoryLedgerState, saveInventoryLedgerState } from "@/lib/inventory-ledger";
import { formatDateTime } from "@/lib/user-preferences";
import {
  getReliabilityClass,
  SupplierReliability,
  readSmartStockState,
  writeSmartStockSuppliers,
} from "@/lib/smartstock-data";
import {
  applyPurchaseOrderReceipt,
  getOpenPurchaseOrders,
  PROCUREMENT_ORDERS_CHANGED_EVENT,
  readPurchaseOrders,
  type PurchaseOrder,
  type PurchaseOrderStatus,
} from "@/lib/procurement-orders";

type SuppliersView = "directory" | "receiving";

type ReceiptInput = {
  received: number;
  damaged: number;
  missing: number;
};

export default function SuppliersPage() {
  const { showToast } = useToast();
  const preferences = useUserPreferences();

  const [activeView, setActiveView] = useState<SuppliersView>("directory");
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
  const [editReliability, setEditReliability] = useState<SupplierReliability>("Medium");

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => readPurchaseOrders());
  const [ledgerState, setLedgerState] = useState(() => getInventoryLedgerState());
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => getInventoryLedgerState().branches[0]?.id ?? "");
  const [actor, setActor] = useState("Receiving clerk");
  const [receiptInputs, setReceiptInputs] = useState<Record<string, ReceiptInput>>({});
  const [receiptReasons, setReceiptReasons] = useState<Record<string, string>>({});

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
        orders: orders.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
      }))
      .sort((a, b) => a.supplierName.localeCompare(b.supplierName));
  }, [purchaseOrders]);

  const branchById = useMemo(() => {
    return Object.fromEntries(ledgerState.branches.map((branch) => [branch.id, branch.name]));
  }, [ledgerState.branches]);

  const openPurchaseOrders = useMemo(() => getOpenPurchaseOrders(purchaseOrders), [purchaseOrders]);

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

        const leadTimeChanged = supplier.leadTimeDays !== editLeadTime;

        return {
          ...supplier,
          name: editName.trim(),
          phone: editPhone.trim(),
          leadTimeDays: Math.max(1, editLeadTime),
          reliability: editReliability,
          leadTimeHistory: leadTimeChanged
            ? [
                {
                  from: supplier.leadTimeDays,
                  to: Math.max(1, editLeadTime),
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

    const shouldDelete = window.confirm(`Delete supplier \"${target.name}\"? This action cannot be undone.`);
    if (!shouldDelete) return;

    setSuppliers((current) => current.filter((supplier) => supplier.id !== supplierId));

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
      window.removeEventListener(PROCUREMENT_ORDERS_CHANGED_EVENT, refreshOrders);
    };
  }, []);

  useEffect(() => {
    const syncViewFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveView(params.get("view") === "receiving" ? "receiving" : "directory");
    };

    syncViewFromUrl();
    window.addEventListener("popstate", syncViewFromUrl);
    return () => window.removeEventListener("popstate", syncViewFromUrl);
  }, []);

  useEffect(() => {
    saveInventoryLedgerState(ledgerState);
  }, [ledgerState]);

  useEffect(() => {
    if (!selectedBranchId && ledgerState.branches[0]) {
      setSelectedBranchId(ledgerState.branches[0].id);
    }
  }, [ledgerState.branches, selectedBranchId]);

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

  const formatOrderStatus = (status: PurchaseOrderStatus) => status.replaceAll("_", " ");

  const getRemainingQty = (order: PurchaseOrder) =>
    Math.max(0, order.quantity - order.receivedQty - order.damagedQty - order.missingQty);

  const getInputForOrder = (orderId: string) =>
    receiptInputs[orderId] ?? {
      received: 0,
      damaged: 0,
      missing: 0,
    };

  const updateInput = (orderId: string, field: keyof ReceiptInput, value: number) => {
    setReceiptInputs((current) => ({
      ...current,
      [orderId]: {
        ...getInputForOrder(orderId),
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
    const reason = (receiptReasons[order.id] ?? "").trim() || "Delivery receiving posted";
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
      [order.id]: { received: 0, damaged: 0, missing: 0 },
    }));
    setReceiptReasons((current) => ({
      ...current,
      [order.id]: "",
    }));

    showToast({
      title: result.updatedOrder?.status === "received" ? "Receipt posted and PO closed" : "Receipt posted",
      description: `${order.productName}: +${accepted} accepted (${input.damaged} damaged, ${input.missing} missing).`,
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
    <SmartStockShell title="Supplier tracking" subtitle="Lead time, reliability, and contact details.">
      <section className="space-y-4 pb-24 sm:pb-0" aria-label="Suppliers">
        <article className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:p-4">
          <p className="text-sm font-medium text-foreground">Operations view</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Keep supplier records and receive deliveries in one place.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-border/70 bg-background p-1">
            <button
              type="button"
              onClick={() => changeView("directory")}
              className={`h-10 rounded-lg px-3 text-sm font-medium transition-colors ${
                activeView === "directory" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Supplier Directory
            </button>
            <button
              type="button"
              onClick={() => changeView("receiving")}
              className={`h-10 rounded-lg px-3 text-sm font-medium transition-colors ${
                activeView === "receiving" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Delivery Receiving
            </button>
          </div>
        </article>

        {activeView === "directory" && (
          <>
            <AddSupplierPanel setSuppliers={setSuppliers} />

            <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
              <div className="mb-3 grid gap-1">
                <label htmlFor="supplier-search" className="text-sm font-medium text-foreground">
                  Search suppliers
                </label>
                <input
                  id="supplier-search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search name or phone"
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  {filteredSuppliers.length} of {suppliers.length} suppliers shown
                </p>
              </div>

              <ul className="space-y-3">
                {filteredSuppliers.map((supplier) => (
                  <li key={supplier.id} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{supplier.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {supplier.phone} · Lead time {supplier.leadTimeDays} days · Next delivery {supplier.nextDelivery}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Contact: {supplier.contactVerified ? "Verified" : "Unverified"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getReliabilityClass(supplier.reliability)}`}>
                          {supplier.reliability}
                        </span>
                        <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getVerificationClass(supplier.contactVerified)}`}>
                          {supplier.contactVerified ? "Verified" : "Needs Verification"}
                        </span>
                      </div>
                    </div>

                    {editingId === supplier.id ? (
                      <div className="mt-3 grid gap-2 rounded-lg border border-border/70 bg-background p-3 sm:grid-cols-2">
                        <input
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          placeholder="Supplier name"
                          className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                        />
                        <input
                          value={editPhone}
                          onChange={(event) => setEditPhone(event.target.value)}
                          placeholder="Phone"
                          className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                        />
                        <input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min={1}
                          value={editLeadTime}
                          onChange={(event) => setEditLeadTime(Number(event.target.value))}
                          placeholder="Lead time"
                          className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                        />
                        <select
                          value={editReliability}
                          onChange={(event) => setEditReliability(event.target.value as SupplierReliability)}
                          className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>

                        <div className="sm:col-span-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={!canSaveEdit}
                            onClick={() => saveEdit(supplier.id)}
                            className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Save changes
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="h-11 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(supplier)}
                          className="h-11 rounded-lg border border-blue-400/50 bg-blue-500/10 px-4 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-500/15 dark:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSupplier(supplier.id)}
                          className="h-11 rounded-lg border border-red-400/50 bg-red-500/10 px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-500/15 dark:text-red-300"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleContactVerification(supplier.id)}
                          className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
                        >
                          {supplier.contactVerified ? "Mark unverified" : "Verify contact"}
                        </button>
                      </div>
                    )}

                    <div className="mt-3 rounded-lg border border-border/70 bg-background p-2">
                      <p className="text-xs font-medium text-foreground">Lead-time update history</p>
                      {supplier.leadTimeHistory.length === 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">No lead-time updates yet.</p>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {supplier.leadTimeHistory.slice(0, 3).map((entry, index) => (
                            <li key={`${supplier.id}-history-${index}`} className="text-xs text-muted-foreground">
                              {formatDateTime(entry.changedAt, preferences)}: {entry.from}d to {entry.to}d
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}

                {filteredSuppliers.length === 0 && (
                  <li className="rounded-lg border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                    No suppliers match your search.
                  </li>
                )}
              </ul>
            </article>

            <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Purchase orders by supplier</h2>
              {purchaseOrdersBySupplier.length === 0 ? (
                <p className="mt-3 rounded-lg border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
                  No purchase orders yet. Create reorders to start procurement tracking.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {purchaseOrdersBySupplier.map((group) => {
                    const openCount = group.orders.filter(
                      (order) => order.status !== "received" && order.status !== "cancelled",
                    ).length;
                    const totalUnits = group.orders.reduce((sum, order) => sum + order.quantity, 0);

                    return (
                      <section key={group.supplierName} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-medium text-foreground">{group.supplierName}</h3>
                          <p className="text-xs text-muted-foreground">
                            {group.orders.length} PO(s) · {openCount} open · {totalUnits} units total
                          </p>
                        </div>

                        <ul className="mt-2 space-y-2">
                          {group.orders.slice(0, 6).map((order) => {
                            const remaining = getRemainingQty(order);
                            return (
                              <li key={order.id} className="rounded-md border border-border/70 bg-background px-3 py-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm font-medium text-foreground">{order.id}</p>
                                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getOrderStatusClass(order.status)}`}>
                                    {formatOrderStatus(order.status)}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {order.productName} · Qty {order.quantity} · Remaining {remaining}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Received {order.receivedQty}, Damaged {order.damagedQty}, Missing {order.missingQty}
                                </p>
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
                    className="flex h-12 flex-1 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium text-foreground"
                  >
                    Cancel Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => editingId !== null && saveEdit(editingId)}
                    disabled={!canSaveEdit}
                    className="flex h-12 flex-1 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
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
            <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Delivery receiving</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Post received, damaged, or missing quantities directly from open purchase orders.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-medium text-foreground">
                  Branch
                  <select
                    value={selectedBranchId}
                    onChange={(event) => setSelectedBranchId(event.target.value)}
                    className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
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
                    className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                  />
                </label>
              </div>
            </article>

            <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">Open purchase orders</h3>
              <p className="mt-1 text-xs text-muted-foreground">{openPurchaseOrders.length} order(s) pending receiving</p>

              {openPurchaseOrders.length === 0 ? (
                <p className="mt-3 rounded-lg border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
                  No open orders to receive. New reorders will appear here automatically.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {openPurchaseOrders.map((order) => {
                    const input = getInputForOrder(order.id);
                    const remaining = getRemainingQty(order);
                    return (
                      <li key={order.id} className="rounded-xl border border-border/70 bg-muted/20 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-foreground">{order.id} · {order.productName}</p>
                          <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getOrderStatusClass(order.status)}`}>
                            {formatOrderStatus(order.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Supplier {order.supplierName} · Qty {order.quantity} · Remaining {remaining} · Branch {branchById[selectedBranchId] ?? selectedBranchId}
                        </p>

                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          <label className="grid gap-1 text-xs font-medium text-foreground">
                            Received
                            <input
                              type="number"
                              min={0}
                              inputMode="numeric"
                              value={input.received}
                              onChange={(event) => updateInput(order.id, "received", Number(event.target.value))}
                              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                            />
                          </label>
                          <label className="grid gap-1 text-xs font-medium text-foreground">
                            Damaged
                            <input
                              type="number"
                              min={0}
                              inputMode="numeric"
                              value={input.damaged}
                              onChange={(event) => updateInput(order.id, "damaged", Number(event.target.value))}
                              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                            />
                          </label>
                          <label className="grid gap-1 text-xs font-medium text-foreground">
                            Missing
                            <input
                              type="number"
                              min={0}
                              inputMode="numeric"
                              value={input.missing}
                              onChange={(event) => updateInput(order.id, "missing", Number(event.target.value))}
                              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                            />
                          </label>
                        </div>

                        <label className="mt-2 grid gap-1 text-xs font-medium text-foreground">
                          Reason (optional)
                          <input
                            value={receiptReasons[order.id] ?? ""}
                            onChange={(event) => updateReason(order.id, event.target.value)}
                            placeholder="Delivery receiving posted"
                            className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => postReceipt(order)}
                          className="mt-3 h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
                        >
                          Post receipt
                        </button>
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
