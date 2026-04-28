"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Building2,
  CreditCard,
  ExternalLink,
  MoreHorizontal,
  Search,
  Trash2,
  UserCog,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { TenantBadge } from "./badges";
import { TENANTS } from "./data";

const TENANT_ACTION_TOAST: Record<string, { title: (name: string) => string; severity: "info" | "success" | "warning" | "critical" | "error" }> = {
  "View Details": { title: (n) => `Viewing ${n}`, severity: "info" },
  "Impersonate": { title: (n) => `Impersonating ${n} — session started`, severity: "warning" },
  "Manage Plan": { title: (n) => `Managing plan for ${n}`, severity: "info" },
  "Suspend": { title: (n) => `${n} suspended`, severity: "warning" },
  "Delete Tenant": { title: (n) => `${n} deleted`, severity: "critical" },
};

export function TenantsSection() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const filtered = TENANTS.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === "all" || t.plan === planFilter;
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  const toggleSelect = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const allSelected = filtered.length > 0 && filtered.every((t) => selected.includes(t.id));
  const toggleAll = () => setSelected(allSelected ? [] : filtered.map((t) => t.id));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Tenant Management</h2>
          <p className="text-sm text-muted-foreground">{TENANTS.length} organisations in the system</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          <Building2 className="h-4 w-4" />
          Add Tenant
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tenants…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border/70 bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          {["all", "Enterprise", "Pro", "Starter"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlanFilter(p)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${planFilter === p ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-background text-muted-foreground hover:text-foreground"}`}
            >
              {p === "all" ? "All Plans" : p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {["all", "active", "trialing", "suspended"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${statusFilter === s ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-background text-muted-foreground hover:text-foreground"}`}
            >
              {s === "all" ? "All Status" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-2.5">
          <span className="text-sm font-medium text-foreground">{selected.length} selected</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => showToast({ title: `Exported ${selected.length} tenant${selected.length !== 1 ? "s" : ""}`, severity: "success", persistToCenter: false })}
              className="rounded-lg border border-border/70 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40"
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => { showToast({ title: `${selected.length} tenant${selected.length !== 1 ? "s" : ""} suspended`, severity: "warning", persistToCenter: false }); setSelected([]); }}
              className="rounded-lg border border-yellow-500/30 px-3 py-1.5 text-xs font-medium text-yellow-600 hover:bg-yellow-500/10"
            >
              Suspend All
            </button>
            <button
              type="button"
              onClick={() => { showToast({ title: `${selected.length} tenant${selected.length !== 1 ? "s" : ""} deleted`, severity: "critical", persistToCenter: false }); setSelected([]); }}
              className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10"
            >
              Delete All
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30">
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-border accent-primary" />
                </th>
                {["Tenant", "Plan", "Users", "Storage", "MRR", "Status", "Joined", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((t) => (
                <tr key={t.id} className={`hover:bg-muted/20 ${selected.includes(t.id) ? "bg-primary/5" : ""}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(t.id)}
                      onChange={() => toggleSelect(t.id)}
                      className="rounded border-border accent-primary"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-muted/50 px-2 py-0.5 text-xs font-medium text-foreground">{t.plan}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{t.users}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{t.storage}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">${t.mrr}</td>
                  <td className="px-4 py-3"><TenantBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.joined}</td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActionMenuOpen(actionMenuOpen === t.id ? null : t.id)}
                        className="rounded-lg p-1.5 hover:bg-muted/40"
                      >
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                      {actionMenuOpen === t.id && (
                        <div className="absolute right-0 top-8 z-10 w-44 rounded-xl border border-border/70 bg-card p-1 shadow-lg">
                          {[
                            { icon: ExternalLink, label: "View Details", cls: "text-foreground" },
                            { icon: UserCog, label: "Impersonate", cls: "text-foreground" },
                            { icon: CreditCard, label: "Manage Plan", cls: "text-foreground" },
                            { icon: AlertTriangle, label: "Suspend", cls: "text-yellow-600" },
                            { icon: Trash2, label: "Delete Tenant", cls: "text-red-500" },
                          ].map((action) => (
                            <button
                              key={action.label}
                              type="button"
                              onClick={() => {
                                setActionMenuOpen(null);
                                const cfg = TENANT_ACTION_TOAST[action.label];
                                if (cfg) showToast({ title: cfg.title(t.name), severity: cfg.severity, persistToCenter: false });
                              }}
                              className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm ${action.cls} hover:bg-muted/40`}
                            >
                              <action.icon className="h-3.5 w-3.5" />
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">No tenants match your filters.</div>
        )}
      </div>
    </div>
  );
}
