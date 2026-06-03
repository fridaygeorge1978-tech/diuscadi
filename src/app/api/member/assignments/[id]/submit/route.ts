// src/app/api/member/assignments/[id]/submit/route.ts
// ─── POST /api/member/assignments/[id]/submit ─────────────────────────────────
// Submits deliverables for an assignment the authenticated member owns.
// If the parent task has autoEvaluate=true → Gemini bot fires immediately.
// Bot failure is non-fatal: assignment stays "submitted", moves to "under_review".

import { NextResponse } from "next/server";
import {
  withAuth,
  AuthenticatedRequest,
  resolveParams,
} from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { runBotEvaluation } from "@/lib/services/botEvaluationService";
import type { SubmitAssignmentPayload } from "@/types/tasks";

export const POST = withAuth(async (req: AuthenticatedRequest, context) => {
  try {
    const { id } = await resolveParams(context);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid assignment ID" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const { vaultId } = req.auth;

    // ── 1. Membership gate ────────────────────────────────────────────────────

    const userData = await Collections.userData(db).findOne({
      vaultId: new ObjectId(vaultId),
    });
    if (!userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }
    if (userData.membershipStatus !== "approved") {
      return NextResponse.json(
        { error: "Approved membership required" },
        { status: 403 },
      );
    }

    // ── 2. Ownership check ────────────────────────────────────────────────────
    // userId === userData._id ensures a member can only touch their own assignments

    const assignment = await Collections.assignments(db).findOne({
      _id: new ObjectId(id),
      userId: userData._id as ObjectId,
    });
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    // ── 3. Status gate ────────────────────────────────────────────────────────

    const submittableStatuses = new Set([
      "pending",
      "in_progress",
      "revision_requested",
    ]);
    if (!submittableStatuses.has(assignment.status)) {
      return NextResponse.json(
        {
          error: `Cannot submit from current status: "${assignment.status}"`,
          currentStatus: assignment.status,
        },
        { status: 409 },
      );
    }

    // ── 4. Fetch parent task ──────────────────────────────────────────────────

    const task = await Collections.tasks(db).findOne({
      _id: assignment.taskId as ObjectId,
    });
    if (!task) {
      return NextResponse.json(
        { error: "Parent task not found" },
        { status: 404 },
      );
    }

    // ── 5. Deadline check (overridden deadline takes precedence) ──────────────

    const effectiveDeadline = new Date(
      assignment.overriddenDeadline ?? task.deadline,
    );
    if (new Date() > effectiveDeadline) {
      return NextResponse.json(
        {
          error: "Submission deadline has passed",
          deadline: effectiveDeadline,
        },
        { status: 422 },
      );
    }

    // ── 6. Parse body ─────────────────────────────────────────────────────────

    let body: SubmitAssignmentPayload;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "At least one submission item is required" },
        { status: 400 },
      );
    }

    // ── 7. Required deliverable check ─────────────────────────────────────────

    const requiredLabels = (task.deliverables ?? [])
      .filter((d) => d.required)
      .map((d) => d.label);
    const submittedLabels = new Set(body.items.map((i) => i.deliverableLabel));
    const missing = requiredLabels.filter((l) => !submittedLabels.has(l));

    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Missing required deliverables", missing },
        { status: 422 },
      );
    }

    // ── 8. Write submission ───────────────────────────────────────────────────

    const now = new Date();
    const isResubmission = assignment.status === "revision_requested";
    const newSubmission = {
      items: body.items,
      submittedAt: now,
      additionalNotes: body.additionalNotes?.trim() ?? "",
    };

    // When resubmitting after a revision request, stamp the most recent open
    // revision history entry with resubmittedAt using an arrayFilter.
    await Collections.assignments(db).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "submitted",
          submission: newSubmission,
          updatedAt: now,
          ...(isResubmission && {
            "revisionHistory.$[last].resubmittedAt": now,
          }),
        },
      },
      isResubmission
        ? { arrayFilters: [{ "last.resubmittedAt": { $exists: false } }] }
        : {},
    );

    // ── 9. Auto-evaluate ──────────────────────────────────────────────────────

    let botTriggered = false;
    let evaluationPreview = null;

    if (task.autoEvaluate) {
      try {
        const result = await runBotEvaluation(db, {
          assignment: {
            ...assignment,
            submission: newSubmission,
            status: "submitted",
          },
          task,
          trigger: "AUTO_SUBMIT",
          requestedBy: vaultId,
        });

        botTriggered = true;
        evaluationPreview = {
          score: result.evaluation.totalScore,
          maxScore: result.evaluation.maxScore,
          percentage: result.evaluation.percentageScore,
          flaggedForHumanReview: result.flaggedForHumanReview,
          feedback: result.evaluation.feedback,
        };
      } catch (botErr) {
        // Bot failure is intentionally non-fatal.
        // runBotEvaluation already moved the assignment to "under_review" and
        // wrote a failure BotActionLog before throwing.
        console.error(
          "[submit] autoEvaluate failed — queued for human review:",
          botErr,
        );
      }
    }

    // ── 10. Return final state ────────────────────────────────────────────────

    const finalAssignment = await Collections.assignments(db).findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      message: "Assignment submitted successfully",
      assignment: finalAssignment,
      botTriggered,
      evaluationPreview,
    });
  } catch (err) {
    console.error("[POST /api/member/assignments/[id]/submit]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
