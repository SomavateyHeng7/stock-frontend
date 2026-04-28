"use client";

import { useState } from "react";
import { AlertTriangle, Clock, Search, Shield, User, UserCog } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { RoleBadge, UserStatusBadge } from "./badges";
import { USERS } from "./data";

export function UsersSection() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = USERS.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">{USERS.length} users across all tenants</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          <User className="h-4 w-4" />
          Invite User
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border/70 bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          {["all", "owner", "admin", "member", "viewer"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${roleFilter === r ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-background text-muted-foreground hover:text-foreground"}`}
            >
              {r === "all" ? "All Roles" : r}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30">
                {["User", "Tenant", "Role", "Last Active", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{u.tenant}</td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {u.lastActive}
                    </span>
                  </td>
                  <td className="px-4 py-3"><UserStatusBadge status={u.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Impersonate"
                        onClick={() => showToast({ title: `Impersonating ${u.name}`, description: "Session started as this user.", severity: "warning", persistToCenter: false })}
                        className="rounded-lg p-1.5 hover:bg-muted/40"
                      >
                        <UserCog className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        type="button"
                        title="Reset password"
                        onClick={() => showToast({ title: "Password reset sent", description: `Reset email dispatched to ${u.email}.`, severity: "success", persistToCenter: false })}
                        className="rounded-lg p-1.5 hover:bg-muted/40"
                      >
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        type="button"
                        title="Suspend user"
                        onClick={() => showToast({ title: `${u.name} suspended`, severity: "warning", persistToCenter: false })}
                        className="rounded-lg p-1.5 hover:bg-muted/40"
                      >
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
