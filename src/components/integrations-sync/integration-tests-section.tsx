import { FormEvent } from "react";
import { ParsedOrderLine } from "@/components/integrations-sync/types";

type IntegrationTestsSectionProps = {
    telegramChatId: string;
    telegramMessage: string;
    telegramStatus: string;
    facebookInput: string;
    parsedLines: ParsedOrderLine[];
    posPayload: string;
    posStatus: string;
    onTelegramChatIdChange: (value: string) => void;
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
    if (status === "Testing..." || status === "Syncing...") return "text-blue-600 dark:text-blue-400";
    return "text-muted-foreground";
};

export function IntegrationTestsSection({
                                            telegramChatId,
                                            telegramMessage,
                                            telegramStatus,
                                            facebookInput,
                                            parsedLines,
                                            posPayload,
                                            posStatus,
                                            onTelegramChatIdChange,
                                            onTelegramMessageChange,
                                            onFacebookInputChange,
                                            onPosPayloadChange,
                                            onTestTelegram,
                                            onTestFacebookParse,
                                            onTestPosSync,
                                        }: IntegrationTestsSectionProps) {
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

                {/* Setup instructions */}
                <details className="mt-4 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm">
                    <summary className="cursor-pointer select-none font-medium text-foreground">
                        How to get your Chat ID
                    </summary>
                    <ol className="mt-2 space-y-1 pl-4 text-muted-foreground" style={{ listStyleType: "decimal" }}>
                        <li>Search for <strong>@SmartStockAlertBot</strong> on Telegram and press Start (or create your own bot via <strong>@BotFather</strong> and set <code className="rounded bg-muted px-1 font-mono text-xs">TELEGRAM_BOT_TOKEN</code> in <code className="rounded bg-muted px-1 font-mono text-xs">.env.local</code>).</li>
                        <li>Message <strong>@userinfobot</strong> on Telegram — it replies with your numeric User ID.</li>
                        <li>Paste that number into the Chat ID field below, then click <strong>Send test message</strong>.</li>
                        <li>For group alerts: add the bot to a group, then use the group's chat ID (starts with <code className="rounded bg-muted px-1 font-mono text-xs">-100…</code>).</li>
                    </ol>
                    <p className="mt-2 text-xs text-muted-foreground">
                        You can also set <code className="rounded bg-muted px-1 font-mono text-xs">TELEGRAM_CHAT_ID</code> in <code className="rounded bg-muted px-1 font-mono text-xs">.env.local</code> as a default — the field below overrides it per-session.
                    </p>
                </details>

                <form className="mt-4 space-y-3" onSubmit={onTestTelegram}>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-foreground">
                            Chat ID <span className="text-muted-foreground">(your numeric Telegram user or group ID)</span>
                        </label>
                        <input
                            type="text"
                            value={telegramChatId}
                            onChange={(event) => onTelegramChatIdChange(event.target.value)}
                            placeholder="e.g. 123456789 or -1001234567890"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-foreground">Test message</label>
                        <textarea
                            value={telegramMessage}
                            onChange={(event) => onTelegramMessageChange(event.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={telegramStatus === "Testing..."}
                        className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                        {telegramStatus === "Testing..." ? "Sending…" : "Send test message"}
                    </button>
                </form>
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
              onChange={(event) => onFacebookInputChange(event.target.value)}
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
              onChange={(event) => onPosPayloadChange(event.target.value)}
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