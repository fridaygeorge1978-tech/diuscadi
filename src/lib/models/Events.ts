// lib/models/Event.ts
import { ObjectId } from "mongodb";
import { CloudinaryImage } from "@/types/cloudinary";

export type EventFormat = "physical" | "virtual" | "hybrid";
export type EventStatus = "draft" | "published" | "cancelled";
export type EventLevel = "Beginner" | "Intermediate" | "Advanced";
export type LocationScope = "local" | "state" | "national";
export type TargetEduStatus = "STUDENT" | "GRADUATE" | "ALL";

 
// ─── Sub-document types ───────────────────────────────────────────────────────
 
export interface EventSpeaker {
  name: string;
  title?: string; // e.g. "Senior Engineer at Google"
  organisation?: string;
  bio?: string;
  // Upgraded from plain string — stores publicId for Cloudinary cleanup
  avatar?: CloudinaryImage;
  // Legacy field kept for backwards compat with any existing DB documents
  avatarUrl?: string;
  socialUrl?: string;
  // Set when populated from a platform member — enables profile link
  userId?: string; // LinkedIn or personal site
}
 
export interface EventScheduleItem {
  time:        string;        // e.g. "09:00 AM"
  title:       string;        // e.g. "Opening Ceremony"
  description?: string;
  speaker?:    string;        // speaker name only — denormalised for display
  type:        "session" | "break" | "workshop" | "keynote" | "networking";
}
 
export interface EventSponsor {
  name: string;
  // Upgraded from plain string — stores publicId for Cloudinary cleanup
  logo?: CloudinaryImage;
  // Legacy field kept for backwards compat
  logoUrl?: string;
  tier?: "gold" | "silver" | "bronze" | "partner";
  website?: string;
}
 
export interface EventFAQ {
  question:    string;
  answer:      string;
}

// ─── Main document ────────────────────────────────────────────────────────────

export interface EventDocument {
  _id?: ObjectId;

  // ── Identity ──────────────────────────────────────────────────────────────
  slug: string; // e.g. "summit-2026" — unique, URL-safe
  title: string;
  overview: string;
  learningOutcomes: string[];

  // ── Classification ────────────────────────────────────────────────────────
  category: string;
  tags: string[];
  level?: EventLevel;
  description: string;
  shortDescription: string;

  // ── Targeting (personalized feed filtering) ───────────────────────────────
  requiredSkills: string[]; // matched against user.skills
  targetEduStatus: TargetEduStatus; // "student" | "graduate" | "all"
  locationScope: LocationScope; // "local" | "state" | "national"

  // ── Speaker / instructor ──────────────────────────────────────────────────
  instructor?: string;

  // ── Format + location ─────────────────────────────────────────────────────
  format: EventFormat;
  location?: {
    venue?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };

  // ── Scheduling ────────────────────────────────────────────────────────────
  eventDate: Date;
  endDate?: Date;
  registrationDeadline: Date;
  duration?: string; // e.g. "2 hours", "3 days"

  // ── Capacity ──────────────────────────────────────────────────────────────
  // slotsRemaining is NOT stored — calculated dynamically via aggregation.
  capacity: number;

  // ── Media ─────────────────────────────────────────────────────────────────
  /**
   * Primary event identity image (square / round logo).
   * Optional — some events may be created before assets are ready.
   */
  hasEventLogo: boolean;
  eventLogo?: CloudinaryImage; // tag: "event-logo"

  /**
   * Wide hero / cover image shown at the top of the event page.
   * Optional — limited or low-budget events may skip this.
   */
  hasEventBanner: boolean;
  eventBanner?: CloudinaryImage; // tag: "event-banner"

  /**
   * Photo gallery for the event (before, during, or after shots).
   * Optional array — may be empty or absent for future/draft events.
   */
  hasEventGallery: boolean;
  eventGallery?: CloudinaryImage[]; // tag: "event-gallery" on each item

  // ── Rich content (managed by admin after event creation) ──────────────────

  /**
   * Speakers and facilitators.
   * Empty array = not yet announced. Shown as placeholder UI until populated.
   */
  speakers?: EventSpeaker[];

  /**
   * Agenda / schedule items ordered chronologically.
   * Empty array = not yet published. Shown as placeholder UI until populated.
   */
  schedule?: EventScheduleItem[];

  /**
   * Sponsors for this specific event.
   * Empty array = none yet confirmed.
   */
  sponsors?: EventSponsor[];

  /**
   * Per-event FAQs. When empty, the component falls back to
   * platform-level default FAQs so the section is never blank.
   */
  faqs?: EventFAQ[];

  // ── Status ────────────────────────────────────────────────────────────────
  status: EventStatus;

  // ── Ownership ─────────────────────────────────────────────────────────────
  createdBy: ObjectId; // → Vault._id of admin who created it

  createdAt: Date;
  updatedAt: Date;
}
