export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock" | "Overstocked";
export type SupplierReliability = "High" | "Medium" | "Low";

export type Supplier = {
  id: number;
  name: string;
  leadTimeDays: number;
  phone: string;
  nextDelivery: string;
  reliability: SupplierReliability;
};

export type Product = {
  id: number;
  name: string;
  currentStock: number;
  reorderPoint: number;
  overstockPoint: number;
  todaySales: number;
  weeklySales: number[];
  supplierId: number;
  salesHistory?: number[];
};

export type Channel = "Walk-in" | "Facebook" | "Delivery";

export type ChannelInventory = {
  productId: number;
  walkIn: number;
  facebook: number;
  delivery: number;
  lastSyncMinutesAgo: number;
};

export type SmartStockState = {
  suppliers: Supplier[];
  products: Product[];
  channelInventory: ChannelInventory[];
  updatedAt: string;
};

export const SMARTSTOCK_STATE_KEY = "smartstock.data.v1";

let _ssCache: SmartStockState | null = null;
let _ssListenerAttached = false;
function ensureSSListener() {
  if (_ssListenerAttached || typeof window === "undefined") return;
  _ssListenerAttached = true;
  window.addEventListener("storage", (e) => {
    if (e.key === SMARTSTOCK_STATE_KEY) _ssCache = null;
  });
}

export const suppliers: Supplier[] = [
  {
    id: 1,
    name: "Golden Rice Trading",
    leadTimeDays: 3,
    phone: "+855 12 111 222",
    nextDelivery: "Mar 25",
    reliability: "High",
  },
  {
    id: 2,
    name: "Kampot Food Wholesale",
    leadTimeDays: 2,
    phone: "+855 12 333 444",
    nextDelivery: "Mar 24",
    reliability: "Medium",
  },
  {
    id: 3,
    name: "City Beverage Supply",
    leadTimeDays: 4,
    phone: "+855 12 555 666",
    nextDelivery: "Mar 26",
    reliability: "High",
  },
];

export const products: Product[] = [
  {
    id: 1,
    name: "Rice 25kg",
    currentStock: 12,
    reorderPoint: 20,
    overstockPoint: 90,
    todaySales: 6,
    weeklySales: [5, 6, 7, 7, 8, 9, 10],
    supplierId: 1,
  },
  {
    id: 2,
    name: "Fish Sauce 750ml",
    currentStock: 2,
    reorderPoint: 8,
    overstockPoint: 60,
    todaySales: 4,
    weeklySales: [3, 4, 4, 5, 5, 6, 6],
    supplierId: 2,
  },
  {
    id: 3,
    name: "Instant Noodles",
    currentStock: 120,
    reorderPoint: 35,
    overstockPoint: 100,
    todaySales: 11,
    weeklySales: [10, 11, 9, 12, 10, 11, 12],
    supplierId: 2,
  },
  {
    id: 4,
    name: "Soft Drink 330ml",
    currentStock: 25,
    reorderPoint: 30,
    overstockPoint: 140,
    todaySales: 9,
    weeklySales: [6, 7, 8, 8, 9, 10, 11],
    supplierId: 3,
  },
  {
    id: 5,
    name: "Cooking Oil 1L",
    currentStock: 42,
    reorderPoint: 25,
    overstockPoint: 100,
    todaySales: 5,
    weeklySales: [4, 4, 5, 5, 6, 5, 6],
    supplierId: 1,
  },
];

export const channelInventory: ChannelInventory[] = [
  { productId: 1, walkIn: 6, facebook: 4, delivery: 2, lastSyncMinutesAgo: 2 },
  { productId: 2, walkIn: 1, facebook: 1, delivery: 0, lastSyncMinutesAgo: 8 },
  { productId: 3, walkIn: 50, facebook: 42, delivery: 28, lastSyncMinutesAgo: 1 },
  { productId: 4, walkIn: 12, facebook: 8, delivery: 5, lastSyncMinutesAgo: 3 },
  { productId: 5, walkIn: 20, facebook: 14, delivery: 8, lastSyncMinutesAgo: 4 },
];

function cloneDefaultState(): SmartStockState {
  return {
    suppliers: suppliers.map((item) => ({ ...item })),
    products: products.map((item) => ({ ...item, weeklySales: [...item.weeklySales] })),
    channelInventory: channelInventory.map((item) => ({ ...item })),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeState(input: Partial<SmartStockState> | null | undefined): SmartStockState {
  const fallback = cloneDefaultState();

  const normalizedSuppliers = Array.isArray(input?.suppliers)
    ? input.suppliers
        .filter((item): item is Supplier => {
          return (
            typeof item?.id === "number" &&
            typeof item?.name === "string" &&
            typeof item?.leadTimeDays === "number" &&
            typeof item?.phone === "string" &&
            typeof item?.nextDelivery === "string" &&
            ["High", "Medium", "Low"].includes(item?.reliability)
          );
        })
        .map((item) => ({ ...item }))
    : fallback.suppliers;

  const normalizedProducts = Array.isArray(input?.products)
    ? input.products
        .filter((item): item is Product => {
          return (
            typeof item?.id === "number" &&
            typeof item?.name === "string" &&
            typeof item?.currentStock === "number" &&
            typeof item?.reorderPoint === "number" &&
            typeof item?.overstockPoint === "number" &&
            typeof item?.todaySales === "number" &&
            Array.isArray(item?.weeklySales) &&
            typeof item?.supplierId === "number"
          );
        })
        .map((item) => ({
          ...item,
          weeklySales: item.weeklySales.map((value) => Number(value) || 0),
          salesHistory: Array.isArray(item.salesHistory)
            ? item.salesHistory.map((value) => Math.max(0, Math.round(Number(value) || 0)))
            : undefined,
        }))
    : fallback.products;

  const normalizedChannels = Array.isArray(input?.channelInventory)
    ? input.channelInventory
        .filter((item): item is ChannelInventory => {
          return (
            typeof item?.productId === "number" &&
            typeof item?.walkIn === "number" &&
            typeof item?.facebook === "number" &&
            typeof item?.delivery === "number" &&
            typeof item?.lastSyncMinutesAgo === "number"
          );
        })
        .map((item) => ({ ...item }))
    : fallback.channelInventory;

  return {
    suppliers: normalizedSuppliers.length > 0 ? normalizedSuppliers : fallback.suppliers,
    products: normalizedProducts.length > 0 ? normalizedProducts : fallback.products,
    channelInventory: normalizedChannels.length > 0 ? normalizedChannels : fallback.channelInventory,
    updatedAt: typeof input?.updatedAt === "string" ? input.updatedAt : fallback.updatedAt,
  };
}

export function readSmartStockState(): SmartStockState {
  if (typeof window === "undefined") return cloneDefaultState();

  ensureSSListener();
  if (_ssCache !== null) return _ssCache;

  try {
    const raw = window.localStorage.getItem(SMARTSTOCK_STATE_KEY);
    if (!raw) {
      const seeded = cloneDefaultState();
      window.localStorage.setItem(SMARTSTOCK_STATE_KEY, JSON.stringify(seeded));
      _ssCache = seeded;
      return _ssCache;
    }

    _ssCache = normalizeState(JSON.parse(raw) as Partial<SmartStockState>);
    return _ssCache;
  } catch {
    return cloneDefaultState();
  }
}

export function writeSmartStockState(next: Partial<SmartStockState>) {
  if (typeof window === "undefined") return;

  const current = readSmartStockState();
  const merged = normalizeState({
    ...current,
    ...next,
    updatedAt: new Date().toISOString(),
  });

  _ssCache = merged;
  window.localStorage.setItem(SMARTSTOCK_STATE_KEY, JSON.stringify(merged));
}

export function writeSmartStockProducts(nextProducts: Product[]) {
  writeSmartStockState({ products: nextProducts });
}

export function writeSmartStockSuppliers(nextSuppliers: Supplier[]) {
  writeSmartStockState({ suppliers: nextSuppliers });
}

export function writeSmartStockChannelInventory(nextChannels: ChannelInventory[]) {
  writeSmartStockState({ channelInventory: nextChannels });
}

function getStateSnapshot(input?: Partial<SmartStockState>) {
  if (input) {
    return normalizeState(input);
  }
  return readSmartStockState();
}

function buildSyntheticHistory(product: Product, days: number) {
  const series: number[] = [];
  const avg = product.weeklySales.reduce((sum, value) => sum + value, 0) / Math.max(1, product.weeklySales.length);
  const slopeBias = (product.todaySales - avg) / Math.max(1, avg * 40);

  for (let index = days - 1; index >= 0; index -= 1) {
    const dayIndex = (days - 1 - index) % 7;
    const seasonal = (product.weeklySales[dayIndex] || avg || 1) / Math.max(1, avg || 1);
    const trend = 1 + slopeBias * (days - 1 - index);
    const hash = ((product.id * 17 + index * 13) % 9) - 4;
    const noise = hash * 0.05;
    const value = Math.max(0, Math.round((avg || 1) * seasonal * Math.max(0.6, trend + noise)));
    series.push(value);
  }

  return series;
}

function getSalesHistory(product: Product) {
  if (Array.isArray(product.salesHistory) && product.salesHistory.length >= 28) {
    return product.salesHistory.map((value) => Math.max(0, Math.round(value)));
  }

  return buildSyntheticHistory(product, 90);
}

function calculateSlope(values: number[]) {
  if (values.length < 2) return 0;

  const n = values.length;
  const sumX = ((n - 1) * n) / 2;
  const sumY = values.reduce((sum, value) => sum + value, 0);
  const sumXY = values.reduce((sum, value, index) => sum + value * index, 0);
  const sumXX = values.reduce((sum, _value, index) => sum + index * index, 0);

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return 0;
  return (n * sumXY - sumX * sumY) / denominator;
}

function calculateSeasonalMultipliers(history: number[], referenceDate: Date) {
  const byDay: number[][] = Array.from({ length: 7 }, () => []);
  const historyStart = new Date(referenceDate);
  historyStart.setDate(referenceDate.getDate() - history.length);

  history.forEach((value, index) => {
    const date = new Date(historyStart);
    date.setDate(historyStart.getDate() + index);
    byDay[date.getDay()].push(value);
  });

  const overall = history.reduce((sum, value) => sum + value, 0) / Math.max(1, history.length);
  if (overall <= 0) {
    return Array.from({ length: 7 }, () => 1);
  }

  return byDay.map((values) => {
    if (values.length === 0) return 1;
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.max(0.6, Math.min(1.5, mean / overall));
  });
}

function getEventBoost(date: Date) {
  const monthDay = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const eventBoosts: Record<string, number> = {
    "01-01": 1.12,
    "02-14": 1.08,
    "04-14": 1.25,
    "04-15": 1.28,
    "04-16": 1.24,
    "11-11": 1.18,
    "12-12": 1.2,
    "12-24": 1.14,
    "12-25": 1.16,
  };

  return eventBoosts[monthDay] ?? 1;
}

export function getStockStatus(product: Product): StockStatus {
  if (product.currentStock <= 0) return "Out of Stock";
  if (product.currentStock <= product.reorderPoint) return "Low Stock";
  if (product.currentStock >= product.overstockPoint) return "Overstocked";
  return "In Stock";
}

export function getStatusClass(status: StockStatus): string {
  if (status === "Out of Stock") return "border-border bg-muted text-foreground";
  if (status === "Low Stock") return "border-border bg-muted/80 text-foreground";
  if (status === "Overstocked") return "border-border bg-muted/70 text-foreground";
  return "border-border/80 bg-muted/60 text-muted-foreground";
}

export function getReliabilityClass(reliability: SupplierReliability): string {
  if (reliability === "High") return "border-primary/30 bg-primary/10 text-foreground";
  if (reliability === "Medium") return "border-border bg-muted/80 text-foreground";
  return "border-border bg-muted text-foreground";
}

export function getThirtyDayForecast(product: Product, asOfDate = new Date()) {
  const history = getSalesHistory(product);
  const recent = history.slice(-42);
  const level = recent.reduce((acc, value, index) => {
    const alpha = 0.28;
    if (index === 0) return value;
    return alpha * value + (1 - alpha) * acc;
  }, recent[0] ?? 1);

  const trend = calculateSlope(recent.slice(-28));
  const seasonalMultipliers = calculateSeasonalMultipliers(history, asOfDate);
  const trailingWindow = history.slice(-14);
  const trailingAverage =
    trailingWindow.reduce((sum, value) => sum + value, 0) / Math.max(1, trailingWindow.length);

  return Array.from({ length: 30 }, (_value, offset) => {
    const horizon = offset + 1;
    const date = new Date(asOfDate);
    date.setDate(asOfDate.getDate() + horizon);

    const dow = date.getDay();
    const baseline = Math.max(0.5, level + trend * horizon);
    const blended = baseline * 0.65 + trailingAverage * 0.35;
    const eventBoost = getEventBoost(date);
    const prediction = blended * seasonalMultipliers[dow] * eventBoost;

    return Math.max(1, Math.round(prediction));
  });
}

export function getEnrichedProducts(input?: Partial<SmartStockState>) {
  const state = getStateSnapshot(input);
  return state.products.map((product) => {
    const supplier = state.suppliers.find((item) => item.id === product.supplierId);
    const status = getStockStatus(product);
    const avgDaily = product.weeklySales.reduce((sum, value) => sum + value, 0) / product.weeklySales.length;
    const coverageDays = avgDaily > 0 ? Math.max(0, Math.floor(product.currentStock / avgDaily)) : 0;

    const forecast14 = getThirtyDayForecast(product).slice(0, 14);
    const avgForecast14 = forecast14.reduce((sum, value) => sum + value, 0) / Math.max(1, forecast14.length);
    const reorderQty = Math.max(
      0,
      Math.ceil(avgForecast14 + (supplier?.leadTimeDays ?? 3) * avgForecast14 - product.currentStock),
    );

    return {
      ...product,
      supplier,
      status,
      avgDaily,
      coverageDays,
      reorderQty,
      reason:
        status === "Out of Stock"
          ? "Current stock is empty."
          : status === "Low Stock"
            ? "Current stock is below reorder point."
            : avgDaily >= 8
              ? "Sales trend is rising this week."
              : "Stock level is healthy.",
    };
  });
}

export function getLowStockAgeHours(product: {
  id: number;
  status: StockStatus;
  coverageDays: number;
}) {
  if (product.status === "Out of Stock") {
    return 28 + product.id * 3;
  }

  if (product.status === "Low Stock") {
    return Math.max(6, (8 - product.coverageDays) * 5 + product.id * 2);
  }

  return 0;
}

export function getLowStockSlaRows(slaHours: number, input?: Partial<SmartStockState>) {
  return getEnrichedProducts(input)
    .filter((item) => item.status === "Low Stock" || item.status === "Out of Stock")
    .map((item) => {
      const ageHours = getLowStockAgeHours(item);
      return {
        ...item,
        ageHours,
        slaBreached: ageHours >= slaHours,
      };
    });
}

export function getWeeklyTotals(input?: Partial<SmartStockState>) {
  const enriched = getEnrichedProducts(input);
  return [0, 0, 0, 0, 0, 0, 0].map((_value, index) =>
    enriched.reduce((sum, item) => sum + item.weeklySales[index], 0),
  );
}

export function getChannelSyncRows(input?: Partial<SmartStockState>) {
  const state = getStateSnapshot(input);
  return state.channelInventory.map((row) => {
    const product = state.products.find((item) => item.id === row.productId);
    const syncedTotal = row.walkIn + row.facebook + row.delivery;
    const sourceTotal = product?.currentStock ?? 0;
    const mismatch = sourceTotal - syncedTotal;

    return {
      ...row,
      product,
      syncedTotal,
      sourceTotal,
      mismatch,
    };
  });
}
