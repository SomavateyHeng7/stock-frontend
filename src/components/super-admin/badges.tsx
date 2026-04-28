import { CircleDot } from "lucide-react";
import type { TenantStatus, UserStatus, UserRole, ServiceStatus } from "./types";

export function TenantBadge({ status }: { status: TenantStatus }) {
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

export function UserStatusBadge({ status }: { status: UserStatus }) {
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

export function RoleBadge({ role }: { role: UserRole }) {
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

export function ServiceBadge({ status }: { status: ServiceStatus }) {
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

export function TransactionBadge({ status }: { status: string }) {
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
