// POST /api/platform/skills/suggest
// Authenticated users suggest a new skill that doesn't exist in the DB.
// Deduplicates by normalized name — increments suggestionCount if already pending.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

function toSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { name, source = "event-form" } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const trimmed = name.trim();
    const suggestedSlug = toSlug(trimmed);

    if (!suggestedSlug) {
      return NextResponse.json(
        { error: "Invalid skill name" },
        { status: 400 },
      );
    }

    const db = await getDb();

    // Check if this skill already exists in the approved skills list
    const existing = await Collections.skills(db).findOne({
      slug: suggestedSlug,
      isActive: true,
    });

    if (existing) {
      return NextResponse.json({
        alreadyExists: true,
        slug: existing.slug,
        name: existing.name,
      });
    }

    const now = new Date();

    // Upsert — increment count if already pending, create if new
    await Collections.skillSuggestions(db).updateOne(
      { suggestedSlug, status: "pending" },
      {
        $inc: { suggestionCount: 1 },
        $set: { updatedAt: now },
        $setOnInsert: {
          name: trimmed,
          suggestedSlug,
          category: "Other",
          source,
          suggestedBy: new ObjectId(req.auth.vaultId),
          suggestionCount: 1,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true },
    );

    return NextResponse.json({
      ok: true,
      suggestedSlug,
      message: "Skill suggestion submitted for admin review",
    });
  } catch (err) {
    console.error("[POST /api/platform/skills/suggest]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
