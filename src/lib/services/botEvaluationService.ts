// src/lib/services/botEvaluationService.ts
// ─── Orchestration layer: prompt → Gemini → DB writes → return ───────────────
// Shared entry-point for both:
//   POST /api/member/assignments/[id]/submit   (autoEvaluate trigger)
//   POST /api/member/bot/evaluate              (manual / re-evaluate trigger)
//
// The service is the ONLY code that writes to assignments and bot_action_logs
// during an evaluation cycle.

import { Db, ObjectId, WithId } from "mongodb";
import { Collections } from "@/lib/db/collections";
import { buildEvaluationPrompt, callGeminiEvaluate } from "./geminiService";
import type {
  EvaluationResult,
  BotTrigger,
} from "@/types/tasks";
import { DbAssignment, DbTask } from "../db/dbTypes";

// ─── Public Interface ──────────────────────────────────────────────────────────

export interface BotEvaluationInput {
  assignment: WithId<DbAssignment>; // ← replaces the Omit<IAssignment...> intersection mess
  task: WithId<DbTask>; // ← replaces the Omit<ITask...> intersection mess
  trigger: BotTrigger;
  requestedBy: string;
}

export interface BotEvaluationOutput {
  evaluation: EvaluationResult;
  logId: ObjectId;
  flaggedForHumanReview: boolean;
}

// ─── Main Orchestrator ─────────────────────────────────────────────────────────

export async function runBotEvaluation(
  db: Db,
  input: BotEvaluationInput,
): Promise<BotEvaluationOutput> {
  const { assignment, task, trigger } = input;

  if (!assignment.submission?.items?.length) {
    throw new Error("Assignment has no submission items — cannot evaluate");
  }

  const assignmentId = new ObjectId(assignment._id);
  const taskId = new ObjectId(task._id);
  const userId = new ObjectId(assignment.userId);
  const now = new Date();

  // ── 1. Build prompt ────────────────────────────────────────────────────────

  const prompt = buildEvaluationPrompt(
    {
      title: task.title,
      description: task.description,
      evaluationCriteria: task.evaluationCriteria,
      maxScore: task.maxScore,
    },
    assignment.submission,
  );

  // ── 2. Snapshot for audit log (captured before the API call) ────────────────

  const inputPayload = {
    submissionText: assignment.submission.items
      .map((i) => `${i.deliverableLabel}: ${i.value}`)
      .join(" | "),
    evaluationCriteria: task.evaluationCriteria ?? "",
    taskTitle: task.title,
    taskDescription: task.description,
    maxScore: task.maxScore,
  };

  // ── 3. Call Gemini ─────────────────────────────────────────────────────────

  let geminiResult: Awaited<ReturnType<typeof callGeminiEvaluate>> | null =
    null;
  let callError: string | null = null;

  try {
    geminiResult = await callGeminiEvaluate(prompt);
  } catch (err) {
    callError = err instanceof Error ? err.message : String(err);
  }

  // ── 4a. FAILURE PATH ───────────────────────────────────────────────────────

  if (!geminiResult || callError) {
    // Write failure log first (fire-and-forget on error is intentional; the
    // assignment update below is the user-visible state change)
    await Collections.botActionLogs(db).insertOne({
      assignmentId,
      taskId,
      userId,
      committeeSlug: assignment.committeeSlug,
      trigger,
      inputPayload,
      rawGeminiResponse: "",
      parsedResult: null,
      tokensUsed: null,
      processingMs: 0,
      modelVersion: "gemini-1.5-flash",
      success: false,
      errorMessage: callError ?? "Unknown error",
      createdAt: now,
      updatedAt: now,
    });

    // Move assignment to under_review so a human picks it up
    await Collections.assignments(db).updateOne(
      { _id: assignmentId },
      { $set: { status: "under_review", updatedAt: now } },
    );

    throw new Error(`Bot evaluation failed: ${callError}`);
  }

  // ── 4b. SUCCESS PATH ───────────────────────────────────────────────────────

  const { parsed, rawText, tokensUsed, modelVersion, processingMs } =
    geminiResult;

  const evaluation: EvaluationResult = {
    totalScore: parsed.totalScore,
    maxScore: task.maxScore,
    percentageScore: parsed.percentageScore,
    feedback: parsed.feedback,
    criteriaBreakdown: parsed.criteriaBreakdown,
    evaluatorId: "GEMINI_BOT",
    evaluatorType: "GEMINI_BOT",
    evaluatedAt: now,
    flaggedForHumanReview: parsed.flaggedForHumanReview,
    reviewNote: parsed.reviewNote ?? undefined,
  };

  // Flagged submissions stay under_review for human confirmation;
  // clean evaluations go straight to evaluated.
  const newStatus = parsed.flaggedForHumanReview ? "under_review" : "evaluated";

  // Atomic parallel writes: assignment update + log insert
  const [, logInsert] = await Promise.all([
    Collections.assignments(db).updateOne(
      { _id: assignmentId },
      {
        $set: {
          status: newStatus,
          evaluation,
          updatedAt: now,
        },
      },
    ),
    Collections.botActionLogs(db).insertOne({
      assignmentId,
      taskId,
      userId,
      committeeSlug: assignment.committeeSlug,
      trigger,
      inputPayload,
      rawGeminiResponse: rawText,
      parsedResult: { ...evaluation },
      tokensUsed,
      processingMs,
      modelVersion,
      success: true,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    }),
  ]);

  return {
    evaluation,
    logId: logInsert.insertedId,
    flaggedForHumanReview: parsed.flaggedForHumanReview,
  };
}
