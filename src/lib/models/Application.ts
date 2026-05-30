// lib/models/Application.ts

import { ObjectId } from "mongodb";

export type ApplicationType =
  | "membership"
  | "committee"
  | "skills"
  | "sponsorship"
  | "program"
  | "writer";

// "withdrawn" added — applicant can pull their own pending application
export type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "withdrawn";

// ── Availability (committee applications only) ─────────────────────────────

export type AvailabilityCategory =
  | "full-time"
  | "part-time"
  | "weekends"
  | "weekday-evenings"
  | "flexible";

export const AVAILABILITY_CATEGORIES: AvailabilityCategory[] = [
  "full-time",
  "part-time",
  "weekends",
  "weekday-evenings",
  "flexible",
];

export const AVAILABILITY_LABELS: Record<AvailabilityCategory, string> = {
  "full-time": "Full time",
  "part-time": "Part time",
  weekends: "Weekends only",
  "weekday-evenings": "Weekday evenings",
  flexible: "Flexible / as needed",
};

// ── Document ──────────────────────────────────────────────────────────────────

export interface ApplicationDocument {
  _id?: ObjectId;
  userId: ObjectId; // → UserData._id
  vaultId: ObjectId; // → Vault._id

  type: ApplicationType;
  status: ApplicationStatus;

  // ── Committee payload ──────────────────────────────────────────────────────
  requestedCommittee?: string; // committee slug

  /**
   * Skill slugs the applicant is highlighting for this committee application.
   * Must be a subset of their UserData.skills at submission time.
   * Separate from requestedSkills — that field is for the "skills" type,
   * which requests new skills be added to their profile.
   */
  committeeSkills?: string[];

  availability?: {
    category: AvailabilityCategory;
    note?: string; // "not available during exam season" etc.
  };

  references?: string; // past experience, links, or names — free text

  // ── Skills payload ─────────────────────────────────────────────────────────
  requestedSkills?: string[]; // skill slugs to add to profile

  // ── Membership payload ─────────────────────────────────────────────────────
  // no extra fields — reason covers it

  // ── Sponsorship payload ────────────────────────────────────────────────────
  sponsorshipDetails?: {
    companyName?: string;
    website?: string;
    eventIds?: string[];
    tier?: string;
  };

  // ── Program payload ────────────────────────────────────────────────────────
  requestedProgram?: string;
  expertiseProof?: string;

  // ── Writer payload ─────────────────────────────────────────────────────────
  writingSamples?: string[];
  topics?: string[];

  // ── Shared ────────────────────────────────────────────────────────────────
  reason?: string; // motivation — used by committee + membership types

  // ── Review ────────────────────────────────────────────────────────────────
  reviewedBy?: ObjectId; // → Vault._id of admin/webmaster who reviewed
  reviewNote?: string; // shown to applicant on rejection
  reviewedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
