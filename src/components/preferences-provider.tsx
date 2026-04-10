"use client";

import { useEffect } from "react";
import {
  USER_PREFERENCES_CHANGED_EVENT,
  readUserPreferences,
  toLocaleTag,
} from "@/lib/user-preferences";

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const apply = () => {
      const preferences = readUserPreferences();
      document.documentElement.lang = toLocaleTag(preferences.language);
      document.documentElement.dataset.timezone = preferences.timezone;
      document.documentElement.dataset.currency = preferences.currency;
    };

    apply();
    window.addEventListener("storage", apply);
    window.addEventListener(USER_PREFERENCES_CHANGED_EVENT, apply);

    return () => {
      window.removeEventListener("storage", apply);
      window.removeEventListener(USER_PREFERENCES_CHANGED_EVENT, apply);
    };
  }, []);

  return <>{children}</>;
}
