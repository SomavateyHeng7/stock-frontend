"use client";

import { useEffect, useState } from "react";
import {
  USER_PREFERENCES_CHANGED_EVENT,
  defaultUserPreferences,
  readUserPreferences,
  type UserPreferences,
} from "@/lib/user-preferences";

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultUserPreferences);

  useEffect(() => {
    const refresh = () => setPreferences(readUserPreferences());
    refresh();

    window.addEventListener("storage", refresh);
    window.addEventListener(USER_PREFERENCES_CHANGED_EVENT, refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(USER_PREFERENCES_CHANGED_EVENT, refresh);
    };
  }, []);

  return preferences;
}
