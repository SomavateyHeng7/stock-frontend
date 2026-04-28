import type { TenantStatus, UserRole, UserStatus, ServiceStatus, FlagScope } from "./types";

export const TENANTS = [
  { id: "t1", name: "Acme Corp", plan: "Enterprise", users: 48, storage: "12.4 GB", mrr: 599, status: "active" as TenantStatus, joined: "2024-01-15", location: "US" },
  { id: "t2", name: "Globe Traders", plan: "Pro", users: 12, storage: "3.1 GB", mrr: 99, status: "active" as TenantStatus, joined: "2024-03-02", location: "UK" },
  { id: "t3", name: "SunRise Retail", plan: "Pro", users: 7, storage: "1.8 GB", mrr: 99, status: "trialing" as TenantStatus, joined: "2025-04-10", location: "AU" },
  { id: "t4", name: "NovaTech Ltd", plan: "Starter", users: 3, storage: "0.4 GB", mrr: 29, status: "active" as TenantStatus, joined: "2024-09-19", location: "SG" },
  { id: "t5", name: "Harbor Foods", plan: "Enterprise", users: 31, storage: "9.7 GB", mrr: 599, status: "active" as TenantStatus, joined: "2023-11-08", location: "US" },
  { id: "t6", name: "Crestline MFG", plan: "Pro", users: 9, storage: "2.2 GB", mrr: 99, status: "suspended" as TenantStatus, joined: "2024-06-22", location: "CA" },
  { id: "t7", name: "Delta Imports", plan: "Starter", users: 2, storage: "0.2 GB", mrr: 29, status: "cancelled" as TenantStatus, joined: "2024-02-14", location: "MY" },
  { id: "t8", name: "PeakView Co", plan: "Pro", users: 18, storage: "4.5 GB", mrr: 99, status: "active" as TenantStatus, joined: "2025-01-30", location: "DE" },
];

export const USERS = [
  { id: "u1", name: "Sarah Chen", email: "sarah@acmecorp.com", tenant: "Acme Corp", role: "owner" as UserRole, lastActive: "2 min ago", status: "active" as UserStatus },
  { id: "u2", name: "James Whitfield", email: "james@globetraders.co.uk", tenant: "Globe Traders", role: "admin" as UserRole, lastActive: "1 hr ago", status: "active" as UserStatus },
  { id: "u3", name: "Priya Nair", email: "priya@sunrise.com.au", tenant: "SunRise Retail", role: "owner" as UserRole, lastActive: "3 days ago", status: "active" as UserStatus },
  { id: "u4", name: "Marcus Lee", email: "marcus@novatech.sg", tenant: "NovaTech Ltd", role: "member" as UserRole, lastActive: "5 hr ago", status: "active" as UserStatus },
  { id: "u5", name: "Elena Vasquez", email: "elena@harborfoods.com", tenant: "Harbor Foods", role: "admin" as UserRole, lastActive: "30 min ago", status: "active" as UserStatus },
  { id: "u6", name: "Tom Briggs", email: "tom@crestline.ca", tenant: "Crestline MFG", role: "owner" as UserRole, lastActive: "12 days ago", status: "suspended" as UserStatus },
  { id: "u7", name: "Aisha Kamara", email: "aisha@peakview.de", tenant: "PeakView Co", role: "viewer" as UserRole, lastActive: "1 day ago", status: "inactive" as UserStatus },
  { id: "u8", name: "Leo Tan", email: "leo@deltaimports.my", tenant: "Delta Imports", role: "owner" as UserRole, lastActive: "45 days ago", status: "suspended" as UserStatus },
];

export const TRANSACTIONS = [
  { id: "inv_001", tenant: "Acme Corp", amount: 599, plan: "Enterprise", date: "2026-04-01", status: "paid" },
  { id: "inv_002", tenant: "Harbor Foods", amount: 599, plan: "Enterprise", date: "2026-04-01", status: "paid" },
  { id: "inv_003", tenant: "Globe Traders", amount: 99, plan: "Pro", date: "2026-04-03", status: "paid" },
  { id: "inv_004", tenant: "PeakView Co", amount: 99, plan: "Pro", date: "2026-04-05", status: "paid" },
  { id: "inv_005", tenant: "SunRise Retail", amount: 0, plan: "Pro (Trial)", date: "2026-04-10", status: "trial" },
  { id: "inv_006", tenant: "Crestline MFG", amount: 99, plan: "Pro", date: "2026-03-22", status: "failed" },
  { id: "inv_007", tenant: "NovaTech Ltd", amount: 29, plan: "Starter", date: "2026-04-19", status: "paid" },
];

export const SERVICES = [
  { name: "API Gateway", status: "operational" as ServiceStatus, latency: "42 ms", uptime: "99.98%" },
  { name: "Database (Primary)", status: "operational" as ServiceStatus, latency: "8 ms", uptime: "99.99%" },
  { name: "Database (Replica)", status: "operational" as ServiceStatus, latency: "11 ms", uptime: "99.97%" },
  { name: "Job Queue", status: "degraded" as ServiceStatus, latency: "340 ms", uptime: "98.12%" },
  { name: "Cache (Redis)", status: "operational" as ServiceStatus, latency: "2 ms", uptime: "100%" },
  { name: "File Storage", status: "operational" as ServiceStatus, latency: "95 ms", uptime: "99.95%" },
  { name: "Email Service", status: "operational" as ServiceStatus, latency: "210 ms", uptime: "99.91%" },
  { name: "Webhook Delivery", status: "degraded" as ServiceStatus, latency: "620 ms", uptime: "97.40%" },
];

export const FLAGS = [
  { id: "f1", name: "ai_forecast_beta", label: "AI Forecast (Beta)", description: "Enable AI-driven demand forecasting for eligible tenants.", enabled: true, scope: "per-tenant" as FlagScope, tenants: 3 },
  { id: "f2", name: "multi_warehouse", label: "Multi-Warehouse", description: "Allow tenants to manage multiple warehouse locations.", enabled: true, scope: "global" as FlagScope, tenants: null },
  { id: "f3", name: "csv_bulk_import", label: "CSV Bulk Import", description: "Upload CSV files to bulk-update inventory.", enabled: true, scope: "global" as FlagScope, tenants: null },
  { id: "f4", name: "barcode_scanner", label: "Barcode Scanner", description: "Mobile barcode scanning in the inventory workflow.", enabled: false, scope: "per-tenant" as FlagScope, tenants: 0 },
  { id: "f5", name: "supplier_portal", label: "Supplier Self-Service Portal", description: "External portal for suppliers to update lead times and pricing.", enabled: false, scope: "global" as FlagScope, tenants: null },
  { id: "f6", name: "audit_export", label: "Audit Log Export", description: "Allow tenants to export their full audit trail as CSV/JSON.", enabled: true, scope: "global" as FlagScope, tenants: null },
  { id: "f7", name: "two_fa_enforcement", label: "Enforce 2FA", description: "Force all tenant users to enable two-factor authentication.", enabled: false, scope: "global" as FlagScope, tenants: null },
];

export const AUDIT_LOGS = [
  { id: "a1", actor: "super@smartstock.io", action: "Suspended tenant", target: "Crestline MFG", time: "2026-04-19 14:32", ip: "103.21.44.1" },
  { id: "a2", actor: "super@smartstock.io", action: "Enabled feature flag", target: "ai_forecast_beta → Acme Corp", time: "2026-04-18 09:15", ip: "103.21.44.1" },
  { id: "a3", actor: "super@smartstock.io", action: "Updated plan", target: "Globe Traders → Pro", time: "2026-04-17 16:44", ip: "103.21.44.1" },
  { id: "a4", actor: "super@smartstock.io", action: "Reset user password", target: "tom@crestline.ca", time: "2026-04-16 11:02", ip: "103.21.44.1" },
  { id: "a5", actor: "super@smartstock.io", action: "Deleted tenant", target: "Delta Imports", time: "2026-04-15 08:50", ip: "103.21.44.1" },
  { id: "a6", actor: "super@smartstock.io", action: "Toggled feature flag OFF", target: "barcode_scanner (global)", time: "2026-04-14 17:21", ip: "103.21.44.1" },
  { id: "a7", actor: "super@smartstock.io", action: "Impersonated user", target: "sarah@acmecorp.com", time: "2026-04-13 13:00", ip: "103.21.44.1" },
  { id: "a8", actor: "super@smartstock.io", action: "Sent broadcast", target: "All Pro tenants", time: "2026-04-12 10:30", ip: "103.21.44.1" },
];

export const MAINTENANCE_HISTORY = [
  { id: "m1", start: "2026-03-15 02:00", end: "2026-03-15 04:30", duration: "2h 30m", scope: "All tenants", reason: "Database schema migration", by: "super@smartstock.io" },
  { id: "m2", start: "2026-02-08 01:00", end: "2026-02-08 02:15", duration: "1h 15m", scope: "All tenants", reason: "API Gateway version upgrade", by: "super@smartstock.io" },
  { id: "m3", start: "2026-01-22 03:00", end: "2026-01-22 03:45", duration: "45m", scope: "Pro, Enterprise", reason: "Redis cluster failover test", by: "super@smartstock.io" },
];
