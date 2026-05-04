import { CloudinaryImage } from "@/types/cloudinary";
import { ObjectId } from "mongodb";

export type LandingSectionKey =
  | "banner"
  | "initiative"
  | "validators"
  | "mission"
  | "workshopTopics"
  | "testimonials"
  | "support";

export interface BannerSlide {
  id: string;
  type: "event" | "ad" | "blog" | "custom";
  image?: CloudinaryImage;
  imageUrl: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  linkedEventId?: string;
  expiresAt?: Date;
  hidden: boolean;
  order: number;
}

export interface InitiativePhoto {
  id: string;
  image?: CloudinaryImage;
  imageUrl: string;
  alt?: string;
  order: number;
}

export interface ValidatorEntry {
  id: string;
  name: string;
  image?: CloudinaryImage;
  logoUrl: string;
  category: "industry" | "academia";
  order: number;
}

export interface MissionConfig {
  image?: CloudinaryImage;
  photoUrl: string;
  name: string;
  title: string;
  writeup: string;
}

export interface WorkshopTopic {
  id: string;
  topic: string;
  expertName: string;
  expertTitle?: string;
  image?: CloudinaryImage;
  expertPhotoUrl?: string;
  icon?: string;
  order: number;
}

export interface TestimonialEntry {
  id: string;
  name: string;
  role?: string;
  edition?: string;
  quote: string;
  image?: CloudinaryImage;
  photoUrl?: string;
  order: number;
}

export interface SupportEntry {
  id: string;
  name: string;
  image?: CloudinaryImage;
  logoUrl: string;
  tier: "headline" | "gold" | "silver" | "partner";
  websiteUrl?: string;
  linkedEventId?: string;
  order: number;
}

export interface InitiativeConfig {
  sectionTitle: string;
  yearLabel: string;
  image?: CloudinaryImage;
  photos: InitiativePhoto[];
}

export interface TestimonialsConfig {
  items: TestimonialEntry[];
  videoUrl: string;
  videoType: "youtube" | "cloudinary";
}

export type SectionDataMap = {
  banner:         { slides: BannerSlide[] };
  initiative:     InitiativeConfig;
  validators:     { items: ValidatorEntry[] };
  mission:        MissionConfig;
  workshopTopics: { items: WorkshopTopic[] };
  testimonials:   TestimonialsConfig;
  support:        { items: SupportEntry[] };
};

export interface LandingPageConfigDocument {
  _id?: ObjectId;
  sectionKey: LandingSectionKey;
  data: SectionDataMap[LandingSectionKey];
  updatedAt: Date;
  updatedBy?: string;
  createdAt?: Date;
}