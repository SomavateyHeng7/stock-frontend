"use client";

import { useState } from "react";
import { Flag, Globe, Sliders, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { FLAGS } from "./data";

export function FlagsSection() {
  const { showToast } = useToast();
  const [flags, setFlags] = useState(FLAGS);

  const toggle = (id: string) => {
    const flag = flags.find((f) => f.id === id);
    setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));
    if (flag) {
      showToast({
        title: `${flag.label} ${flag.enabled ? "disabled" : "enabled"}`,
        severity: flag.enabled ? "info" : "success",
        persistToCenter: false,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Feature Flags</h2>
          <p className="text-sm text-muted-foreground">Control feature rollouts across the platform</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          <Flag className="h-4 w-4" />
          New Flag
        </button>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card shadow-sm divide-y divide-border/40 overflow-hidden">
        {flags.map((flag) => (
          <div key={flag.id} className="flex items-start gap-4 p-4 hover:bg-muted/20">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">{flag.label}</p>
                <span className="font-mono text-xs text-muted-foreground">{flag.name}</span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${flag.scope === "global" ? "border-blue-500/30 bg-blue-500/10 text-blue-600" : "border-purple-500/30 bg-purple-500/10 text-purple-600"}`}>
                  <Globe className="mr-1 h-2.5 w-2.5" />
                  {flag.scope === "global" ? "Global" : `Per-tenant (${flag.tenants ?? 0})`}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{flag.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`text-xs font-medium ${flag.enabled ? "text-green-600" : "text-muted-foreground"}`}>
                {flag.enabled ? "On" : "Off"}
              </span>
              <button
                type="button"
                onClick={() => toggle(flag.id)}
                title="Toggle flag"
                className={`transition-colors ${flag.enabled ? "text-green-600 hover:text-green-700" : "text-muted-foreground hover:text-foreground"}`}
              >
                {flag.enabled ? (
                  <ToggleRight className="h-6 w-6" />
                ) : (
                  <ToggleLeft className="h-6 w-6" />
                )}
              </button>
              <button type="button" className="rounded-lg p-1.5 hover:bg-muted/40">
                <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
