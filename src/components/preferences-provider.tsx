"use client";

import { useEffect } from "react";
import { I18nProvider } from "@/lib/i18n";
import {
  USER_PREFERENCES_CHANGED_EVENT,
  readUserPreferences,
  toLocaleTag,
} from "@/lib/user-preferences";

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const apply = () => {
      const prefs = readUserPreferences();
      document.documentElement.lang = toLocaleTag(prefs.language);
      document.documentElement.dataset.timezone = prefs.timezone;
      document.documentElement.dataset.currency = prefs.currency;
    };

    apply();
    window.addEventListener(USER_PREFERENCES_CHANGED_EVENT, apply);
    window.addEventListener("storage", apply);
    return () => {
      window.removeEventListener(USER_PREFERENCES_CHANGED_EVENT, apply);
      window.removeEventListener("storage", apply);
    };
  }, []);

  return <I18nProvider>{children}</I18nProvider>;
}
