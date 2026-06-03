// src/lib/db/dbTypes.ts
// ─── Native MongoDB document shapes (ObjectId, not string) ───────────────────
// Used by both collections.ts and taskService.ts.
// Kept separate from @/types/tasks which uses string IDs for client serialisation.

import { ObjectId } from "mongodb";
import type {
  TaskPriority,
  TaskScope,
  TaskStatus,
  AssignmentStatus,
  BotTrigger,
  EvaluatorType,
  SubmissionItem,
} from "@/types/tasks";

export type DbTask = {
  _id?: ObjectId;
  title: string;
  description: string;
  committeeSlug: string;
  createdBy: ObjectId;
  specificAssignees: ObjectId[];
  scope: TaskScope;
  priority: TaskPriority;
  priorityWeight: number; // ← was missing from collections.ts
  status: TaskStatus;
  deadline: Date;
  deliverables: {
    label: string;
    description?: string;
    type: "text" | "url" | "file_url" | "image_url";
    required: boolean;
    placeholder?: string;
  }[];
  tags: string[];
  maxScore: number;
  autoEvaluate: boolean;
  evaluationCriteria: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type DbAssignment = {
  _id?: ObjectId;
  taskId: ObjectId;
  userId: ObjectId;
  committeeSlug: string;
  status: AssignmentStatus;
  submission?: {
    items: SubmissionItem[]; // ← was { deliverableLabel: string; type: string; value: string }[]
    submittedAt: Date;
    additionalNotes?: string;
  };
  evaluation?: {
    totalScore: number;
    maxScore: number;
    percentageScore: number;
    feedback: string;
    criteriaBreakdown: {
      criterion: string;
      awarded: number;
      maximum: number;
      rationale: string;
    }[];
    evaluatorId: string;
    evaluatorType: EvaluatorType;
    evaluatedAt: Date;
    flaggedForHumanReview: boolean;
    reviewNote?: string | null;
  };
  revisionHistory: {
    requestedAt: Date;
    requestedBy: string;
    reason: string;
    resubmittedAt?: Date;
  }[];
  overriddenDeadline?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DbBotActionLog = {
  _id?: ObjectId;
  assignmentId: ObjectId;
  taskId: ObjectId;
  userId: ObjectId;
  committeeSlug: string;
  trigger: BotTrigger;
  inputPayload: {
    submissionText: string;
    evaluationCriteria: string;
    taskTitle: string;
    taskDescription: string;
    maxScore: number;
  };
  rawGeminiResponse: string;
  parsedResult?: Record<string, unknown> | null;
  tokensUsed?: number | null;
  processingMs: number;
  modelVersion: string;
  success: boolean;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
};
