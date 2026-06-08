"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Search, Keyboard, Moon, Sun, Monitor, ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n";

type CommandAction = {
  id: string;
  title: string;
  description: string;
  keywords: string;
  shortcut?: string;
  run: () => void;
};

const KEYBOARD_SHORTCUTS = [
  { keys: "Cmd/Ctrl + K", description: "Open command palette" },
  { keys: "Cmd/Ctrl + /", description: "Open keyboard shortcuts help" },
  { keys: "Arrow Up / Down", description: "Move command selection" },
  { keys: "Enter", description: "Run selected command" },
  { keys: "Esc", description: "Close palette" },
];

export function GlobalCommandPalette() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const t = useT();

  const [isOpen, setIsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const openPalette = (withShortcuts = false) => {
    setIsOpen(true);
    setShowShortcuts(withShortcuts);
    setQuery("");
    setSelectedIndex(0);
  };

  const closePalette = () => {
    setIsOpen(false);
    setShowShortcuts(false);
    setQuery("");
    setSelectedIndex(0);
  };

  const actions = useMemo<CommandAction[]>(
    () => [
      {
        id: "goto-dashboard",
        title: "Open dashboard",
        description: "Go to workspace dashboard",
        keywords: "dashboard home overview",
        run: () => router.push("/dashboard"),
      },
      {
        id: "goto-inventory",
        title: "Open inventory",
        description: "Manage stock and product movements",
        keywords: "inventory stock products",
        run: () => router.push("/inventory"),
      },
      {
        id: "goto-reports",
        title: "Open reports",
        description: "View reporting and exports",
        keywords: "reports analytics export",
        run: () => router.push("/reports"),
      },
      {
        id: "goto-billing",
        title: "Open billing",
        description: "Manage plans and payment methods",
        keywords: "billing plans payment",
        run: () => router.push("/billing"),
      },
      {
        id: "goto-settings",
        title: "Open settings",
        description: "Profile, security, team, and preferences",
        keywords: "settings profile security team",
        run: () => router.push("/setting"),
      },
      {
        id: "goto-account",
        title: "Open account",
        description: "Manage account and session details",
        keywords: "account identity session",
        run: () => router.push("/account"),
      },
      {
        id: "theme-light",
        title: "Switch to light theme",
        description: "Set application appearance to light",
        keywords: "theme light appearance",
        shortcut: "L",
        run: () => setTheme("light"),
      },
      {
        id: "theme-dark",
        title: "Switch to dark theme",
        description: "Set application appearance to dark",
        keywords: "theme dark appearance",
        shortcut: "D",
        run: () => setTheme("dark"),
      },
      {
        id: "theme-system",
        title: "Use system theme",
        description: "Follow system dark/light setting",
        keywords: "theme system appearance",
        shortcut: "S",
        run: () => setTheme("system"),
      },
      {
        id: "open-shortcuts",
        title: "Show keyboard shortcuts",
        description: "Open universal shortcut reference",
        keywords: "shortcut help keyboard",
        run: () => setShowShortcuts(true),
      },
    ],
    [router, setTheme],
  );

  const filteredActions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return actions;
    return actions.filter((action) => {
      const haystack = `${action.title} ${action.description} ${action.keywords}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [actions, query]);

  const runAction = (action: CommandAction) => {
    action.run();
    closePalette();
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const metaOrCtrl = event.metaKey || event.ctrlKey;

      if (metaOrCtrl && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette(false);
        return;
      }

      if (metaOrCtrl && event.key === "/") {
        event.preventDefault();
        openPalette(true);
        return;
      }

      if (!isOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closePalette();
        return;
      }

      if (showShortcuts) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((current) => Math.min(current + 1, Math.max(0, filteredActions.length - 1)));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((current) => Math.max(0, current - 1));
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const action = filteredActions[selectedIndex];
        if (action) {
          runAction(action);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filteredActions, isOpen, selectedIndex, showShortcuts]);

  useEffect(() => {
    if (!isOpen || showShortcuts) return;
    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [isOpen, showShortcuts]);

  const themeBadge = resolvedTheme === "dark" ? "Dark" : resolvedTheme === "light" ? "Light" : "System";

  return (
    <>
      <button
        type="button"
        onClick={() => openPalette(false)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-lg"
        aria-label="Open command palette"
      >
        <Keyboard className="h-4 w-4" />
        {t("dashboard.sections.quickActions", "Quick actions")}
        <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px]">Cmd/Ctrl+K</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16" role="dialog" aria-modal="true" aria-label="Global command palette">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/70 p-3">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <Search className="h-4 w-4" />
                Command Palette
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <span>Theme: {themeBadge}</span>
                <button
                  type="button"
                  onClick={closePalette}
                  className="rounded border border-border bg-background px-2 py-1 text-xs font-medium text-foreground"
                >
                  Esc
                </button>
              </div>
            </div>

            {!showShortcuts ? (
              <>
                <div className="border-b border-border/70 p-3">
                  <label htmlFor="global-command-input" className="sr-only">
                    Search commands
                  </label>
                  <input
                    id="global-command-input"
                    ref={inputRef}
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setSelectedIndex(0);
                    }}
                    placeholder="Search commands, pages, and actions..."
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                  />
                </div>

                <ul className="max-h-88 overflow-y-auto p-2">
                  {filteredActions.length === 0 ? (
                    <li className="rounded-lg border border-border/70 bg-background px-3 py-3 text-sm text-muted-foreground">
                      No commands match your search.
                    </li>
                  ) : (
                    filteredActions.map((action, index) => {
                      const selected = index === selectedIndex;
                      return (
                        <li key={action.id}>
                          <button
                            type="button"
                            onClick={() => runAction(action)}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-colors ${
                              selected ? "bg-primary/10" : "hover:bg-muted/40"
                            }`}
                          >
                            <span>
                              <span className="block text-sm font-semibold text-foreground">{action.title}</span>
                              <span className="block text-xs text-muted-foreground">{action.description}</span>
                            </span>
                            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                              {action.shortcut && (
                                <span className="rounded border border-border bg-background px-1.5 py-0.5">{action.shortcut}</span>
                              )}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </>
            ) : (
              <div className="p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Keyboard shortcuts</h2>
                  <button
                    type="button"
                    onClick={() => setShowShortcuts(false)}
                    className="rounded border border-border bg-background px-2 py-1 text-xs font-medium text-foreground"
                  >
                    Back to commands
                  </button>
                </div>
                <ul className="space-y-2">
                  {KEYBOARD_SHORTCUTS.map((shortcut) => (
                    <li key={shortcut.keys} className="flex items-center justify-between rounded-lg border border-border/70 bg-background p-2">
                      <span className="text-sm text-foreground">{shortcut.description}</span>
                      <span className="rounded border border-border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                        {shortcut.keys}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border/70 px-3 py-2 text-xs text-muted-foreground">
              <span>Tip: press Cmd/Ctrl + / for shortcut help</span>
              <span className="inline-flex items-center gap-2">
                <Sun className="h-3.5 w-3.5" />
                <Moon className="h-3.5 w-3.5" />
                <Monitor className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
