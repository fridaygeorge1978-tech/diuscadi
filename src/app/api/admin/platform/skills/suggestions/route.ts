// GET   — list pending skill suggestions
// PATCH — approve or reject a suggestion

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import type { SkillCategory } from "@/lib/models/platformConfig";
import { SuggestionStatus } from "@/lib/models/SkillSuggestion";

const ALLOWED_ROLES = ["admin", "webmaster"];

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  if (!ALLOWED_ROLES.includes(req.auth.role)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const db = await getDb();
    const url = new URL(req.url);
    const status = (url.searchParams.get("status") ??
      "pending") as SuggestionStatus;

    const suggestions = await Collections.skillSuggestions(db)
      .find({ status })
      .sort({ suggestionCount: -1, createdAt: 1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      suggestions: suggestions.map((s) => ({
        id: s._id!.toString(),
        name: s.name,
        suggestedSlug: s.suggestedSlug,
        category: s.category,
        source: s.source,
        suggestionCount: s.suggestionCount,
        status: s.status,
        reviewNote: s.reviewNote ?? null,
        reviewedAt: s.reviewedAt?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/platform/skills/suggestions]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  if (!ALLOWED_ROLES.includes(req.auth.role)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const db = await getDb();
    const {
      id,
      action, // "approve" | "reject"
      category, // required when approving — admin sets the right category
      reviewNote,
    } = await req.json();

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid suggestion id" },
        { status: 400 },
      );
    }
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "action must be approve or reject" },
        { status: 400 },
      );
    }

    const suggestion = await Collections.skillSuggestions(db).findOne({
      _id: new ObjectId(id),
    });
    if (!suggestion) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 },
      );
    }

    const now = new Date();
    const reviewedBy = new ObjectId(req.auth.vaultId);

    if (action === "reject") {
      await Collections.skillSuggestions(db).updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: "rejected",
            reviewedBy,
            reviewNote: reviewNote ?? null,
            reviewedAt: now,
            updatedAt: now,
          },
        },
      );
      return NextResponse.json({ ok: true, action: "rejected" });
    }

    // Approve — create the actual SkillDocument
    if (!category) {
      return NextResponse.json(
        { error: "category is required when approving" },
        { status: 400 },
      );
    }

    // Check slug not already taken
    const slugTaken = await Collections.skills(db).findOne({
      slug: suggestion.suggestedSlug,
    });
    if (slugTaken) {
      return NextResponse.json(
        { error: "A skill with this slug already exists" },
        { status: 409 },
      );
    }

    // Get current max displayOrder for this category
    const [lastInCategory] = await Collections.skills(db)
      .find({ category: category as SkillCategory })
      .sort({ displayOrder: -1 })
      .limit(1)
      .toArray();

    const displayOrder = (lastInCategory?.displayOrder ?? 0) + 1;

    const { insertedId } = await Collections.skills(db).insertOne({
      slug: suggestion.suggestedSlug,
      name: suggestion.name,
      category: category as SkillCategory,
      isActive: true,
      displayOrder,
      createdBy: reviewedBy,
      createdAt: now,
      updatedAt: now,
    });

    // Mark suggestion as approved
    await Collections.skillSuggestions(db).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "approved",
          approvedSkillId: insertedId,
          category: category as SkillCategory,
          reviewedBy,
          reviewNote: reviewNote ?? null,
          reviewedAt: now,
          updatedAt: now,
        },
      },
    );

    return NextResponse.json({
      ok: true,
      action: "approved",
      newSkillId: insertedId.toString(),
      newSkillSlug: suggestion.suggestedSlug,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/platform/skills/suggestions]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
