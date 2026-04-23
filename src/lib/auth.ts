export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: "owner" | "manager" | "staff" | "accountant";
  createdAt: string;
};

const AUTH_STORAGE_KEY = "smartstock.auth.user.v1";
export const AUTH_CHANGED_EVENT = "smartstock:auth-changed";

// undefined = not yet read from storage; null = loaded, no user
let _authCache: AuthUser | null | undefined = undefined;
let _authListenerAttached = false;
function ensureAuthListener() {
  if (_authListenerAttached || typeof window === "undefined") return;
  _authListenerAttached = true;
  window.addEventListener("storage", (e) => {
    if (e.key === AUTH_STORAGE_KEY) _authCache = undefined;
  });
}

export function readAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  ensureAuthListener();
  if (_authCache !== undefined) return _authCache;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) { _authCache = null; return null; }

    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed.id || !parsed.fullName || !parsed.email || !parsed.createdAt) { _authCache = null; return null; }

    const validRoles = ["staff", "manager", "accountant"] as const;
    _authCache = {
      id: parsed.id,
      fullName: parsed.fullName,
      email: parsed.email,
      role: (validRoles as readonly string[]).includes(parsed.role ?? "")
        ? (parsed.role as "staff" | "manager" | "accountant")
        : "owner",
      createdAt: parsed.createdAt,
    };
    return _authCache;
  } catch {
    return null;
  }
}

export function writeAuthUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;

  _authCache = user;
  if (!user) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } else {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }

  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
}

export function signInWithEmail(email: string, fullName?: string): AuthUser {
  const existing = readAuthUser();
  const nextUser: AuthUser = {
    id: existing?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fullName: fullName?.trim() || existing?.fullName || email.split("@")[0] || "SmartStock User",
    email: email.trim().toLowerCase(),
    role: existing?.role ?? "owner",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };

  writeAuthUser(nextUser);
  return nextUser;
}

export function signOut() {
  writeAuthUser(null);
}

export function getUserInitials(fullName: string) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "SS";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "SS";
}
