"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/components/theme-provider";
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

/* ------------------------------------------------------------------ */
/*  Icons                                                               */
/* ------------------------------------------------------------------ */
const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
);
const IconPalette = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
);
const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
);
const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const IconMonitor = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
);
const IconSun = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
);
const IconMoon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);
const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
);
const IconSmartphone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
);
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
const IconChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);
const IconLayout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
);

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
type Tab = "profile" | "appearance" | "security" | "team";

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

/* ------------------------------------------------------------------ */
/*  Storage helpers                                                     */
/* ------------------------------------------------------------------ */
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
      permissions: { billing: true, inventory: true, reports: true, settings: true },
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
  if (role === "owner" || role === "admin") return { billing: true, inventory: true, reports: true, settings: true };
  if (role === "manager") return { billing: false, inventory: true, reports: true, settings: false };
  return { billing: false, inventory: true, reports: false, settings: false };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getRoleColor(role: TeamRole): string {
  if (role === "owner") return "bg-violet-500/15 text-violet-600 dark:text-violet-400";
  if (role === "admin") return "bg-blue-500/15 text-blue-600 dark:text-blue-400";
  if (role === "manager") return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  return "bg-muted text-muted-foreground";
}

/* ------------------------------------------------------------------ */
/*  Toggle switch component                                             */
/* ------------------------------------------------------------------ */
function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        checked ? "bg-primary" : "bg-input"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Field wrapper                                                       */
/* ------------------------------------------------------------------ */
function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50";

const selectCls =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20";

/* ------------------------------------------------------------------ */
/*  Section card                                                        */
/* ------------------------------------------------------------------ */
function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                           */
/* ------------------------------------------------------------------ */
export default function SettingPage() {
  const t = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const preferences = useUserPreferences();
  const { resolvedTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const [settings, setSettings] = useState<SettingsForm>(() => {
    const storedSettings = readSettings();
    const storedPreferences = readUserPreferences();
    return { ...storedSettings, language: storedPreferences.language, currency: storedPreferences.currency, timezone: storedPreferences.timezone };
  });
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => {
    const authUser = readAuthUser();
    const storedSecurity = readSecuritySettings();
    return { ...storedSecurity, recoveryEmail: storedSecurity.recoveryEmail || authUser?.email || "" };
  });
  const [sessions, setSessions] = useState<SessionRecord[]>(() => readSessions());
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => readTeamMembers());

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("staff");

  useEffect(() => { writeSecuritySettings(securitySettings); }, [securitySettings]);
  useEffect(() => { writeSessions(sessions); }, [sessions]);
  useEffect(() => { writeTeamMembers(teamMembers); }, [teamMembers]);

  const selectedTheme = useMemo(() => {
    if (resolvedTheme === "dark") return "dark";
    if (resolvedTheme === "light") return "light";
    return "system";
  }, [resolvedTheme]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (settings.fullName.trim().length < 2) {
      showToast({ title: "Profile name required", description: "Please enter your full name.", source: "Settings", severity: "warning" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email.trim())) {
      showToast({ title: "Invalid email", description: "Please provide a valid email address.", source: "Settings", severity: "warning" });
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
    updateUserPreferences({ language: normalized.language, currency: normalized.currency, timezone: normalized.timezone });
    showToast({ title: "Settings saved", description: "Your profile and preferences have been updated.", source: "Settings", severity: "info" });
  };

  const submitPasswordChange = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (currentPassword.trim().length < 6) {
      showToast({ title: "Current password required", description: "Enter your current password to continue.", source: "Security", severity: "warning" });
      return;
    }
    if (newPassword.trim().length < 8) {
      showToast({ title: "Weak new password", description: "New password must be at least 8 characters.", source: "Security", severity: "warning" });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({ title: "Password mismatch", description: "New password and confirmation do not match.", source: "Security", severity: "warning" });
      return;
    }
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    showToast({ title: "Password changed", description: "Your password has been updated successfully.", source: "Security", severity: "info" });
  };

  const toggleTwoFactor = () => {
    setSecuritySettings((c) => ({ ...c, twoFactorEnabled: !c.twoFactorEnabled }));
    showToast({
      title: securitySettings.twoFactorEnabled ? "2FA disabled" : "2FA enabled",
      description: securitySettings.twoFactorEnabled ? "Two-factor authentication has been disabled." : "Two-factor authentication has been enabled.",
      source: "Security", severity: "info",
    });
  };

  const revokeSession = (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (!target || target.current) return;
    setSessions((c) => c.filter((s) => s.id !== sessionId));
    showToast({ title: "Session revoked", description: `${target.deviceName} was signed out.`, source: "Security", severity: "info" });
  };

  const revokeAllOtherSessions = () => {
    setSessions((c) => c.filter((s) => s.current));
    showToast({ title: "Other sessions revoked", description: "All non-current sessions have been signed out.", source: "Security", severity: "info" });
  };

  const inviteTeamMember = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inviteName.trim().length < 2) {
      showToast({ title: "Name required", description: "Enter a valid team member name.", source: "Team", severity: "warning" }); return;
    }
    const normalizedEmail = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showToast({ title: "Invalid email", description: "Enter a valid team member email.", source: "Team", severity: "warning" }); return;
    }
    if (teamMembers.some((m) => m.email.toLowerCase() === normalizedEmail)) {
      showToast({ title: "Already invited", description: "This email already exists in your team.", source: "Team", severity: "warning" }); return;
    }
    const nextMember: TeamMember = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: inviteName.trim(), email: normalizedEmail, role: inviteRole,
      status: "invited", permissions: getDefaultPermissions(inviteRole),
    };
    setTeamMembers((c) => [nextMember, ...c]);
    setInviteName(""); setInviteEmail(""); setInviteRole("staff");
    showToast({ title: "Invite sent", description: `${nextMember.name} has been invited as ${nextMember.role}.`, source: "Team", severity: "info" });
  };

  const updateMemberRole = (memberId: string, role: TeamRole) => {
    setTeamMembers((c) => c.map((m) => m.id === memberId ? { ...m, role, permissions: getDefaultPermissions(role), status: "active" } : m));
  };

  const togglePermission = (memberId: string, permission: keyof TeamMember["permissions"]) => {
    setTeamMembers((c) => c.map((m) => {
      if (m.id !== memberId || m.role === "owner") return m;
      return { ...m, permissions: { ...m.permissions, [permission]: !m.permissions[permission] }, status: "active" };
    }));
  };

  const removeMember = (memberId: string) => {
    const target = teamMembers.find((m) => m.id === memberId);
    if (!target || target.role === "owner") return;
    setTeamMembers((c) => c.filter((m) => m.id !== memberId));
  };

  const deleteAccount = () => {
    if (typeof window === "undefined") return;
    const confirmed = window.confirm("Delete account and local workspace data? This action will sign you out and cannot be undone.");
    if (!confirmed) return;
    signOut();
    [SETTINGS_STORAGE_KEY, SECURITY_SETTINGS_STORAGE_KEY, DEVICE_SESSIONS_STORAGE_KEY, TEAM_SETTINGS_STORAGE_KEY].forEach(
      (key) => window.localStorage.removeItem(key),
    );
    showToast({ title: "Account deleted", description: "Your local account data has been removed.", source: "Security", severity: "warning" });
    router.push("/signup");
  };

  /* ---- Sidebar nav ---- */
  const tabs = useMemo(() => [
    { id: "profile" as Tab, label: t("settings.tabs.profile", "Profile"), icon: <IconUser /> },
    { id: "appearance" as Tab, label: t("settings.tabs.appearance", "Appearance"), icon: <IconPalette /> },
    { id: "security" as Tab, label: t("settings.tabs.security", "Security"), icon: <IconShield /> },
    { id: "team" as Tab, label: t("settings.tabs.team", "Team"), icon: <IconUsers /> },
  ], [t]);

  const avatarInitials = getInitials(settings.fullName || "User");

  return (
    <SmartStockShell
      title={t("settings.title", "Settings")}
      subtitle={t("settings.subtitle", "Manage your profile, appearance, security, and team.")}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Sidebar */}
        <aside className="flex shrink-0 flex-col gap-1 lg:w-52">
          {/* Profile summary */}
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {avatarInitials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {settings.fullName || "Your Name"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {settings.email || "email@example.com"}
              </p>
            </div>
          </div>

          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className={activeTab === tab.id ? "text-primary" : "text-muted-foreground"}>
                {tab.icon}
              </span>
              {tab.label}
              {activeTab === tab.id && (
                <span className="ml-auto">
                  <IconChevronRight />
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* Content area */}
        <div className="min-w-0 flex-1 space-y-4">

          {/* ── Profile tab ── */}
          {activeTab === "profile" && (
            <>
              <SectionCard title={t("settings.personalInfo", "Personal information")} description={t("settings.personalInfoDesc", "This information appears across billing, exports, and team notifications.")}>
                <form className="space-y-4" onSubmit={onSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t("settings.fullName", "Full name")} htmlFor="settings-full-name">
                      <input
                        id="settings-full-name"
                        className={inputCls}
                        placeholder="Jane Smith"
                        value={settings.fullName}
                        onChange={(e) => setSettings((c) => ({ ...c, fullName: e.target.value }))}
                      />
                    </Field>
                    <Field label={t("settings.emailAddress", "Email address")} htmlFor="settings-email">
                      <input
                        id="settings-email"
                        className={inputCls}
                        placeholder="jane@company.com"
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings((c) => ({ ...c, email: e.target.value }))}
                      />
                    </Field>
                    <Field label={t("settings.phoneNumber", "Phone number")} htmlFor="settings-phone">
                      <input
                        id="settings-phone"
                        className={inputCls}
                        placeholder="+855 12 345 678"
                        value={settings.phone}
                        onChange={(e) => setSettings((c) => ({ ...c, phone: e.target.value }))}
                      />
                    </Field>
                    <Field label={t("settings.businessName", "Business name")} htmlFor="settings-business-name">
                      <input
                        id="settings-business-name"
                        className={inputCls}
                        placeholder="Acme Corp"
                        value={settings.businessName}
                        onChange={(e) => setSettings((c) => ({ ...c, businessName: e.target.value }))}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label={t("settings.timezone", "Timezone")} htmlFor="settings-timezone">
                      <select
                        id="settings-timezone"
                        className={selectCls}
                        value={settings.timezone}
                        onChange={(e) => setSettings((c) => ({ ...c, timezone: e.target.value }))}
                      >
                        <option value="Asia/Phnom_Penh">Asia/Phnom_Penh</option>
                        <option value="Asia/Singapore">Asia/Singapore</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </Field>
                    <Field label={t("settings.language", "Language")} htmlFor="settings-language">
                      <select
                        id="settings-language"
                        className={selectCls}
                        value={settings.language}
                        onChange={(e) => setSettings((c) => ({ ...c, language: e.target.value as AppLanguage }))}
                      >
                        <option value="en">English</option>
                        <option value="km">Khmer</option>
                      </select>
                    </Field>
                    <Field label={t("settings.currency", "Currency")} htmlFor="settings-currency">
                      <select
                        id="settings-currency"
                        className={selectCls}
                        value={settings.currency}
                        onChange={(e) => setSettings((c) => ({ ...c, currency: e.target.value as AppCurrency }))}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="KHR">KHR (៛)</option>
                      </select>
                    </Field>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                      {t("settings.saveChanges", "Save changes")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings(defaultSettings)}
                      className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {t("settings.reset", "Reset")}
                    </button>
                  </div>
                </form>
              </SectionCard>

              <SectionCard title={t("settings.preferences", "Preferences")} description={t("settings.preferencesDesc", "Notifications and display settings for your workspace.")}>
                <div className="space-y-1 divide-y divide-border/60">
                  {[
                    { id: "email-alerts", icon: <IconMail />, label: t("settings.emailAlerts", "Email alerts"), description: t("settings.emailAlertsDesc", "Receive important updates via email"), key: "emailAlerts" as const },
                    { id: "telegram-alerts", icon: <IconSmartphone />, label: t("settings.telegramAlerts", "Telegram alerts"), description: t("settings.telegramAlertsDesc", "Get stock notifications on Telegram"), key: "telegramAlerts" as const },
                    { id: "compact-rows", icon: <IconLayout />, label: t("settings.compactRows", "Compact table rows"), description: t("settings.compactRowsDesc", "Show more items per screen in tables"), key: "compactTables" as const },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{item.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <Toggle
                        id={item.id}
                        checked={settings[item.key]}
                        onChange={(v) => setSettings((c) => ({ ...c, [item.key]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          )}

          {/* ── Appearance tab ── */}
          {activeTab === "appearance" && (
            <SectionCard title={t("settings.themeSection", "Theme")} description={t("settings.themeSectionDesc", "Choose how SmartStock looks on your device.")}>
              <div className="mb-4 flex items-center justify-between rounded-lg border border-border/70 bg-background/60 px-3 py-2.5">
                <p className="text-sm font-medium text-foreground">{t("settings.themeQuickToggle", "Quick toggle")}</p>
                <ModeToggle />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { value: "light", label: "Light", icon: <IconSun />, preview: "bg-white border-gray-200" },
                    { value: "dark", label: "Dark", icon: <IconMoon />, preview: "bg-zinc-900 border-zinc-700" },
                    { value: "system", label: "System", icon: <IconMonitor />, preview: "bg-gradient-to-br from-white to-zinc-900 border-gray-300" },
                  ] as const
                ).map((option) => {
                  const active = selectedTheme === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      className={`group relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm transition-all ${
                        active
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-border/80 hover:bg-muted/30"
                      }`}
                    >
                      {/* Mini preview */}
                      <div className={`h-12 w-full rounded-lg border ${option.preview}`} />
                      <div className="flex items-center gap-1.5">
                        <span className={active ? "text-primary" : "text-muted-foreground"}>{option.icon}</span>
                        <span className={`font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{t(`settings.${option.value}`, option.label)}</span>
                      </div>
                      {active && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <IconCheck />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* ── Security tab ── */}
          {activeTab === "security" && (
            <>
              <SectionCard title={t("settings.changePassword", "Change password")} description={t("settings.changePasswordDesc", "Use a strong password of at least 8 characters.")}>
                <form className="space-y-3" onSubmit={submitPasswordChange}>
                  <Field label={t("settings.currentPassword", "Current password")} htmlFor="settings-current-password">
                    <input
                      id="settings-current-password"
                      className={inputCls}
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t("settings.currentPassword", "Enter current password")}
                    />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label={t("settings.newPassword", "New password")} htmlFor="settings-new-password">
                      <input
                        id="settings-new-password"
                        className={inputCls}
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                      />
                    </Field>
                    <Field label={t("settings.confirmPassword", "Confirm password")} htmlFor="settings-confirm-password">
                      <input
                        id="settings-confirm-password"
                        className={inputCls}
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                      />
                    </Field>
                  </div>
                  <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                    {t("settings.updatePassword", "Update password")}
                  </button>
                </form>
              </SectionCard>

              <SectionCard title={t("settings.twoFactor", "Two-factor authentication")} description={t("settings.twoFactorDesc", "Add an extra layer of security to your account.")}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-background/60 p-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${securitySettings.twoFactorEnabled ? "bg-green-500/15 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                        <IconShield />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t("settings.authenticatorApp", "Authenticator app")}</p>
                        <p className="text-xs text-muted-foreground">{securitySettings.twoFactorEnabled ? t("settings.activeProtect", "Active and protecting your account") : t("settings.notConfigured", "Not configured")}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={toggleTwoFactor}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        securitySettings.twoFactorEnabled
                          ? "border border-border bg-background text-muted-foreground hover:text-foreground"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {securitySettings.twoFactorEnabled ? t("settings.disable", "Disable") : t("settings.enable2fa", "Enable 2FA")}
                    </button>
                  </div>

                  <Field label={t("settings.recoveryEmail", "Recovery email")} htmlFor="settings-recovery-email">
                    <input
                      id="settings-recovery-email"
                      className={inputCls}
                      type="email"
                      value={securitySettings.recoveryEmail}
                      onChange={(e) => setSecuritySettings((c) => ({ ...c, recoveryEmail: e.target.value }))}
                      placeholder="security@yourcompany.com"
                    />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard
                title={t("settings.activeSessions", "Active sessions")}
                description={t(sessions.length === 1 ? "settings.activeSessionCount" : "settings.activeSessionsCount", "{{count}} active sessions", { count: sessions.length })}
              >
                <ul className="space-y-2">
                  {sessions.map((session) => (
                    <li key={session.id} className="flex items-start justify-between gap-3 rounded-lg border border-border/70 bg-background/60 p-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <IconMonitor />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {session.deviceName}
                            {session.current && (
                              <span className="ml-2 rounded-full bg-green-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400">
                                {t("settings.current", "Current")}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{session.location}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("settings.lastActive", "Last active: {{time}}", { time: formatDateTime(session.lastActiveAt, preferences) })}
                          </p>
                        </div>
                      </div>
                      {!session.current && (
                        <button
                          type="button"
                          onClick={() => revokeSession(session.id)}
                          className="shrink-0 rounded border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                        >
                          {t("settings.revoke", "Revoke")}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={revokeAllOtherSessions}
                  className="mt-3 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors"
                >
                  {t("settings.signOutOther", "Sign out all other devices")}
                </button>
              </SectionCard>

              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                <p className="text-sm font-semibold text-foreground">{t("settings.dangerZone", "Danger zone")}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("settings.dangerZoneDesc", "Permanently remove this account profile and sign out from the workspace. This action cannot be undone.")}
                </p>
                <button
                  type="button"
                  onClick={deleteAccount}
                  className="mt-3 flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <IconTrash />
                  {t("settings.deleteAccount", "Delete account")}
                </button>
              </div>
            </>
          )}

          {/* ── Team tab ── */}
          {activeTab === "team" && (
            <>
              <SectionCard title={t("settings.inviteTeam", "Invite a team member")} description={t("settings.inviteTeamDesc", "New members will receive an invitation email.")}>
                <form className="space-y-3" onSubmit={inviteTeamMember}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label={t("settings.fullName", "Full name")} htmlFor="team-invite-name">
                      <input
                        id="team-invite-name"
                        className={inputCls}
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        placeholder="Team member name"
                      />
                    </Field>
                    <Field label={t("settings.emailAddress", "Email address")} htmlFor="team-invite-email">
                      <input
                        id="team-invite-email"
                        className={inputCls}
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="member@company.com"
                      />
                    </Field>
                  </div>
                  <Field label={t("settings.role", "Role")} htmlFor="team-invite-role">
                    <select
                      id="team-invite-role"
                      className={selectCls}
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                    >
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </Field>
                  <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                    <IconPlus />
                    {t("settings.inviteMember", "Invite member")}
                  </button>
                </form>
              </SectionCard>

              <SectionCard title={t("settings.teamMembers", "Team members")} description={t(teamMembers.length === 1 ? "settings.memberWorkspace" : "settings.membersWorkspace", "{{count}} members in your workspace", { count: teamMembers.length })}>
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="rounded-xl border border-border/70 bg-background/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{member.name}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${getRoleColor(member.role)}`}>
                                {member.role}
                              </span>
                              {member.status === "invited" && (
                                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                  {t("settings.pending", "Pending")}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                            value={member.role}
                            onChange={(e) => updateMemberRole(member.id, e.target.value as TeamRole)}
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
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-colors"
                              aria-label={`Remove ${member.name}`}
                            >
                              <IconTrash />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                        {(["billing", "inventory", "reports", "settings"] as const).map((permission) => {
                          const granted = member.permissions[permission];
                          return (
                            <button
                              key={`${member.id}-${permission}`}
                              type="button"
                              onClick={() => togglePermission(member.id, permission)}
                              disabled={member.role === "owner"}
                              className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition-colors disabled:cursor-not-allowed ${
                                granted
                                  ? "border-primary/30 bg-primary/5 text-foreground"
                                  : "border-border bg-background text-muted-foreground hover:border-border/80"
                              }`}
                            >
                              <span className="capitalize">{permission}</span>
                              <span className={`flex h-4 w-4 items-center justify-center rounded-full ${granted ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                {granted && <IconCheck />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </SmartStockShell>
  );
}
