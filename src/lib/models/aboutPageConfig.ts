import { ObjectId } from "mongodb";

export type AboutSectionKey =
  | "hero"
  | "stats"
  | "founderStory"
  | "values"
  | "focusAreas"
  | "timeline"
  | "sdgs"
  | "partners"
  | "cta"
  | "team"; 

// ─── Section data shapes ───────────────────────────────────────────────────────

export interface AboutHero {
  headline: string;
  headlineAccent: string; // the coloured portion at end of headline
  subtitle: string;
  cta1Label: string;
  cta1Href: string;
  cta2Label: string;
  cta2Href: string;
}

export interface AboutStat {
  value: string;
  label: string;
}

export interface AboutFounderStory {
  heading: string;
  paragraphs: string[]; // array of paragraph strings
  quoteText: string;
  quoteAttribution: string;
  photoUrl: string; // Cloudinary imageUrl
  photoAlt: string;
}

export interface AboutValueCard {
  id: string;
  iconKey: string; // e.g. "Target", "Lightbulb" — resolved via ICON_MAP
  title: string;
  desc: string;
  order: number;
}

export interface AboutFocusArea {
  id: string;
  iconKey: string;
  label: string;
  desc: string;
  order: number;
}

export interface AboutMilestone {
  id: string;
  year: string;
  title: string;
  desc: string;
  order: number;
}

export interface AboutSDG {
  id: string;
  num: string;
  label: string;
  desc: string;
  order: number;
}

export interface AboutPartner {
  id: string;
  name: string;
  logoUrl?: string;
  order: number;
}

export interface AboutCTA {
  heading: string;
  subtitle: string;
  cta1Label: string;
  cta1Href: string;
  cta2Label: string;
  cta2Href: string;
}

// Add new type:
export type TeamTier = "leadership" | "core" | "volunteer";

export interface AboutTeamMember {
  id: string;
  userId?: string; // platform user ID — set when populated from user picker
  // undefined for manual entries (advisors, patrons, etc.)
  displayName: string;
  professionalTitle: string; // e.g. "Head of Publicity · Software Engineer"
  shortBio: string;
  photoUrl: string;
  tier: TeamTier;
  visible: boolean; // false = hidden from public, kept in DB for easy restore
  order: number;
}

// ─── Section data map ──────────────────────────────────────────────────────────

export type AboutSectionDataMap = {
  hero: AboutHero;
  stats: { items: AboutStat[] };
  founderStory: AboutFounderStory;
  values: { items: AboutValueCard[] };
  focusAreas: { items: AboutFocusArea[] };
  timeline: { items: AboutMilestone[] };
  sdgs: { items: AboutSDG[] };
  partners: { items: AboutPartner[] };
  team: { items: AboutTeamMember[] };
  cta: AboutCTA;
};

// ─── Document ──────────────────────────────────────────────────────────────────

export interface AboutPageConfigDocument {
  _id?: ObjectId;
  sectionKey: AboutSectionKey;
  data: AboutSectionDataMap[AboutSectionKey];
  updatedAt: Date;
  updatedBy?: string;
  createdAt?: Date;
}
