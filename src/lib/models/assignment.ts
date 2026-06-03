// src/lib/models/Assignment.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type {
  IAssignment,
  SubmissionItem,
  EvaluationResult,
  CriteriaScore,
  RevisionHistoryEntry,
} from "@/types/tasks";

// ─── Document Interface ───────────────────────────────────────────────────────
// Omit the string fields that are actually stored as ObjectId at the DB layer.
// IAssignment keeps them as string — correct for API serialization.
// AssignmentDocument overrides them with Types.ObjectId — correct for Mongoose.
export interface AssignmentDocument
  extends Omit<IAssignment, "_id" | "taskId" | "userId">,
    Document {
  taskId: Types.ObjectId;
  userId: Types.ObjectId;
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const SubmissionItemSchema = new Schema<SubmissionItem>(
  {
    deliverableLabel: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "url", "file_url", "image_url"],
      required: true,
    },
    value: { type: String, required: true },
  },
  { _id: false },
);

const CriteriaScoreSchema = new Schema<CriteriaScore>(
  {
    criterion: { type: String, required: true },
    awarded: { type: Number, required: true, min: 0 },
    maximum: { type: Number, required: true, min: 0 },
    rationale: { type: String, default: "" },
  },
  { _id: false },
);

const EvaluationResultSchema = new Schema<EvaluationResult>(
  {
    totalScore: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 0 },
    percentageScore: { type: Number, required: true, min: 0, max: 100 },
    feedback: { type: String, required: true },
    criteriaBreakdown: { type: [CriteriaScoreSchema], default: [] },

    // "GEMINI_BOT" (literal string) or a Vault ObjectId string for human evaluators
    evaluatorId: { type: String, required: true },

    evaluatorType: {
      type: String,
      enum: ["GEMINI_BOT", "MANUAL", "HYBRID"],
      required: true,
    },

    evaluatedAt: { type: Date, required: true },

    // Gemini sets this to true when submission is ambiguous or needs human judgment
    flaggedForHumanReview: { type: Boolean, default: false },
    reviewNote: { type: String, default: null },
  },
  { _id: false },
);

const RevisionHistorySchema = new Schema<RevisionHistoryEntry>(
  {
    requestedAt: { type: Date, required: true },
    requestedBy: { type: String, required: true }, // Vault ObjectId as string
    reason: { type: String, required: true },
    resubmittedAt: { type: Date, default: null },
  },
  { _id: false },
);

// ─── Primary Schema ────────────────────────────────────────────────────────────

const AssignmentSchema = new Schema<AssignmentDocument>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },

    // UserData ObjectId — the member this assignment belongs to
    userId: {
      type: Schema.Types.ObjectId,
      ref: "UserData",
      required: true,
      index: true,
    },

    // Denormalised from Task for fast per-committee queries (no join needed)
    committeeSlug: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "submitted",
        "under_review",
        "evaluated",
        "revision_requested",
        "rejected",
      ],
      default: "pending",
    },

    // Optional — only present after member submits
    submission: {
      items: { type: [SubmissionItemSchema], default: undefined },
      submittedAt: { type: Date },
      additionalNotes: { type: String, default: "" },
    },

    // Optional — only present after evaluation
    evaluation: {
      type: EvaluationResultSchema,
      default: undefined,
    },

    // Append-only audit trail of revision cycles
    revisionHistory: {
      type: [RevisionHistorySchema],
      default: [],
    },

    // Admin can set a member-specific deadline different from the task's
    overriddenDeadline: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "assignments",
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// CRITICAL: Enforce one assignment per user per task
AssignmentSchema.index(
  { taskId: 1, userId: 1 },
  { unique: true, name: "unique_task_user_assignment" },
);

// Member dashboard query: "all my assignments in this committee by status"
AssignmentSchema.index({ userId: 1, committeeSlug: 1, status: 1 });

// Admin evaluation queue: "all submitted assignments for committee X"
AssignmentSchema.index({
  committeeSlug: 1,
  status: 1,
  "submission.submittedAt": -1,
});

// Flagged assignments needing human review
AssignmentSchema.index({ "evaluation.flaggedForHumanReview": 1, status: 1 });

// ─── Model Export ─────────────────────────────────────────────────────────────
const Assignment: Model<AssignmentDocument> =
  mongoose.models.Assignment ||
  mongoose.model<AssignmentDocument>("Assignment", AssignmentSchema);

export default Assignment;
