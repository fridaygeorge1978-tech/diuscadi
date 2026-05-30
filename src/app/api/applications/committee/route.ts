import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import type {
  ApplicationDocument,
  AvailabilityCategory,
} from "@/lib/models/Application";
import { AVAILABILITY_CATEGORIES } from "@/lib/models/Application";

// ── POST /api/applications ────────────────────────────────────────────────────
// Submit a committee application.
// Only approved members (membershipStatus === "approved") may apply.
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const {
      type,
      requestedCommittee,
      reason,
      committeeSkills,
      availability,
      references,
    } = body;

    if (type !== "committee") {
      return NextResponse.json(
        { error: "Only committee applications are handled by this endpoint" },
        { status: 400 },
      );
    }

    if (!requestedCommittee || !reason || !availability?.category) {
      return NextResponse.json(
        {
          error:
            "requestedCommittee, reason, and availability.category are required",
        },
        { status: 400 },
      );
    }

    if (!AVAILABILITY_CATEGORIES.includes(availability.category)) {
      return NextResponse.json(
        {
          error: `availability.category must be one of: ${AVAILABILITY_CATEGORIES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    const userData = await Collections.userData(db).findOne({ vaultId });
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Gate: approved members only
    if (userData.membershipStatus !== "approved") {
      return NextResponse.json(
        { error: "Only approved members can apply to join a committee" },
        { status: 403 },
      );
    }

    // Gate: not already in this committee
    if (userData.committeeMembership?.committee === requestedCommittee) {
      return NextResponse.json(
        { error: "You are already a member of this committee" },
        { status: 409 },
      );
    }

    // Validate committee is active
    const committeeDoc = await Collections.committees(db).findOne({
      slug: requestedCommittee,
      isActive: true,
    });
    if (!committeeDoc) {
      return NextResponse.json(
        { error: "Committee not found or is not active" },
        { status: 404 },
      );
    }

    // Gate: no existing pending application for this committee
    const existingApp = await Collections.applications(db).findOne({
      vaultId,
      type: "committee",
      requestedCommittee,
      status: "pending",
    });
    if (existingApp) {
      return NextResponse.json(
        { error: "You already have a pending application for this committee" },
        { status: 409 },
      );
    }

    // Validate committeeSkills are a subset of the user's own skills
    if (Array.isArray(committeeSkills) && committeeSkills.length > 0) {
      const userSkillSet = new Set(userData.skills);
      const invalid = (committeeSkills as string[]).filter(
        (s) => !userSkillSet.has(s),
      );
      if (invalid.length > 0) {
        return NextResponse.json(
          {
            error: `Skills not on your profile: ${invalid.join(", ")}. Add them first.`,
          },
          { status: 400 },
        );
      }
    }

    const now = new Date();
    const application: ApplicationDocument = {
      userId: userData._id as ObjectId,
      vaultId,
      type: "committee",
      status: "pending",
      requestedCommittee,
      reason,
      committeeSkills: committeeSkills ?? [],
      availability: {
        category: availability.category as AvailabilityCategory,
        ...(availability.note ? { note: availability.note } : {}),
      },
      ...(references ? { references } : {}),
      createdAt: now,
      updatedAt: now,
    };

    const result = await Collections.applications(db).insertOne(application);

    return NextResponse.json(
      {
        message: "Application submitted successfully",
        applicationId: result.insertedId.toString(),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/applications]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// ── GET /api/applications ─────────────────────────────────────────────────────
// Admin/webmaster: all applications, filterable by ?type=&status=&committee=
// Others: own applications only
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);
    const { searchParams } = new URL(req.url);
    const isAdmin = req.auth.role === "admin" || req.auth.role === "webmaster";

    const filter: Record<string, unknown> = {};

    if (!isAdmin) {
      filter.vaultId = vaultId;
    } else {
      const s = searchParams.get("status");
      const t = searchParams.get("type");
      const c = searchParams.get("committee");
      if (s) filter.status = s;
      if (t) filter.type = t;
      if (c) filter.requestedCommittee = c;
    }

    const applications = await Collections.applications(db)
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({ applications });
  } catch (err) {
    console.error("[GET /api/applications]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
