import { getChannelSyncRows } from "@/lib/smartstock-data";

type ChannelSyncRow = ReturnType<typeof getChannelSyncRows>[number];

type SyncSectionProps = {
  rows: ChannelSyncRow[];
  hasMismatches: boolean;
  mismatchCount: number;
  syncedCount: number;
  lastSyncLabel: string;
  onSyncNow: () => void;
  onResolveOne: (productId: number) => void;
};

export function SyncSection({
  rows,
  hasMismatches,
  mismatchCount,
  syncedCount,
  lastSyncLabel,
  onSyncNow,
  onResolveOne,
}: SyncSectionProps) {
  return (
    <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Multi-channel inventory sync</h2>
        <button
          type="button"
          onClick={onSyncNow}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {hasMismatches ? "Sync now" : "Already synced"}
        </button>
      </div>
      <p className="text-sm text-muted-foreground">Last full sync: {lastSyncLabel}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
            <p className="text-sm text-muted-foreground">Synced total {row.syncedTotal} / Source total {row.sourceTotal}</p>
            <p className="text-sm text-muted-foreground">Last sync {row.lastSyncMinutesAgo} min ago</p>
            {row.mismatch !== 0 && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="inline-flex rounded-full border border-border bg-muted px-2 py-1 text-xs font-medium text-foreground">
                  Inventory mismatch: {row.mismatch > 0 ? `+${row.mismatch}` : row.mismatch}
                </span>
                <button
                  type="button"
                  onClick={() => onResolveOne(row.productId)}
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
  );
}
