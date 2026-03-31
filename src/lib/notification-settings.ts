export type NotificationSettings = {
  enabled: boolean;
  intervalMinutes: number;
  slaHours: number;
  lastRunAt: string | null;
};

export const NOTIFICATION_SETTINGS_KEY = "smartstock.notification.settings";

export const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  intervalMinutes: 30,
  slaHours: 24,
  lastRunAt: null,
};

export function normalizeNotificationSettings(value?: Partial<NotificationSettings>): NotificationSettings {
  return {
    enabled: value?.enabled ?? defaultNotificationSettings.enabled,
    intervalMinutes: Math.max(5, value?.intervalMinutes ?? defaultNotificationSettings.intervalMinutes),
    slaHours: Math.max(1, value?.slaHours ?? defaultNotificationSettings.slaHours),
    lastRunAt: value?.lastRunAt ?? defaultNotificationSettings.lastRunAt,
  };
}

export function readNotificationSettings(): NotificationSettings {
  if (typeof window === "undefined") {
    return defaultNotificationSettings;
  }

  try {
    const raw = window.localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (!raw) return defaultNotificationSettings;
    return normalizeNotificationSettings(JSON.parse(raw));
  } catch {
    return defaultNotificationSettings;
  }
}

export function writeNotificationSettings(settings: Partial<NotificationSettings>) {
  if (typeof window === "undefined") {
    return;
  }

  const next = normalizeNotificationSettings({
    ...readNotificationSettings(),
    ...settings,
  });

  window.localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(next));
}
