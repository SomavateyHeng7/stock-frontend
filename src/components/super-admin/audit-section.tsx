"use client";

import { useState } from "react";
import { FileText, Search } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { AUDIT_LOGS } from "./data";

export function AuditSection() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const filtered = AUDIT_LOGS.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Audit Log</h2>
          <p className="text-sm text-muted-foreground">All super-admin actions are recorded here</p>
        </div>
        <button
          type="button"
          onClick={() => showToast({ title: "Audit log exported", description: "Download will begin shortly.", severity: "success", persistToCenter: false })}
          className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
        >
          <FileText className="h-4 w-4 text-muted-foreground" />
          Export Log
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search actions or targets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border/70 bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30">
                {["Actor", "Action", "Target", "Time", "IP"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        SA
                      </div>
                      <span className="text-xs text-muted-foreground">{log.actor}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{log.action}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{log.target}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{log.time}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">No matching log entries.</div>
        )}
      </div>
    </div>
  );
}
