"use client";

import { useMemo, useState } from "react";
import { SmartStockShell } from "@/components/smartstock-shell";
import {
  getChannelSyncRows,
  writeSmartStockChannelInventory,
} from "@/lib/smartstock-data";

export default function SyncPage() {
  const [rows, setRows] = useState(getChannelSyncRows());
  const mismatchCount = rows.filter((row) => row.mismatch !== 0).length;
  const syncedCount = rows.length - mismatchCount;
  const hasMismatches = mismatchCount > 0;

  const lastSyncLabel = useMemo(() => {
    if (rows.length === 0) return "-";
    const newest = Math.min(...rows.map((row) => row.lastSyncMinutesAgo));
    return `${newest} min ago`;
  }, [rows]);

  const persistRows = (nextRows: typeof rows) => {
    writeSmartStockChannelInventory(
      nextRows.map((row) => ({
        productId: row.productId,
        walkIn: row.walkIn,
        facebook: row.facebook,
        delivery: row.delivery,
        lastSyncMinutesAgo: row.lastSyncMinutesAgo,
      })),
    );
    setRows(nextRows);
  };

  const rebalanceToSourceTotal = (row: (typeof rows)[number]) => {
    const total = row.sourceTotal;
    const oldTotal = Math.max(1, row.walkIn + row.facebook + row.delivery);
    const walkIn = Math.max(0, Math.round((row.walkIn / oldTotal) * total));
    const facebook = Math.max(0, Math.round((row.facebook / oldTotal) * total));
    const delivery = Math.max(0, total - walkIn - facebook);

    return {
      ...row,
      walkIn,
      facebook,
      delivery,
      syncedTotal: total,
      mismatch: 0,
      lastSyncMinutesAgo: 0,
    };
  };

  const resolveOne = (productId: number) => {
    const nextRows = rows.map((row) => (row.productId === productId ? rebalanceToSourceTotal(row) : row));
    persistRows(nextRows);
  };

  const syncNow = () => {
    const nextRows = rows.map((row) => rebalanceToSourceTotal(row));
    persistRows(nextRows);
  };

  return (
    <SmartStockShell title="Multi-channel inventory sync" subtitle="One stock view across Walk-in, Facebook, and Delivery.">
      <section className="space-y-4" aria-label="Sync">
        <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Last full sync: {lastSyncLabel}</p>
            <button
              type="button"
              onClick={syncNow}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {hasMismatches ? "Sync now" : "Already synced"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <p className="text-sm text-muted-foreground">Connected Channels</p>
              <p className="text-xl font-semibold text-foreground">3</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <p className="text-sm text-muted-foreground">Synced Products</p>
              <p className="text-xl font-semibold text-foreground">{syncedCount}/{rows.length}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <p className="text-sm text-muted-foreground">Mismatches</p>
              <p className="text-xl font-semibold text-foreground">{mismatchCount}</p>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {rows.map((row) => (
              <li key={row.productId} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="font-medium text-foreground">{row.product?.name ?? "Unknown product"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Walk-in {row.walkIn} · Facebook {row.facebook} · Delivery {row.delivery}
                </p>
                <p className="text-sm text-muted-foreground">
                  Synced total {row.syncedTotal} / Source total {row.sourceTotal}
                </p>
                <p className="text-sm text-muted-foreground">Last sync {row.lastSyncMinutesAgo} min ago</p>
                {row.mismatch !== 0 && (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="inline-flex rounded-full border border-border bg-muted px-2 py-1 text-xs font-medium text-foreground">
                      Inventory mismatch: {row.mismatch > 0 ? `+${row.mismatch}` : row.mismatch}
                    </span>
                    <button
                      type="button"
                      onClick={() => resolveOne(row.productId)}
                      className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground"
                    >
                      Resolve
                    </button>
                  </div>
                )}
                {row.mismatch === 0 && (
                  <span className="mt-2 inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-foreground">
                    Synced
                  </span>
                )}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </SmartStockShell>
  );
}
