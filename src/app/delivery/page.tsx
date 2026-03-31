"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SmartStockShell } from "@/components/smartstock-shell";
import { EmptyState, ErrorState, HelpHint, LoadingState } from "@/components/ui/data-state";
import { useToast } from "@/components/ui/toast-provider";
import { readSmartStockState } from "@/lib/smartstock-data";
import {
  appendMovements,
  ensureProductsInLedger,
  getInventoryLedgerState,
  getOnHandQty,
  saveInventoryLedgerState,
} from "@/lib/inventory-ledger";
import {
  applyPurchaseOrderReceipt,
  getOpenPurchaseOrders,
  readPurchaseOrders,
  type PurchaseOrder,
} from "@/lib/procurement-orders";

type ReceiptInput = {
  received: number;
  damaged: number;
  missing: number;
};

type ReceiptEvent = {
  received: number;
  damaged: number;
  missing: number;
  accepted: number;
  actor: string;
  reason: string;
  timestamp: string;
};

function getDeliveryStatusLabel(order: PurchaseOrder) {
  if (order.status === "received") return "Delivered";
  if (order.status === "partially_received") return "Partially Received";
  if (order.status === "cancelled") return "Cancelled";
  return "On the way";
}

function isDeliveryComplete(order: PurchaseOrder) {
  if (order.status === "received" || order.status === "cancelled") return true;
  const accounted = order.receivedQty + order.damagedQty + order.missingQty;
  return accounted >= order.quantity;
}

export default function DeliveryPage() {
  const { showToast } = useToast();
  const [ledgerState, setLedgerState] = useState(() => getInventoryLedgerState());
  const [orders, setOrders] = useState<PurchaseOrder[]>(() => readPurchaseOrders());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(ledgerState.branches[0]?.id ?? "");
  const [actor, setActor] = useState("Receiving clerk");
  const [receiptInputs, setReceiptInputs] = useState<Record<string, ReceiptInput>>({});
  const [receiptReasons, setReceiptReasons] = useState<Record<string, string>>({});
  const [receiptHistoryByOrder, setReceiptHistoryByOrder] = useState<Record<string, ReceiptEvent[]>>({});

  const supplierEtaByName = useMemo(() => {
    const entries = readSmartStockState().suppliers.map((supplier) => [supplier.name, supplier.nextDelivery]);
    return Object.fromEntries(entries);
  }, []);

  const hydrateDeliveryData = useCallback(() => {
    setIsLoading(true);
    try {
      const currentOrders = readPurchaseOrders();
      const currentState = readSmartStockState();
      const latestLedger = ensureProductsInLedger(
        getInventoryLedgerState(),
        currentState.products.map((item) => item.id),
      );

      setOrders(currentOrders);
      setLedgerState(latestLedger);

      if (!selectedBranchId && latestLedger.branches[0]) {
        setSelectedBranchId(latestLedger.branches[0].id);
      }

      setLoadError(null);
    } catch {
      setLoadError("Delivery tracking data could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    hydrateDeliveryData();
  }, [hydrateDeliveryData]);

  useEffect(() => {
    saveInventoryLedgerState(ledgerState);
  }, [ledgerState]);

  const deliveries = useMemo(
    () => orders.filter((order) => order.status !== "cancelled"),
    [orders],
  );
  const openDeliveries = useMemo(() => getOpenPurchaseOrders(orders), [orders]);

  const deliveredCount = deliveries.filter((item) => item.status === "received").length;
  const partiallyReceivedCount = deliveries.filter((item) => item.status === "partially_received").length;
  const inTransitCount = deliveries.filter((item) => item.status === "placed" || item.status === "acknowledged").length;
  const acceptedUnits = deliveries.reduce((sum, item) => sum + Math.max(0, item.receivedQty - item.damagedQty), 0);
  const completionRate = deliveries.length === 0 ? 0 : Math.round((deliveredCount / deliveries.length) * 100);

  const nextEta = useMemo(() => {
    const upcoming = openDeliveries[0];
    if (!upcoming) return "All received";
    return supplierEtaByName[upcoming.supplierName] ?? "Pending";
  }, [openDeliveries, supplierEtaByName]);

  const firstOpenOrderId = openDeliveries[0]?.id ?? null;

  const getRemainingQty = (item: PurchaseOrder) =>
    Math.max(0, item.quantity - item.receivedQty - item.damagedQty - item.missingQty);

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

  const bumpReceivedInput = (orderId: string, delta: number) => {
    const current = getInputForOrder(orderId);
    updateInput(orderId, "received", current.received + delta);
  };

  const jumpToFirstOpen = () => {
    if (!firstOpenOrderId) return;
    const target = document.getElementById(`delivery-row-${firstOpenOrderId}`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const postReceipt = (orderId: string) => {
    const target = openDeliveries.find((item) => item.id === orderId);
    if (!target) {
      showToast({
        title: "Order already closed",
        description: "This purchase order is already completed or cancelled.",
      });
      return;
    }

    const input = getInputForOrder(orderId);
    const remainingQty = getRemainingQty(target);
    const totalInput = input.received + input.damaged + input.missing;

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

    if (totalInput > remainingQty) {
      showToast({
        title: "Invalid receipt",
        description: `Only ${remainingQty} units remaining for PO ${target.id}.`,
      });
      return;
    }

    const accepted = Math.max(0, input.received - input.damaged);
    const reason = (receiptReasons[orderId] ?? "").trim() || "Delivery receiving posted";

    const result = applyPurchaseOrderReceipt(orderId, input);
    setOrders(result.orders);

    setLedgerState((current) =>
      appendMovements(current, {
        branchId: selectedBranchId,
        actor,
        reason,
        entries: [
          ...(accepted > 0
            ? [
                {
                  productId: target.productId,
                  type: "delivery_accepted" as const,
                  quantity: accepted,
                  stockDelta: accepted,
                  reference: `delivery:${target.id}`,
                },
              ]
            : []),
          ...(input.damaged > 0
            ? [
                {
                  productId: target.productId,
                  type: "delivery_damaged" as const,
                  quantity: input.damaged,
                  stockDelta: 0,
                  reference: `delivery:${target.id}`,
                },
              ]
            : []),
          ...(input.missing > 0
            ? [
                {
                  productId: target.productId,
                  type: "delivery_missing" as const,
                  quantity: input.missing,
                  stockDelta: 0,
                  reference: `delivery:${target.id}`,
                },
              ]
            : []),
        ],
      }),
    );

    setReceiptHistoryByOrder((current) => ({
      ...current,
      [orderId]: [
        {
          received: input.received,
          damaged: input.damaged,
          missing: input.missing,
          accepted,
          actor: actor.trim() || "Receiving clerk",
          reason,
          timestamp: new Date().toLocaleString(),
        },
        ...(current[orderId] ?? []),
      ],
    }));

    setReceiptInputs((current) => ({
      ...current,
      [orderId]: { received: 0, damaged: 0, missing: 0 },
    }));
    setReceiptReasons((current) => ({
      ...current,
      [orderId]: "",
    }));

    const closed = result.updatedOrder?.status === "received";
    showToast({
      title: closed ? "Receipt posted and PO closed" : "Receipt posted",
      description: `${target.productName}: +${accepted} stock (${input.damaged} damaged, ${input.missing} missing).`,
    });
  };

  if (isLoading) {
    return (
      <SmartStockShell
        title="Delivery tracking"
        subtitle="Ledger-backed receiving for accepted, damaged, and missing units."
      >
        <section className="space-y-4" aria-label="Delivery loading">
          <LoadingState
            title="Loading delivery queue"
            description="Preparing incoming purchase orders and receipt history."
            rows={4}
          />
        </section>
      </SmartStockShell>
    );
  }

  if (loadError) {
    return (
      <SmartStockShell
        title="Delivery tracking"
        subtitle="Ledger-backed receiving for accepted, damaged, and missing units."
      >
        <section className="space-y-4" aria-label="Delivery error">
          <ErrorState
            description={loadError}
            onRetry={hydrateDeliveryData}
            retryLabel="Retry delivery"
            hint="If this repeats, verify purchase order and inventory data then refresh the app."
          />
        </section>
      </SmartStockShell>
    );
  }

  return (
    <SmartStockShell title="Delivery tracking" subtitle="Incoming deliveries generated from open purchase orders.">
      <section className="space-y-4 pb-24 sm:pb-0" aria-label="Delivery tracking">
        <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm text-muted-foreground">
              Branch / Location
              <select
                value={selectedBranchId}
                onChange={(event) => setSelectedBranchId(event.target.value)}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              >
                {ledgerState.branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm text-muted-foreground">
              Actor
              <input
                value={actor}
                onChange={(event) => setActor(event.target.value)}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>
          </div>
        </article>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">In Transit</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{inTransitCount}</p>
          </article>
          <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Partial</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{partiallyReceivedCount}</p>
          </article>
          <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Delivered</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{deliveredCount}</p>
          </article>
          <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Accepted Units</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{acceptedUnits}</p>
          </article>
        </div>

        <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Completion {completionRate}% · Next ETA {nextEta}
          </p>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Incoming deliveries from POs</h2>
          {deliveries.length === 0 ? (
            <EmptyState
              className="mt-3"
              title="No deliveries pending"
              description="There are currently no purchase orders in delivery flow."
              actionLabel="Refresh queue"
              onAction={hydrateDeliveryData}
              hint="Create reorders to generate purchase orders automatically."
            />
          ) : (
            <ul className="mt-3 space-y-3">
              {deliveries.map((item) => {
                const remaining = getRemainingQty(item);
                const complete = isDeliveryComplete(item);
                const eta = supplierEtaByName[item.supplierName] ?? "Pending";
                const statusLabel = getDeliveryStatusLabel(item);

                return (
                  <li id={`delivery-row-${item.id}`} key={item.id} className="rounded-xl border border-border/70 bg-muted/20 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          PO {item.id} · Supplier: {item.supplierName} · ETA: {eta}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Expected {item.quantity} · Remaining {remaining} · Current stock {getOnHandQty(ledgerState, selectedBranchId, item.productId)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Received {item.receivedQty}, Damaged {item.damagedQty}, Missing {item.missingQty}
                        </p>
                      </div>

                      <span className="inline-flex rounded-full border border-border bg-background px-2 py-1 text-xs font-medium text-foreground">
                        {statusLabel}
                      </span>
                    </div>

                    {!complete && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-4">
                        <label className="grid gap-1 text-xs text-muted-foreground">
                          Received now
                          <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min={0}
                            value={getInputForOrder(item.id).received}
                            onChange={(event) => updateInput(item.id, "received", Number(event.target.value))}
                            className="h-11 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
                          />
                        </label>
                        <label className="grid gap-1 text-xs text-muted-foreground">
                          Damaged now
                          <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min={0}
                            value={getInputForOrder(item.id).damaged}
                            onChange={(event) => updateInput(item.id, "damaged", Number(event.target.value))}
                            className="h-11 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
                          />
                        </label>
                        <label className="grid gap-1 text-xs text-muted-foreground">
                          Missing now
                          <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min={0}
                            value={getInputForOrder(item.id).missing}
                            onChange={(event) => updateInput(item.id, "missing", Number(event.target.value))}
                            className="h-11 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
                          />
                        </label>
                        <div className="flex items-end gap-2 sm:col-span-4">
                          <button
                            type="button"
                            onClick={() => bumpReceivedInput(item.id, 1)}
                            className="h-10 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground"
                          >
                            +1 received
                          </button>
                          <button
                            type="button"
                            onClick={() => bumpReceivedInput(item.id, 5)}
                            className="h-10 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground"
                          >
                            +5 received
                          </button>
                          <button
                            type="button"
                            onClick={() => bumpReceivedInput(item.id, 10)}
                            className="h-10 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground"
                          >
                            +10 received
                          </button>
                        </div>
                        <label className="grid gap-1 text-xs text-muted-foreground sm:col-span-3">
                          Reason
                          <input
                            value={receiptReasons[item.id] ?? ""}
                            onChange={(event) => updateReason(item.id, event.target.value)}
                            placeholder="Reason for this receipt update"
                            className="h-11 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
                          />
                        </label>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => postReceipt(item.id)}
                            className="h-11 w-full rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground"
                          >
                            Post receipt
                          </button>
                        </div>
                      </div>
                    )}

                    {(receiptHistoryByOrder[item.id] ?? []).length > 0 && (
                      <div className="mt-3 rounded-lg border border-border/70 bg-background p-2">
                        <p className="text-xs font-medium text-foreground">Recent receipts</p>
                        <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                          {(receiptHistoryByOrder[item.id] ?? []).slice(0, 2).map((entry, index) => (
                            <li key={`${item.id}-${index}`}>
                              {entry.timestamp}: received {entry.received}, damaged {entry.damaged}, missing {entry.missing}, accepted +{entry.accepted}, actor {entry.actor}, reason {entry.reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <HelpHint description="Receipts update inventory ledger and auto-close purchase orders when all expected units are fully accounted." />
      </section>

      {openDeliveries.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 p-3 backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-6xl gap-2">
            <button
              type="button"
              onClick={jumpToFirstOpen}
              className="flex h-12 flex-1 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium text-foreground"
            >
              Jump to Next Receipt
            </button>
            <button
              type="button"
              onClick={hydrateDeliveryData}
              className="flex h-12 flex-1 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
            >
              Refresh Queue
            </button>
          </div>
        </div>
      )}
    </SmartStockShell>
  );
}
