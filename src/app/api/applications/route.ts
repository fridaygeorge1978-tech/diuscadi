// GET  /api/applications — auth required, returns current user's own applications
//   Query: ?type=committee|skills &status=pending|approved|rejected
// POST /api/applications — auth required, submit a new application

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

// ── GET ───────────────────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    const userData = await Collections.userData(db).findOne(
      { vaultId },
      { projection: { _id: 1 } },
    );
    if (!userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    const filter: Record<string, unknown> = { userId: userData._id };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const applications = await Collections.applications(db)
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      applications: applications.map((a) => ({
        id: a._id!.toString(),
        type: a.type,
        status: a.status,
        requestedCommittee: a.requestedCommittee ?? null,
        requestedSkills: a.requestedSkills ?? null,
        reason: a.reason ?? null,
        reviewNote: a.reviewNote ?? null,
        reviewedAt: a.reviewedAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      total: applications.length,
    });
  } catch (err) {
    console.error("[GET /api/applications]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// ── POST ──────────────────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const {
      type,
      requestedCommittee,
      requestedSkills,
      requestedProgram,
      sponsorshipDetails,
      writingSamples,
      topics,
      reason,
    } = body;

    const VALID_TYPES = [
      "membership",
      "committee",
      "skills",
      "sponsorship",
      "program",
      "writer",
    ];

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 },
      );
    }

    const db = await getDb();
    const vaultId = new ObjectId(req.auth.vaultId);

    const userData = await Collections.userData(db).findOne({ vaultId });
    if (!userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    // ── Membership: only participants with pending/no membership can apply ──
    if (type === "membership") {
      if (userData.membershipStatus === "approved") {
        return NextResponse.json(
          { error: "You are already an approved member" },
          { status: 409 },
        );
      }
    }

    // ── Committee: validate against live DB list ───────────────────────────
    // if (type === "committee") {
    //   if (!requestedCommittee || typeof requestedCommittee !== "string") {
    //     return NextResponse.json(
    //       { error: "requestedCommittee is required" },
    //       { status: 400 },
    //     );
    //   }
    //   const committeeDoc = await Collections.committees(db).findOne({
    //     slug: requestedCommittee,
    //     isActive: true,
    //   });
    //   if (!committeeDoc) {
    //     const valid = await Collections.committees(db)
    //       .find({ isActive: true }, { projection: { slug: 1, _id: 0 } })
    //       .toArray();
    //     return NextResponse.json(
    //       {
    //         error: `Invalid committee. Must be one of: ${valid.map((c) => c.slug).join(", ")}`,
    //       },
    //       { status: 400 },
    //     );
    //   }
    // }

    // ── Committee: redirect to dedicated endpoint ──────────────────────────
    if (type === "committee") {
      return NextResponse.json(
        {
          error:
            "Committee applications must be submitted via POST /api/applications/committee",
          redirect: "/api/applications/committee",
        },
        { status: 308 }, // 308 Permanent Redirect — tells the client the method is preserved
      );
    }

    // ── Skills: validate against live DB list ─────────────────────────────
    if (type === "skills") {
      if (!Array.isArray(requestedSkills) || requestedSkills.length === 0) {
        return NextResponse.json(
          { error: "requestedSkills must be a non-empty array" },
          { status: 400 },
        );
      }
      const validSkills = await Collections.skills(db)
        .find({ isActive: true }, { projection: { slug: 1, _id: 0 } })
        .toArray();
      const validSlugs = validSkills.map((s) => s.slug as string);
      const invalid = (requestedSkills as string[]).filter(
        (s) => !validSlugs.includes(s),
      );
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: `Invalid skills: ${invalid.join(", ")}` },
          { status: 400 },
        );
      }
    }

    // ── Program: requires a program name ──────────────────────────────────
    if (type === "program") {
      if (!requestedProgram || typeof requestedProgram !== "string") {
        return NextResponse.json(
          { error: "requestedProgram is required" },
          { status: 400 },
        );
      }
    }

    // ── Writer: writing samples optional but topics required ──────────────
    if (type === "writer") {
      if (!Array.isArray(topics) || topics.length === 0) {
        return NextResponse.json(
          { error: "topics must be a non-empty array for writer applications" },
          { status: 400 },
        );
      }
    }

    // ── Sponsorship: no extra validation — reason is sufficient ───────────

    // ── Block duplicate pending application of same type ──────────────────
    const existing = await Collections.applications(db).findOne({
      userId: userData._id!,
      type,
      status: "pending",
    });
    if (existing) {
      return NextResponse.json(
        { error: `You already have a pending ${type} application` },
        { status: 409 },
      );
    }

    const now = new Date();
    const doc: Record<string, unknown> = {
      userId: userData._id!,
      vaultId,
      type,
      status: "pending",
      reason: reason ?? null,
      createdAt: now,
      updatedAt: now,
    };

    // Type-specific payload fields
    if (type === "committee") doc.requestedCommittee = requestedCommittee;
    if (type === "skills") doc.requestedSkills = requestedSkills;
    if (type === "program") doc.requestedProgram = requestedProgram;
    if (type === "sponsorship")
      doc.sponsorshipDetails = sponsorshipDetails ?? null;
    if (type === "writer") {
      doc.writingSamples = writingSamples ?? null;
      doc.topics = topics ?? null;
    }

    const { insertedId } = await Collections.applications(db).insertOne(
      doc as never,
    );

    return NextResponse.json(
      {
        message: "Application submitted successfully",
        applicationId: insertedId.toString(),
        type,
        status: "pending",
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
