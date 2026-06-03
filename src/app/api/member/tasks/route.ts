// src/app/api/member/tasks/route.ts
// ─── GET /api/member/tasks ────────────────────────────────────────────────────
// Returns tasks for the authenticated member's effective committee,
// each enriched with that member's own assignment summary.
//
// Query params:
//   status  "active" (default) | "completed" | "cancelled" | "archived" | "all"
//   page    page number, default 1
//   limit   items per page, default 20, max 50

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const db = await getDb();
    const { vaultId } = req.auth;

    // ── 1. Fetch UserData — membership gate ───────────────────────────────────

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
        { error: "Approved membership is required to access committee tasks" },
        { status: 403 },
      );
    }

    // ── 2. Resolve effective committee ────────────────────────────────────────
    // temporaryAssignment (if active) takes precedence over primary membership

    const now = new Date();
    const effectiveSlug: string | null =
      userData.temporaryAssignment &&
      new Date(userData.temporaryAssignment.endsAt) > now
        ? userData.temporaryAssignment.committee
        : (userData.committeeMembership?.committee ?? null);

    if (!effectiveSlug) {
      return NextResponse.json(
        { error: "No active committee membership found for this account" },
        { status: 400 },
      );
    }

    // ── 3. Query params ───────────────────────────────────────────────────────

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") ?? "active";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
    const skip = (page - 1) * limit;

    // ── 4. Build task query ───────────────────────────────────────────────────

    const taskQuery: Record<string, unknown> = {
      committeeSlug: effectiveSlug,
      isVisible: true,
    };
    if (statusFilter !== "all") taskQuery.status = statusFilter;

    // ── 5. Fetch tasks + total count (parallel) ───────────────────────────────

    const [tasks, total] = await Promise.all([
      Collections.tasks(db)
        .find(taskQuery)
        // priority DESC (critical first), then deadline ASC (soonest first)
        .sort({ priority: -1, deadline: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      Collections.tasks(db).countDocuments(taskQuery),
    ]);

    if (tasks.length === 0) {
      return NextResponse.json({
        tasks: [],
        committee: { slug: effectiveSlug },
        pagination: { total: 0, page, limit, totalPages: 0 },
      });
    }

    // ── 6. Fetch member's assignments for returned tasks (one round-trip) ─────

    const userId = userData._id as ObjectId;
    const taskIds = tasks.map((t) => t._id as ObjectId);

    const assignments = await Collections.assignments(db)
      .find({ taskId: { $in: taskIds }, userId })
      .project({
        taskId: 1,
        status: 1,
        "submission.submittedAt": 1,
        "evaluation.totalScore": 1,
        "evaluation.maxScore": 1,
        "evaluation.percentageScore": 1,
        "evaluation.evaluatedAt": 1,
        "evaluation.flaggedForHumanReview": 1,
        overriddenDeadline: 1,
        revisionHistory: 1,
      })
      .toArray();

    // ── 7. O(1) lookup map: taskId → assignment ───────────────────────────────

    const assignmentMap = new Map(
      assignments.map((a) => [(a.taskId as ObjectId).toString(), a]),
    );

    // ── 8. Enrich each task with its assignment summary ───────────────────────

    const enriched = tasks.map((task) => {
      const a = assignmentMap.get((task._id as ObjectId).toString()) ?? null;
      return {
        ...task,
        assignment: a
          ? {
              _id: a._id,
              status: a.status,
              submittedAt: a.submission?.submittedAt ?? null,
              score: a.evaluation
                ? {
                    total: a.evaluation.totalScore,
                    max: a.evaluation.maxScore,
                    percentage: a.evaluation.percentageScore,
                  }
                : null,
              evaluatedAt: a.evaluation?.evaluatedAt ?? null,
              flaggedForHumanReview:
                a.evaluation?.flaggedForHumanReview ?? false,
              effectiveDeadline: a.overriddenDeadline ?? task.deadline,
              revisionsRequested: (a.revisionHistory ?? []).length,
            }
          : null,
      };
    });

    // ── 9. Fetch committee display metadata ───────────────────────────────────

    const committee = await Collections.committees(db).findOne(
      { slug: effectiveSlug },
      { projection: { slug: 1, name: 1, color: 1, icon: 1 } },
    );

    return NextResponse.json({
      tasks: enriched,
      committee: committee ?? { slug: effectiveSlug },
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[GET /api/member/tasks]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
