import { FormEvent, useEffect, useRef } from "react";
import { ParsedOrderLine } from "@/components/integrations-sync/types";

type IntegrationTestsSectionProps = {
  telegramChatId: string;
  telegramMessage: string;
  telegramStatus: string;
  // Renamed: replaces onStartPolling + the hardcoded open-bot link
  // Call useTelegramLink's activate() here — it mints token, opens deep link, starts polling
  onActivate: () => Promise<void>;
  onStopPolling: () => void;
  telegramPolling: boolean;
  facebookInput: string;
  parsedLines: ParsedOrderLine[];
  posPayload: string;
  posStatus: string;
  onTelegramMessageChange: (value: string) => void;
  onFacebookInputChange: (value: string) => void;
  onPosPayloadChange: (value: string) => void;
  onTestTelegram: (event: FormEvent) => Promise<void>;
  onTestFacebookParse: (event: FormEvent) => Promise<void>;
  onTestPosSync: (event: FormEvent) => Promise<void>;
};

const statusColor = (status: string) => {
  if (status === "Connected") return "text-green-600 dark:text-green-400";
  if (status.startsWith("Error")) return "text-red-600 dark:text-red-400";
  if (status === "Testing..." || status === "Syncing..." || status === "Waiting...")
    return "text-blue-600 dark:text-blue-400";
  return "text-muted-foreground";
};

export function IntegrationTestsSection({
                                          telegramChatId,
                                          telegramMessage,
                                          telegramStatus,
                                          telegramPolling,
                                          onActivate,
                                          onStopPolling,
                                          facebookInput,
                                          parsedLines,
                                          posPayload,
                                          posStatus,
                                          onTelegramMessageChange,
                                          onFacebookInputChange,
                                          onPosPayloadChange,
                                          onTestTelegram,
                                          onTestFacebookParse,
                                          onTestPosSync,
                                        }: IntegrationTestsSectionProps) {
  const dotsRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!telegramPolling || !dotsRef.current) return;
    const frames = ["·", "··", "···", "····"];
    let i = 0;
    const id = setInterval(() => {
      if (dotsRef.current) {
        dotsRef.current.textContent = frames[i % frames.length];
        i++;
      }
    }, 400);
    return () => clearInterval(id);
  }, [telegramPolling]);

  const isConnected = telegramChatId.length > 0;

  return (
    <>
      {/* ── Telegram ──────────────────────────────────────────────── */}
      <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Telegram alerts</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Send live SLA breach notifications to a Telegram chat or group.
            </p>
          </div>
          <span className={`mt-1 shrink-0 text-sm font-medium ${statusColor(telegramStatus)}`}>
            {telegramStatus}
          </span>
        </div>

        {/* ── Step 1: Link ──────────────────────────────────────── */}
        <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-4">
          <p className="text-sm font-medium text-foreground">
            Step 1 — Link your Telegram account
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Click the button below — it opens the bot with a secure one-time link.
            Just send any message and your chat ID is captured automatically.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isConnected ? (
              /* ── Already linked ── */
              <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/10 px-3 text-sm font-medium text-green-700 dark:text-green-400">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Linked — chat ID {telegramChatId}
              </span>
            ) : telegramPolling ? (
              /* ── Waiting for message ── */
              <button
                type="button"
                onClick={onStopPolling}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                <span ref={dotsRef} className="font-mono text-blue-600 dark:text-blue-400 w-5 inline-block">·</span>
                Waiting for message — cancel
              </button>
            ) : (
              /* ── One button: mint token + open bot + start polling ── */
              <button
                type="button"
                onClick={onActivate}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2AABEE] px-4 text-sm font-semibold text-white hover:bg-[#239DD5] transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
                </svg>
                Open SmartStock Bot
              </button>
            )}
          </div>
        </div>

        {/* ── Step 2: Send test message ─────────────────────────── */}
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-foreground">
            Step 2 — Send a test message
            {!isConnected && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (link your account first)
              </span>
            )}
          </p>
          <form className="space-y-3" onSubmit={onTestTelegram}>
            <textarea
              value={telegramMessage}
              onChange={(e) => onTelegramMessageChange(e.target.value)}
              rows={3}
              disabled={!isConnected}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!isConnected || telegramStatus === "Testing..."}
              className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {telegramStatus === "Testing..." ? "Sending…" : "Send test message"}
            </button>
          </form>
        </div>
      </article>

      {/* ── Facebook Messenger parser ──────────────────────────────── */}
      <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Facebook Messenger parser</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Paste a raw Messenger order message to extract product/quantity lines.
        </p>
        <form className="mt-4 space-y-3" onSubmit={onTestFacebookParse}>
          <textarea
            value={facebookInput}
            onChange={(e) => onFacebookInputChange(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
          <button
            type="submit"
            className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Parse sample message
          </button>
        </form>

        {parsedLines.length > 0 && (
          <ul className="mt-3 space-y-2">
            {parsedLines.map((line, index) => (
              <li
                key={`${line.product}-${index}`}
                className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm text-foreground"
              >
                <span>{line.product}</span>
                <span className="font-medium">Qty {line.quantity}</span>
              </li>
            ))}
          </ul>
        )}
      </article>

      {/* ── POS sync connector ─────────────────────────────────────── */}
      <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">POS sync connector</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Simulate a POS payload to verify the sync endpoint.
            </p>
          </div>
          <span className={`mt-1 shrink-0 text-sm font-medium ${statusColor(posStatus)}`}>
            {posStatus}
          </span>
        </div>
        <form className="mt-4 space-y-3" onSubmit={onTestPosSync}>
          <textarea
            value={posPayload}
            onChange={(e) => onPosPayloadChange(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
          <button
            type="submit"
            disabled={posStatus === "Syncing..."}
            className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            {posStatus === "Syncing..." ? "Syncing…" : "Run POS sync test"}
          </button>
        </form>
      </article>
    </>
  );
}