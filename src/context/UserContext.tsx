"use client";
// context/UserContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import type {
  EduStatus,
  AccountRole,
  Committee,
  CommitteeMembership,
  Skill,
  PhoneNumber,
  UserPreferences,
} from "@/types/domain";
import { DEFAULT_PREFERENCES } from "@/types/domain";
import type { CloudinaryImage } from "@/types/cloudinary";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Institution {
  institutionId?: string;
  name?: string;
  abbreviation?: string;
  Type?: "University" | "Polytechnic" | "College" | "Institute";
  facultyId?: string;
  faculty?: string;
  departmentId?: string;
  department?: string;
  degreeType?: string;
  durationYears?: { min: number; max: number };
  level?: string;
  semester?: "First" | "Second";
  enrollmentYear?: number;
  graduationYear?: number;
  currentStatus?: "Graduate" | "Student";
  schoolEmail?: string;
  verifiedSchoolEmail?: boolean;
  cgpa?: number | null;
  cgpaScale?: number;
}

// ── Location — matches UserData.ts UserLocation interface ─────────────────────
export interface UserLocation {
  country?: string;
  state?: string;
  city?: string;
  lga?: string;
  pendingVerification?: boolean;
  rawCountry?: string;
  rawState?: string;
  rawCity?: string;
}

export interface UserProfile {
  id: string;
  fullName: { firstname: string; secondname?: string; lastname: string };
  email: string;
  phone?: PhoneNumber;
  role: AccountRole;
  eduStatus: EduStatus;
  hasAvatar: boolean;
  avatar?: CloudinaryImage;
  socials?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
  };
  committeeMembership: CommitteeMembership | null;
  skills: Skill[];
  profileCompleted: boolean;
  membershipStatus: "pending" | "approved" | "suspended";
  location?: UserLocation; // ← now uses full UserLocation type
  Institution?: Institution;
  profile?: { bio?: string };
  analytics: {
    eventsRegistered: number;
    eventsAttended: number;
    lastEventRegisteredAt?: string;
    lastActiveAt?: string;
  };
  signupInviteCode: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateResult {
  success: boolean;
  error?: string;
}

// ─── Context type ─────────────────────────────────────────────────────────────

interface UserContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  refreshProfile: () => Promise<void>;
  updateProfile: (data: {
    fullName?: { firstname: string; secondname?: string; lastname: string };
    bio?: string;
    phone?: PhoneNumber;
    location?: UserLocation; // ← ADDED
     socials?: {           // ✅ add this
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
  };
  }) => Promise<UpdateResult>;
  updateInstitution: (data: Partial<Institution>) => Promise<UpdateResult>;
  updateSkills: (skills: Skill[]) => Promise<UpdateResult>;
  updateCommittee: (committee: Committee | null) => Promise<UpdateResult>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<UpdateResult>;
  clearError: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const UserContext = createContext<UserContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("diuscadi_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function parseFullName(raw: unknown): UserProfile["fullName"] {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    return {
      firstname: String(obj.firstname ?? ""),
      secondname: obj.secondname != null ? String(obj.secondname) : undefined,
      lastname: String(obj.lastname ?? ""),
    };
  }
  return { firstname: String(raw ?? ""), lastname: "" };
}

function parseProfile(raw: Record<string, unknown>): UserProfile {
  return {
    id: String(raw._id ?? ""),
    fullName: parseFullName(raw.fullName),
    email: String(raw.email ?? ""),
    hasAvatar: Boolean(raw.hasAvatar),
    avatar: raw.avatar as CloudinaryImage | undefined,
    phone: raw.phone as PhoneNumber | undefined,
    socials: raw.socials as UserProfile["socials"],
    role: (raw.role ?? "participant") as AccountRole,
    eduStatus: (raw.eduStatus ?? "STUDENT") as EduStatus,
    committeeMembership: (raw.committeeMembership ??
      null) as CommitteeMembership | null,
    skills: (raw.skills ?? []) as Skill[],
    profileCompleted: Boolean(raw.profileCompleted),
    membershipStatus: (raw.membershipStatus ??
      "pending") as UserProfile["membershipStatus"],
    location: raw.location as UserLocation | undefined,
    Institution: raw.Institution as Institution | undefined,
    profile: raw.profile as UserProfile["profile"],
    analytics: (raw.analytics ?? {
      eventsRegistered: 0,
      eventsAttended: 0,
    }) as UserProfile["analytics"],
    signupInviteCode: String(raw.signupInviteCode ?? ""),
    preferences:
      (raw.preferences as UserPreferences | undefined) ?? DEFAULT_PREFERENCES,
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
  };
}

async function callPatch(
  endpoint: string,
  body: Record<string, unknown>,
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
): Promise<UpdateResult> {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const msg = String(data.error ?? "Update failed");
      setError(msg);
      return { success: false, error: msg };
    }
    setProfile(parseProfile(data.profile as Record<string, unknown>));
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Update failed";
    setError(msg);
    return { success: false, error: msg };
  } finally {
    setLoading(false);
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, sessionStatus } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seed from AuthContext on login
  useEffect(() => {
    if (sessionStatus === "pending") return;
    if (!isAuthenticated || !user) {
      setProfile(null);
      return;
    }
    setProfile({
      id: user.userDataId ?? "",
      fullName: parseFullName(user.fullName),
      email: user.email ?? "",
      hasAvatar: user.hasAvatar ?? false,
      avatar: user.avatar as CloudinaryImage | undefined,
      phone: user.phone,
      role: user.role,
      eduStatus: user.eduStatus,
      committeeMembership: user.committeeMembership ?? null,
      skills: user.skills ?? [],
      profileCompleted: user.profileCompleted ?? false,
      membershipStatus: user.membershipStatus ?? "pending",
      location: undefined,
      Institution: undefined,
      profile: undefined,
      analytics: { eventsRegistered: 0, eventsAttended: 0 },
      signupInviteCode: "",
      preferences: user.preferences,
      createdAt: "",
      updatedAt: "",
    });
  }, [isAuthenticated, sessionStatus, user]);

  // Full profile fetch on session restore
  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users/profile", { headers: authHeaders() });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok)
        throw new Error(String(data.error ?? "Failed to load profile"));
      setProfile(parseProfile(data.profile as Record<string, unknown>));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (sessionStatus !== "restored" || !isAuthenticated) return;
    refreshProfile();
  }, [sessionStatus, isAuthenticated, refreshProfile]);

  // ── updateProfile — now includes location ─────────────────────────────────
  const updateProfile = useCallback(
    (data: {
      fullName?: { firstname: string; secondname?: string; lastname: string };
      bio?: string;
      phone?: PhoneNumber;
      location?: UserLocation;
      socials?: {
        linkedin?: string;
        github?: string;
        twitter?: string;
        portfolio?: string;
      };
    }) =>
      callPatch(
        "/api/users/profile",
        data as Record<string, unknown>,
        setProfile,
        setError,
        setIsLoading,
      ),
    [],
  );

  const updateInstitution = useCallback(
    (data: Partial<Institution>) =>
      callPatch(
        "/api/users/institution",
        data as Record<string, unknown>,
        setProfile,
        setError,
        setIsLoading,
      ),
    [],
  );

  const updateSkills = useCallback(
    (skills: Skill[]) =>
      callPatch(
        "/api/users/skills",
        { skills },
        setProfile,
        setError,
        setIsLoading,
      ),
    [],
  );

  const updateCommittee = useCallback(
    (committee: Committee | null) =>
      callPatch(
        "/api/users/committee",
        { committee },
        setProfile,
        setError,
        setIsLoading,
      ),
    [],
  );

  const updatePreferences = useCallback(
    async (prefs: Partial<UserPreferences>): Promise<UpdateResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/users/preferences", {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(prefs),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to update preferences");
          return { success: false, error: data.error };
        }
        setProfile((prev) =>
          prev ? { ...prev, preferences: data.preferences } : prev,
        );
        return { success: true };
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to update preferences";
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return (
    <UserContext.Provider
      value={{
        profile,
        isLoading,
        error,
        refreshProfile,
        updateProfile,
        updateInstitution,
        updateSkills,
        updateCommittee,
        updatePreferences,
        clearError,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
};
