"use client";

import { useMemo, useState } from "react";
import { SmartStockShell } from "@/components/smartstock-shell";
import { useToast } from "@/components/ui/toast-provider";
import {
  readNotificationSettings,
  writeNotificationSettings,
} from "@/lib/notification-settings";
import { pushNotification } from "@/lib/notification-center";
import { getLowStockSlaRows } from "@/lib/smartstock-data";

export default function AlertsPage() {
  const [orderedIds, setOrderedIds] = useState<number[]>([]);
  const { showToast } = useToast();
  const [settings, setSettings] = useState(readNotificationSettings());

  const alertItems = useMemo(
    () => getLowStockSlaRows(settings.slaHours),
    [settings.slaHours],
  );
  const breachedItems = alertItems.filter((item) => item.slaBreached);

  const markOrdered = (productId: number, productName: string, reorderQty: number) => {
    if (orderedIds.includes(productId)) return;
    setOrderedIds((current) => [...current, productId]);
    showToast({
      title: "Order confirmed",
      description: `${productName}: ${reorderQty} units added to reorder queue.`,
    });
  };

  const saveSettings = () => {
    const next = {
      ...settings,
      intervalMinutes: Math.max(5, settings.intervalMinutes),
      slaHours: Math.max(1, settings.slaHours),
    };
    setSettings(next);
    writeNotificationSettings(next);

    pushNotification({
      title: "Notification settings updated",
      description: `SLA ${next.slaHours}h, every ${next.intervalMinutes} minutes, schedule ${next.enabled ? "enabled" : "disabled"}.`,
      source: "Alerts",
      severity: "info",
    });

    showToast({
      title: "Notification settings saved",
      description: `SLA ${next.slaHours}h, every ${next.intervalMinutes} min.`,
      persistToCenter: false,
    });
  };

  const runSlaCheckNow = () => {
    const refreshed = getLowStockSlaRows(settings.slaHours);
    const breaches = refreshed.filter((item) => item.slaBreached);

    writeNotificationSettings({
      ...settings,
      lastRunAt: new Date().toISOString(),
    });

    if (breaches.length === 0) {
      pushNotification({
        title: "Manual SLA check complete",
        description: "No low-stock SLA breaches detected.",
        source: "Alerts",
        severity: "info",
      });

      showToast({
        title: "SLA check complete",
        description: "No low-stock SLA breaches detected.",
        persistToCenter: false,
      });
      return;
    }

    pushNotification({
      title: `Manual SLA alert: ${breaches.length} item${breaches.length > 1 ? "s" : ""}`,
      description: `Threshold exceeded (${settings.slaHours}h).`,
      source: "Alerts",
      severity: "warning",
    });

    showToast({
      title: `SLA alert: ${breaches.length} item${breaches.length > 1 ? "s" : ""}`,
      description: `Threshold exceeded (${settings.slaHours}h).`,
      persistToCenter: false,
    });
  };

  return (
    <SmartStockShell title="Alerts" subtitle="Low stock and stockout alerts only.">
      <section className="space-y-4" aria-label="Alerts">
        <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Low-stock SLA alerts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {breachedItems.length} breached item{breachedItems.length === 1 ? "" : "s"} at {settings.slaHours}h threshold.
          </p>
          <ul className="mt-3 space-y-2">
            {breachedItems.length === 0 && (
              <li className="rounded-lg border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
                No SLA breaches right now.
              </li>
            )}
            {breachedItems.map((item) => (
              <li key={item.id} className="rounded-lg border border-border/70 bg-muted/20 p-3 text-sm">
                <span className="font-medium text-foreground">{item.name}</span>
                <span className="text-muted-foreground"> · Open {item.ageHours}h · Reorder {item.reorderQty}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Scheduled notification engine</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(event) => setSettings((prev) => ({ ...prev, enabled: event.target.checked }))}
              />
              Enable schedule
            </label>
            <label className="grid gap-1 text-sm text-foreground">
              SLA hours
              <input
                type="number"
                min={1}
                value={settings.slaHours}
                onChange={(event) => setSettings((prev) => ({ ...prev, slaHours: Number(event.target.value) }))}
                className="h-10 rounded-lg border border-border bg-background px-3 text-foreground"
              />
            </label>
            <label className="grid gap-1 text-sm text-foreground">
              Check interval (minutes)
              <input
                type="number"
                min={5}
                value={settings.intervalMinutes}
                onChange={(event) => setSettings((prev) => ({ ...prev, intervalMinutes: Number(event.target.value) }))}
                className="h-10 rounded-lg border border-border bg-background px-3 text-foreground"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveSettings}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              Save schedule
            </button>
            <button
              type="button"
              onClick={runSlaCheckNow}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground"
            >
              Run SLA check now
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Reorder alerts</h2>
          <ul className="space-y-3">
            {alertItems.map((item) => (
              <li key={item.id} className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-sm font-semibold text-foreground">{item.status}</p>
                <p className="text-sm text-muted-foreground">
                  {item.name} has {item.currentStock} left. Coverage {item.coverageDays} days · Open {item.ageHours}h.
                </p>
                <button
                  type="button"
                  className="mt-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  onClick={() => markOrdered(item.id, item.name, item.reorderQty)}
                >
                  {orderedIds.includes(item.id) ? "Ordered" : `Reorder ${item.reorderQty} units`}
                </button>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </SmartStockShell>
  );
}
