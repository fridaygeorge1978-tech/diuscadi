// src/app/api/admin/tasks/create/route.ts
// ─── POST /api/admin/tasks/create ────────────────────────────────────────────
// Creates a committee task.
//
// Who can call:
//   "admin" | "webmaster"  →  can create for any committee
//   "participant" with committeeMembership.role "HEAD" | "COORDINATOR"
//                          →  can only create for their own committee

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import { PRIORITY_WEIGHTS, spawnAssignments } from "@/lib/services/taskService";
import type {
  CreateTaskPayload,
  TaskScope,
  TaskPriority,
  TaskStatus,
} from "@/types/tasks";

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const db = await getDb();
    const { vaultId, role } = req.auth;

    // ── 1. Parse body ─────────────────────────────────────────────────────────

    let body: CreateTaskPayload;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    // ── 2. Fetch caller's UserData for role-elevation check ───────────────────

    const userData = await Collections.userData(db).findOne({
      vaultId: new ObjectId(vaultId),
    });
    if (!userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    // ── 3. Permission check ───────────────────────────────────────────────────

    const isSystemAdmin = role === "admin" || role === "webmaster";
    const isCommitteeStaff =
      userData.membershipStatus === "approved" &&
      userData.committeeMembership?.committee === body.committeeSlug &&
      ["HEAD", "COORDINATOR"].includes(
        userData.committeeMembership?.role ?? "",
      );

    if (!isSystemAdmin && !isCommitteeStaff) {
      return NextResponse.json(
        {
          error:
            "Insufficient permissions. Requires admin/webmaster role, " +
            "or HEAD/COORDINATOR of the target committee.",
        },
        { status: 403 },
      );
    }

    // ── 4. Required field validation ──────────────────────────────────────────

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!body.description?.trim()) {
      return NextResponse.json(
        { error: "description is required" },
        { status: 400 },
      );
    }
    if (!body.committeeSlug?.trim()) {
      return NextResponse.json(
        { error: "committeeSlug is required" },
        { status: 400 },
      );
    }
    if (!body.deadline) {
      return NextResponse.json(
        { error: "deadline is required" },
        { status: 400 },
      );
    }

    const deadlineDate = new Date(body.deadline);
    if (isNaN(deadlineDate.getTime())) {
      return NextResponse.json(
        { error: "deadline must be a valid ISO 8601 date string" },
        { status: 400 },
      );
    }
    if (deadlineDate <= new Date()) {
      return NextResponse.json(
        { error: "deadline must be in the future" },
        { status: 400 },
      );
    }

    // ── 5. Validate committeeSlug exists ──────────────────────────────────────

    const committee = await Collections.committees(db).findOne({
      slug: body.committeeSlug,
    });
    if (!committee) {
      return NextResponse.json(
        { error: `Committee "${body.committeeSlug}" not found` },
        { status: 404 },
      );
    }

    // ── 6. Build and insert task document ─────────────────────────────────────

    const now = new Date();
    const newTask = {
      title: body.title.trim(),
      description: body.description.trim(),
      committeeSlug: body.committeeSlug.trim(),
      createdBy: new ObjectId(vaultId),
      specificAssignees: (body.specificAssignees ?? []).map(
        (id) => new ObjectId(id),
      ),
      scope: (body.scope ?? "individual") as TaskScope,
      priority: (body.priority ?? "medium") as TaskPriority,
      priorityWeight: PRIORITY_WEIGHTS[body.priority ?? "medium"], // ← add this
      status: (body.publishImmediately ? "active" : "draft") as TaskStatus,
      deadline: deadlineDate,
      deliverables: body.deliverables ?? [],
      tags: (body.tags ?? []).map((t) => t.toLowerCase().trim()),
      maxScore: body.maxScore ?? 100,
      autoEvaluate: body.autoEvaluate ?? false,
      evaluationCriteria: body.evaluationCriteria?.trim() ?? "",
      isVisible: true,
      createdAt: now,
      updatedAt: now,
    };

    const { insertedId } = await Collections.tasks(db).insertOne(newTask);

    // ── 7. Spawn assignments if publishing immediately ─────────────────────────

    let spawnResult = { spawned: 0, skipped: 0 };
    if (body.publishImmediately) {
      try {
        spawnResult = await spawnAssignments(db, {
          _id: insertedId,
          committeeSlug: newTask.committeeSlug,
          specificAssignees: newTask.specificAssignees,
        });
      } catch (spawnErr) {
        // Task is already created+active — spawn failure is logged but non-fatal.
        // An admin can re-trigger spawning via a separate activate endpoint.
        console.error("[tasks/create] assignment spawn error:", spawnErr);
      }
    }

    return NextResponse.json(
      {
        message: body.publishImmediately
          ? `Task published. ${spawnResult.spawned} assignment(s) created.`
          : "Task saved as draft.",
        task: { ...newTask, _id: insertedId },
        assignments: spawnResult,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/admin/tasks/create]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
