import mongoose, { Document, Schema } from "mongoose";

// ─── Section payload types ─────────────────────────────────────────────────

export interface BannerSlide {
  id: string;
  type: "event" | "ad" | "blog" | "custom";
  imageUrl: string; // Cloudinary URL
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  linkedEventId?: string; // populated if type === "event"
  expiresAt?: Date; // cron flags hidden when past
  hidden: boolean;
  order: number;
}

export interface InitiativePhoto {
  id: string;
  imageUrl: string; // Cloudinary URL
  alt?: string;
  order: number;
}

export interface ValidatorEntry {
  id: string;
  name: string;
  logoUrl: string; // Cloudinary URL
  category: "industry" | "academia";
  order: number;
}

export interface MissionConfig {
  photoUrl: string; // Cloudinary — Prof. Umeh (or future leader)
  name: string;
  title: string;
  writeup: string; // Rich text / paragraph
}

export interface WorkshopTopic {
  id: string;
  topic: string;
  expertName: string;
  expertTitle?: string;
  expertPhotoUrl?: string; // Cloudinary
  icon?: string; // emoji or icon key
  order: number;
}

export interface TestimonialEntry {
  id: string;
  name: string;
  role?: string;
  institution?: string;
  quote: string;
  photoUrl?: string; // Cloudinary
  order: number;
}

export interface TestimonialsConfig {
  items: TestimonialEntry[];
  videoUrl: string; // YouTube URL or Cloudinary
  videoType: "youtube" | "cloudinary";
}

export interface SupportEntry {
  id: string;
  name: string;
  logoUrl: string; // Cloudinary
  tier: "headline" | "gold" | "silver" | "partner";
  websiteUrl?: string;
  linkedEventId?: string; // if scoped to a specific event
  order: number;
}

export interface InitiativeConfig {
  sectionTitle: string; // e.g. "LASCADSS Class of 2026"
  yearLabel: string; // e.g. "2026"
  photos: InitiativePhoto[];
}

// ─── Section keys ──────────────────────────────────────────────────────────

export type LandingSectionKey =
  | "banner"
  | "initiative"
  | "validators"
  | "mission"
  | "workshopTopics"
  | "testimonials"
  | "support";

// ─── Union data shape per key ──────────────────────────────────────────────

type SectionDataMap = {
  banner: { slides: BannerSlide[] };
  initiative: InitiativeConfig;
  validators: { items: ValidatorEntry[] };
  mission: MissionConfig;
  workshopTopics: { items: WorkshopTopic[] };
  testimonials: TestimonialsConfig;
  support: { items: SupportEntry[] };
};

// ─── Document ──────────────────────────────────────────────────────────────

export interface LandingPageConfigDocument extends Document {
  sectionKey: LandingSectionKey;
  data: SectionDataMap[LandingSectionKey];
  updatedAt: Date;
  updatedBy?: string; // admin userId
}

const LandingPageConfigSchema = new Schema<LandingPageConfigDocument>(
  {
    sectionKey: {
      type: String,
      required: true,
      unique: true,
      enum: [
        "banner",
        "initiative",
        "validators",
        "mission",
        "workshopTopics",
        "testimonials",
        "support",
      ],
    },
    data: { type: Schema.Types.Mixed, required: true },
    updatedBy: { type: String },
  },
  { timestamps: true },
);

export const LandingPageConfig =
  mongoose.models.LandingPageConfig ||
  mongoose.model<LandingPageConfigDocument>(
    "LandingPageConfig",
    LandingPageConfigSchema,
  );
