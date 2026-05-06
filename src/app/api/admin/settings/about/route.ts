import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { AboutSectionDataMap, AboutSectionKey } from "@/lib/models/aboutPageConfig";

const ALLOWED_ROLES = ["admin", "webmaster"];

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  if (!ALLOWED_ROLES.includes(req.auth.role)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }
  const db = await getDb();
  const sections = await Collections.aboutPageConfig(db).find({}).toArray();
  return NextResponse.json({ sections });
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  if (!ALLOWED_ROLES.includes(req.auth.role)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  try {
    const { sectionKey, data } = (await req.json()) as {
      sectionKey: AboutSectionKey;
      data: unknown;
    };
    if (!sectionKey || !data) {
      return NextResponse.json(
        { error: "sectionKey and data required" },
        { status: 400 },
      );
    }

      if (sectionKey === "team" && req.auth.role !== "webmaster") {
        return NextResponse.json(
          { error: "Webmaster access required for team section" },
          { status: 403 },
        );
    }
    
    const db = await getDb();
    const now = new Date();
    await Collections.aboutPageConfig(db).updateOne(
      { sectionKey },
      {
        $set: {
          data: data as AboutSectionDataMap[AboutSectionKey],
          updatedBy: req.auth.vaultId,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/admin/settings/about]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
