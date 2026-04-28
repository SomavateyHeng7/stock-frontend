"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { SmartStockShell } from "@/components/smartstock-shell";
import { IntegrationTestsSection } from "@/components/integrations-sync/integration-tests-section";
import { SyncSection } from "@/components/integrations-sync/sync-section";
import { ParsedOrderLine } from "@/components/integrations-sync/types";
import { useToast } from "@/components/ui/toast-provider";
import { useTelegramLink } from "@/hooks/use-telegram-link";
import {
    getChannelSyncRows,
    writeSmartStockChannelInventory,
} from "@/lib/smartstock-data";
import {
    readNotificationSettings,
    writeNotificationSettings,
} from "@/lib/notification-settings";

type IntegrationsSyncHubProps = {
    title?: string;
    subtitle?: string;
};

export function IntegrationsSyncHub({
                                        title = "Integrations + Sync",
                                        subtitle = "Connect channels and keep inventory totals aligned across Walk-in, Facebook, and Delivery.",
                                    }: IntegrationsSyncHubProps) {
    const { showToast } = useToast();

    // ── Telegram state ───────────────────────────────────────────────────
    const [telegramChatId, setTelegramChatId] = useState(() => {
        if (typeof window === "undefined") return "";
        return readNotificationSettings().telegramChatId;
    });
    const [telegramMessage, setTelegramMessage] = useState("SmartStock test alert from Integrations page");
    const [telegramStatus, setTelegramStatus] = useState<string>(
      () => (typeof window !== "undefined" && readNotificationSettings().telegramChatId ? "Connected" : "Not linked")
    );

    const { phase, chatId: linkedChatId, activate, stop: stopPolling } = useTelegramLink();
    const telegramPolling = phase === "waiting";

    // When the link flow completes, persist the new chat ID and notify.
    useEffect(() => {
        if (!linkedChatId) return;
        setTelegramChatId(linkedChatId);
        showToast({
            title: "Telegram linked!",
            description: `Chat ID ${linkedChatId} captured. Alerts are now active.`,
            source: "Telegram",
            severity: "info",
        });
    }, [linkedChatId, showToast]);

    // Sync status label with hook phase.
    useEffect(() => {
        if (phase === "waiting") setTelegramStatus("Waiting...");
        else if (phase === "connected") setTelegramStatus("Connected");
        else if (phase === "error") setTelegramStatus("Error connecting");
    }, [phase]);

    // Persist chat ID to notification settings whenever it changes.
    useEffect(() => {
        writeNotificationSettings({ telegramChatId });
    }, [telegramChatId]);

    // ── Facebook parser ─────────────────────────────────────────────────
    const [facebookInput, setFacebookInput] = useState("2 Rice 25kg\nFish Sauce 750ml x 3");
    const [parsedLines, setParsedLines] = useState<ParsedOrderLine[]>([]);

    // ── POS sync ────────────────────────────────────────────────────────
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

    // ── Channel sync rows ────────────────────────────────────────────────
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
        return { ...row, walkIn, facebook, delivery, syncedTotal: total, mismatch: 0, lastSyncMinutesAgo: 0 };
    };

    const resolveOne = (productId: number) => {
        persistRows(rows.map((row) => (row.productId === productId ? rebalanceToSourceTotal(row) : row)));
    };

    const syncNow = () => {
        persistRows(rows.map((row) => rebalanceToSourceTotal(row)));
    };

    // ── Handlers ─────────────────────────────────────────────────────────
    const testTelegram = async (event: FormEvent) => {
        event.preventDefault();
        setTelegramStatus("Testing...");

        try {
            const response = await fetch("/api/integrations/telegram/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: telegramMessage,
                    ...(telegramChatId ? { chatId: telegramChatId } : {}),
                }),
            });

            const payload = (await response.json()) as { details?: string };
            if (!response.ok) {
                throw new Error(payload.details || "Telegram send failed");
            }

            setTelegramStatus("Connected");
            showToast({
                title: "Telegram connected",
                description: "Test message delivered successfully.",
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
                telegramChatId={telegramChatId}
                telegramMessage={telegramMessage}
                telegramStatus={telegramStatus}
                telegramPolling={telegramPolling}
                facebookInput={facebookInput}
                parsedLines={parsedLines}
                posPayload={posPayload}
                posStatus={posStatus}
                onTelegramMessageChange={setTelegramMessage}
                onFacebookInputChange={setFacebookInput}
                onPosPayloadChange={setPosPayload}
                onActivate={activate}
                onStopPolling={stopPolling}
                onTestTelegram={testTelegram}
                onTestFacebookParse={testFacebookParse}
                onTestPosSync={testPosSync}
              />
          </section>
      </SmartStockShell>
    );
}