// src/app/api/member/bot/evaluate/route.ts
// ─── POST /api/member/bot/evaluate ───────────────────────────────────────────
// Manually triggers Gemini evaluation on a submitted assignment.
//
// Permission matrix:
//   admin | webmaster          →  any assignment
//   HEAD | COORDINATOR         →  any assignment in their committee
//   The assignment owner       →  only when status is "under_review"
//                                 (i.e. a previous bot run failed; member retries)
//
// Valid pre-evaluation statuses: "submitted" | "under_review"

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { runBotEvaluation } from "@/lib/services/botEvaluationService";
import type { BotEvaluatePayload } from "@/types/tasks";

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const db = await getDb();
    const { vaultId, role } = req.auth;

    // ── 1. Parse body ─────────────────────────────────────────────────────────

    let body: BotEvaluatePayload;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    if (!body.assignmentId || !ObjectId.isValid(body.assignmentId)) {
      return NextResponse.json(
        { error: "assignmentId is required and must be a valid ObjectId" },
        { status: 400 },
      );
    }

    // ── 2. Fetch caller's profile ─────────────────────────────────────────────

    const callerData = await Collections.userData(db).findOne({
      vaultId: new ObjectId(vaultId),
    });
    if (!callerData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    // ── 3. Fetch assignment ───────────────────────────────────────────────────

    const assignment = await Collections.assignments(db).findOne({
      _id: new ObjectId(body.assignmentId),
    });
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    // ── 4. Permission matrix ──────────────────────────────────────────────────

    const isSystemAdmin = role === "admin" || role === "webmaster";
    const isCommitteeStaff =
      callerData.membershipStatus === "approved" &&
      callerData.committeeMembership?.committee === assignment.committeeSlug &&
      ["HEAD", "COORDINATOR"].includes(
        callerData.committeeMembership?.role ?? "",
      );
    // Members can re-trigger only when the previous bot run failed (under_review)
    const isOwnerRetry =
      (callerData._id as ObjectId).toString() ===
        (assignment.userId as ObjectId).toString() &&
      assignment.status === "under_review";

    if (!isSystemAdmin && !isCommitteeStaff && !isOwnerRetry) {
      return NextResponse.json(
        {
          error:
            "Insufficient permissions to trigger evaluation for this assignment",
        },
        { status: 403 },
      );
    }

    // ── 5. Submission presence check ──────────────────────────────────────────

    if (!assignment.submission?.items?.length) {
      return NextResponse.json(
        { error: "Assignment has no submission — cannot evaluate" },
        { status: 422 },
      );
    }

    // ── 6. Status gate ────────────────────────────────────────────────────────

    const evaluatableStatuses = new Set(["submitted", "under_review"]);
    if (!evaluatableStatuses.has(assignment.status)) {
      return NextResponse.json(
        {
          error: `Assignment status "${assignment.status}" is not eligible for bot evaluation`,
          evaluatableStatuses: [...evaluatableStatuses],
        },
        { status: 409 },
      );
    }

    // ── 7. Fetch parent task ──────────────────────────────────────────────────

    const task = await Collections.tasks(db).findOne({
      _id: assignment.taskId as ObjectId,
    });
    if (!task) {
      return NextResponse.json(
        { error: "Parent task not found" },
        { status: 404 },
      );
    }

    // ── 8. Determine trigger type ─────────────────────────────────────────────

    const trigger =
      body.trigger ??
      (assignment.status === "under_review" ? "RE_EVALUATE" : "MANUAL_TRIGGER");

    // ── 9. Run the evaluation ─────────────────────────────────────────────────
    // runBotEvaluation handles: Gemini API → parse → DB writes → BotActionLog

    const result = await runBotEvaluation(db, {
      assignment,
      task,
      trigger,
      requestedBy: vaultId,
    });

    // ── 10. Return enriched response ──────────────────────────────────────────

    const finalAssignment = await Collections.assignments(db).findOne({
      _id: new ObjectId(body.assignmentId),
    });

    return NextResponse.json({
      message: result.flaggedForHumanReview
        ? "Evaluation complete — flagged for human review"
        : "Evaluation complete",
      evaluation: result.evaluation,
      flaggedForHumanReview: result.flaggedForHumanReview,
      logId: result.logId,
      assignment: finalAssignment,
    });
  } catch (err) {
    console.error("[POST /api/member/bot/evaluate]", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    const isGeminiErr = msg.toLowerCase().includes("gemini");
    return NextResponse.json(
      {
        error: isGeminiErr
          ? "Bot evaluation failed — please try again later"
          : "Internal server error",
        detail: process.env.NODE_ENV === "development" ? msg : undefined,
      },
      { status: isGeminiErr ? 502 : 500 },
    );
  }
});
