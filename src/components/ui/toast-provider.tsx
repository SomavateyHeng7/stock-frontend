"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { pushNotification, type NotificationSeverity } from "@/lib/notification-center";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ToastSeverity = NotificationSeverity | "success" | "error";

type Toast = {
  id: number;
  title: string;
  description?: string;
  severity: ToastSeverity;
  duration: number;
  action?: { label: string; onClick: () => void };
};

export type ToastInput = {
  title: string;
  description?: string;
  source?: string;
  severity?: ToastSeverity;
  persistToCenter?: boolean;
  duration?: number;
  action?: { label: string; onClick: () => void };
};

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

// ─── Config ────────────────────────────────────────────────────────────────────

const MAX_TOASTS = 5;
const DEFAULT_DURATION = 4000;

const SEVERITY_CONFIG: Record<
  ToastSeverity,
  { icon: React.ElementType; bar: string; border: string; iconCls: string; bg: string }
> = {
  success: {
    icon: CheckCircle2,
    bar: "bg-green-500",
    border: "border-green-500/40",
    iconCls: "text-green-500",
    bg: "bg-green-500/5",
  },
  info: {
    icon: Info,
    bar: "bg-blue-500",
    border: "border-blue-500/30",
    iconCls: "text-blue-500",
    bg: "bg-blue-500/5",
  },
  warning: {
    icon: AlertTriangle,
    bar: "bg-yellow-500",
    border: "border-yellow-500/40",
    iconCls: "text-yellow-500",
    bg: "bg-yellow-500/5",
  },
  critical: {
    icon: XCircle,
    bar: "bg-red-500",
    border: "border-red-500/40",
    iconCls: "text-red-500",
    bg: "bg-red-500/5",
  },
  error: {
    icon: XCircle,
    bar: "bg-red-500",
    border: "border-red-500/40",
    iconCls: "text-red-500",
    bg: "bg-red-500/5",
  },
};

// Map toast-only severities to NotificationSeverity for the notification centre
function toNotificationSeverity(s: ToastSeverity): NotificationSeverity {
  if (s === "success") return "info";
  if (s === "error") return "critical";
  return s;
}

// ─── Toast Item ────────────────────────────────────────────────────────────────

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const cfg = SEVERITY_CONFIG[toast.severity];
  const Icon = cfg.icon;

  // Progress bar state
  const [progress, setProgress] = useState(100);
  const [paused, setPaused] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const remainingRef = useRef<number>(toast.duration);
  const rafRef = useRef<number | null>(null);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    dismissTimeoutRef.current = setTimeout(
      () => onDismiss(toast.id),
      remainingRef.current,
    );

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.max(0, 100 - (elapsed / remainingRef.current) * 100);
      setProgress(pct);
      if (pct > 0) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [onDismiss, toast.id]);

  const pauseTimer = useCallback(() => {
    if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    remainingRef.current -= Date.now() - startTimeRef.current;
    setPaused(true);
  }, []);

  const resumeTimer = useCallback(() => {
    setPaused(false);
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    startTimer();
    return () => {
      if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [startTimer]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      role="status"
      aria-live="polite"
      className={`pointer-events-auto w-full overflow-hidden rounded-xl border shadow-lg ${cfg.border} ${cfg.bg} bg-card backdrop-blur-sm`}
    >
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-3">
        {/* Icon */}
        <div className={`mt-0.5 shrink-0 ${cfg.iconCls}`}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground leading-snug">{toast.title}</p>
          {toast.description && (
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{toast.description}</p>
          )}
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action!.onClick();
                onDismiss(toast.id);
              }}
              className={`mt-2 text-xs font-semibold underline-offset-2 hover:underline ${cfg.iconCls}`}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss notification"
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 w-full bg-muted/40">
        <div
          className={`h-full transition-none ${cfg.bar} ${paused ? "opacity-50" : ""}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

// ─── Provider ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      title,
      description,
      source,
      severity = "info",
      persistToCenter,
      duration = DEFAULT_DURATION,
      action,
    }: ToastInput) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);

      setToasts((current) => {
        const next = [...current, { id, title, description, severity, duration, action }];
        // Drop oldest if over cap
        return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
      });

      if (persistToCenter !== false) {
        pushNotification({
          title,
          description,
          source: source ?? "Toast",
          severity: toNotificationSeverity(severity),
        });
      }
    },
    [],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Portal — top-right stack */}
      <div
        aria-label="Notifications"
        className="pointer-events-none fixed right-4 top-4 z-200 flex w-full max-w-sm flex-col-reverse gap-2"
      >
        <AnimatePresence initial={false} mode="sync">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
