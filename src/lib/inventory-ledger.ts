import { products as baseProducts } from "@/lib/smartstock-data";

export type BranchLocation = {
  id: string;
  name: string;
};

export type MovementType = "manual_adjustment" | "delivery_accepted" | "delivery_damaged" | "delivery_missing";

export type InventoryMovement = {
  id: string;
  branchId: string;
  productId: number;
  type: MovementType;
  quantity: number;
  stockDelta: number;
  actor: string;
  reason: string;
  reference: string;
  createdAt: string;
};

export type InventoryLedgerState = {
  branches: BranchLocation[];
  stockByBranch: Record<string, Record<string, number>>;
  movements: InventoryMovement[];
};

export type MovementInput = {
  productId: number;
  type: MovementType;
  quantity: number;
  stockDelta: number;
  reference?: string;
};

const STORAGE_KEY = "smartstock.inventory-ledger.v1";

export const defaultBranches: BranchLocation[] = [
  { id: "pp-main", name: "Phnom Penh Main" },
  { id: "siem-reap", name: "Siem Reap" },
  { id: "battambang", name: "Battambang" },
];

function generateMovementId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildInitialStockByBranch() {
  const stockByBranch: InventoryLedgerState["stockByBranch"] = {};

  stockByBranch[defaultBranches[0].id] = Object.fromEntries(baseProducts.map((product) => [String(product.id), product.currentStock]));
  stockByBranch[defaultBranches[1].id] = Object.fromEntries(baseProducts.map((product) => [String(product.id), Math.max(0, Math.round(product.currentStock * 0.65))]));
  stockByBranch[defaultBranches[2].id] = Object.fromEntries(baseProducts.map((product) => [String(product.id), Math.max(0, Math.round(product.currentStock * 0.45))]));

  return stockByBranch;
}

function buildInitialState(): InventoryLedgerState {
  return {
    branches: defaultBranches,
    stockByBranch: buildInitialStockByBranch(),
    movements: [],
  };
}

export function getInventoryLedgerState(): InventoryLedgerState {
  if (typeof window === "undefined") {
    return buildInitialState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = buildInitialState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(raw) as InventoryLedgerState;
    if (!Array.isArray(parsed.branches) || !parsed.stockByBranch || !Array.isArray(parsed.movements)) {
      return buildInitialState();
    }
    return parsed;
  } catch {
    return buildInitialState();
  }
}

export function saveInventoryLedgerState(state: InventoryLedgerState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function ensureProductsInLedger(state: InventoryLedgerState, productIds: number[]) {
  const nextState: InventoryLedgerState = {
    ...state,
    stockByBranch: { ...state.stockByBranch },
  };

  for (const branch of state.branches) {
    const branchStock = { ...(nextState.stockByBranch[branch.id] ?? {}) };
    for (const productId of productIds) {
      const key = String(productId);
      if (typeof branchStock[key] !== "number") {
        branchStock[key] = 0;
      }
    }
    nextState.stockByBranch[branch.id] = branchStock;
  }

  return nextState;
}

export function getOnHandQty(state: InventoryLedgerState, branchId: string, productId: number) {
  return state.stockByBranch[branchId]?.[String(productId)] ?? 0;
}

export function appendMovements(
  state: InventoryLedgerState,
  args: {
    branchId: string;
    actor: string;
    reason: string;
    entries: MovementInput[];
  },
) {
  const now = new Date().toISOString();
  const actor = args.actor.trim() || "System";
  const reason = args.reason.trim() || "No reason provided";

  const stockByBranch = {
    ...state.stockByBranch,
    [args.branchId]: {
      ...(state.stockByBranch[args.branchId] ?? {}),
    },
  };

  const createdMovements: InventoryMovement[] = [];

  for (const entry of args.entries) {
    if (entry.quantity <= 0 && entry.stockDelta === 0) continue;

    const productKey = String(entry.productId);
    const current = stockByBranch[args.branchId][productKey] ?? 0;
    stockByBranch[args.branchId][productKey] = Math.max(0, current + entry.stockDelta);

    createdMovements.push({
      id: generateMovementId(),
      branchId: args.branchId,
      productId: entry.productId,
      type: entry.type,
      quantity: Math.max(0, entry.quantity),
      stockDelta: entry.stockDelta,
      actor,
      reason,
      reference: entry.reference ?? "manual",
      createdAt: now,
    });
  }

  return {
    ...state,
    stockByBranch,
    movements: [...createdMovements, ...state.movements],
  };
}