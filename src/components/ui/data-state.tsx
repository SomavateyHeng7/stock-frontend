import { AlertCircle, HelpCircle, Inbox, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  hint?: string;
  className?: string;
};

type ErrorStateProps = {
  title?: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
  hint?: string;
  className?: string;
};

type LoadingStateProps = {
  title?: string;
  description?: string;
  rows?: number;
  className?: string;
};

type HelpHintProps = {
  title?: string;
  description: string;
  className?: string;
};

export function LoadingState({
  title = "Loading content",
  description = "Please wait while we prepare your data.",
  rows = 3,
  className,
}: LoadingStateProps) {
  const placeholders = Array.from({ length: rows });

  return (
    <div className={cn("rounded-2xl border border-border/70 bg-card p-5 shadow-sm", className)}>
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>

      <div className="mt-4 space-y-3" aria-hidden="true">
        {placeholders.map((_, index) => (
          <div
            key={`loading-row-${index}`}
            className="h-12 animate-pulse rounded-lg border border-border/60 bg-muted/40"
          />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
  hint,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center", className)}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="mt-3 text-base font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {actionLabel}
        </button>
      )}

      {hint && <p className="mt-3 text-xs text-muted-foreground">Hint: {hint}</p>}
    </div>
  );
}

export function ErrorState({
  title = "We hit an unexpected issue",
  description,
  retryLabel = "Try again",
  onRetry,
  hint,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("rounded-2xl border border-red-500/20 bg-red-500/5 p-6", className)}>
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-red-500/10 p-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1">
          <p className="text-base font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>

          {hint && <p className="mt-2 text-xs text-muted-foreground">Hint: {hint}</p>}

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function HelpHint({
  title = "Need help?",
  description,
  className,
}: HelpHintProps) {
  return (
    <aside className={cn("rounded-xl border border-blue-500/20 bg-blue-500/5 p-3", className)}>
      <div className="flex items-start gap-2">
        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </aside>
  );
}
