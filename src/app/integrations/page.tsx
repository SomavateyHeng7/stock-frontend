"use client";

import { FormEvent, useState } from "react";
import { SmartStockShell } from "@/components/smartstock-shell";
import { useToast } from "@/components/ui/toast-provider";

type ParsedOrderLine = {
  product: string;
  quantity: number;
};

export default function IntegrationsPage() {
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
    <SmartStockShell title="Integrations" subtitle="Test and validate live connectors for Telegram, Facebook parsing, and POS sync.">
      <section className="space-y-4" aria-label="Integrations">
        <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Telegram alerts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Status: {telegramStatus}</p>
          <form className="mt-3 space-y-2" onSubmit={testTelegram}>
            <textarea
              value={telegramMessage}
              onChange={(event) => setTelegramMessage(event.target.value)}
              className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <button type="submit" className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">
              Send test message
            </button>
          </form>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Facebook Messenger parser</h2>
          <form className="mt-3 space-y-2" onSubmit={testFacebookParse}>
            <textarea
              value={facebookInput}
              onChange={(event) => setFacebookInput(event.target.value)}
              className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <button type="submit" className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground">
              Parse sample message
            </button>
          </form>

          {parsedLines.length > 0 && (
            <ul className="mt-3 space-y-2">
              {parsedLines.map((line, index) => (
                <li key={`${line.product}-${index}`} className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm text-foreground">
                  {line.product} · Qty {line.quantity}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">POS sync connector</h2>
          <p className="mt-1 text-sm text-muted-foreground">Status: {posStatus}</p>
          <form className="mt-3 space-y-2" onSubmit={testPosSync}>
            <textarea
              value={posPayload}
              onChange={(event) => setPosPayload(event.target.value)}
              className="min-h-36 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground"
            />
            <button type="submit" className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground">
              Run POS sync test
            </button>
          </form>
        </article>
      </section>
    </SmartStockShell>
  );
}
