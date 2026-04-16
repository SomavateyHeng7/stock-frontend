import { FormEvent } from "react";
import { ParsedOrderLine } from "@/components/integrations-sync/types";

type IntegrationTestsSectionProps = {
  telegramMessage: string;
  telegramStatus: string;
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

export function IntegrationTestsSection({
  telegramMessage,
  telegramStatus,
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
  return (
    <>
      <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Telegram alerts</h2>
        <p className="mt-1 text-sm text-muted-foreground">Status: {telegramStatus}</p>
        <form className="mt-3 space-y-2" onSubmit={onTestTelegram}>
          <textarea
            value={telegramMessage}
            onChange={(event) => onTelegramMessageChange(event.target.value)}
            className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <button type="submit" className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Send test message
          </button>
        </form>
      </article>

      <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Facebook Messenger parser</h2>
        <form className="mt-3 space-y-2" onSubmit={onTestFacebookParse}>
          <textarea
            value={facebookInput}
            onChange={(event) => onFacebookInputChange(event.target.value)}
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
        <form className="mt-3 space-y-2" onSubmit={onTestPosSync}>
          <textarea
            value={posPayload}
            onChange={(event) => onPosPayloadChange(event.target.value)}
            className="min-h-36 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground"
          />
          <button type="submit" className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground">
            Run POS sync test
          </button>
        </form>
      </article>
    </>
  );
}
