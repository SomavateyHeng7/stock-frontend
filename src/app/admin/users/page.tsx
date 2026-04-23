"use client";

import { useEffect, useMemo, useState } from "react";
import { SmartStockShell } from "@/components/smartstock-shell";
import { useToast } from "@/components/ui/toast-provider";
import { AUTH_CHANGED_EVENT, getUserInitials, readAuthUser, type AuthUser } from "@/lib/auth";
import {
  TEAM_CHANGED_EVENT,
  acceptInvite,
  bootstrapTeam,
  cancelInvite,
  readTeamState,
  removeMember,
  resendInvite,
  sendInvite,
  updateMember,
  type MemberStatus,
  type PendingInvite,
  type TeamMember,
  type TeamRole,
} from "@/lib/team-members";
import { getInventoryLedgerState, type BranchLocation } from "@/lib/inventory-ledger";
import {
  AlertTriangle,
  Building2,
  Check,
  Clock,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserMinus,
  Users,
  X,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<TeamRole, { label: string; desc: string; badgeCls: string }> = {
  owner: {
    label: "Owner",
    desc: "Full access to all features, billing, and team management",
    badgeCls: "bg-primary/10 text-primary border-primary/30",
  },
  manager: {
    label: "Manager",
    desc: "Manages inventory and approves reorders for assigned branches",
    badgeCls: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  },
  staff: {
    label: "Staff",
    desc: "Logs stock movements and receives deliveries at their branch",
    badgeCls: "bg-muted text-muted-foreground border-border/60",
  },
  accountant: {
    label: "Accountant",
    desc: "Read-only access to reports and billing history",
    badgeCls: "bg-green-500/10 text-green-600 border-green-500/30",
  },
};

const STATUS_CONFIG: Record<MemberStatus, { label: string; badgeCls: string }> = {
  active: { label: "Active", badgeCls: "bg-green-500/10 text-green-600 border-green-500/30" },
  suspended: { label: "Suspended", badgeCls: "bg-red-500/10 text-red-600 border-red-500/30" },
};

const ROLE_PERMISSIONS: Record<TeamRole, string[]> = {
  owner: ["Full system access", "Billing & subscription", "Team management", "All branches"],
  manager: ["Inventory adjustments", "Approve reorders", "Receive deliveries", "Assigned branches only"],
  staff: ["Log stock movements", "Receive deliveries", "View current stock", "Assigned branch only"],
  accountant: ["View reports", "Export data", "View billing history", "No inventory changes"],
};

const INVITABLE_ROLES: TeamRole[] = ["manager", "staff", "accountant"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: TeamRole }) {
  const { label, badgeCls } = ROLE_CONFIG[role];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badgeCls}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const { label, badgeCls } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badgeCls}`}>
      {label}
    </span>
  );
}

function formatLastActive(iso: string | null): string {
  if (!iso) return "Never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function BranchChips({
  branchIds,
  branches,
  role,
}: {
  branchIds: string[];
  branches: BranchLocation[];
  role: TeamRole;
}) {
  if (role === "owner") return <span className="text-xs text-muted-foreground">All branches</span>;
  if (role === "accountant") return <span className="text-xs text-muted-foreground">Reports only</span>;
  if (branchIds.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
        <AlertTriangle className="h-3 w-3" />
        None assigned
      </span>
    );
  }
  const names = branchIds.map((id) => branches.find((b) => b.id === id)?.name ?? id);
  const visible = names.slice(0, 2);
  const overflow = names.length - 2;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((name) => (
        <span key={name} className="rounded-md bg-muted/60 px-1.5 py-0.5 text-xs text-foreground">
          {name}
        </span>
      ))}
      {overflow > 0 && (
        <span className="rounded-md bg-muted/40 px-1.5 py-0.5 text-xs text-muted-foreground">
          +{overflow}
        </span>
      )}
    </div>
  );
}

// ─── Role Selector (shared between modals) ────────────────────────────────────

function RoleSelector({
  value,
  onChange,
}: {
  value: TeamRole;
  onChange: (role: TeamRole) => void;
}) {
  return (
    <div className="space-y-2">
      {INVITABLE_ROLES.map((r) => {
        const cfg = ROLE_CONFIG[r];
        const selected = value === r;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
              selected ? "border-primary bg-primary/5" : "border-border/70 bg-background hover:bg-muted/30"
            }`}
          >
            <div
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                selected ? "border-primary bg-primary" : "border-border"
              }`}
            >
              {selected && <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{cfg.label}</p>
              <p className="text-xs text-muted-foreground">{cfg.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Branch Selector (shared between modals) ──────────────────────────────────

function BranchSelector({
  branchIds,
  branches,
  onChange,
}: {
  branchIds: string[];
  branches: BranchLocation[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) =>
    onChange(branchIds.includes(id) ? branchIds.filter((b) => b !== id) : [...branchIds, id]);

  return (
    <div className="space-y-2">
      {branches.map((branch) => (
        <label
          key={branch.id}
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5 hover:bg-muted/30"
        >
          <input
            type="checkbox"
            checked={branchIds.includes(branch.id)}
            onChange={() => toggle(branch.id)}
            className="rounded border-border accent-primary"
          />
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{branch.name}</span>
        </label>
      ))}
    </div>
  );
}

// ─── Modal: Invite Member ─────────────────────────────────────────────────────

function InviteModal({
  branches,
  onClose,
}: {
  branches: BranchLocation[];
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("staff");
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [emailError, setEmailError] = useState("");

  const branchRequired = role === "manager" || role === "staff";

  const handleRoleChange = (r: TeamRole) => {
    setRole(r);
    if (r === "accountant") setBranchIds([]);
  };

  const handleSend = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    sendInvite({ email: trimmed, role, branchIds: branchRequired ? branchIds : [] });
    showToast({
      title: "Invitation sent",
      description: `${trimmed} was invited as ${ROLE_CONFIG[role].label}.`,
      severity: "success",
      persistToCenter: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Invite team member</h2>
            <p className="text-xs text-muted-foreground">An invitation link will be sent to their email.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted/40">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="colleague@yourbusiness.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  emailError ? "border-red-500/50 bg-red-500/5" : "border-border/70 bg-background"
                }`}
              />
            </div>
            {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Role</label>
            <RoleSelector value={role} onChange={handleRoleChange} />
          </div>

          {branchRequired && (
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Assign branches
                <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
              </label>
              <BranchSelector branchIds={branchIds} branches={branches} onChange={setBranchIds} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border/50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border/70 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Send invitation
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Edit Member ───────────────────────────────────────────────────────

function EditMemberModal({
  member,
  branches,
  onClose,
}: {
  member: TeamMember;
  branches: BranchLocation[];
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [role, setRole] = useState<TeamRole>(member.role);
  const [branchIds, setBranchIds] = useState<string[]>(member.branchIds);
  const branchRequired = role === "manager" || role === "staff";

  const handleRoleChange = (r: TeamRole) => {
    setRole(r);
    if (r === "accountant") setBranchIds([]);
  };

  const handleSave = () => {
    updateMember(member.id, { role, branchIds: branchRequired ? branchIds : [] });
    showToast({
      title: "Member updated",
      description: `${member.fullName} is now ${ROLE_CONFIG[role].label}.`,
      severity: "success",
      persistToCenter: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Edit {member.fullName}</h2>
            <p className="text-xs text-muted-foreground">Change role or branch assignments.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted/40">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Role</label>
            <RoleSelector value={role} onChange={handleRoleChange} />
          </div>

          {branchRequired && (
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Assigned branches</label>
              <BranchSelector branchIds={branchIds} branches={branches} onChange={setBranchIds} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border/50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border/70 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type RoleFilter = "all" | TeamRole;
type StatusFilter = "all" | MemberStatus;

export default function AdminUsersPage() {
  const { showToast } = useToast();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [teamState, setTeamState] = useState(() => readTeamState());
  const [branches, setBranches] = useState<BranchLocation[]>([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [acceptingInviteId, setAcceptingInviteId] = useState<string | null>(null);
  const [acceptName, setAcceptName] = useState("");

  useEffect(() => {
    const user = readAuthUser();
    setCurrentUser(user);
    if (user) bootstrapTeam(user);
    setTeamState(readTeamState());
    setBranches(getInventoryLedgerState().branches);

    const refreshTeam = () => setTeamState(readTeamState());
    const refreshAuth = () => setCurrentUser(readAuthUser());
    const closeMenu = () => setActionMenuId(null);

    window.addEventListener(TEAM_CHANGED_EVENT, refreshTeam);
    window.addEventListener(AUTH_CHANGED_EVENT, refreshAuth);
    window.addEventListener("click", closeMenu);

    return () => {
      window.removeEventListener(TEAM_CHANGED_EVENT, refreshTeam);
      window.removeEventListener(AUTH_CHANGED_EVENT, refreshAuth);
      window.removeEventListener("click", closeMenu);
    };
  }, []);

  const isOwner = currentUser?.role === "owner";

  const filteredMembers = useMemo(
    () =>
      teamState.members.filter((m) => {
        const matchSearch =
          m.fullName.toLowerCase().includes(search.toLowerCase()) ||
          m.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === "all" || m.role === roleFilter;
        const matchStatus = statusFilter === "all" || m.status === statusFilter;
        return matchSearch && matchRole && matchStatus;
      }),
    [teamState.members, search, roleFilter, statusFilter],
  );

  const stats = useMemo(
    () => ({
      active: teamState.members.filter((m) => m.status === "active").length,
      pending: teamState.invites.length,
      managers: teamState.members.filter((m) => m.role === "manager" && m.status === "active").length,
      staff: teamState.members.filter((m) => m.role === "staff" && m.status === "active").length,
    }),
    [teamState],
  );

  const handleSuspendToggle = (member: TeamMember) => {
    const next: MemberStatus = member.status === "suspended" ? "active" : "suspended";
    updateMember(member.id, { status: next });
    showToast({
      title: next === "suspended" ? `${member.fullName} suspended` : `${member.fullName} reactivated`,
      severity: next === "suspended" ? "warning" : "success",
      persistToCenter: false,
    });
  };

  const handleRemove = (id: string) => {
    const member = teamState.members.find((m) => m.id === id);
    removeMember(id);
    setConfirmRemoveId(null);
    showToast({
      title: `${member?.fullName ?? "Member"} removed from team`,
      severity: "info",
      persistToCenter: false,
    });
  };

  const handleResendInvite = (invite: PendingInvite) => {
    resendInvite(invite.id);
    showToast({
      title: "Invitation resent",
      description: `Invite resent to ${invite.email}.`,
      severity: "success",
      persistToCenter: false,
    });
  };

  const handleCancelInvite = (invite: PendingInvite) => {
    cancelInvite(invite.id);
    showToast({
      title: "Invitation cancelled",
      description: `Invite to ${invite.email} was cancelled.`,
      severity: "info",
      persistToCenter: false,
    });
  };

  const handleAcceptInvite = (invite: PendingInvite) => {
    const member = acceptInvite(invite.id, acceptName);
    setAcceptingInviteId(null);
    setAcceptName("");
    showToast({
      title: "Invitation accepted",
      description: `${member?.fullName ?? invite.email} joined as ${ROLE_CONFIG[invite.role].label}.`,
      severity: "success",
      persistToCenter: false,
    });
  };

  return (
    <SmartStockShell
      title="Team & Users"
      subtitle="Manage who can access your SmartStock workspace and what they can do."
    >
      <div className="space-y-5">
        {!isOwner && (
          <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
            <ShieldAlert className="h-4 w-4 shrink-0 text-yellow-500" />
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Only the account owner can manage team members. Contact your owner to request changes.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, label: "Active Members", value: stats.active },
            { icon: Mail, label: "Pending Invites", value: stats.pending },
            { icon: Shield, label: "Managers", value: stats.managers },
            { icon: UserCheck, label: "Staff", value: stats.staff },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <div className="rounded-xl bg-primary/10 p-2.5 w-fit">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">{value}</p>
              <p className="mt-0.5 text-sm font-medium text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Members table */}
        <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border/50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Team Members</h2>
              <p className="text-sm text-muted-foreground">
                {teamState.members.length} member{teamState.members.length !== 1 ? "s" : ""} in your workspace
              </p>
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Invite Member
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-2 border-b border-border/50 px-5 py-3 sm:flex-row sm:items-center">
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
            <div className="flex flex-wrap gap-1.5">
              {(["all", "owner", "manager", "staff", "accountant"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    roleFilter === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r === "all" ? "All Roles" : ROLE_CONFIG[r].label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {(["all", "active", "suspended"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    statusFilter === s
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/70 bg-muted/30">
                  {["Member", "Role", "Branches", "Status", "Last Active", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredMembers.map((member) => {
                  const isCurrentUser = member.id === currentUser?.id;
                  const isMenuOpen = actionMenuId === member.id;
                  const canEdit = isOwner && !isCurrentUser && member.role !== "owner";

                  return (
                    <tr key={member.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {getUserInitials(member.fullName)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {member.fullName}
                              {isCurrentUser && (
                                <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge role={member.role} />
                      </td>
                      <td className="px-4 py-3">
                        <BranchChips branchIds={member.branchIds} branches={branches} role={member.role} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={member.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatLastActive(member.lastActiveAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {canEdit && (
                          <div
                            className="relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => setActionMenuId(isMenuOpen ? null : member.id)}
                              className="rounded-lg p-1.5 hover:bg-muted/40"
                            >
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                            {isMenuOpen && (
                              <div className="absolute right-0 top-8 z-10 w-48 rounded-xl border border-border/70 bg-card p-1 shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => { setEditingMember(member); setActionMenuId(null); }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-muted/40"
                                >
                                  <Shield className="h-3.5 w-3.5" />
                                  Edit role &amp; branches
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { handleSuspendToggle(member); setActionMenuId(null); }}
                                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted/40 ${
                                    member.status === "suspended" ? "text-green-600" : "text-yellow-600"
                                  }`}
                                >
                                  {member.status === "suspended" ? (
                                    <>
                                      <UserCheck className="h-3.5 w-3.5" />
                                      Reactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserMinus className="h-3.5 w-3.5" />
                                      Suspend
                                    </>
                                  )}
                                </button>
                                <div className="my-1 border-t border-border/40" />
                                <button
                                  type="button"
                                  onClick={() => { setConfirmRemoveId(member.id); setActionMenuId(null); }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-500 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Remove from team
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredMembers.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No members match your filters.
            </div>
          )}
        </div>

        {/* Pending invites */}
        {teamState.invites.length > 0 && (
          <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
            <div className="border-b border-border/50 p-5">
              <h2 className="text-base font-semibold text-foreground">Pending Invitations</h2>
              <p className="text-sm text-muted-foreground">
                {teamState.invites.length} invitation{teamState.invites.length !== 1 ? "s" : ""} awaiting acceptance
              </p>
            </div>
            <div className="divide-y divide-border/40">
              {teamState.invites.map((invite) => (
                <div key={invite.id} className="px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/50 text-xs font-bold text-muted-foreground">
                      {invite.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{invite.email}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <RoleBadge role={invite.role} />
                        {invite.branchIds.length > 0 && (
                          <BranchChips
                            branchIds={invite.branchIds}
                            branches={branches}
                            role={invite.role}
                          />
                        )}
                        <span className="text-xs text-muted-foreground">
                          Sent {formatLastActive(invite.sentAt)}
                        </span>
                      </div>
                    </div>
                    {isOwner && acceptingInviteId !== invite.id && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setAcceptingInviteId(invite.id); setAcceptName(invite.email.split("@")[0]); }}
                          className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-500/20 dark:text-green-400"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResendInvite(invite)}
                          className="rounded-lg border border-border/70 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40"
                        >
                          Resend
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelInvite(invite)}
                          className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  {isOwner && acceptingInviteId === invite.id && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/5 p-3">
                      <div className="flex-1">
                        <p className="mb-1.5 text-xs font-medium text-foreground">Full name for this member</p>
                        <input
                          type="text"
                          value={acceptName}
                          onChange={(e) => setAcceptName(e.target.value)}
                          placeholder="e.g. Sophea Dara"
                          className="w-full rounded-lg border border-border/70 bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          onKeyDown={(e) => { if (e.key === "Enter") handleAcceptInvite(invite); }}
                          autoFocus
                        />
                      </div>
                      <div className="flex shrink-0 flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAcceptInvite(invite)}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setAcceptingInviteId(null)}
                          className="rounded-lg border border-border/70 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Role permissions guide */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Role permissions</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(["owner", "manager", "staff", "accountant"] as TeamRole[]).map((r) => (
              <div key={r} className="rounded-xl border border-border/60 p-4">
                <RoleBadge role={r} />
                <p className="mt-2 text-xs text-muted-foreground">{ROLE_CONFIG[r].desc}</p>
                <ul className="mt-3 space-y-1.5">
                  {ROLE_PERMISSIONS[r].map((p) => (
                    <li key={p} className="flex items-center gap-2 text-xs text-foreground">
                      <Check className="h-3 w-3 shrink-0 text-green-600" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showInviteModal && (
        <InviteModal branches={branches} onClose={() => setShowInviteModal(false)} />
      )}

      {editingMember && (
        <EditMemberModal
          member={editingMember}
          branches={branches}
          onClose={() => setEditingMember(null)}
        />
      )}

      {confirmRemoveId && (() => {
        const member = teamState.members.find((m) => m.id === confirmRemoveId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-border/70 bg-card p-6 shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-foreground">Remove member?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {member
                  ? `${member.fullName} will lose access to this workspace immediately.`
                  : "This member will lose access to this workspace immediately."}
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmRemoveId(null)}
                  className="flex-1 rounded-lg border border-border/70 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
                >
                  Keep
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(confirmRemoveId)}
                  className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </SmartStockShell>
  );
}
