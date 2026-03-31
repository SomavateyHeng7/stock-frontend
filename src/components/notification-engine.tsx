"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { readNotificationSettings, writeNotificationSettings } from "@/lib/notification-settings";
import { pushNotification } from "@/lib/notification-center";
import { getLowStockSlaRows } from "../lib/smartstock-data";

type SlaRow = ReturnType<typeof getLowStockSlaRows>[number];

async function sendTelegramAlert(message: string) {
  const response = await fetch("/api/integrations/telegram/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const payload = (await response.json()) as { details?: string };
    throw new Error(payload.details || `Telegram send failed (${response.status})`);
  }
}

export function NotificationEngine() {
  const { showToast } = useToast();

  useEffect(() => {
    const runCheckIfDue = async () => {
      const settings = readNotificationSettings();
      if (!settings.enabled) {
        return;
      }

      const lastRunMs = settings.lastRunAt ? new Date(settings.lastRunAt).getTime() : 0;
      const now = Date.now();
      const isDue = now - lastRunMs >= settings.intervalMinutes * 60_000;

      if (!isDue) {
        return;
      }

      const slaRows = getLowStockSlaRows(settings.slaHours);
      const breachedRows = slaRows.filter((item: SlaRow) => item.slaBreached);

      if (breachedRows.length > 0) {
        const topItems = breachedRows
          .slice(0, 3)
          .map((row: SlaRow) => `${row.name} (${row.reorderQty})`)
          .join(", ");
        const message = `<b>SmartStock SLA Alert</b>\n${breachedRows.length} item${
          breachedRows.length > 1 ? "s" : ""
        } breached (${settings.slaHours}h).\nTop: ${topItems}`;

        pushNotification({
          title: `SLA alert: ${breachedRows.length} item${breachedRows.length > 1 ? "s" : ""}`,
          description: `Auto-check detected low-stock SLA breaches (${settings.slaHours}h threshold).`,
          source: "Notification Engine",
          severity: "warning",
        });

        try {
          await sendTelegramAlert(message);
          pushNotification({
            title: "Telegram alert delivered",
            description: `Sent SLA update for ${breachedRows.length} breached item${breachedRows.length > 1 ? "s" : ""}.`,
            source: "Telegram Connector",
            severity: "info",
          });
        } catch (error) {
          const details = error instanceof Error ? error.message : "Unknown connector error";
          pushNotification({
            title: "Telegram alert failed",
            description: details,
            source: "Telegram Connector",
            severity: "critical",
          });
        }

        showToast({
          title: `SLA alert: ${breachedRows.length} item${breachedRows.length > 1 ? "s" : ""}`,
          description: `Low-stock SLA exceeded (${settings.slaHours}h threshold).`,
          persistToCenter: false,
        });
      }

      writeNotificationSettings({
        ...settings,
        lastRunAt: new Date(now).toISOString(),
      });
    };

    void runCheckIfDue();
    const intervalId = window.setInterval(() => {
      void runCheckIfDue();
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [showToast]);

  return null;
}
