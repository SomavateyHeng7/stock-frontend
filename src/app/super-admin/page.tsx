"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Building2,
  ChevronDown,
  CircleDot,
  Clock,
  CreditCard,
  Database,
  DollarSign,
  ExternalLink,
  FileText,
  Flag,
  Globe,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Package,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Trash2,
  TrendingUp,
  User,
  UserCog,
  Users,
  Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section =
  | "overview"
  | "tenants"
  | "users"
  | "billing"
  | "system"
  | "flags"
  | "audit";

type TenantStatus = "active" | "trialing" | "suspended" | "cancelled";
type UserRole = "owner" | "admin" | "member" | "viewer";
type UserStatus = "active" | "inactive" | "suspended";
type ServiceStatus = "operational" | "degraded" | "outage";
type FlagScope = "global" | "per-tenant";

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const TENANTS = [
  { id: "t1", name: "Acme Corp", plan: "Enterprise", users: 48, storage: "12.4 GB", mrr: 599, status: "active" as TenantStatus, joined: "2024-01-15", location: "US" },
  { id: "t2", name: "Globe Traders", plan: "Pro", users: 12, storage: "3.1 GB", mrr: 99, status: "active" as TenantStatus, joined: "2024-03-02", location: "UK" },
  { id: "t3", name: "SunRise Retail", plan: "Pro", users: 7, storage: "1.8 GB", mrr: 99, status: "trialing" as TenantStatus, joined: "2025-04-10", location: "AU" },
  { id: "t4", name: "NovaTech Ltd", plan: "Starter", users: 3, storage: "0.4 GB", mrr: 29, status: "active" as TenantStatus, joined: "2024-09-19", location: "SG" },
  { id: "t5", name: "Harbor Foods", plan: "Enterprise", users: 31, storage: "9.7 GB", mrr: 599, status: "active" as TenantStatus, joined: "2023-11-08", location: "US" },
  { id: "t6", name: "Crestline MFG", plan: "Pro", users: 9, storage: "2.2 GB", mrr: 99, status: "suspended" as TenantStatus, joined: "2024-06-22", location: "CA" },
  { id: "t7", name: "Delta Imports", plan: "Starter", users: 2, storage: "0.2 GB", mrr: 29, status: "cancelled" as TenantStatus, joined: "2024-02-14", location: "MY" },
  { id: "t8", name: "PeakView Co", plan: "Pro", users: 18, storage: "4.5 GB", mrr: 99, status: "active" as TenantStatus, joined: "2025-01-30", location: "DE" },
];

const USERS = [
  { id: "u1", name: "Sarah Chen", email: "sarah@acmecorp.com", tenant: "Acme Corp", role: "owner" as UserRole, lastActive: "2 min ago", status: "active" as UserStatus },
  { id: "u2", name: "James Whitfield", email: "james@globetraders.co.uk", tenant: "Globe Traders", role: "admin" as UserRole, lastActive: "1 hr ago", status: "active" as UserStatus },
  { id: "u3", name: "Priya Nair", email: "priya@sunrise.com.au", tenant: "SunRise Retail", role: "owner" as UserRole, lastActive: "3 days ago", status: "active" as UserStatus },
  { id: "u4", name: "Marcus Lee", email: "marcus@novatech.sg", tenant: "NovaTech Ltd", role: "member" as UserRole, lastActive: "5 hr ago", status: "active" as UserStatus },
  { id: "u5", name: "Elena Vasquez", email: "elena@harborfoods.com", tenant: "Harbor Foods", role: "admin" as UserRole, lastActive: "30 min ago", status: "active" as UserStatus },
  { id: "u6", name: "Tom Briggs", email: "tom@crestline.ca", tenant: "Crestline MFG", role: "owner" as UserRole, lastActive: "12 days ago", status: "suspended" as UserStatus },
  { id: "u7", name: "Aisha Kamara", email: "aisha@peakview.de", tenant: "PeakView Co", role: "viewer" as UserRole, lastActive: "1 day ago", status: "inactive" as UserStatus },
  { id: "u8", name: "Leo Tan", email: "leo@deltaimports.my", tenant: "Delta Imports", role: "owner" as UserRole, lastActive: "45 days ago", status: "suspended" as UserStatus },
];

const TRANSACTIONS = [
  { id: "inv_001", tenant: "Acme Corp", amount: 599, plan: "Enterprise", date: "2026-04-01", status: "paid" },
  { id: "inv_002", tenant: "Harbor Foods", amount: 599, plan: "Enterprise", date: "2026-04-01", status: "paid" },
  { id: "inv_003", tenant: "Globe Traders", amount: 99, plan: "Pro", date: "2026-04-03", status: "paid" },
  { id: "inv_004", tenant: "PeakView Co", amount: 99, plan: "Pro", date: "2026-04-05", status: "paid" },
  { id: "inv_005", tenant: "SunRise Retail", amount: 0, plan: "Pro (Trial)", date: "2026-04-10", status: "trial" },
  { id: "inv_006", tenant: "Crestline MFG", amount: 99, plan: "Pro", date: "2026-03-22", status: "failed" },
  { id: "inv_007", tenant: "NovaTech Ltd", amount: 29, plan: "Starter", date: "2026-04-19", status: "paid" },
];

const SERVICES = [
  { name: "API Gateway", status: "operational" as ServiceStatus, latency: "42 ms", uptime: "99.98%" },
  { name: "Database (Primary)", status: "operational" as ServiceStatus, latency: "8 ms", uptime: "99.99%" },
  { name: "Database (Replica)", status: "operational" as ServiceStatus, latency: "11 ms", uptime: "99.97%" },
  { name: "Job Queue", status: "degraded" as ServiceStatus, latency: "340 ms", uptime: "98.12%" },
  { name: "Cache (Redis)", status: "operational" as ServiceStatus, latency: "2 ms", uptime: "100%" },
  { name: "File Storage", status: "operational" as ServiceStatus, latency: "95 ms", uptime: "99.95%" },
  { name: "Email Service", status: "operational" as ServiceStatus, latency: "210 ms", uptime: "99.91%" },
  { name: "Webhook Delivery", status: "degraded" as ServiceStatus, latency: "620 ms", uptime: "97.40%" },
];

const FLAGS = [
  { id: "f1", name: "ai_forecast_beta", label: "AI Forecast (Beta)", description: "Enable AI-driven demand forecasting for eligible tenants.", enabled: true, scope: "per-tenant" as FlagScope, tenants: 3 },
  { id: "f2", name: "multi_warehouse", label: "Multi-Warehouse", description: "Allow tenants to manage multiple warehouse locations.", enabled: true, scope: "global" as FlagScope, tenants: null },
  { id: "f3", name: "csv_bulk_import", label: "CSV Bulk Import", description: "Upload CSV files to bulk-update inventory.", enabled: true, scope: "global" as FlagScope, tenants: null },
  { id: "f4", name: "barcode_scanner", label: "Barcode Scanner", description: "Mobile barcode scanning in the inventory workflow.", enabled: false, scope: "per-tenant" as FlagScope, tenants: 0 },
  { id: "f5", name: "supplier_portal", label: "Supplier Self-Service Portal", description: "External portal for suppliers to update lead times and pricing.", enabled: false, scope: "global" as FlagScope, tenants: null },
  { id: "f6", name: "audit_export", label: "Audit Log Export", description: "Allow tenants to export their full audit trail as CSV/JSON.", enabled: true, scope: "global" as FlagScope, tenants: null },
  { id: "f7", name: "two_fa_enforcement", label: "Enforce 2FA", description: "Force all tenant users to enable two-factor authentication.", enabled: false, scope: "global" as FlagScope, tenants: null },
];

const AUDIT_LOGS = [
  { id: "a1", actor: "super@smartstock.io", action: "Suspended tenant", target: "Crestline MFG", time: "2026-04-19 14:32", ip: "103.21.44.1" },
  { id: "a2", actor: "super@smartstock.io", action: "Enabled feature flag", target: "ai_forecast_beta → Acme Corp", time: "2026-04-18 09:15", ip: "103.21.44.1" },
  { id: "a3", actor: "super@smartstock.io", action: "Updated plan", target: "Globe Traders → Pro", time: "2026-04-17 16:44", ip: "103.21.44.1" },
  { id: "a4", actor: "super@smartstock.io", action: "Reset user password", target: "tom@crestline.ca", time: "2026-04-16 11:02", ip: "103.21.44.1" },
  { id: "a5", actor: "super@smartstock.io", action: "Deleted tenant", target: "Delta Imports", time: "2026-04-15 08:50", ip: "103.21.44.1" },
  { id: "a6", actor: "super@smartstock.io", action: "Toggled feature flag OFF", target: "barcode_scanner (global)", time: "2026-04-14 17:21", ip: "103.21.44.1" },
  { id: "a7", actor: "super@smartstock.io", action: "Impersonated user", target: "sarah@acmecorp.com", time: "2026-04-13 13:00", ip: "103.21.44.1" },
  { id: "a8", actor: "super@smartstock.io", action: "Sent broadcast", target: "All Pro tenants", time: "2026-04-12 10:30", ip: "103.21.44.1" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TenantBadge({ status }: { status: TenantStatus }) {
  const styles: Record<TenantStatus, string> = {
    active: "bg-green-500/10 text-green-600 border-green-500/30",
    trialing: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    suspended: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    cancelled: "bg-red-500/10 text-red-600 border-red-500/30",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

function UserStatusBadge({ status }: { status: UserStatus }) {
  const styles: Record<UserStatus, string> = {
    active: "bg-green-500/10 text-green-600 border-green-500/30",
    inactive: "bg-muted text-muted-foreground border-border/60",
    suspended: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const styles: Record<UserRole, string> = {
    owner: "bg-primary/10 text-primary border-primary/30",
    admin: "bg-purple-500/10 text-purple-600 border-purple-500/30",
    member: "bg-muted text-muted-foreground border-border/60",
    viewer: "bg-muted text-muted-foreground border-border/50",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${styles[role]}`}>
      {role}
    </span>
  );
}

function ServiceBadge({ status }: { status: ServiceStatus }) {
  const map: Record<ServiceStatus, { label: string; cls: string }> = {
    operational: { label: "Operational", cls: "text-green-600" },
    degraded: { label: "Degraded", cls: "text-yellow-600" },
    outage: { label: "Outage", cls: "text-red-600" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`flex items-center gap-1.5 text-sm font-medium ${cls}`}>
      <CircleDot className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function TransactionBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "bg-green-500/10 text-green-600 border-green-500/30",
    trial: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    failed: "bg-red-500/10 text-red-600 border-red-500/30",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  trendUp,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trendUp ? "text-green-600" : "text-red-500"}`}>
            {trendUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-muted-foreground">{label}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground/70">{sub}</p>}
    </div>
  );
}

// ─── Section: Overview ────────────────────────────────────────────────────────

function OverviewSection() {
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

// ─── Section: Tenants ─────────────────────────────────────────────────────────

const TENANT_ACTION_TOAST: Record<string, { title: (name: string) => string; severity: "info" | "success" | "warning" | "critical" | "error" }> = {
  "View Details": { title: (n) => `Viewing ${n}`, severity: "info" },
  "Impersonate": { title: (n) => `Impersonating ${n} — session started`, severity: "warning" },
  "Manage Plan": { title: (n) => `Managing plan for ${n}`, severity: "info" },
  "Suspend": { title: (n) => `${n} suspended`, severity: "warning" },
  "Delete Tenant": { title: (n) => `${n} deleted`, severity: "critical" },
};

function TenantsSection() {
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

// ─── Section: Users ───────────────────────────────────────────────────────────

function UsersSection() {
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

// ─── Section: Billing & Revenue ───────────────────────────────────────────────

function BillingSection() {
  const { showToast } = useToast();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Billing & Revenue</h2>
        <p className="text-sm text-muted-foreground">Platform-wide revenue overview and transaction history</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="MRR" value="$1,653" trend="+8.2%" trendUp sub="Apr 2026" />
        <StatCard icon={TrendingUp} label="ARR Run-rate" value="$19,836" trend="+8.2%" trendUp />
        <StatCard icon={CreditCard} label="Avg Revenue / Tenant" value="$207" sub="per active tenant" />
        <StatCard icon={ArrowDownRight} label="Churn Rate" value="1.2%" sub="net revenue churn" />
      </div>

      {/* Transactions */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
          <button
            type="button"
            onClick={() => showToast({ title: "CSV exported", description: "Transaction history download starting.", severity: "success", persistToCenter: false })}
            className="text-xs font-medium text-primary hover:underline"
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30">
                {["Invoice", "Tenant", "Plan", "Amount", "Date", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{tx.tenant}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{tx.plan}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">
                    {tx.amount === 0 ? <span className="text-muted-foreground">—</span> : `$${tx.amount}`}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{tx.date}</td>
                  <td className="px-4 py-3"><TransactionBadge status={tx.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment failure alert */}
      <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-medium text-foreground">1 payment failure requires action</p>
          <p className="text-xs text-muted-foreground">Crestline MFG — invoice #inv_006 failed on Mar 22. Tenant has been notified.</p>
        </div>
        <button
          type="button"
          onClick={() => showToast({ title: "Payment retry queued", description: "Retrying invoice #inv_006 for Crestline MFG.", severity: "info", persistToCenter: false })}
          className="ml-auto shrink-0 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

// ─── Section: System Health ───────────────────────────────────────────────────

function SystemSection() {
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

// ─── Section: Feature Flags ───────────────────────────────────────────────────

function FlagsSection() {
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

// ─── Section: Audit Log ───────────────────────────────────────────────────────

function AuditSection() {
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

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tenants", label: "Tenants", icon: Building2, badge: "8" },
  { id: "users", label: "Users", icon: Users, badge: "130" },
  { id: "billing", label: "Billing & Revenue", icon: DollarSign },
  { id: "system", label: "System Health", icon: Activity, badge: "!" },
  { id: "flags", label: "Feature Flags", icon: Flag },
  { id: "audit", label: "Audit Log", icon: FileText },
];

// ─── Root Page ─────────────────────────────────────────────────────────────────

export default function SuperAdminPage() {
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const activeNav = NAV_ITEMS.find((n) => n.id === activeSection)!;

  const renderSection = () => {
    switch (activeSection) {
      case "overview": return <OverviewSection />;
      case "tenants": return <TenantsSection />;
      case "users": return <UsersSection />;
      case "billing": return <BillingSection />;
      case "system": return <SystemSection />;
      case "flags": return <FlagsSection />;
      case "audit": return <AuditSection />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border/70 bg-card lg:flex">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 border-b border-border/70 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Super Admin</p>
            <p className="text-[10px] text-muted-foreground">SmartStock Platform</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              const isAlert = item.badge === "!";
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-primary/10 font-semibold text-primary"
                        : "font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isAlert ? "bg-yellow-500/10 text-yellow-600" : "bg-muted text-muted-foreground"}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border/70 p-3">
          <div className="mb-1 flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              SA
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">super@smartstock.io</p>
              <p className="text-[10px] text-muted-foreground">Super Administrator</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button type="button" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/70 px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/40 hover:text-foreground">
              <Settings className="h-3.5 w-3.5" />
              Settings
            </button>
            <button type="button" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/70 px-2 py-1.5 text-xs text-red-500 hover:bg-red-500/10">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border/70 bg-card px-4 sm:px-6">
          {/* Mobile nav toggle */}
          <button
            type="button"
            onClick={() => setMobileNavOpen((o) => !o)}
            className="rounded-lg border border-border/70 p-2 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${mobileNavOpen ? "rotate-180" : ""}`} />
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <activeNav.icon className="h-4 w-4 text-muted-foreground" />
              <h1 className="text-base font-semibold text-foreground">{activeNav.label}</h1>
            </div>
            <p className="text-xs text-muted-foreground">SmartStock Super Admin — read carefully before making changes</p>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" className="relative rounded-full border border-border/70 p-2 text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>
            <div className="hidden items-center gap-2 rounded-lg border border-border/70 px-3 py-1.5 sm:flex">
              <BadgeCheck className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-foreground">Super Admin</span>
            </div>
          </div>
        </header>

        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <div className="border-b border-border/70 bg-card px-4 py-2 lg:hidden">
            <ul className="grid grid-cols-2 gap-1 sm:grid-cols-4">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => { setActiveSection(item.id); setMobileNavOpen(false); }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${activeSection === item.id ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted/40"}`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            {/* Security notice */}
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 text-yellow-500" />
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                <span className="font-semibold">Privileged access.</span> All actions in this console are logged and audited. Proceed with caution.
              </p>
            </div>

            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
