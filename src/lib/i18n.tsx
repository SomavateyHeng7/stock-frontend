"use client";

/**
 * Dead-simple i18n — pure React Context, no external libraries.
 *
 * Usage:
 *   const t = useT();
 *   t("nav.dashboard")            → looks up nested key
 *   t("nav.dashboard", "Default") → fallback if key missing
 *   t("dashboard.trialDaysLeft", "Trial {{days}} left", { days: 3 }) → interpolation
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import en from "../locales/en.json";
import km from "../locales/km.json";
import {
  USER_PREFERENCES_CHANGED_EVENT,
  readUserPreferences,
  toLocaleTag,
  type AppLanguage,
} from "./user-preferences";

// ─── types ────────────────────────────────────────────────────────────────────

type Translations = Record<string, unknown>;

const dictionaries: Record<AppLanguage, Translations> = {
  en: en as Translations,
  km: km as Translations,
};

// ─── lookup ───────────────────────────────────────────────────────────────────

function getByPath(obj: Translations, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`,
  );
}

// ─── context ──────────────────────────────────────────────────────────────────

type TFn = (key: string, fallback?: string, vars?: Record<string, string | number>) => string;

const I18nContext = createContext<{ t: TFn; lang: AppLanguage }>({
  t: (key, fallback) => fallback ?? key,
  lang: "en",
});

// ─── provider ────────────────────────────────────────────────────────────────

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<AppLanguage>("en");

  useEffect(() => {
    // Read initial language from stored preferences
    const initial = readUserPreferences().language;
    setLang(initial);
    document.documentElement.lang = toLocaleTag(initial);

    const handleChange = () => {
      const next = readUserPreferences().language;
      setLang(next);
      document.documentElement.lang = toLocaleTag(next);
    };

    window.addEventListener(USER_PREFERENCES_CHANGED_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(USER_PREFERENCES_CHANGED_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const t = useCallback<TFn>(
    (key, fallback, vars) => {
      const dict = dictionaries[lang];
      const raw = getByPath(dict, key);
      const template = raw ?? fallback ?? key;
      return interpolate(template, vars);
    },
    [lang],
  );

  return <I18nContext.Provider value={{ t, lang }}>{children}</I18nContext.Provider>;
}

// ─── hook ─────────────────────────────────────────────────────────────────────

/** Drop-in replacement for useTranslation() → `const t = useT();` */
export function useT(): TFn {
  return useContext(I18nContext).t;
}

/** Get the current language code */
export function useLang(): AppLanguage {
  return useContext(I18nContext).lang;
}
