"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  MessageSquare,
  Plus,
  Power,
  Shield,
  ShieldAlert,
  Timer,
  ToggleLeft,
  ToggleRight,
  Wrench,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { TenantBadge } from "./badges";
import { TENANTS, MAINTENANCE_HISTORY } from "./data";

export function MaintenanceSection() {
  const { showToast } = useToast();

  const [active, setActive]                         = useState(false);
  const [activeSince]                               = useState("14:23");
  const [confirming, setConfirming]                 = useState(false);
  const [previewOpen, setPreviewOpen]               = useState(false);

  const [mainTitle, setMainTitle]                   = useState("SmartStock is under scheduled maintenance");
  const [mainMessage, setMainMessage]               = useState(
    "We're performing scheduled maintenance to improve platform reliability and performance. We'll be back shortly.\n\nThank you for your patience."
  );
  const [estimatedHours, setEstimatedHours]         = useState("2");
  const [showCountdown, setShowCountdown]           = useState(true);

  const [scheduledStart, setScheduledStart]         = useState("");
  const [scheduledEnd, setScheduledEnd]             = useState("");
  const [notifyTenants, setNotifyTenants]           = useState(true);
  const [notifyHoursBefore, setNotifyHoursBefore]   = useState("24");

  const [scope, setScope]                           = useState<"all" | "plans" | "tenants">("all");
  const [scopePlans, setScopePlans]                 = useState<string[]>([]);
  const [scopeTenants, setScopeTenants]             = useState<string[]>([]);

  const [bypassIps, setBypassIps]                   = useState<string[]>(["103.21.44.1"]);
  const [bypassUsers, setBypassUsers]               = useState<string[]>(["super@smartstock.io"]);
  const [newIp, setNewIp]                           = useState("");
  const [newUser, setNewUser]                       = useState("");

  const affectedCount = scope === "all"
    ? TENANTS.filter((t) => t.status === "active" || t.status === "trialing").length
    : scope === "plans"
    ? TENANTS.filter((t) => scopePlans.includes(t.plan)).length
    : scopeTenants.length;

  const togglePlan = (plan: string) =>
    setScopePlans((p) => (p.includes(plan) ? p.filter((x) => x !== plan) : [...p, plan]));
  const toggleScopeTenant = (id: string) =>
    setScopeTenants((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  const addIp = () => {
    const ip = newIp.trim();
    if (ip && !bypassIps.includes(ip)) { setBypassIps((prev) => [...prev, ip]); setNewIp(""); }
  };
  const addUser = () => {
    const u = newUser.trim();
    if (u && !bypassUsers.includes(u)) { setBypassUsers((prev) => [...prev, u]); setNewUser(""); }
  };

  const activate = () => {
    setActive(true);
    setConfirming(false);
    showToast({ title: "Maintenance mode activated", description: `${affectedCount} tenant(s) are now seeing the maintenance page.`, severity: "warning" });
  };

  const deactivate = () => {
    setActive(false);
    showToast({ title: "Maintenance mode deactivated", description: "Platform is back online for all affected tenants.", severity: "success" });
  };

  const saveConfig = () => {
    showToast({ title: "Configuration saved", description: "Maintenance settings updated. Changes take effect on next activation.", severity: "success", persistToCenter: false });
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Maintenance Mode</h2>
          <p className="text-sm text-muted-foreground">
            Take the platform offline for planned maintenance windows. Configure messaging, scope, and bypass access.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPreviewOpen((o) => !o)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border/70 bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
        >
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          {previewOpen ? "Hide Preview" : "User Preview"}
        </button>
      </div>

      {/* ── User-facing preview ────────────────────────────────────────── */}
      {previewOpen && (
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">What users will see</p>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-2.5">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
              </div>
              <div className="flex-1 rounded-md border border-border/50 bg-background px-3 py-1 text-center text-xs text-muted-foreground">
                app.smartstock.io
              </div>
            </div>
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/10">
                <Wrench className="h-7 w-7 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{mainTitle || "Under maintenance"}</h3>
              <p className="mt-3 max-w-md whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                {mainMessage}
              </p>
              {showCountdown && estimatedHours && (
                <div className="mt-5 flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Estimated duration: <span className="font-semibold text-foreground">{estimatedHours}h</span>
                  </span>
                </div>
              )}
              <p className="mt-6 text-xs text-muted-foreground/60">Status updates at status.smartstock.io</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Status card ────────────────────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 shadow-sm transition-colors ${
        active ? "border-red-500/40 bg-red-500/5" : "border-border/70 bg-card"
      }`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${active ? "bg-red-500/10" : "bg-muted/50"}`}>
              <Power className={`h-5 w-5 ${active ? "text-red-500" : "text-muted-foreground"}`} />
              {active && (
                <span className="absolute -right-1 -top-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {active ? "MAINTENANCE MODE IS ACTIVE" : "Maintenance Mode Is Off"}
                </p>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  active ? "border-red-500/40 bg-red-500/10 text-red-600" : "border-green-500/30 bg-green-500/10 text-green-600"
                }`}>
                  {active ? "Live" : "Inactive"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {active
                  ? `Active since ${activeSince} · Est. duration ${estimatedHours}h · ${affectedCount} tenant(s) affected`
                  : "Platform is fully operational. Activate only for planned windows."}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {active ? (
              <button
                type="button"
                onClick={deactivate}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <CheckCircle2 className="h-4 w-4" />
                Deactivate
              </button>
            ) : confirming ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">{affectedCount} tenant(s) affected</span>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-lg border border-border/70 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={activate}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <Power className="h-3.5 w-3.5" />
                  Confirm Activation
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/5 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-500/10"
              >
                <Wrench className="h-4 w-4" />
                Activate Maintenance
              </button>
            )}
          </div>
        </div>

        {confirming && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-xs text-red-700 dark:text-red-400">
              <span className="font-semibold">Warning:</span> Activating maintenance mode will immediately show the maintenance page to{" "}
              <span className="font-semibold">{affectedCount} tenant(s)</span>. Users without bypass access will be locked out until you deactivate.
            </p>
          </div>
        )}
      </div>

      {/* ── Config + Schedule grid ─────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Message configuration */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Maintenance Message</h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Page title</label>
            <input
              type="text"
              value={mainTitle}
              onChange={(e) => setMainTitle(e.target.value)}
              className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">User-facing message</label>
            <textarea
              rows={4}
              value={mainMessage}
              onChange={(e) => setMainMessage(e.target.value)}
              className="w-full resize-none rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Est. duration (hours)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Show countdown</label>
              <button
                type="button"
                onClick={() => setShowCountdown((v) => !v)}
                className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  showCountdown
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/70 bg-background text-muted-foreground"
                }`}
              >
                {showCountdown ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                {showCountdown ? "Visible" : "Hidden"}
              </button>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Scheduled Window</h3>
            <span className="ml-auto rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Optional
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Start (local time)</label>
            <input
              type="datetime-local"
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
              className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">End (local time)</label>
            <input
              type="datetime-local"
              value={scheduledEnd}
              onChange={(e) => setScheduledEnd(e.target.value)}
              className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {scheduledStart && (
            <div className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/5 px-3 py-2.5">
              <Clock className="h-4 w-4 shrink-0 text-blue-500" />
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Maintenance will auto-activate at the scheduled start time.
              </p>
            </div>
          )}

          <div className="border-t border-border/50 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">Notify tenants in advance</p>
                <p className="text-[11px] text-muted-foreground">Email sent to tenant owners</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyTenants((v) => !v)}
                className={`transition-colors ${notifyTenants ? "text-green-600 hover:text-green-700" : "text-muted-foreground hover:text-foreground"}`}
              >
                {notifyTenants ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
              </button>
            </div>
            {notifyTenants && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Notify how many hours before?</label>
                <select
                  value={notifyHoursBefore}
                  onChange={(e) => setNotifyHoursBefore(e.target.value)}
                  className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {["1", "2", "4", "6", "12", "24", "48"].map((h) => (
                    <option key={h} value={h}>{h} hour{h !== "1" ? "s" : ""} before</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Scope + Bypass grid ────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scope */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Affected Scope</h3>
          </div>

          <div className="space-y-2">
            {([
              { value: "all", label: "All tenants", sub: `${TENANTS.filter((t) => t.status === "active" || t.status === "trialing").length} active/trialing tenants` },
              { value: "plans", label: "Specific plans", sub: "Choose which subscription tiers to affect" },
              { value: "tenants", label: "Specific tenants", sub: "Cherry-pick individual organisations" },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setScope(opt.value)}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  scope === opt.value
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/70 bg-background hover:bg-muted/30"
                }`}
              >
                <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${scope === opt.value ? "border-primary" : "border-muted-foreground/40"}`}>
                  {scope === opt.value && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <p className={`text-sm font-medium ${scope === opt.value ? "text-primary" : "text-foreground"}`}>{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.sub}</p>
                </div>
              </button>
            ))}
          </div>

          {scope === "plans" && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-muted-foreground">Select plans</p>
              {["Starter", "Pro", "Enterprise"].map((plan) => (
                <label key={plan} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5 hover:bg-muted/20">
                  <input
                    type="checkbox"
                    checked={scopePlans.includes(plan)}
                    onChange={() => togglePlan(plan)}
                    className="rounded border-border accent-primary"
                  />
                  <span className="text-sm text-foreground">{plan}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {TENANTS.filter((t) => t.plan === plan).length} tenant(s)
                  </span>
                </label>
              ))}
              {scopePlans.length === 0 && (
                <p className="text-xs text-muted-foreground">Select at least one plan.</p>
              )}
            </div>
          )}

          {scope === "tenants" && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-muted-foreground">Select tenants</p>
              <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                {TENANTS.map((t) => (
                  <label key={t.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 px-3 py-2 hover:bg-muted/20">
                    <input
                      type="checkbox"
                      checked={scopeTenants.includes(t.id)}
                      onChange={() => toggleScopeTenant(t.id)}
                      className="rounded border-border accent-primary"
                    />
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                      {t.name[0]}
                    </div>
                    <span className="flex-1 text-sm text-foreground">{t.name}</span>
                    <TenantBadge status={t.status} />
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${affectedCount > 0 ? "bg-yellow-500/5 border border-yellow-500/20" : "bg-muted/30 border border-border/40"}`}>
            <Ban className={`h-3.5 w-3.5 shrink-0 ${affectedCount > 0 ? "text-yellow-600" : "text-muted-foreground"}`} />
            <p className={`text-xs font-medium ${affectedCount > 0 ? "text-yellow-700 dark:text-yellow-400" : "text-muted-foreground"}`}>
              {affectedCount > 0 ? `${affectedCount} tenant(s) will be locked out during maintenance` : "No tenants selected"}
            </p>
          </div>
        </div>

        {/* Bypass access */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Bypass Access</h3>
            <p className="ml-auto text-xs text-muted-foreground">These parties see the live app during maintenance</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Allowed IPs</p>
            <div className="flex flex-wrap gap-1.5">
              {bypassIps.map((ip) => (
                <span key={ip} className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-mono text-foreground">
                  {ip}
                  <button type="button" onClick={() => setBypassIps((prev) => prev.filter((x) => x !== ip))} className="ml-0.5 text-muted-foreground hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 192.168.1.1"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addIp()}
                className="flex-1 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={addIp}
                disabled={!newIp.trim()}
                className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40 disabled:opacity-40"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
          </div>

          <div className="border-t border-border/50" />

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Allowed users (email)</p>
            <div className="flex flex-wrap gap-1.5">
              {bypassUsers.map((u) => (
                <span key={u} className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1 text-xs text-foreground">
                  {u}
                  {u !== "super@smartstock.io" && (
                    <button type="button" onClick={() => setBypassUsers((prev) => prev.filter((x) => x !== u))} className="ml-0.5 text-muted-foreground hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="e.g. dev@company.com"
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addUser()}
                className="flex-1 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={addUser}
                disabled={!newUser.trim()}
                className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40 disabled:opacity-40"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Super admin sessions are always bypassed. IP bypass applies to all users from that IP. User bypass requires an active session.
            </p>
          </div>
        </div>
      </div>

      {/* ── Save row ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => showToast({ title: "Changes discarded", severity: "info", persistToCenter: false })}
          className="rounded-lg border border-border/70 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={saveConfig}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Save Configuration
        </button>
      </div>

      {/* ── History ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Maintenance History</h3>
          <button
            type="button"
            onClick={() => showToast({ title: "Log exported", severity: "success", persistToCenter: false })}
            className="text-xs font-medium text-primary hover:underline"
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30">
                {["Start", "End", "Duration", "Scope", "Reason", "Initiated by"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {MAINTENANCE_HISTORY.map((row) => (
                <tr key={row.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.start}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.end}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-xs font-medium text-foreground">
                      <Timer className="h-3 w-3" />
                      {row.duration}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.scope}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{row.reason}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">SA</div>
                      <span className="text-xs text-muted-foreground">{row.by}</span>
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
