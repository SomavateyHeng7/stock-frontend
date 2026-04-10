"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { SmartStockShell } from "@/components/smartstock-shell";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useToast } from "@/components/ui/toast-provider";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { readAuthUser, signOut } from "@/lib/auth";
import {
  formatDateTime,
  readUserPreferences,
  updateUserPreferences,
  type AppCurrency,
  type AppLanguage,
} from "@/lib/user-preferences";

type SettingsForm = {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  timezone: string;
  language: AppLanguage;
  currency: AppCurrency;
  emailAlerts: boolean;
  telegramAlerts: boolean;
  compactTables: boolean;
};

type SecuritySettings = {
  twoFactorEnabled: boolean;
  recoveryEmail: string;
};

type SessionRecord = {
  id: string;
  deviceName: string;
  location: string;
  lastActiveAt: string;
  current: boolean;
};

type TeamRole = "owner" | "admin" | "manager" | "staff";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: "active" | "invited";
  permissions: {
    billing: boolean;
    inventory: boolean;
    reports: boolean;
    settings: boolean;
  };
};

const SETTINGS_STORAGE_KEY = "smartstock.settings.profile.v1";
const SECURITY_SETTINGS_STORAGE_KEY = "smartstock.settings.security.v1";
const DEVICE_SESSIONS_STORAGE_KEY = "smartstock.settings.sessions.v1";
const TEAM_SETTINGS_STORAGE_KEY = "smartstock.settings.team.v1";

const defaultSettings: SettingsForm = {
  fullName: "",
  email: "",
  phone: "",
  businessName: "",
  timezone: "Asia/Phnom_Penh",
  language: "en",
  currency: "USD",
  emailAlerts: true,
  telegramAlerts: false,
  compactTables: false,
};

const defaultSecuritySettings: SecuritySettings = {
  twoFactorEnabled: false,
  recoveryEmail: "",
};

function readSettings(): SettingsForm {
  if (typeof window === "undefined") return defaultSettings;

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<SettingsForm>;
    return {
      fullName: parsed.fullName ?? defaultSettings.fullName,
      email: parsed.email ?? defaultSettings.email,
      phone: parsed.phone ?? defaultSettings.phone,
      businessName: parsed.businessName ?? defaultSettings.businessName,
      timezone: parsed.timezone ?? defaultSettings.timezone,
      language: parsed.language ?? defaultSettings.language,
      currency: parsed.currency ?? defaultSettings.currency,
      emailAlerts: Boolean(parsed.emailAlerts ?? defaultSettings.emailAlerts),
      telegramAlerts: Boolean(parsed.telegramAlerts ?? defaultSettings.telegramAlerts),
      compactTables: Boolean(parsed.compactTables ?? defaultSettings.compactTables),
    };
  } catch {
    return defaultSettings;
  }
}

function writeSettings(value: SettingsForm) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(value));
}

function readSecuritySettings(): SecuritySettings {
  if (typeof window === "undefined") return defaultSecuritySettings;

  try {
    const raw = window.localStorage.getItem(SECURITY_SETTINGS_STORAGE_KEY);
    if (!raw) return defaultSecuritySettings;
    const parsed = JSON.parse(raw) as Partial<SecuritySettings>;
    return {
      twoFactorEnabled: Boolean(parsed.twoFactorEnabled),
      recoveryEmail: parsed.recoveryEmail ?? "",
    };
  } catch {
    return defaultSecuritySettings;
  }
}

function writeSecuritySettings(value: SecuritySettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SECURITY_SETTINGS_STORAGE_KEY, JSON.stringify(value));
}

function getDefaultSessions(): SessionRecord[] {
  return [
    {
      id: "session-current",
      deviceName: "Current Browser Session",
      location: "Phnom Penh, KH",
      lastActiveAt: new Date().toISOString(),
      current: true,
    },
  ];
}

function readSessions(): SessionRecord[] {
  if (typeof window === "undefined") return getDefaultSessions();

  try {
    const raw = window.localStorage.getItem(DEVICE_SESSIONS_STORAGE_KEY);
    if (!raw) return getDefaultSessions();
    const parsed = JSON.parse(raw) as SessionRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) return getDefaultSessions();
    return parsed;
  } catch {
    return getDefaultSessions();
  }
}

function writeSessions(value: SessionRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEVICE_SESSIONS_STORAGE_KEY, JSON.stringify(value));
}

function getDefaultTeamMembers(): TeamMember[] {
  return [
    {
      id: "team-owner",
      name: "Workspace Owner",
      email: "owner@smartstock.app",
      role: "owner",
      status: "active",
      permissions: {
        billing: true,
        inventory: true,
        reports: true,
        settings: true,
      },
    },
  ];
}

function readTeamMembers(): TeamMember[] {
  if (typeof window === "undefined") return getDefaultTeamMembers();

  try {
    const raw = window.localStorage.getItem(TEAM_SETTINGS_STORAGE_KEY);
    if (!raw) return getDefaultTeamMembers();
    const parsed = JSON.parse(raw) as TeamMember[];
    if (!Array.isArray(parsed) || parsed.length === 0) return getDefaultTeamMembers();
    return parsed;
  } catch {
    return getDefaultTeamMembers();
  }
}

function writeTeamMembers(value: TeamMember[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TEAM_SETTINGS_STORAGE_KEY, JSON.stringify(value));
}

function getDefaultPermissions(role: TeamRole) {
  if (role === "owner") {
    return { billing: true, inventory: true, reports: true, settings: true };
  }
  if (role === "admin") {
    return { billing: true, inventory: true, reports: true, settings: true };
  }
  if (role === "manager") {
    return { billing: false, inventory: true, reports: true, settings: false };
  }
  return { billing: false, inventory: true, reports: false, settings: false };
}

export default function SettingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const preferences = useUserPreferences();
  const { resolvedTheme, setTheme } = useTheme();
  const [settings, setSettings] = useState<SettingsForm>(defaultSettings);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(defaultSecuritySettings);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("staff");

  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const storedSettings = readSettings();
    const preferences = readUserPreferences();
    setSettings({
      ...storedSettings,
      language: preferences.language,
      currency: preferences.currency,
      timezone: preferences.timezone,
    });
    const authUser = readAuthUser();
    const storedSecurity = readSecuritySettings();
    setSecuritySettings({
      ...storedSecurity,
      recoveryEmail: storedSecurity.recoveryEmail || authUser?.email || "",
    });
    setSessions(readSessions());
    setTeamMembers(readTeamMembers());
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    writeSecuritySettings(securitySettings);
  }, [hasHydrated, securitySettings]);

  useEffect(() => {
    if (!hasHydrated) return;
    writeSessions(sessions);
  }, [hasHydrated, sessions]);

  useEffect(() => {
    if (!hasHydrated) return;
    writeTeamMembers(teamMembers);
  }, [hasHydrated, teamMembers]);

  const selectedTheme = useMemo(() => {
    if (!hasHydrated) return "system";
    if (resolvedTheme === "dark") return "dark";
    if (resolvedTheme === "light") return "light";
    return "system";
  }, [hasHydrated, resolvedTheme]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (settings.fullName.trim().length < 2) {
      showToast({
        title: "Profile name required",
        description: "Please enter your full name.",
        source: "Settings",
        severity: "warning",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email.trim())) {
      showToast({
        title: "Invalid email",
        description: "Please provide a valid email address.",
        source: "Settings",
        severity: "warning",
      });
      return;
    }

    const normalized: SettingsForm = {
      ...settings,
      fullName: settings.fullName.trim(),
      email: settings.email.trim(),
      phone: settings.phone.trim(),
      businessName: settings.businessName.trim(),
    };

    setSettings(normalized);
    writeSettings(normalized);
    updateUserPreferences({
      language: normalized.language,
      currency: normalized.currency,
      timezone: normalized.timezone,
    });

    showToast({
      title: "Settings saved",
      description: "Your profile and app preferences have been updated.",
      source: "Settings",
      severity: "info",
    });
  };

  const submitPasswordChange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (currentPassword.trim().length < 6) {
      showToast({
        title: "Current password required",
        description: "Enter your current password to continue.",
        source: "Security",
        severity: "warning",
      });
      return;
    }

    if (newPassword.trim().length < 8) {
      showToast({
        title: "Weak new password",
        description: "New password must be at least 8 characters.",
        source: "Security",
        severity: "warning",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast({
        title: "Password mismatch",
        description: "New password and confirmation do not match.",
        source: "Security",
        severity: "warning",
      });
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast({
      title: "Password changed",
      description: "Your password has been updated successfully.",
      source: "Security",
      severity: "info",
    });
  };

  const toggleTwoFactor = () => {
    setSecuritySettings((current) => ({
      ...current,
      twoFactorEnabled: !current.twoFactorEnabled,
    }));
    showToast({
      title: securitySettings.twoFactorEnabled ? "2FA disabled" : "2FA enabled",
      description: securitySettings.twoFactorEnabled
        ? "Two-factor authentication has been disabled."
        : "Two-factor authentication has been enabled.",
      source: "Security",
      severity: "info",
    });
  };

  const revokeSession = (sessionId: string) => {
    const target = sessions.find((session) => session.id === sessionId);
    if (!target || target.current) return;

    setSessions((current) => current.filter((session) => session.id !== sessionId));
    showToast({
      title: "Session revoked",
      description: `${target.deviceName} was signed out.`,
      source: "Security",
      severity: "info",
    });
  };

  const revokeAllOtherSessions = () => {
    setSessions((current) => current.filter((session) => session.current));
    showToast({
      title: "Other sessions revoked",
      description: "All non-current sessions have been signed out.",
      source: "Security",
      severity: "info",
    });
  };

  const inviteTeamMember = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (inviteName.trim().length < 2) {
      showToast({
        title: "Name required",
        description: "Enter a valid team member name.",
        source: "Team",
        severity: "warning",
      });
      return;
    }

    const normalizedEmail = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showToast({
        title: "Invalid email",
        description: "Enter a valid team member email.",
        source: "Team",
        severity: "warning",
      });
      return;
    }

    if (teamMembers.some((member) => member.email.toLowerCase() === normalizedEmail)) {
      showToast({
        title: "Already invited",
        description: "This email already exists in your team.",
        source: "Team",
        severity: "warning",
      });
      return;
    }

    const nextMember: TeamMember = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: inviteName.trim(),
      email: normalizedEmail,
      role: inviteRole,
      status: "invited",
      permissions: getDefaultPermissions(inviteRole),
    };

    setTeamMembers((current) => [nextMember, ...current]);
    setInviteName("");
    setInviteEmail("");
    setInviteRole("staff");
    showToast({
      title: "Invite sent",
      description: `${nextMember.name} has been invited as ${nextMember.role}.`,
      source: "Team",
      severity: "info",
    });
  };

  const updateMemberRole = (memberId: string, role: TeamRole) => {
    setTeamMembers((current) =>
      current.map((member) =>
        member.id === memberId
          ? {
              ...member,
              role,
              permissions: getDefaultPermissions(role),
              status: "active",
            }
          : member,
      ),
    );
  };

  const togglePermission = (memberId: string, permission: keyof TeamMember["permissions"]) => {
    setTeamMembers((current) =>
      current.map((member) => {
        if (member.id !== memberId) return member;
        if (member.role === "owner") return member;
        return {
          ...member,
          permissions: {
            ...member.permissions,
            [permission]: !member.permissions[permission],
          },
          status: "active",
        };
      }),
    );
  };

  const removeMember = (memberId: string) => {
    const target = teamMembers.find((member) => member.id === memberId);
    if (!target || target.role === "owner") return;
    setTeamMembers((current) => current.filter((member) => member.id !== memberId));
  };

  const deleteAccount = () => {
    if (typeof window === "undefined") return;

    const confirmed = window.confirm(
      "Delete account and local workspace data? This action will sign you out and cannot be undone.",
    );
    if (!confirmed) return;

    signOut();
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    window.localStorage.removeItem(SECURITY_SETTINGS_STORAGE_KEY);
    window.localStorage.removeItem(DEVICE_SESSIONS_STORAGE_KEY);
    window.localStorage.removeItem(TEAM_SETTINGS_STORAGE_KEY);
    showToast({
      title: "Account deleted",
      description: "Your local account data has been removed.",
      source: "Security",
      severity: "warning",
    });
    router.push("/signup");
  };

  const sessionCountLabel = `${sessions.length} active session${sessions.length === 1 ? "" : "s"}`;

  return (
    <SmartStockShell
      title="Settings"
      subtitle="Manage profile, appearance, security, and team permissions for your workspace."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Profile information</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This information appears across billing, exports, and team notifications.
          </p>

          <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
            <div className="grid gap-1 sm:grid-cols-2 sm:gap-3">
              <label htmlFor="settings-full-name" className="grid gap-1 text-xs text-muted-foreground">
                Full name
                <input
                  id="settings-full-name"
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                  placeholder="Full name"
                  value={settings.fullName}
                  onChange={(event) => setSettings((current) => ({ ...current, fullName: event.target.value }))}
                />
              </label>
              <label htmlFor="settings-email" className="grid gap-1 text-xs text-muted-foreground">
                Email address
                <input
                  id="settings-email"
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                  placeholder="Email address"
                  type="email"
                  value={settings.email}
                  onChange={(event) => setSettings((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
            </div>

            <div className="grid gap-1 sm:grid-cols-2 sm:gap-3">
              <label htmlFor="settings-phone" className="grid gap-1 text-xs text-muted-foreground">
                Phone number
                <input
                  id="settings-phone"
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                  placeholder="Phone number"
                  value={settings.phone}
                  onChange={(event) => setSettings((current) => ({ ...current, phone: event.target.value }))}
                />
              </label>
              <label htmlFor="settings-business-name" className="grid gap-1 text-xs text-muted-foreground">
                Business name
                <input
                  id="settings-business-name"
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                  placeholder="Business name"
                  value={settings.businessName}
                  onChange={(event) => setSettings((current) => ({ ...current, businessName: event.target.value }))}
                />
              </label>
            </div>

            <div className="grid gap-1 sm:grid-cols-3 sm:gap-3">
              <label htmlFor="settings-timezone" className="grid gap-1 text-xs text-muted-foreground">
                Timezone
                <select
                  id="settings-timezone"
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                  value={settings.timezone}
                  onChange={(event) => setSettings((current) => ({ ...current, timezone: event.target.value }))}
                >
                  <option value="Asia/Phnom_Penh">Asia/Phnom_Penh</option>
                  <option value="Asia/Singapore">Asia/Singapore</option>
                  <option value="UTC">UTC</option>
                </select>
              </label>

              <label htmlFor="settings-language" className="grid gap-1 text-xs text-muted-foreground">
                Language
                <select
                  id="settings-language"
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                  value={settings.language}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, language: event.target.value as AppLanguage }))
                  }
                >
                  <option value="en">English</option>
                  <option value="km">Khmer</option>
                </select>
              </label>

              <label htmlFor="settings-currency" className="grid gap-1 text-xs text-muted-foreground">
                Currency
                <select
                  id="settings-currency"
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                  value={settings.currency}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, currency: event.target.value as AppCurrency }))
                  }
                >
                  <option value="USD">USD ($)</option>
                  <option value="KHR">KHR (៛)</option>
                </select>
              </label>
            </div>

            <div className="mt-1 space-y-2 rounded-lg border border-border/70 bg-background/60 p-3">
              <label htmlFor="settings-email-alerts" className="flex items-center justify-between gap-3 text-sm text-foreground">
                <span>Email alerts</span>
                <input
                  id="settings-email-alerts"
                  type="checkbox"
                  checked={settings.emailAlerts}
                  onChange={(event) => setSettings((current) => ({ ...current, emailAlerts: event.target.checked }))}
                />
              </label>
              <label htmlFor="settings-telegram-alerts" className="flex items-center justify-between gap-3 text-sm text-foreground">
                <span>Telegram alerts</span>
                <input
                  id="settings-telegram-alerts"
                  type="checkbox"
                  checked={settings.telegramAlerts}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, telegramAlerts: event.target.checked }))
                  }
                />
              </label>
              <label htmlFor="settings-compact-rows" className="flex items-center justify-between gap-3 text-sm text-foreground">
                <span>Compact table rows</span>
                <input
                  id="settings-compact-rows"
                  type="checkbox"
                  checked={settings.compactTables}
                  onChange={(event) => setSettings((current) => ({ ...current, compactTables: event.target.checked }))}
                />
              </label>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Save settings
              </button>
              <button
                type="button"
                onClick={() => setSettings(defaultSettings)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground"
              >
                Reset form
              </button>
            </div>
          </form>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Switch dark and light mode for your workspace.
          </p>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-border/70 bg-background/60 p-3">
            <p className="text-sm font-medium text-foreground">Quick toggle</p>
            <ModeToggle />
          </div>

          <div className="mt-3 grid gap-2">
            {[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
              { value: "system", label: "System" },
            ].map((option) => {
              const active = selectedTheme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Security</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Change password, configure 2FA, and manage signed-in devices.
          </p>

          <form className="mt-4 grid gap-3" onSubmit={submitPasswordChange}>
            <label htmlFor="settings-current-password" className="grid gap-1 text-sm text-muted-foreground">
              Current password
              <input
                id="settings-current-password"
                className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Enter current password"
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <label htmlFor="settings-new-password" className="grid gap-1 text-sm text-muted-foreground">
                New password
                <input
                  id="settings-new-password"
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
              </label>
              <label htmlFor="settings-confirm-password" className="grid gap-1 text-sm text-muted-foreground">
                Confirm password
                <input
                  id="settings-confirm-password"
                  className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter new password"
                />
              </label>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Change password
            </button>
          </form>

          <div className="mt-4 rounded-xl border border-border/70 bg-background/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Two-factor authentication (2FA)</p>
                <p className="text-xs text-muted-foreground">
                  {securitySettings.twoFactorEnabled ? "Enabled" : "Disabled"}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleTwoFactor}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground"
              >
                {securitySettings.twoFactorEnabled ? "Disable" : "Enable"}
              </button>
            </div>

            <label htmlFor="settings-recovery-email" className="mt-3 grid gap-1 text-sm text-muted-foreground">
              Recovery email
              <input
                id="settings-recovery-email"
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                type="email"
                value={securitySettings.recoveryEmail}
                onChange={(event) =>
                  setSecuritySettings((current) => ({ ...current, recoveryEmail: event.target.value }))
                }
                placeholder="security@yourcompany.com"
              />
            </label>
          </div>

          <div className="mt-4 rounded-xl border border-border/70 bg-background/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">Device sessions</p>
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {sessionCountLabel}
              </span>
            </div>
            <ul className="mt-2 space-y-2">
              {sessions.map((session) => (
                <li key={session.id} className="rounded-lg border border-border bg-background p-2 text-xs">
                  <p className="font-medium text-foreground">
                    {session.deviceName} {session.current ? "(current)" : ""}
                  </p>
                  <p className="text-muted-foreground">{session.location}</p>
                  <p className="text-muted-foreground">
                    Last active: {formatDateTime(session.lastActiveAt, preferences)}
                  </p>
                  {!session.current && (
                    <button
                      type="button"
                      onClick={() => revokeSession(session.id)}
                      className="mt-1 rounded border border-border px-2 py-1 text-[11px] font-semibold text-foreground"
                    >
                      Revoke
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={revokeAllOtherSessions}
              className="mt-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground"
            >
              Sign out all other devices
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm font-semibold text-foreground">Danger zone</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Permanently remove this account profile and sign out from the workspace.
            </p>
            <button
              type="button"
              onClick={deleteAccount}
              className="mt-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive"
            >
              Delete account
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Organization and Team</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite members, assign roles, and configure permissions.
          </p>

          <form className="mt-4 grid gap-2" onSubmit={inviteTeamMember}>
            <label htmlFor="team-invite-name" className="grid gap-1 text-xs text-muted-foreground">
              Team member name
              <input
                id="team-invite-name"
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
                placeholder="Team member name"
              />
            </label>
            <label htmlFor="team-invite-email" className="grid gap-1 text-xs text-muted-foreground">
              Team member email
              <input
                id="team-invite-email"
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="member@company.com"
              />
            </label>
            <label htmlFor="team-invite-role" className="grid gap-1 text-xs text-muted-foreground">
              Team role
              <select
                id="team-invite-role"
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as TeamRole)}
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Invite member
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {teamMembers.map((member) => (
              <div key={member.id} className="rounded-lg border border-border/70 bg-background/60 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.email} · {member.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
                      value={member.role}
                      onChange={(event) => updateMemberRole(member.id, event.target.value as TeamRole)}
                      disabled={member.role === "owner"}
                      aria-label={`Role for ${member.name}`}
                    >
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="staff">Staff</option>
                    </select>
                    {member.role !== "owner" && (
                      <button
                        type="button"
                        onClick={() => removeMember(member.id)}
                        className="h-8 rounded border border-border bg-background px-2 text-xs font-semibold text-foreground"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  {(["billing", "inventory", "reports", "settings"] as const).map((permission) => (
                    <label
                      key={`${member.id}-${permission}`}
                      className="flex items-center justify-between rounded border border-border bg-background px-2 py-1 text-foreground"
                    >
                      <span className="capitalize">{permission}</span>
                      <input
                        type="checkbox"
                        checked={member.permissions[permission]}
                        onChange={() => togglePermission(member.id, permission)}
                        disabled={member.role === "owner"}
                        aria-label={`${permission} permission for ${member.name}`}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </SmartStockShell>
  );
}
