"use client";

import { FormEvent, useMemo, useState } from "react";
import { SmartStockShell } from "@/components/smartstock-shell";
import { IntegrationTestsSection } from "@/components/integrations-sync/integration-tests-section";
import { SyncSection } from "@/components/integrations-sync/sync-section";
import { ParsedOrderLine } from "@/components/integrations-sync/types";
import { useToast } from "@/components/ui/toast-provider";
import {
  getChannelSyncRows,
  writeSmartStockChannelInventory,
} from "@/lib/smartstock-data";

type IntegrationsSyncHubProps = {
  title?: string;
  subtitle?: string;
};

export function IntegrationsSyncHub({
  title = "Integrations + Sync",
  subtitle = "Connect channels and keep inventory totals aligned across Walk-in, Facebook, and Delivery.",
}: IntegrationsSyncHubProps) {
  const { showToast } = useToast();

  const [telegramMessage, setTelegramMessage] = useState("SmartStock test alert from Integrations page");
  const [telegramStatus, setTelegramStatus] = useState<string>("Not tested");

  const [facebookInput, setFacebookInput] = useState("2 Rice 25kg\nFish Sauce 750ml x 3");
  const [parsedLines, setParsedLines] = useState<ParsedOrderLine[]>([]);

  const [posPayload, setPosPayload] = useState(
    JSON.stringify(
      {
        source: "demo-pos",
        items: [
          { sku: "RICE25", sold: 6, onHand: 14 },
          { sku: "FISH750", sold: 3, onHand: 7 },
        ],
      },
      null,
      2,
    ),
  );
  const [posStatus, setPosStatus] = useState<string>("Not tested");

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

  const testTelegram = async (event: FormEvent) => {
    event.preventDefault();
    setTelegramStatus("Testing...");

    try {
      const response = await fetch("/api/integrations/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: telegramMessage }),
      });

      const payload = (await response.json()) as { details?: string };
      if (!response.ok) {
        throw new Error(payload.details || "Telegram send failed");
      }

      setTelegramStatus("Connected");
      showToast({
        title: "Telegram connected",
        description: "Test message sent successfully.",
        source: "Integrations",
        severity: "info",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Telegram test error";
      setTelegramStatus(`Error: ${message}`);
      showToast({
        title: "Telegram test failed",
        description: message,
        source: "Integrations",
        severity: "warning",
      });
    }
  };

  const testFacebookParse = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch("/api/integrations/facebook/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: facebookInput }),
      });

      const payload = (await response.json()) as {
        orderLines?: ParsedOrderLine[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Parser request failed");
      }

      setParsedLines(payload.orderLines ?? []);
      showToast({
        title: "Facebook parser tested",
        description: `${payload.orderLines?.length ?? 0} line(s) extracted.`,
        source: "Integrations",
        severity: "info",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown parser error";
      showToast({
        title: "Parser test failed",
        description: message,
        source: "Integrations",
        severity: "warning",
      });
    }
  };

  const testPosSync = async (event: FormEvent) => {
    event.preventDefault();
    setPosStatus("Syncing...");

    try {
      const parsed = JSON.parse(posPayload) as unknown;
      const response = await fetch("/api/integrations/pos/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const payload = (await response.json()) as {
        syncedItems?: number;
        totalUnitsSold?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "POS sync failed");
      }

      setPosStatus(`Connected · ${payload.syncedItems ?? 0} items synced`);
      showToast({
        title: "POS sync successful",
        description: `Synced ${payload.syncedItems ?? 0} items / ${payload.totalUnitsSold ?? 0} sold units.`,
        source: "Integrations",
        severity: "info",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown POS sync error";
      setPosStatus(`Error: ${message}`);
      showToast({
        title: "POS sync failed",
        description: message,
        source: "Integrations",
        severity: "warning",
      });
    }
  };

  return (
    <SmartStockShell title={title} subtitle={subtitle}>
      <section className="space-y-4" aria-label="Integrations and sync">
        <SyncSection
          rows={rows}
          hasMismatches={hasMismatches}
          mismatchCount={mismatchCount}
          syncedCount={syncedCount}
          lastSyncLabel={lastSyncLabel}
          onSyncNow={syncNow}
          onResolveOne={resolveOne}
        />

        <IntegrationTestsSection
          telegramMessage={telegramMessage}
          telegramStatus={telegramStatus}
          facebookInput={facebookInput}
          parsedLines={parsedLines}
          posPayload={posPayload}
          posStatus={posStatus}
          onTelegramMessageChange={setTelegramMessage}
          onFacebookInputChange={setFacebookInput}
          onPosPayloadChange={setPosPayload}
          onTestTelegram={testTelegram}
          onTestFacebookParse={testFacebookParse}
          onTestPosSync={testPosSync}
        />
      </section>
    </SmartStockShell>
  );
}
