"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { pushNotification, type NotificationSeverity } from "@/lib/notification-center";

type Toast = {
  id: number;
  title: string;
  description?: string;
};

type ToastInput = {
  title: string;
  description?: string;
  source?: string;
  severity?: NotificationSeverity;
  persistToCenter?: boolean;
};

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, source, severity, persistToCenter }: ToastInput) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);

      setToasts((current) => [...current, { id, title, description }]);

      if (persistToCenter !== false) {
        // Mirror transient toasts into persistent notification timeline.
        pushNotification({
          title,
          description,
          source: source ?? "Toast",
          severity: severity ?? "info",
        });
      }

      window.setTimeout(() => {
        removeToast(id);
      }, 2800);
    },
    [removeToast],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-100 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-xl border border-border/70 bg-card p-3 shadow-lg"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-semibold text-foreground">{toast.title}</p>
            {toast.description && (
              <p className="mt-1 text-sm text-muted-foreground">{toast.description}</p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
