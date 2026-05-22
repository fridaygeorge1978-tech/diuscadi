import { ObjectId } from "mongodb";
import type { SkillCategory } from "@/lib/models/platformConfig";

export type SuggestionStatus = "pending" | "approved" | "rejected";

export interface SkillSuggestionDocument {
  _id?: ObjectId;

  // The free-text name the user typed
  name: string;

  // Auto-generated slug from the name — used if approved
  suggestedSlug: string;

  // Category — guessed from context or left as "Other" until admin sets it
  category: SkillCategory;

  // Where this suggestion came from
  source: "event-form" | "user-profile" | "application";

  // Who suggested it
  suggestedBy: ObjectId; // → Vault._id

  // How many times this exact name has been suggested (dedup counter)
  suggestionCount: number;

  status: SuggestionStatus;

  // Set when approved — points to the new SkillDocument._id
  approvedSkillId?: ObjectId;

  reviewedBy?: ObjectId;
  reviewNote?: string;
  reviewedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
