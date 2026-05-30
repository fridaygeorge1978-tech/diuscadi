"use client";
// context/ApplicationContext.tsx

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { AvailabilityCategory } from "@/lib/models/Application";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApplicationType =
  | "membership"
  | "committee"
  | "skills"
  | "sponsorship"
  | "program"
  | "writer";

export type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "withdrawn";

export interface Application {
  id: string;
  type: ApplicationType;
  status: ApplicationStatus;
  // committee-specific
  requestedCommittee?: string;
  committeeSkills?: string[];
  availability?: { category: AvailabilityCategory; note?: string };
  references?: string | null;
  // other type payloads
  requestedSkills?: string[];
  requestedProgram?: string;
  sponsorshipDetails?: Record<string, unknown> | null;
  writingSamples?: string[] | null;
  topics?: string[] | null;
  // shared
  reason?: string | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface SubmitApplicationPayload {
  type: ApplicationType;
  // committee
  requestedCommittee?: string;
  committeeSkills?: string[];
  availability?: { category: AvailabilityCategory; note?: string };
  references?: string;
  // other types
  requestedSkills?: string[];
  requestedProgram?: string;
  sponsorshipDetails?: Record<string, unknown>;
  writingSamples?: string[];
  topics?: string[];
  // shared
  reason?: string;
}

interface ApplicationState {
  applications: Application[];
  pendingCount: number;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  initialized: boolean;
}

interface ApplicationContextValue extends ApplicationState {
  loadMyApplications: (opts?: {
    type?: string;
    status?: string;
  }) => Promise<void>;
  submitApplication: (
    payload: SubmitApplicationPayload,
    token: string,
  ) => Promise<Application>;
  withdrawApplication: (id: string, token: string) => Promise<void>;
  hasPending: (type: ApplicationType) => boolean;
  hasApproved: (type: ApplicationType) => boolean;
  getLatest: (type: ApplicationType) => Application | undefined;
  reset: () => void;
  clearError: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ApplicationContext = createContext<ApplicationContextValue | null>(null);

export function useApplications(): ApplicationContextValue {
  const ctx = useContext(ApplicationContext);
  if (!ctx)
    throw new Error("useApplications must be used within ApplicationProvider");
  return ctx;
}

function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

const INITIAL_STATE: ApplicationState = {
  applications: [],
  pendingCount: 0,
  loading: false,
  submitting: false,
  error: null,
  initialized: false,
};

// ── Provider ──────────────────────────────────────────────────────────────────

export function ApplicationProvider({
  children,
  token,
}: {
  children: ReactNode;
  token: string | null;
}) {
  const [state, setState] = useState<ApplicationState>(INITIAL_STATE);

  const clearError = useCallback(
    () => setState((s) => ({ ...s, error: null })),
    [],
  );
  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const loadMyApplications = useCallback(
    async (opts: { type?: string; status?: string } = {}) => {
      if (!token) return;
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const params = new URLSearchParams();
        if (opts.type) params.set("type", opts.type);
        if (opts.status) params.set("status", opts.status);
        const res = await fetch(`/api/applications?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await handleResponse<{
          applications: Application[];
          total: number;
        }>(res);
        const pending = data.applications.filter(
          (a) => a.status === "pending",
        ).length;
        setState((s) => ({
          ...s,
          applications: data.applications,
          pendingCount: pending,
          loading: false,
          initialized: true,
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          loading: false,
          initialized: true,
          error:
            err instanceof Error ? err.message : "Failed to load applications",
        }));
      }
    },
    [token],
  );

  const submitApplication = useCallback(
    async (
      payload: SubmitApplicationPayload,
      tkn: string,
    ): Promise<Application> => {
      setState((s) => ({ ...s, submitting: true, error: null }));
      try {
        // Committee applications go to the dedicated endpoint —
        // all other types hit the general applications route.
        const endpoint =
          payload.type === "committee"
            ? "/api/applications/committee"
            : "/api/applications";

        const res = await fetch(endpoint, {
          method: "POST",
          headers: authHeaders(tkn),
          body: JSON.stringify(payload),
        });
        const data = await handleResponse<{
          applicationId: string;
          type: ApplicationType;
          status: ApplicationStatus;
        }>(res);

        const newApp: Application = {
          id: data.applicationId,
          type: data.type,
          status: data.status,
          requestedCommittee: payload.requestedCommittee,
          committeeSkills: payload.committeeSkills,
          availability: payload.availability,
          references: payload.references ?? null,
          requestedSkills: payload.requestedSkills,
          requestedProgram: payload.requestedProgram,
          sponsorshipDetails: payload.sponsorshipDetails ?? null,
          writingSamples: payload.writingSamples ?? null,
          topics: payload.topics ?? null,
          reason: payload.reason ?? null,
          reviewNote: null,
          reviewedAt: null,
          createdAt: new Date().toISOString(),
        };

        setState((s) => ({
          ...s,
          applications: [newApp, ...s.applications],
          pendingCount: s.pendingCount + 1,
          submitting: false,
        }));
        return newApp;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to submit application";
        setState((s) => ({ ...s, submitting: false, error: message }));
        throw err;
      }
    },
    [],
  );

  // Withdraw own pending application
  const withdrawApplication = useCallback(
    async (id: string, tkn: string): Promise<void> => {
      setState((s) => ({ ...s, submitting: true, error: null }));
      try {
        const res = await fetch(`/api/applications/committee/${id}`, {
          method: "PATCH",
          headers: authHeaders(tkn),
          body: JSON.stringify({ status: "withdrawn" }),
        });
        await handleResponse(res);
        setState((s) => ({
          ...s,
          submitting: false,
          applications: s.applications.map((a) =>
            a.id === id
              ? { ...a, status: "withdrawn" as ApplicationStatus }
              : a,
          ),
          pendingCount: Math.max(0, s.pendingCount - 1),
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to withdraw application";
        setState((s) => ({ ...s, submitting: false, error: message }));
        throw err;
      }
    },
    [],
  );

  const hasPending = useCallback(
    (type: ApplicationType) =>
      state.applications.some((a) => a.type === type && a.status === "pending"),
    [state.applications],
  );

  // NEW — useful for checking if membership is already approved
  const hasApproved = useCallback(
    (type: ApplicationType) =>
      state.applications.some(
        (a) => a.type === type && a.status === "approved",
      ),
    [state.applications],
  );

  const getLatest = useCallback(
    (type: ApplicationType) => state.applications.find((a) => a.type === type),
    [state.applications],
  );

  return (
    <ApplicationContext.Provider
      value={{
        ...state,
        loadMyApplications,
        submitApplication,
        withdrawApplication,
        hasPending,
        hasApproved,
        getLatest,
        reset,
        clearError,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
}
