export type AppLanguage = "en" | "km";
export type AppCurrency = "USD" | "KHR";

export type UserPreferences = {
  language: AppLanguage;
  currency: AppCurrency;
  timezone: string;
};

export const USER_PREFERENCES_KEY = "smartstock.user.preferences.v1";
export const USER_PREFERENCES_CHANGED_EVENT = "smartstock:user-preferences-changed";

export const defaultUserPreferences: UserPreferences = {
  language: "en",
  currency: "USD",
  timezone: "Asia/Phnom_Penh",
};

export function toLocaleTag(language: AppLanguage) {
  return language === "km" ? "km-KH" : "en-US";
}

export function readUserPreferences(): UserPreferences {
  if (typeof window === "undefined") return defaultUserPreferences;

  try {
    const raw = window.localStorage.getItem(USER_PREFERENCES_KEY);
    if (!raw) return defaultUserPreferences;

    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      language: parsed.language === "km" ? "km" : "en",
      currency: parsed.currency === "KHR" ? "KHR" : "USD",
      timezone: typeof parsed.timezone === "string" && parsed.timezone.trim().length > 0
        ? parsed.timezone
        : defaultUserPreferences.timezone,
    };
  } catch {
    return defaultUserPreferences;
  }
}

export function writeUserPreferences(next: UserPreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(USER_PREFERENCES_CHANGED_EVENT));
}

export function updateUserPreferences(partial: Partial<UserPreferences>) {
  const current = readUserPreferences();
  writeUserPreferences({
    language: partial.language ?? current.language,
    currency: partial.currency ?? current.currency,
    timezone: partial.timezone ?? current.timezone,
  });
}

export function formatCurrencyAmount(amount: number, preferences: UserPreferences) {
  return new Intl.NumberFormat(toLocaleTag(preferences.language), {
    style: "currency",
    currency: preferences.currency,
    maximumFractionDigits: preferences.currency === "KHR" ? 0 : 2,
  }).format(amount);
}

export function formatDateTime(value: string | number | Date, preferences: UserPreferences, withSeconds = false) {
  return new Intl.DateTimeFormat(toLocaleTag(preferences.language), {
    timeZone: preferences.timezone,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" as const } : {}),
  }).format(new Date(value));
}

export function formatDateOnly(value: string | number | Date, preferences: UserPreferences) {
  return new Intl.DateTimeFormat(toLocaleTag(preferences.language), {
    timeZone: preferences.timezone,
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}
