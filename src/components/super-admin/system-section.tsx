"use client";

import { AlertTriangle, CircleDot, RefreshCw, Server } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { ServiceBadge } from "./badges";
import { SERVICES } from "./data";

export function SystemSection() {
  const { showToast } = useToast();
  const hasIssue = SERVICES.some((s) => s.status !== "operational");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">System Health</h2>
          <p className="text-sm text-muted-foreground">Real-time service status and infrastructure metrics</p>
        </div>
        <button
          type="button"
          onClick={() => showToast({ title: "Status refreshed", severity: "success", persistToCenter: false })}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Status banner */}
      <div className={`flex items-center gap-3 rounded-xl border p-4 ${hasIssue ? "border-yellow-500/30 bg-yellow-500/5" : "border-green-500/30 bg-green-500/5"}`}>
        <CircleDot className={`h-4 w-4 ${hasIssue ? "text-yellow-500" : "text-green-600"}`} />
        <p className={`text-sm font-medium ${hasIssue ? "text-yellow-600" : "text-green-600"}`}>
          {hasIssue ? "Some services are experiencing degraded performance." : "All systems operational."}
        </p>
      </div>

      {/* Services grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map((svc) => (
          <div key={svc.name} className={`rounded-xl border p-4 ${svc.status === "operational" ? "border-border/70 bg-card" : "border-yellow-500/30 bg-yellow-500/5"}`}>
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{svc.name}</p>
              <Server className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <ServiceBadge status={svc.status} />
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>Latency: <span className="font-medium text-foreground">{svc.latency}</span></span>
              <span>Up: <span className="font-medium text-foreground">{svc.uptime}</span></span>
            </div>
          </div>
        ))}
      </div>

      {/* Infrastructure Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Database</h3>
          {[
            { label: "Active Connections", value: "148 / 500" },
            { label: "Queries / sec", value: "2,340" },
            { label: "Replication Lag", value: "3 ms" },
            { label: "Disk Usage", value: "214 GB / 1 TB" },
          ].map((row) => (
            <div key={row.label} className="flex justify-between py-1.5 text-sm border-b border-border/40 last:border-0">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium text-foreground">{row.value}</span>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">API Gateway</h3>
          {[
            { label: "Req / min", value: "17,240" },
            { label: "Error Rate (5xx)", value: "0.04%" },
            { label: "p95 Latency", value: "142 ms" },
            { label: "Rate-limited Req", value: "12" },
          ].map((row) => (
            <div key={row.label} className="flex justify-between py-1.5 text-sm border-b border-border/40 last:border-0">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium text-foreground">{row.value}</span>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Job Queue</h3>
          <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-yellow-500/10 px-2 py-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-xs font-medium text-yellow-600">Elevated backlog</span>
          </div>
          {[
            { label: "Queued Jobs", value: "1,240" },
            { label: "Processing", value: "18" },
            { label: "Failed (24h)", value: "23" },
            { label: "Workers Active", value: "4 / 8" },
          ].map((row) => (
            <div key={row.label} className="flex justify-between py-1.5 text-sm border-b border-border/40 last:border-0">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium text-foreground">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
