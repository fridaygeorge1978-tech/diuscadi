// GET /api/admin/users/search
// Lightweight endpoint for member picker in admin UI.
// Returns id, fullName, email, avatar only — no sensitive data.

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";

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
    const q = url.searchParams.get("q")?.trim() ?? "";
    const limit = Math.min(15, parseInt(url.searchParams.get("limit") ?? "10"));

    const filter: Record<string, unknown> = {
      membershipStatus: "approved",
    };

    if (q) {
      filter.$or = [
        { "fullName.firstname": { $regex: q, $options: "i" } },
        { "fullName.lastname": { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const users = await Collections.userData(db)
      .find(filter, {
        projection: {
          _id: 1,
          fullName: 1,
          email: 1,
          hasAvatar: 1,
          avatar: 1,
        },
      })
      .sort({ "fullName.firstname": 1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      users: users.map((u) => ({
        id: u._id!.toString(),
        fullName: u.fullName,
        email: u.email,
        avatarUrl: u.hasAvatar ? (u.avatar?.imageUrl ?? null) : null,
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/users/search]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
