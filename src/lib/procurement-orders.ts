export type PurchaseOrderStatus = "placed" | "acknowledged" | "partially_received" | "received" | "cancelled";

export type PurchaseOrder = {
  id: string;
  productId: number;
  productName: string;
  supplierId: number | null;
  supplierName: string;
  quantity: number;
  receivedQty: number;
  damagedQty: number;
  missingQty: number;
  status: PurchaseOrderStatus;
  createdAt: string;
  updatedAt: string;
};

export const PROCUREMENT_ORDERS_KEY = "smartstock.procurement.orders.v1";
export const PROCUREMENT_ORDERS_CHANGED_EVENT = "smartstock:procurement-orders-changed";

function fallbackOrders(): PurchaseOrder[] {
  return [];
}

export function readPurchaseOrders(): PurchaseOrder[] {
  if (typeof window === "undefined") return fallbackOrders();

  try {
    const raw = window.localStorage.getItem(PROCUREMENT_ORDERS_KEY);
    if (!raw) return fallbackOrders();

    const parsed = JSON.parse(raw) as Array<Partial<PurchaseOrder>>;
    if (!Array.isArray(parsed)) return fallbackOrders();

    return parsed
      .filter((item) => {
        return (
          typeof item.id === "string" &&
          typeof item.productId === "number" &&
          typeof item.productName === "string" &&
          typeof item.supplierName === "string" &&
          typeof item.quantity === "number" &&
          ["placed", "acknowledged", "partially_received", "received", "cancelled"].includes(
            String(item.status),
          ) &&
          typeof item.createdAt === "string" &&
          typeof item.updatedAt === "string"
        );
      })
      .map((item) => ({
        id: item.id as string,
        productId: item.productId as number,
        productName: item.productName as string,
        supplierId: typeof item.supplierId === "number" ? item.supplierId : null,
        supplierName: item.supplierName as string,
        quantity: Math.max(1, Math.round(item.quantity as number)),
        receivedQty: Math.max(0, Math.round(Number(item.receivedQty ?? 0))),
        damagedQty: Math.max(0, Math.round(Number(item.damagedQty ?? 0))),
        missingQty: Math.max(0, Math.round(Number(item.missingQty ?? 0))),
        status: item.status as PurchaseOrderStatus,
        createdAt: item.createdAt as string,
        updatedAt: item.updatedAt as string,
      }));
  } catch {
    return fallbackOrders();
  }
}

export function writePurchaseOrders(orders: PurchaseOrder[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROCUREMENT_ORDERS_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent(PROCUREMENT_ORDERS_CHANGED_EVENT));
}

function generateOrderId() {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PO-${datePart}-${randomPart}`;
}

export function createPurchaseOrder(input: {
  productId: number;
  productName: string;
  supplierId?: number | null;
  supplierName?: string | null;
  quantity: number;
}) {
  const now = new Date().toISOString();
  const safeQty = Math.max(1, Math.round(input.quantity));
  const next: PurchaseOrder = {
    id: generateOrderId(),
    productId: input.productId,
    productName: input.productName,
    supplierId: input.supplierId ?? null,
    supplierName: input.supplierName ?? "Unassigned",
    quantity: safeQty,
    receivedQty: 0,
    damagedQty: 0,
    missingQty: 0,
    status: "placed",
    createdAt: now,
    updatedAt: now,
  };

  const current = readPurchaseOrders();
  const merged = [next, ...current];
  writePurchaseOrders(merged);
  return next;
}

export function updatePurchaseOrderStatus(orderId: string, status: PurchaseOrderStatus) {
  const current = readPurchaseOrders();
  const now = new Date().toISOString();
  const updated = current.map((order) =>
    order.id === orderId
      ? {
          ...order,
          status,
          updatedAt: now,
        }
      : order,
  );

  writePurchaseOrders(updated);
  return updated;
}

export function getActiveOrderByProduct(orders: PurchaseOrder[]) {
  const map = new Map<number, PurchaseOrder>();
  for (const order of orders) {
    if (order.status === "received" || order.status === "cancelled") continue;

    const accountedQty = order.receivedQty + order.damagedQty + order.missingQty;
    if (accountedQty >= order.quantity) continue;

    if (!map.has(order.productId)) {
      map.set(order.productId, order);
    }
  }
  return map;
}

export function getOpenPurchaseOrders(orders: PurchaseOrder[]) {
  return orders.filter((order) => {
    if (order.status === "received" || order.status === "cancelled") return false;
    const accountedQty = order.receivedQty + order.damagedQty + order.missingQty;
    return accountedQty < order.quantity;
  });
}

export function applyPurchaseOrderReceipt(
  orderId: string,
  receipt: {
    received: number;
    damaged: number;
    missing: number;
  },
): { orders: PurchaseOrder[]; updatedOrder: PurchaseOrder | null } {
  const current = readPurchaseOrders();
  const now = new Date().toISOString();

  let updatedOrder: PurchaseOrder | null = null;

  const updated = current.map((order) => {
    if (order.id !== orderId) return order;

    const received = Math.max(0, Math.round(receipt.received));
    const damaged = Math.max(0, Math.round(receipt.damaged));
    const missing = Math.max(0, Math.round(receipt.missing));

    const nextReceived = order.receivedQty + received;
    const nextDamaged = order.damagedQty + damaged;
    const nextMissing = order.missingQty + missing;
    const accountedQty = nextReceived + nextDamaged + nextMissing;

    let nextStatus: PurchaseOrderStatus = order.status;
    if (accountedQty >= order.quantity) {
      nextStatus = "received";
    } else if (accountedQty > 0) {
      nextStatus = "partially_received";
    } else if (order.status === "partially_received") {
      nextStatus = "acknowledged";
    }

    updatedOrder = {
      ...order,
      receivedQty: nextReceived,
      damagedQty: nextDamaged,
      missingQty: nextMissing,
      status: nextStatus,
      updatedAt: now,
    };

    return updatedOrder;
  });

  writePurchaseOrders(updated);
  return {
    orders: updated,
    updatedOrder,
  };
}
