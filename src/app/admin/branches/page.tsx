"use client";

import { useEffect, useRef, useState } from "react";
import { SmartStockShell } from "@/components/smartstock-shell";
import { useToast } from "@/components/ui/toast-provider";
import { AUTH_CHANGED_EVENT, readAuthUser, type AuthUser } from "@/lib/auth";
import {
  LEDGER_BRANCHES_CHANGED_EVENT,
  addBranch,
  getBranchStats,
  getInventoryLedgerState,
  renameBranch,
  removeBranch,
  type BranchLocation,
  type InventoryLedgerState,
} from "@/lib/inventory-ledger";
import {
  AlertTriangle,
  Building2,
  Check,
  MapPin,
  Package,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";

// ─── Add Branch Modal ─────────────────────────────────────────────────────────

function AddBranchModal({ onClose }: { onClose: () => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Branch name is required."); return; }
    if (trimmed.length > 60) { setError("Name must be 60 characters or fewer."); return; }

    const state = getInventoryLedgerState();
    const duplicate = state.branches.some(
      (b) => b.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) { setError("A branch with this name already exists."); return; }

    const branch = addBranch(trimmed);
    showToast({
      title: "Branch created",
      description: `"${branch.name}" is ready for inventory tracking.`,
      severity: "success",
      persistToCenter: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border/70 bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Add branch</h2>
            <p className="text-xs text-muted-foreground">New location for inventory tracking.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted/40">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5">
          <label className="mb-1.5 block text-sm font-medium text-foreground">Branch name</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="e.g. Kampot Warehouse"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") onClose(); }}
              maxLength={60}
              className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                error ? "border-red-500/50 bg-red-500/5" : "border-border/70 bg-background"
              }`}
            />
          </div>
          {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
          <p className="mt-1.5 text-xs text-muted-foreground">
            This creates a new location. Stock will start at zero for all products.
          </p>
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
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Create branch
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Remove Confirm Modal ─────────────────────────────────────────────────────

function RemoveConfirmModal({
  branch,
  stats,
  onConfirm,
  onClose,
}: {
  branch: BranchLocation;
  stats: { activeSKUs: number; totalUnits: number };
  onConfirm: () => void;
  onClose: () => void;
}) {
  const hasStock = stats.totalUnits > 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border/70 bg-card shadow-xl">
        <div className="p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-foreground">
            Remove &ldquo;{branch.name}&rdquo;?
          </h2>

          {hasStock ? (
            <div className="mt-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  This branch has{" "}
                  <span className="font-semibold">{stats.totalUnits} units</span> across{" "}
                  <span className="font-semibold">{stats.activeSKUs} SKUs</span>. That stock
                  data will be permanently cleared.
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              This branch has no stock. It will be removed immediately.
            </p>
          )}

          <p className="mt-2 text-xs text-muted-foreground">
            Movement history for this branch is preserved for audit purposes.
          </p>
        </div>

        <div className="flex gap-2 border-t border-border/50 px-6 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border/70 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
          >
            Keep branch
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Branch Card ──────────────────────────────────────────────────────────────

function BranchCard({
  branch,
  stats,
  isOnly,
  isOwner,
  onRemoveRequest,
}: {
  branch: BranchLocation;
  stats: { activeSKUs: number; totalUnits: number; recentMovements: number };
  isOnly: boolean;
  isOwner: boolean;
  onRemoveRequest: (branch: BranchLocation) => void;
}) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(branch.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEdit = () => {
    setDraftName(branch.name);
    setEditing(true);
  };

  const saveEdit = () => {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === branch.name) { setEditing(false); return; }
    renameBranch(branch.id, trimmed);
    showToast({
      title: "Branch renamed",
      description: `"${trimmed}" saved successfully.`,
      severity: "success",
      persistToCenter: false,
    });
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraftName(branch.name);
    setEditing(false);
  };

  const formattedCreated = branch.createdAt
    ? new Date(branch.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>

          {editing ? (
            <div className="flex flex-1 items-center gap-1.5">
              <input
                ref={inputRef}
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                maxLength={60}
                className="flex-1 rounded-lg border border-primary/50 bg-background px-2.5 py-1 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={saveEdit}
                className="rounded-lg bg-primary/10 p-1.5 text-primary hover:bg-primary/20"
                title="Save"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/40"
                title="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{branch.name}</p>
              {formattedCreated ? (
                <p className="text-xs text-muted-foreground">Added {formattedCreated}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Default branch</p>
              )}
            </div>
          )}
        </div>

        {isOwner && !editing && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={startEdit}
              title="Rename branch"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onRemoveRequest(branch)}
              title={isOnly ? "Cannot remove the last branch" : "Remove branch"}
              disabled={isOnly}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border/50 pt-4">
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">{stats.activeSKUs}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Active SKUs</p>
        </div>
        <div className="text-center border-x border-border/40">
          <p className="text-xl font-bold text-foreground">{stats.totalUnits.toLocaleString()}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Total units</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">{stats.recentMovements}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Movements (30d)</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminBranchesPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [ledgerState, setLedgerState] = useState<InventoryLedgerState | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [removingBranch, setRemovingBranch] = useState<BranchLocation | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setCurrentUser(readAuthUser());
    setLedgerState(getInventoryLedgerState());

    const refresh = () => setLedgerState(getInventoryLedgerState());
    const refreshAuth = () => setCurrentUser(readAuthUser());

    window.addEventListener(LEDGER_BRANCHES_CHANGED_EVENT, refresh);
    window.addEventListener(AUTH_CHANGED_EVENT, refreshAuth);
    return () => {
      window.removeEventListener(LEDGER_BRANCHES_CHANGED_EVENT, refresh);
      window.removeEventListener(AUTH_CHANGED_EVENT, refreshAuth);
    };
  }, []);

  const isOwner = currentUser?.role === "owner";
  const branches = ledgerState?.branches ?? [];

  const handleConfirmRemove = () => {
    if (!removingBranch) return;
    removeBranch(removingBranch.id);
    showToast({
      title: "Branch removed",
      description: `"${removingBranch.name}" has been removed.`,
      severity: "info",
      persistToCenter: false,
    });
    setRemovingBranch(null);
  };

  // Aggregate stats across all branches
  const totalSKUs = ledgerState
    ? branches.reduce((sum, b) => {
        const { activeSKUs } = getBranchStats(ledgerState, b.id);
        return sum + activeSKUs;
      }, 0)
    : 0;

  const totalUnits = ledgerState
    ? branches.reduce((sum, b) => {
        const { totalUnits } = getBranchStats(ledgerState, b.id);
        return sum + totalUnits;
      }, 0)
    : 0;

  const totalMovements = ledgerState
    ? branches.reduce((sum, b) => {
        const { recentMovements } = getBranchStats(ledgerState, b.id);
        return sum + recentMovements;
      }, 0)
    : 0;

  return (
    <SmartStockShell
      title="Branch Locations"
      subtitle="Create and manage the physical locations where inventory is tracked."
    >
      <div className="space-y-5">
        {!isOwner && (
          <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
            <ShieldAlert className="h-4 w-4 shrink-0 text-yellow-500" />
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Only the account owner can add or remove branch locations.
            </p>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="rounded-xl bg-primary/10 p-2.5 w-fit">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">{branches.length}</p>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">Branch locations</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="rounded-xl bg-primary/10 p-2.5 w-fit">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">
              {totalUnits.toLocaleString()}
            </p>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">
              Total units across all branches
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="rounded-xl bg-primary/10 p-2.5 w-fit">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">{totalMovements}</p>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">
              Movements in last 30 days
            </p>
          </div>
        </div>

        {/* Branch list header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Locations</h2>
            <p className="text-sm text-muted-foreground">
              {branches.length} branch{branches.length !== 1 ? "es" : ""} ·{" "}
              {totalSKUs} active SKU{totalSKUs !== 1 ? "s" : ""} tracked
            </p>
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add branch
            </button>
          )}
        </div>

        {/* Branch cards */}
        {ledgerState && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                stats={getBranchStats(ledgerState, branch.id)}
                isOnly={branches.length === 1}
                isOwner={isOwner}
                onRemoveRequest={setRemovingBranch}
              />
            ))}

            {/* Add branch prompt card */}
            {/* {isOwner && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/50 p-8 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-dashed border-current">
                  <Plus className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">Add branch</p>
              </button>
            )} */}
          </div>
        )}

        {/* Info callout */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">How branches work</h3>
          <div className="grid gap-3 sm:grid-cols-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>Each branch tracks stock independently. Products can have different quantities at each location.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>Managers are assigned to specific branches and can only adjust stock for their locations.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <Package className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>New branches start with zero stock. Use Inventory to log initial stock quantities.</p>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && <AddBranchModal onClose={() => setShowAddModal(false)} />}

      {removingBranch && ledgerState && (
        <RemoveConfirmModal
          branch={removingBranch}
          stats={getBranchStats(ledgerState, removingBranch.id)}
          onConfirm={handleConfirmRemove}
          onClose={() => setRemovingBranch(null)}
        />
      )}
    </SmartStockShell>
  );
}
