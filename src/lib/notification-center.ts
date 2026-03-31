export type NotificationSeverity = "info" | "warning" | "critical";

export type NotificationItem = {
  id: string;
  title: string;
  description?: string;
  source: string;
  severity: NotificationSeverity;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
};

export const NOTIFICATION_CENTER_KEY = "smartstock.notification-center.v1";
export const NOTIFICATION_CENTER_CHANGED_EVENT = "smartstock:notification-center-changed";

function generateNotificationId() {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `NTF-${Date.now()}-${rand}`;
}

export function readNotificationCenter(): NotificationItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(NOTIFICATION_CENTER_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as Array<Partial<NotificationItem>>;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => {
        return (
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          typeof item.source === "string" &&
          ["info", "warning", "critical"].includes(String(item.severity)) &&
          typeof item.createdAt === "string"
        );
      })
      .map((item) => ({
        id: item.id as string,
        title: item.title as string,
        description: typeof item.description === "string" ? item.description : undefined,
        source: item.source as string,
        severity: item.severity as NotificationSeverity,
        createdAt: item.createdAt as string,
        acknowledgedAt: typeof item.acknowledgedAt === "string" ? item.acknowledgedAt : null,
        resolvedAt: typeof item.resolvedAt === "string" ? item.resolvedAt : null,
      }))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  } catch {
    return [];
  }
}

export function writeNotificationCenter(items: NotificationItem[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(NOTIFICATION_CENTER_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(NOTIFICATION_CENTER_CHANGED_EVENT));
}

export function pushNotification(input: {
  title: string;
  description?: string;
  source: string;
  severity?: NotificationSeverity;
}) {
  const now = new Date().toISOString();
  const current = readNotificationCenter();

  const next: NotificationItem = {
    id: generateNotificationId(),
    title: input.title,
    description: input.description,
    source: input.source,
    severity: input.severity ?? "info",
    createdAt: now,
    acknowledgedAt: null,
    resolvedAt: null,
  };

  writeNotificationCenter([next, ...current].slice(0, 300));
  return next;
}

export function acknowledgeNotification(id: string) {
  const current = readNotificationCenter();
  const now = new Date().toISOString();

  const next = current.map((item) =>
    item.id === id && !item.acknowledgedAt
      ? {
          ...item,
          acknowledgedAt: now,
        }
      : item,
  );

  writeNotificationCenter(next);
  return next;
}

export function resolveNotification(id: string) {
  const current = readNotificationCenter();
  const now = new Date().toISOString();

  const next = current.map((item) =>
    item.id === id
      ? {
          ...item,
          acknowledgedAt: item.acknowledgedAt ?? now,
          resolvedAt: now,
        }
      : item,
  );

  writeNotificationCenter(next);
  return next;
}

export function reopenNotification(id: string) {
  const current = readNotificationCenter();
  const next = current.map((item) =>
    item.id === id
      ? {
          ...item,
          resolvedAt: null,
        }
      : item,
  );

  writeNotificationCenter(next);
  return next;
}

export function clearResolvedNotifications() {
  const current = readNotificationCenter();
  writeNotificationCenter(current.filter((item) => !item.resolvedAt));
}

export function getOpenNotificationCount(items: NotificationItem[]) {
  return items.filter((item) => !item.resolvedAt).length;
}
