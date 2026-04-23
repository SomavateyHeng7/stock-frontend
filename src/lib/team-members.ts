export type TeamRole = "owner" | "manager" | "staff" | "accountant";
export type MemberStatus = "active" | "suspended";

export type TeamMember = {
  id: string;
  fullName: string;
  email: string;
  role: TeamRole;
  branchIds: string[];
  status: MemberStatus;
  invitedAt: string;
  joinedAt: string | null;
  lastActiveAt: string | null;
};

export type PendingInvite = {
  id: string;
  email: string;
  role: TeamRole;
  branchIds: string[];
  sentAt: string;
};

export type TeamState = {
  members: TeamMember[];
  invites: PendingInvite[];
};

export const TEAM_STATE_KEY = "smartstock.team.v1";
export const TEAM_CHANGED_EVENT = "smartstock:team-changed";

const SEED_MEMBERS: TeamMember[] = [
  {
    id: "m-seed-sophea",
    fullName: "Sophea Dara",
    email: "sophea.dara@example.com",
    role: "manager",
    branchIds: ["pp-main"],
    status: "active",
    invitedAt: "2026-03-15T08:00:00.000Z",
    joinedAt: "2026-03-15T10:30:00.000Z",
    lastActiveAt: "2026-04-20T14:22:00.000Z",
  },
  {
    id: "m-seed-virak",
    fullName: "Virak Chan",
    email: "virak.chan@example.com",
    role: "staff",
    branchIds: ["siem-reap", "battambang"],
    status: "active",
    invitedAt: "2026-03-20T09:00:00.000Z",
    joinedAt: "2026-03-20T11:15:00.000Z",
    lastActiveAt: "2026-04-19T08:05:00.000Z",
  },
  {
    id: "m-seed-chenda",
    fullName: "Chenda Lim",
    email: "chenda.lim@example.com",
    role: "accountant",
    branchIds: [],
    status: "active",
    invitedAt: "2026-04-01T10:00:00.000Z",
    joinedAt: "2026-04-01T12:00:00.000Z",
    lastActiveAt: "2026-04-21T09:30:00.000Z",
  },
  {
    id: "m-seed-bopha",
    fullName: "Bopha Keo",
    email: "bopha.keo@example.com",
    role: "staff",
    branchIds: ["pp-main"],
    status: "active",
    invitedAt: "2026-04-05T07:30:00.000Z",
    joinedAt: "2026-04-05T09:00:00.000Z",
    lastActiveAt: "2026-04-18T17:40:00.000Z",
  },
];

const SEED_INVITES: PendingInvite[] = [
  {
    id: "inv-seed-narith",
    email: "narith.pov@example.com",
    role: "staff",
    branchIds: ["battambang"],
    sentAt: "2026-04-20T14:00:00.000Z",
  },
  {
    id: "inv-seed-sokha",
    email: "sokha.tep@example.com",
    role: "manager",
    branchIds: ["siem-reap"],
    sentAt: "2026-04-19T10:30:00.000Z",
  },
];

let _teamCache: TeamState | null = null;
let _teamListenerAttached = false;

function ensureTeamListener() {
  if (_teamListenerAttached || typeof window === "undefined") return;
  _teamListenerAttached = true;
  window.addEventListener("storage", (e) => {
    if (e.key === TEAM_STATE_KEY) _teamCache = null;
  });
}

function buildDefaultState(): TeamState {
  return { members: [], invites: [] };
}

export function readTeamState(): TeamState {
  if (typeof window === "undefined") return buildDefaultState();

  ensureTeamListener();
  if (_teamCache !== null) return _teamCache;

  try {
    const raw = window.localStorage.getItem(TEAM_STATE_KEY);
    if (!raw) {
      _teamCache = buildDefaultState();
      return _teamCache;
    }
    const parsed = JSON.parse(raw) as Partial<TeamState>;
    _teamCache = {
      members: Array.isArray(parsed.members) ? parsed.members : [],
      invites: Array.isArray(parsed.invites) ? parsed.invites : [],
    };
    return _teamCache;
  } catch {
    return buildDefaultState();
  }
}

export function writeTeamState(next: TeamState) {
  if (typeof window === "undefined") return;
  _teamCache = next;
  window.localStorage.setItem(TEAM_STATE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(TEAM_CHANGED_EVENT));
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function bootstrapTeam(owner: { id: string; fullName: string; email: string }) {
  const current = readTeamState();

  if (current.members.length > 0) {
    const hasOwner = current.members.some((m) => m.id === owner.id);
    if (!hasOwner) {
      writeTeamState({
        ...current,
        members: [
          {
            id: owner.id,
            fullName: owner.fullName,
            email: owner.email,
            role: "owner",
            branchIds: [],
            status: "active",
            invitedAt: new Date().toISOString(),
            joinedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
          },
          ...current.members,
        ],
      });
    }
    return;
  }

  writeTeamState({
    members: [
      {
        id: owner.id,
        fullName: owner.fullName,
        email: owner.email,
        role: "owner",
        branchIds: [],
        status: "active",
        invitedAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      },
      ...SEED_MEMBERS,
    ],
    invites: SEED_INVITES,
  });
}

export function sendInvite(input: Omit<PendingInvite, "id" | "sentAt">): PendingInvite {
  const current = readTeamState();
  const next: PendingInvite = {
    id: generateId("inv"),
    sentAt: new Date().toISOString(),
    ...input,
  };
  writeTeamState({ ...current, invites: [next, ...current.invites] });
  return next;
}

export function cancelInvite(inviteId: string) {
  const current = readTeamState();
  writeTeamState({ ...current, invites: current.invites.filter((i) => i.id !== inviteId) });
}

export function resendInvite(inviteId: string) {
  const current = readTeamState();
  writeTeamState({
    ...current,
    invites: current.invites.map((i) =>
      i.id === inviteId ? { ...i, sentAt: new Date().toISOString() } : i,
    ),
  });
}

export function updateMember(
  memberId: string,
  patch: Partial<Pick<TeamMember, "role" | "branchIds" | "status">>,
) {
  const current = readTeamState();
  writeTeamState({
    ...current,
    members: current.members.map((m) => (m.id === memberId ? { ...m, ...patch } : m)),
  });
}

export function removeMember(memberId: string) {
  const current = readTeamState();
  writeTeamState({ ...current, members: current.members.filter((m) => m.id !== memberId) });
}

export function acceptInvite(inviteId: string, fullName: string): TeamMember | null {
  const current = readTeamState();
  const invite = current.invites.find((i) => i.id === inviteId);
  if (!invite) return null;

  const now = new Date().toISOString();
  const member: TeamMember = {
    id: generateId("m"),
    fullName: fullName.trim() || invite.email.split("@")[0],
    email: invite.email,
    role: invite.role,
    branchIds: invite.branchIds,
    status: "active",
    invitedAt: invite.sentAt,
    joinedAt: now,
    lastActiveAt: now,
  };

  writeTeamState({
    members: [...current.members, member],
    invites: current.invites.filter((i) => i.id !== inviteId),
  });

  return member;
}
