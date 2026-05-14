"use client";
// app/admin/settings/page.tsx
// Platform Control Center — feature flags + navigation to sub-pages.

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  LuSettings,
  LuLoader,
  LuSave,
  LuBuilding2,
  LuGraduationCap,
  LuBookOpen,
  LuUsers,
  LuCode,
  LuShield,
  LuBug,
  LuChevronRight,
  LuLayoutTemplate, // ← Landing Page
  LuInfo, // ← About Page
} from "react-icons/lu";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { PlatformConfigValue } from "@/lib/models/platformConfig";

type Config = Record<string, PlatformConfigValue>;

const SUB_PAGES = [
  {
    label: "Institutions",
    icon: LuBuilding2,
    path: "/admin/settings/institutions",
    desc: "Manage universities and polytechnics",
  },
  {
    label: "Landing Page",
    icon: LuLayoutTemplate, // ← was LuBuilding2
    path: "/admin/settings/landing",
    desc: "Manage landing page data and information",
  },
  {
    label: "About Page", // ← new entry
    icon: LuInfo,
    path: "/admin/settings/about",
    desc: "Manage about page sections and content",
  },
  {
    label: "Faculties",
    icon: LuGraduationCap,
    path: "/admin/settings/faculties",
    desc: "Manage faculties across institutions",
  },
  {
    label: "Departments",
    icon: LuBookOpen,
    path: "/admin/settings/departments",
    desc: "Manage departments within faculties",
  },
  {
    label: "Committees",
    icon: LuUsers,
    path: "/admin/settings/committees",
    desc: "Manage platform committees",
  },
  {
    label: "Skills",
    icon: LuCode,
    path: "/admin/settings/skills",
    desc: "Manage the skills catalogue",
  },
  {
    label: "Committee Roles",
    icon: LuShield,
    path: "/admin/settings/roles",
    desc: "Manage committee role hierarchy",
  },
];

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<Config | null>(null);
  const [dirty, setDirty] = useState<Partial<Config>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConfig(data.config ?? {});
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const set = (key: string, value: PlatformConfigValue) => {
    setConfig((c) => (c ? { ...c, [key]: value } : c));
    setDirty((d) => ({ ...d, [key]: value }));
  };

  const save = async () => {
    if (!token || Object.keys(dirty).length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dirty),
      });
      if (!res.ok) throw new Error("Save failed");
      setDirty({});
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full mt-20">
        <LuLoader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const hasDirty = Object.keys(dirty).length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="max-w-[1600px] w-full mt-20 p-5 mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center shadow-xl shadow-foreground/20">
            <LuSettings className="w-7 h-7 text-background" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">
              Console Config
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Platform feature flags and content managers
            </p>
          </div>
        </div>
        {hasDirty && (
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-3 px-8 py-4 bg-primary text-foreground rounded-2xl font-black text-[11px] uppercase tracking-widest hover:opacity-90 transition-all shadow-xl cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <LuLoader className="w-5 h-5 animate-spin" />
            ) : (
              <LuSave className="w-5 h-5" />
            )}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        )}
      </div>

      {/* ── Section: Access Control ── */}
      <SettingsSection
        title="Access Control"
        desc="Control who can access and use the platform"
      >
        <ToggleRow
          label="Registration Open"
          desc="Allow new user registrations"
          value={config.registrationOpen as boolean}
          onChange={(v) => set("registrationOpen", v)}
        />
        <ToggleRow
          label="Events Open"
          desc="Allow users to register for events"
          value={config.eventsOpen as boolean}
          onChange={(v) => set("eventsOpen", v)}
        />
        <ToggleRow
          label="Applications Open"
          desc="Allow committee and skills applications"
          value={config.applicationsOpen as boolean}
          onChange={(v) => set("applicationsOpen", v)}
        />
        <ToggleRow
          label="Maintenance Mode"
          desc="Show maintenance page to non-admins"
          value={config.maintenanceMode as boolean}
          onChange={(v) => set("maintenanceMode", v)}
          warning
        />
      </SettingsSection>

      {/* ── Section: Invite Mode ── */}
      <SettingsSection
        title="Invite System"
        desc="Control how new users access the platform"
      >
        <div className="space-y-3">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            Invite Mode
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(["open", "lockdown", "referral"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => set("inviteMode", mode)}
                className={cn(
                  "p-5 rounded-2xl border-2 text-left transition-all cursor-pointer",
                  config.inviteMode === mode
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-slate-300",
                )}
              >
                <p
                  className={cn(
                    "text-[11px] font-black uppercase tracking-widest mb-1",
                    config.inviteMode === mode
                      ? "text-primary"
                      : "text-foreground",
                  )}
                >
                  {mode}
                </p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  {mode === "open" ? "Anyone can register freely" : ""}
                  {mode === "lockdown"
                    ? "Requires admin-generated invite code"
                    : ""}
                  {mode === "referral"
                    ? "Fee applies, discount with referral"
                    : ""}
                </p>
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* ── Section: Registration + Referral Config ── */}
      <SettingsSection
        title="Registration & Referral"
        desc="Fee and referral incentive configuration"
      >
        <NumberRow
          label="Registration Fee (₦)"
          desc="Fee charged at registration (0 = free)"
          value={config.registrationFee as number}
          onChange={(v) => set("registrationFee", v)}
        />
        <NumberRow
          label="Referral Discount (%)"
          desc="% discount given to user who uses a referral code"
          value={config.referralDiscountPercent as number}
          onChange={(v) => set("referralDiscountPercent", v)}
          min={0}
          max={100}
        />
        <NumberRow
          label="Referral Bonus Points"
          desc="Points credited to referrer on successful signup"
          value={config.referralBonusPoints as number}
          onChange={(v) => set("referralBonusPoints", v)}
        />
      </SettingsSection>

      {/* ── Section: UI Toggles ── */}
      <SettingsSection
        title="UI Toggles"
        desc="Show or hide sections on the public site"
      >
        <ToggleRow
          label="Show Banners"
          desc="Display banner section on homepage"
          value={config.showBanners as boolean}
          onChange={(v) => set("showBanners", v)}
        />
        <ToggleRow
          label="Show Gallery"
          desc="Display gallery section on homepage"
          value={config.showGallery as boolean}
          onChange={(v) => set("showGallery", v)}
        />
      </SettingsSection>

      {/* ── Section: Debug Mode ── */}
      <SettingsSection
        title="Debug Mode"
        desc="Enable bug reporting for specific users"
        icon={LuBug}
      >
        <ToggleRow
          label="Debug Mode"
          desc="Show bug report button to debug targets"
          value={config.debugMode as boolean}
          onChange={(v) => set("debugMode", v)}
          warning
        />
        {config.debugMode && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Debug Targets (User IDs, one per line — or type &quot;all&quot;)
            </label>
            <textarea
              rows={4}
              value={((config.debugTargets ?? []) as string[]).join("\n")}
              onChange={(e) =>
                set(
                  "debugTargets",
                  e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              placeholder={"all\n— or —\nuserIdHere\nanotherUserId"}
              className={cn(
                "w-full",
                "bg-muted",
                "border",
                "border-border",
                "rounded-2xl",
                "p-4",
                "text-xs",
                "font-mono",
                "outline-none",
                "focus:border-primary",
                "transition-all",
                "resize-none",
              )}
            />
            <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">
              Type &quot;all&quot; to enable for every user — use sparingly
            </p>
          </div>
        )}
      </SettingsSection>

      {/* ── Section: Content Managers ── */}
      <SettingsSection
        title="Content Managers"
        desc="Manage platform data — institutions, committees, skills and more"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {SUB_PAGES.map((sp) => {
            const Icon = sp.icon;
            return (
              <button
                key={sp.path}
                onClick={() => router.push(sp.path)}
                className={cn(
                  "flex",
                  "items-center",
                  "justify-between",
                  "gap-4",
                  "p-6",
                  "bg-background",
                  "border-2",
                  "border-border",
                  "rounded-2xl",
                  "hover:border-foreground",
                  "transition-all",
                  "group",
                  "cursor-pointer",
                  "text-left",
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-10",
                      "h-10",
                      "rounded-xl",
                      "bg-muted",
                      "flex",
                      "items-center",
                      "justify-center",
                      "group-hover:bg-foreground",
                      "transition-colors",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5",
                        "h-5",
                        "text-muted-foreground",
                        "group-hover:text-background",
                        "transition-colors",
                      )}
                    />
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-[11px]",
                        "font-black",
                        "text-foreground",
                        "uppercase",
                        "tracking-wide",
                      )}
                    >
                      {sp.label}
                    </p>
                    <p
                      className={cn(
                        "text-[9px]",
                        "font-bold",
                        "text-muted-foreground",
                        "uppercase",
                        "tracking-widest",
                        "mt-0.5",
                      )}
                    >
                      {sp.desc}
                    </p>
                  </div>
                </div>
                <LuChevronRight
                  className={cn(
                    "w-4",
                    "h-4",
                    "text-muted-foreground",
                    "group-hover:text-foreground",
                    "group-hover:translate-x-1",
                    "transition-all",
                    "shrink-0",
                  )}
                />
              </button>
            );
          })}
        </div>
      </SettingsSection>
    </motion.div>
  );
}

// ── Reusable section wrapper ──────────────────────────────────────────────────
const SettingsSection: React.FC<{
  title: string;
  desc: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}> = ({ title, desc, icon: Icon, children }) => (
  <div className="bg-background border-2 border-border rounded-[2.5rem] p-8 space-y-6">
    <div className="flex items-center gap-3 pb-6 border-b border-border">
      {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
      <div>
        <h2 className="text-sm font-black text-foreground uppercase tracking-tight">
          {title}
        </h2>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
          {desc}
        </p>
      </div>
    </div>
    <div className="space-y-5">{children}</div>
  </div>
);

// ── Toggle row ────────────────────────────────────────────────────────────────
const ToggleRow: React.FC<{
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  warning?: boolean;
}> = ({ label, desc, value, onChange, warning }) => (
  <div className="flex items-center justify-between gap-4 py-2">
    <div>
      <p
        className={cn(
          "text-[11px] font-black uppercase tracking-wide",
          warning && value ? "text-amber-600" : "text-foreground",
        )}
      >
        {label}
      </p>
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
        {desc}
      </p>
    </div>
    <button
      onClick={() => onChange(!value)}
      className={cn(
        "relative w-12 h-6 rounded-full transition-all cursor-pointer shrink-0",
        value
          ? warning
            ? "bg-amber-500"
            : "bg-primary"
          : "bg-muted border border-border",
      )}
    >
      <div
        className={cn(
          "absolute top-1 w-4 h-4 bg-background rounded-full shadow-sm transition-all",
          value ? "left-7" : "left-1",
        )}
      />
    </button>
  </div>
);

// ── Number input row ──────────────────────────────────────────────────────────
const NumberRow: React.FC<{
  label: string;
  desc: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}> = ({ label, desc, value, onChange, min = 0, max }) => (
  <div className="flex items-center justify-between gap-4 py-2">
    <div className="flex-1">
      <p className="text-[11px] font-black text-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
        {desc}
      </p>
    </div>
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Math.max(min, parseInt(e.target.value) || 0))}
      className={cn(
        "w-28",
        "bg-muted",
        "border",
        "border-border",
        "rounded-xl",
        "p-3",
        "text-sm",
        "font-black",
        "text-right",
        "outline-none",
        "focus:border-primary",
        "transition-all",
      )}
    />
  </div>
);
