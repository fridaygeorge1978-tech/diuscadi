// src/lib/models/BotActionLog.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type { IBotActionLog } from "@/types/tasks";

// ─── Document Interface ───────────────────────────────────────────────────────
export interface BotActionLogDocument
  extends Omit<IBotActionLog, "_id" | "assignmentId" | "taskId" | "userId">,
    Document {
  assignmentId: Types.ObjectId;
  taskId: Types.ObjectId;
  userId: Types.ObjectId;
}

// ─── Primary Schema ────────────────────────────────────────────────────────────

const BotActionLogSchema = new Schema<BotActionLogDocument>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "UserData",
      required: true,
      index: true,
    },
    committeeSlug: { type: String, required: true },

    trigger: {
      type: String,
      enum: ["AUTO_SUBMIT", "MANUAL_TRIGGER", "RE_EVALUATE"],
      required: true,
    },

    // Snapshot of exactly what was sent to Gemini — critical for auditing
    inputPayload: {
      submissionText: { type: String, required: true },
      evaluationCriteria: { type: String, required: true },
      taskTitle: { type: String, required: true },
      taskDescription: { type: String, required: true },
      maxScore: { type: Number, required: true },
    },

    // Raw unparsed string returned by Gemini — kept even on parse failure
    rawGeminiResponse: { type: String, default: "" },

    // Structured result if parsing succeeded (Mixed to avoid strict subdoc issues)
    parsedResult: { type: Schema.Types.Mixed, default: null },

    tokensUsed: { type: Number, default: null },
    processingMs: { type: Number, required: true },
    modelVersion: { type: String, default: "gemini-1.5-flash" },

    success: { type: Boolean, required: true },
    errorMessage: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: "bot_action_logs",
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Fetch all bot runs for a given assignment (audit trail)
BotActionLogSchema.index({ assignmentId: 1, createdAt: -1 });

// Health monitoring — count recent failures
BotActionLogSchema.index({ success: 1, createdAt: -1 });

// Per-user bot evaluation history
BotActionLogSchema.index({ userId: 1, createdAt: -1 });

// ─── Model Export ─────────────────────────────────────────────────────────────
const BotActionLog: Model<BotActionLogDocument> =
  mongoose.models.BotActionLog ||
  mongoose.model<BotActionLogDocument>("BotActionLog", BotActionLogSchema);

export default BotActionLog;
