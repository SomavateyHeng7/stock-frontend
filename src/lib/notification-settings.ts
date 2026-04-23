export type NotificationSettings = {
    enabled: boolean;
    intervalMinutes: number;
    slaHours: number;
    lastRunAt: string | null;
    /** Numeric Telegram chat ID. Get yours by messaging @userinfobot on Telegram. */
    telegramChatId: string;
};

export const NOTIFICATION_SETTINGS_KEY = "smartstock.notification.settings";

export const defaultNotificationSettings: NotificationSettings = {
    enabled: true,
    intervalMinutes: 30,
    slaHours: 24,
    lastRunAt: null,
    telegramChatId: "",
};

let _nsCache: NotificationSettings | null = null;
let _nsListenerAttached = false;
function ensureNSListener() {
    if (_nsListenerAttached || typeof window === "undefined") return;
    _nsListenerAttached = true;
    window.addEventListener("storage", (e) => {
        if (e.key === NOTIFICATION_SETTINGS_KEY) _nsCache = null;
    });
}

export function normalizeNotificationSettings(value?: Partial<NotificationSettings>): NotificationSettings {
    return {
        enabled: value?.enabled ?? defaultNotificationSettings.enabled,
        intervalMinutes: Math.max(5, value?.intervalMinutes ?? defaultNotificationSettings.intervalMinutes),
        slaHours: Math.max(1, value?.slaHours ?? defaultNotificationSettings.slaHours),
        lastRunAt: value?.lastRunAt ?? defaultNotificationSettings.lastRunAt,
        telegramChatId: typeof value?.telegramChatId === "string" ? value.telegramChatId.trim() : "",
    };
}

export function readNotificationSettings(): NotificationSettings {
    if (typeof window === "undefined") return defaultNotificationSettings;

    ensureNSListener();
    if (_nsCache !== null) return _nsCache;

    try {
        const raw = window.localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
        if (!raw) return defaultNotificationSettings;
        _nsCache = normalizeNotificationSettings(JSON.parse(raw));
        return _nsCache;
    } catch {
        return defaultNotificationSettings;
    }
}

export function writeNotificationSettings(settings: Partial<NotificationSettings>) {
    if (typeof window === "undefined") return;

    _nsCache = null;
    const current = readNotificationSettings();
    const next = normalizeNotificationSettings({ ...current, ...settings });
    _nsCache = next;
    window.localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(next));
}