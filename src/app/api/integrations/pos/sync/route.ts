import { NextResponse } from "next/server";

type PosItem = {
  sku: string;
  sold: number;
  onHand?: number;
};

type PosSyncRequest = {
  source?: string;
  snapshotAt?: string;
  items?: PosItem[];
};

type PosSyncStore = {
  history: Array<{
    source: string;
    snapshotAt: string;
    items: PosItem[];
    receivedAt: string;
  }>;
};

declare global {
  var __smartstockPosSyncStore: PosSyncStore | undefined;
}

function getStore(): PosSyncStore {
  if (!globalThis.__smartstockPosSyncStore) {
    globalThis.__smartstockPosSyncStore = { history: [] };
  }
  return globalThis.__smartstockPosSyncStore;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as PosSyncRequest;
  const source = payload.source?.trim() || "unknown-pos";
  const items = Array.isArray(payload.items)
    ? payload.items.filter(
        (item) =>
          typeof item?.sku === "string" &&
          typeof item?.sold === "number" &&
          (item.onHand === undefined || typeof item.onHand === "number"),
      )
    : [];

  if (items.length === 0) {
    return NextResponse.json({ error: "items array is required" }, { status: 400 });
  }

  const record = {
    source,
    snapshotAt: payload.snapshotAt ?? new Date().toISOString(),
    items,
    receivedAt: new Date().toISOString(),
  };

  const store = getStore();
  store.history = [record, ...store.history].slice(0, 50);

  return NextResponse.json({
    ok: true,
    source: record.source,
    syncedItems: record.items.length,
    totalUnitsSold: record.items.reduce((sum, item) => sum + item.sold, 0),
    latestReceivedAt: record.receivedAt,
  });
}
