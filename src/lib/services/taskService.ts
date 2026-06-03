// src/lib/services/taskService.ts

import { Db, ObjectId } from "mongodb";
import { Collections } from "@/lib/db/collections";
import type { TaskPriority, TaskScope } from "@/types/tasks";
import type { DbTask } from "@/lib/db/dbTypes";

// ─── Weight Map ───────────────────────────────────────────────────────────────
export const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
} as const;

// ─── Input Contract ───────────────────────────────────────────────────────────
export interface CreateTaskInput {
  title: string;
  description: string;
  committeeSlug: string;
  createdBy: string | ObjectId; // ✅ renamed from creatorId
  scope: TaskScope; // ✅ "individual" | "group" — from types/tasks.ts
  priority: TaskPriority;
  deadline: Date; // ✅ renamed from dueDate
  maxScore?: number;
  specificAssignees?: (string | ObjectId)[];
  deliverables?: {
    label: string;
    description?: string;
    type: "text" | "url" | "file_url" | "image_url";
    required: boolean;
    placeholder?: string;
  }[];
  tags?: string[];
  autoEvaluate?: boolean;
  evaluationCriteria?: string;
  status?: "draft" | "active";
}

// ─── Return Types ─────────────────────────────────────────────────────────────
export interface SpawnResult {
  spawned: number;
  skipped: number;
}

export interface CreateTaskResult {
  task: DbTask;
  spawnResult?: SpawnResult;
}

// ─── createTask ───────────────────────────────────────────────────────────────
export async function createTask(
  db: Db,
  input: CreateTaskInput,
): Promise<CreateTaskResult> {
  const now = new Date();

  const createdBy =
    typeof input.createdBy === "string"
      ? new ObjectId(input.createdBy)
      : input.createdBy;

  const specificAssignees =
    input.specificAssignees?.map((id) =>
      typeof id === "string" ? new ObjectId(id) : id,
    ) ?? [];

  const targetStatus = input.status ?? "draft";

  // Every field is explicit — no implicit `any`, no missing required props
  const taskDoc: Omit<DbTask, "_id"> = {
    title: input.title,
    description: input.description,
    committeeSlug: input.committeeSlug,
    createdBy, // ✅ correct field name
    specificAssignees,
    scope: input.scope,
    priority: input.priority,
    priorityWeight: PRIORITY_WEIGHTS[input.priority], // ✅ always derived, never drifts
    status: targetStatus,
    deadline: new Date(input.deadline), // ✅ correct field name
    deliverables: input.deliverables ?? [], // ✅ was missing
    tags: input.tags ?? [], // ✅ was missing
    maxScore: input.maxScore ?? 100, // ✅ was missing
    autoEvaluate: input.autoEvaluate ?? false, // ✅ was missing
    evaluationCriteria: input.evaluationCriteria ?? "", // ✅ was missing
    isVisible: true, // ✅ was missing
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await Collections.tasks(db).insertOne(taskDoc);
  const createdTask: DbTask & { _id: ObjectId } = {
    _id: insertResult.insertedId,
    ...taskDoc,
  };

  if (targetStatus === "active") {
    const spawnResult = await spawnAssignments(db, {
      _id: createdTask._id,
      committeeSlug: createdTask.committeeSlug,
      specificAssignees: createdTask.specificAssignees,
    });
    return { task: createdTask, spawnResult };
  }

  return { task: createdTask };
}

// ─── spawnAssignments ─────────────────────────────────────────────────────────
export async function spawnAssignments(
  db: Db,
  task: {
    _id: ObjectId;
    committeeSlug: string;
    specificAssignees: (ObjectId | string)[];
  },
): Promise<SpawnResult> {
  const now = new Date();
  let targetIds: ObjectId[];

  if (task.specificAssignees.length > 0) {
    targetIds = task.specificAssignees.map((id) =>
      typeof id === "string" ? new ObjectId(id) : id,
    );
  } else {
    const members = await Collections.userData(db)
      .find(
        {
          "committeeMembership.committee": task.committeeSlug,
          membershipStatus: "approved",
        },
        { projection: { _id: 1 } },
      )
      .toArray();
    targetIds = members.map((m) => m._id as ObjectId);
  }

  if (targetIds.length === 0) return { spawned: 0, skipped: 0 };

  const docs = targetIds.map((userId) => ({
    taskId: task._id,
    userId,
    committeeSlug: task.committeeSlug,
    status: "pending" as const,
    revisionHistory: [] as never[],
    overriddenDeadline: null,
    createdAt: now,
    updatedAt: now,
  }));

  try {
    const result = await Collections.assignments(db).insertMany(docs, {
      ordered: false,
    });
    return {
      spawned: result.insertedCount,
      skipped: docs.length - result.insertedCount,
    };
  } catch (err: unknown) {
    const e = err as { code?: number; result?: { insertedCount?: number } };
    if (e?.code === 11000 || e?.result) {
      const inserted = e.result?.insertedCount ?? 0;
      return { spawned: inserted, skipped: docs.length - inserted };
    }
    throw err;
  }
}

// ─── activateTask ─────────────────────────────────────────────────────────────
export async function activateTask(
  db: Db,
  taskId: ObjectId,
): Promise<SpawnResult> {
  const now = new Date();

  const task = await Collections.tasks(db).findOneAndUpdate(
    { _id: taskId, status: "draft" },
    { $set: { status: "active", updatedAt: now } },
    { returnDocument: "after" },
  );

  if (!task) return { spawned: 0, skipped: 0 };

  return spawnAssignments(db, {
    _id: task._id as ObjectId,
    committeeSlug: task.committeeSlug,
    specificAssignees: (task.specificAssignees as ObjectId[]) ?? [],
  });
}
