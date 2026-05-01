// types/domain.ts
// ─────────────────────────────────────────────────────────────────────────────
// Committee, Skill, and CommitteeRole are now DB-driven (see PlatformConfig.ts).
// They are typed as `string` here so any slug from the DB is accepted.
// Validation against live DB values happens in API routes, not at the type level.
//
// The former COMMITTEES, SKILLS, COMMITTEE_ROLES const arrays are removed.
// Source of truth is now:
//   GET /api/platform/committees
//   GET /api/platform/skills
//   GET /api/platform/committee-roles
// ─────────────────────────────────────────────────────────────────────────────

import { ObjectId } from "mongodb";

export type EduStatus = "STUDENT" | "GRADUATE";
export type AccountRole = "participant" | "moderator" | "admin" | "webmaster";

/**
 * DB-driven — value is a committee slug from the `committees` collection.
 * e.g. "socials", "media", "logistics"
 */
export type Committee = string;

/**
 * DB-driven — value is a skill slug from the `skills` collection.
 * e.g. "photography", "programming", "design"
 */
export type Skill = string;

/**
 * DB-driven — value is a role slug from the `committeeRoles` collection.
 * e.g. "MEMBER", "COORDINATOR", "HEAD", "ADMIN"
 */
export type CommitteeRole = string;

export interface PhoneNumber {
  countryCode: number;
  phoneNumber: number;
}

// A user's single committee membership with an attached role.
// null = not in any committee yet.
export interface CommitteeMembership {
  committee: Committee;
  role: CommitteeRole;
  joinedAt: Date;
  assignedBy?: ObjectId; // → Vault._id of admin who assigned/changed the role
}

// ── User Preferences (persisted on UserDataDocument) ─────────────────────────

export type ThemeMode = "light" | "dark" | "system";
export type AccentColor =
  | "orange"
  | "emerald"
  | "violet"
  | "rose"
  | "amber"
  | "sky"
  | "indigo"
  | "cyan";
export type NotificationFrequency = "instant" | "daily" | "weekly";

export interface NotificationPreferences {
  frequency: NotificationFrequency;
  tickets: boolean; // ticket confirmations & QR codes
  reminders: boolean; // 24h/1h event reminders
  messages: boolean; // direct messages from other members
  marketing: boolean; // news & platform features
}

export interface AppearancePreferences {
  theme: ThemeMode;
  accent: AccentColor;
}

export interface PrivacyPreferences {
  profileVisibility: "public" | "members" | "private";
  fieldPermissions: {
    phone: "public" | "members" | "private";
    email: "public" | "members" | "private";
    location: "public" | "members" | "private";
    socials: "public" | "members" | "private";
    academic: "public" | "members" | "private"; // For CGPA/Level
  }
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  appearance: AppearancePreferences;
  privacy: PrivacyPreferences;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  notifications: {
    frequency: "instant",
    tickets: true,
    reminders: true,
    messages: false,
    marketing: false,
  },
  appearance: {
    theme: "light",
    accent: "sky",
  },
  privacy: {
    profileVisibility: "members",
    fieldPermissions: {
      phone: 'private',
      email: "members",
    location: "private",
    socials: "members",
    academic: "private",
    },
  },
};

// ── Static value lists (these are NOT DB-driven — keep them here) ─────────────

export const ACCENT_COLORS: AccentColor[] = [
  "orange",
  "emerald",
  "violet",
  "rose",
  "amber",
  "sky",
  "indigo",
  "cyan",
];

export const THEME_MODES: ThemeMode[] = ["light", "dark", "system"];
export const NOTIF_FREQS: NotificationFrequency[] = [
  "instant",
  "daily",
  "weekly",
];
export const EDU_STATUSES: EduStatus[] = ["STUDENT", "GRADUATE"];
export const ACCOUNT_ROLES: AccountRole[] = [
  "participant",
  "moderator",
  "admin",
  "webmaster",
];
