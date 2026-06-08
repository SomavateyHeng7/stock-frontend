"use client";

import { useLang } from "@/lib/i18n";
import { updateUserPreferences } from "@/lib/user-preferences";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const lang = useLang();

  const toggle = () => {
    updateUserPreferences({ language: lang === "km" ? "en" : "km" });
  };

  return (
    <button
      onClick={toggle}
      title={lang === "km" ? "Switch to English" : "ប្តូរទៅភាសាខ្មែរ"}
      aria-label="Switch language"
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      <Globe className="h-3.5 w-3.5 text-slate-400" />
      <span className="uppercase tracking-wide">{lang}</span>
    </button>
  );
}
