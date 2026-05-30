// app/api/platform/committees/route.ts
// GET /api/platform/committees — public
// Returns all active committees ordered by displayOrder.

import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { seedIfEmpty } from "@/lib/db/seed";

export async function GET() {
  try {
    const db = await getDb();
    await seedIfEmpty();

    const committees = await Collections.committees(db)
      .find({ isActive: true })
      .sort({ displayOrder: 1 })
      .project({
        _id: 0,
        slug: 1,
        name: 1,
        shortDesc: 1,
        description: 1,
        color: 1,
        icon: 1,
        headName: 1,
        memberCount: 1,
        displayOrder: 1,
      })
      .toArray();

    return NextResponse.json({ committees });
  } catch (err) {
    console.error("[GET /api/platform/committees]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
