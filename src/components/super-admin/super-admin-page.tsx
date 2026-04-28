"use client";

import { useState } from "react";
import {
  Activity,
  BadgeCheck,
  Bell,
  Building2,
  ChevronDown,
  DollarSign,
  FileText,
  Flag,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  ShieldAlert,
  Users,
  Wrench,
} from "lucide-react";
import type { Section } from "./types";
import { OverviewSection } from "./overview-section";
import { TenantsSection } from "./tenants-section";
import { UsersSection } from "./users-section";
import { BillingSection } from "./billing-section";
import { SystemSection } from "./system-section";
import { FlagsSection } from "./flags-section";
import { AuditSection } from "./audit-section";
import { MaintenanceSection } from "./maintenance-section";

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tenants", label: "Tenants", icon: Building2, badge: "8" },
  { id: "users", label: "Users", icon: Users, badge: "130" },
  { id: "billing", label: "Billing & Revenue", icon: DollarSign },
  { id: "system", label: "System Health", icon: Activity, badge: "!" },
  { id: "flags", label: "Feature Flags", icon: Flag },
  { id: "audit", label: "Audit Log", icon: FileText },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
];

export function SuperAdminPage() {
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
      case "maintenance": return <MaintenanceSection />;
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
