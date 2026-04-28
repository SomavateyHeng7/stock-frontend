"use client";

import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  CreditCard,
  DollarSign,
  FileText,
  Flag,
  RefreshCw,
  Server,
  ShieldAlert,
  TrendingUp,
  UserCog,
  Users,
  Zap,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { StatCard } from "./stat-card";

export function OverviewSection() {
  const { showToast } = useToast();
  const recentActivity = [
    { icon: Building2, text: "SunRise Retail started a Pro trial", time: "10 min ago", color: "text-blue-500" },
    { icon: AlertTriangle, text: "Job Queue latency spiked to 340 ms", time: "25 min ago", color: "text-yellow-500" },
    { icon: CreditCard, text: "Invoice #inv_007 paid — NovaTech Ltd ($29)", time: "1 hr ago", color: "text-green-600" },
    { icon: ShieldAlert, text: "Failed login attempt — tom@crestline.ca (×4)", time: "2 hr ago", color: "text-red-500" },
    { icon: Flag, text: "ai_forecast_beta enabled for Acme Corp", time: "Yesterday", color: "text-purple-500" },
    { icon: UserCog, text: "Password reset sent to leo@deltaimports.my", time: "Yesterday", color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Building2} label="Total Tenants" value="8" trend="+2 mo" trendUp sub="6 active" />
        <StatCard icon={Users} label="Total Users" value="130" trend="+11 mo" trendUp sub="across all tenants" />
        <StatCard icon={DollarSign} label="MRR" value="$1,653" trend="+8.2%" trendUp sub="vs last month" />
        <StatCard icon={TrendingUp} label="ARR" value="$19,836" trend="+8.2%" trendUp />
        <StatCard icon={Activity} label="System Uptime" value="99.6%" sub="last 30 days" />
        <StatCard icon={Zap} label="API Calls Today" value="24,812" trend="+3.1%" trendUp />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Plan Distribution */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Plan Distribution</h3>
          <div className="space-y-3">
            {[
              { plan: "Enterprise", count: 2, color: "bg-primary", pct: 25 },
              { plan: "Pro", count: 4, color: "bg-blue-500", pct: 50 },
              { plan: "Starter", count: 2, color: "bg-muted-foreground", pct: 25 },
            ].map((p) => (
              <div key={p.plan}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-foreground">{p.plan}</span>
                  <span className="text-muted-foreground">{p.count} tenant{p.count !== 1 ? "s" : ""}</span>
                </div>
                <div className="h-2 rounded-full bg-muted/50">
                  <div className={`h-2 rounded-full ${p.color}`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-border/50 pt-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">MRR by Plan</h4>
            <div className="space-y-1.5">
              {[
                { plan: "Enterprise", mrr: "$1,198" },
                { plan: "Pro", mrr: "$396" },
                { plan: "Starter", mrr: "$58" },
              ].map((p) => (
                <div key={p.plan} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{p.plan}</span>
                  <span className="font-semibold text-foreground">{p.mrr}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Churn & Growth */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Growth & Retention</h3>
          <div className="space-y-4">
            {[
              { label: "New Tenants (30d)", value: "2", sub: "+33% vs prior period", color: "text-green-600" },
              { label: "Churned Tenants (30d)", value: "1", sub: "Delta Imports cancelled", color: "text-red-500" },
              { label: "Trials Active", value: "1", sub: "SunRise Retail — 10 days left", color: "text-blue-500" },
              { label: "Trial → Paid Conv.", value: "72%", sub: "last 90 days", color: "text-foreground" },
              { label: "Net Revenue Churn", value: "−1.2%", sub: "healthy range", color: "text-green-600" },
            ].map((row) => (
              <div key={row.label} className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.sub}</p>
                </div>
                <span className={`text-lg font-bold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Recent Activity</h3>
          <ul className="space-y-3">
            {recentActivity.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className={`mt-0.5 shrink-0 ${item.color}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{item.text}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { icon: Building2, label: "Add Tenant", title: "Add Tenant", description: "Tenant creation dialog coming soon.", severity: "info" as const },
            { icon: Bell, label: "Send Broadcast", title: "Broadcast queued", description: "Message sent to all active tenants.", severity: "success" as const },
            { icon: Flag, label: "Manage Flags", title: "Feature Flags", description: "Navigate to the Flags section.", severity: "info" as const },
            { icon: FileText, label: "Export Audit Log", title: "Audit log exported", description: "Download will begin shortly.", severity: "success" as const },
            { icon: RefreshCw, label: "Flush Cache", title: "Cache flushed", description: "Redis cache cleared successfully.", severity: "success" as const },
            { icon: Server, label: "View System Status", title: "System Health", description: "Navigate to the System Health section.", severity: "info" as const },
          ].map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => showToast({ title: a.title, description: a.description, severity: a.severity, persistToCenter: false })}
              className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
            >
              <a.icon className="h-4 w-4 text-muted-foreground" />
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
