"use client";

import { useEffect, useMemo, useState } from "react";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { SmartStockShell } from "@/components/smartstock-shell";
import {
  NOTIFICATION_CENTER_CHANGED_EVENT,
  acknowledgeNotification,
  clearResolvedNotifications,
  getOpenNotificationCount,
  readNotificationCenter,
  reopenNotification,
  resolveNotification,
  type NotificationItem,
} from "@/lib/notification-center";
import { formatDateTime } from "@/lib/user-preferences";

type ViewFilter = "open" | "resolved" | "all";

export default function NotificationsPage() {
  const preferences = useUserPreferences();
  const [filter, setFilter] = useState<ViewFilter>("open");
  const [items, setItems] = useState<NotificationItem[]>(() => readNotificationCenter());

  const visibleItems = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "resolved") return items.filter((item) => item.resolvedAt);
    return items.filter((item) => !item.resolvedAt);
  }, [filter, items]);

  const openCount = getOpenNotificationCount(items);
  const resolvedCount = items.length - openCount;
  const unackedCount = items.filter((item) => !item.acknowledgedAt).length;

  const markAcknowledged = (id: string) => {
    setItems(acknowledgeNotification(id));
  };

  const markResolved = (id: string) => {
    setItems(resolveNotification(id));
  };

  const markReopened = (id: string) => {
    setItems(reopenNotification(id));
  };

  const clearResolved = () => {
    clearResolvedNotifications();
    setItems(readNotificationCenter());
  };

  const refresh = () => {
    setItems(readNotificationCenter());
  };

  useEffect(() => {
    const refreshOnChange = () => setItems(readNotificationCenter());
    window.addEventListener("storage", refreshOnChange);
    window.addEventListener(NOTIFICATION_CENTER_CHANGED_EVENT, refreshOnChange);
    return () => {
      window.removeEventListener("storage", refreshOnChange);
      window.removeEventListener(NOTIFICATION_CENTER_CHANGED_EVENT, refreshOnChange);
    };
  }, []);

  const badgeClass = (severity: NotificationItem["severity"]) => {
    if (severity === "critical") return "border-red-400/40 bg-red-500/10 text-red-700";
    if (severity === "warning") return "border-yellow-400/40 bg-yellow-500/10 text-yellow-700";
    return "border-border bg-muted text-foreground";
  };

  return (
    <SmartStockShell
      title="Notification Inbox"
      subtitle="Central timeline for alerts, acknowledgements, and resolution tracking."
    >
      <section className="space-y-4" aria-label="Notifications">
        <article className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:grid-cols-4">
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Total Events</p>
            <p className="text-xl font-semibold text-foreground">{items.length}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Open</p>
            <p className="text-xl font-semibold text-foreground">{openCount}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Unacknowledged</p>
            <p className="text-xl font-semibold text-foreground">{unackedCount}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Resolved</p>
            <p className="text-xl font-semibold text-foreground">{resolvedCount}</p>
          </div>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => setFilter("open")}
                className={`rounded px-3 py-1.5 text-xs font-medium ${
                  filter === "open" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => setFilter("resolved")}
                className={`rounded px-3 py-1.5 text-xs font-medium ${
                  filter === "resolved" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Resolved
              </button>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded px-3 py-1.5 text-xs font-medium ${
                  filter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                All
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={refresh}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={clearResolved}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
              >
                Clear Resolved
              </button>
            </div>
          </div>

          {visibleItems.length === 0 ? (
            <p className="mt-3 rounded-lg border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
              No notifications in this filter.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {visibleItems.map((item) => (
                <li key={item.id} className="rounded-xl border border-border/70 bg-muted/20 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(item.createdAt, preferences)} · Source: {item.source}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${badgeClass(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {!item.acknowledgedAt && (
                      <button
                        type="button"
                        onClick={() => markAcknowledged(item.id)}
                        className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground"
                      >
                        Acknowledge
                      </button>
                    )}
                    {!item.resolvedAt ? (
                      <button
                        type="button"
                        onClick={() => markResolved(item.id)}
                        className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
                      >
                        Resolve
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markReopened(item.id)}
                        className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground"
                      >
                        Reopen
                      </button>
                    )}
                    <span className="inline-flex items-center rounded-lg border border-border bg-background px-2 text-xs text-muted-foreground">
                      {item.acknowledgedAt ? "Acknowledged" : "Not acknowledged"}
                    </span>
                    <span className="inline-flex items-center rounded-lg border border-border bg-background px-2 text-xs text-muted-foreground">
                      {item.resolvedAt ? "Resolved" : "Open"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </SmartStockShell>
  );
}
