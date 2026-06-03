// src/lib/models/Task.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type { ITask, TaskDeliverable } from "@/types/tasks";

// ─── Document Interface ───────────────────────────────────────────────────────
// Omit the fields that differ at the DB layer (ObjectId vs string).
// ITask keeps string — correct for API responses.
// TaskDocument overrides them with Types.ObjectId — correct for Mongoose internals.
export interface TaskDocument
  extends Omit<ITask, "_id" | "createdBy" | "specificAssignees">,
    Document {
  createdBy: Types.ObjectId;
  specificAssignees: Types.ObjectId[];
}

// Add this helper mapping at the top of your model file
export const PRIORITY_WEIGHTS = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
} as const;

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const TaskDeliverableSchema = new Schema<TaskDeliverable>(
  {
    label: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    type: {
      type: String,
      enum: ["text", "url", "file_url", "image_url"],
      required: true,
    },
    required: { type: Boolean, default: true },
    placeholder: { type: String, default: "" },
  },
  { _id: false }, // embedded subdocument — no separate _id needed
);

// ─── Primary Schema ────────────────────────────────────────────────────────────

const TaskSchema = new Schema<TaskDocument>(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [120, "Title must be 120 characters or fewer"],
    },
    description: {
      type: String,
      required: [true, "Task description is required"],
    },

    // Committee scoping — matches CommitteeDocument.slug in platformConfig collection
    committeeSlug: {
      type: String,
      required: [true, "committeeSlug is required"],
      index: true,
    },

    // Vault ObjectId of the admin or committee HEAD who created the task
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Vault",
      required: true,
    },

    // Empty array = broadcast to all approved members of the committee.
    // Populated array = targeted assignment to specific UserData ObjectIds.
    specificAssignees: [{ type: Schema.Types.ObjectId, ref: "UserData" }],

    scope: {
      type: String,
      enum: ["individual", "group"],
      default: "individual",
    },

    priority: { 
    type: String, 
    enum: ["low", "medium", "high", "critical"], 
    required: true 
  },
  priorityWeight: { 
    type: Number, 
    required: true, 
    default: 2 // Defaults to medium weight
  },

    status: {
      type: String,
      enum: ["draft", "active", "completed", "cancelled", "archived"],
      default: "draft",
    },

    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },

    deliverables: {
      type: [TaskDeliverableSchema],
      default: [],
    },

    tags: [{ type: String, trim: true, lowercase: true }],

    maxScore: {
      type: Number,
      default: 100,
      min: [1, "maxScore must be at least 1"],
      max: [1000, "maxScore cannot exceed 1000"],
    },

    // When true → the /api/member/bot/evaluate route is auto-called on submission
    autoEvaluate: { type: Boolean, default: false },

    // Plain English criteria — passed verbatim to the Gemini prompt
    evaluationCriteria: { type: String, default: "" },

    // Allows admins to hide a task without cancelling it
    isVisible: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: "tasks",
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Primary listing query: "all active tasks for committee X sorted by deadline"
TaskSchema.index({ committeeSlug: 1, status: 1, deadline: 1 });

// Admin view: "all tasks created by this user across committees"
TaskSchema.index({ createdBy: 1, committeeSlug: 1 });

// Priority + deadline for urgency-sorted views
TaskSchema.index({ committeeSlug: 1, priority: 1, deadline: 1 });

TaskSchema.index({ priorityWeight: -1, dueDate: 1 });

// ─── Model Export ─────────────────────────────────────────────────────────────
// Guards against Mongoose "Cannot overwrite model" error in Next.js hot-reload
const Task: Model<TaskDocument> =
  mongoose.models.Task || mongoose.model<TaskDocument>("Task", TaskSchema);

export default Task;
