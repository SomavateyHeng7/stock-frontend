export type Section =
  | "overview"
  | "tenants"
  | "users"
  | "billing"
  | "system"
  | "flags"
  | "audit"
  | "maintenance";

export type TenantStatus = "active" | "trialing" | "suspended" | "cancelled";
export type UserRole = "owner" | "admin" | "member" | "viewer";
export type UserStatus = "active" | "inactive" | "suspended";
export type ServiceStatus = "operational" | "degraded" | "outage";
export type FlagScope = "global" | "per-tenant";
