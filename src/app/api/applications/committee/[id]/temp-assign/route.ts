import { NextResponse } from "next/server";
import {
  withAuth,
  AuthenticatedRequest,
  resolveParams,
} from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

// ── POST — create a temporary assignment ──────────────────────────────────────
// [id] = userDataId of the target member
// Body: { committee: string, role: string, endsAt: ISO string }
//
// committeeMembership is never touched — the permanent membership is snapshotted
// inside temporaryAssignment.originalCommittee so the revert in /api/auth/me
// is completely lossless.
export const POST = withAuth(
  async (
    req: AuthenticatedRequest,
    context?: {
      params?: Record<string, string> | Promise<Record<string, string>>;
    },
  ) => {
    try {
      if (req.auth.role !== "admin" && req.auth.role !== "webmaster") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

     const { id } = await resolveParams(context);
     if (!id || !ObjectId.isValid(id)) {
       return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
     }

      const body = await req.json();
      const { committee, role, endsAt } = body;

      if (!committee || !role || !endsAt) {
        return NextResponse.json(
          { error: "committee, role, and endsAt are required" },
          { status: 400 },
        );
      }

      const endsAtDate = new Date(endsAt);
      if (isNaN(endsAtDate.getTime()) || endsAtDate <= new Date()) {
        return NextResponse.json(
          { error: "endsAt must be a valid date in the future" },
          { status: 400 },
        );
      }

      const db = await getDb();
      const userDataId = new ObjectId(id);
      const adminVaultId = new ObjectId(req.auth.vaultId);

      const [committeeDoc, roleDoc, userData] = await Promise.all([
        Collections.committees(db).findOne({ slug: committee, isActive: true }),
        Collections.committeeRoles(db).findOne({ slug: role, isActive: true }),
        Collections.userData(db).findOne({ _id: userDataId }),
      ]);

      if (!committeeDoc) {
        return NextResponse.json(
          { error: "Committee not found or not active" },
          { status: 404 },
        );
      }
      if (!roleDoc) {
        return NextResponse.json(
          { error: "Role not found or not active" },
          { status: 404 },
        );
      }
      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      if (userData.membershipStatus !== "approved") {
        return NextResponse.json(
          { error: "Only approved members can receive temporary assignments" },
          { status: 400 },
        );
      }

      const now = new Date();

      // If replacing an existing active temp assignment, decrement its committee
      if (
        userData.temporaryAssignment &&
        userData.temporaryAssignment.endsAt > now
      ) {
        await Collections.committees(db).updateOne(
          { slug: userData.temporaryAssignment.committee },
          { $inc: { memberCount: -1 } },
        );
      }

      await Collections.userData(db).updateOne(
        { _id: userDataId },
        {
          $set: {
            temporaryAssignment: {
              committee,
              role,
              endsAt: endsAtDate,
              originalCommittee:
                userData.committeeMembership?.committee ?? null,
              originalRole: userData.committeeMembership?.role ?? null,
              assignedBy: adminVaultId,
              assignedAt: now,
            },
            updatedAt: now,
          },
        },
      );

      await Collections.committees(db).updateOne(
        { slug: committee },
        { $inc: { memberCount: 1 } },
      );

      return NextResponse.json({
        message: `${userData.fullName.firstname} temporarily assigned to ${committeeDoc.name} until ${endsAtDate.toLocaleDateString()}.`,
      });
    } catch (err) {
      console.error("[POST temp-assign]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);

// ── DELETE — manually end a temporary assignment early ────────────────────────
export const DELETE = withAuth(
  async (
    req: AuthenticatedRequest,
    context?: {
      params?: Record<string, string> | Promise<Record<string, string>>;
    },
  ) => {
    try {
      if (req.auth.role !== "admin" && req.auth.role !== "webmaster") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { id } = await resolveParams(context);
      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
      }

      const db = await getDb();
      const userDataId = new ObjectId(id);

      const userData = await Collections.userData(db).findOne(
        { _id: userDataId },
        { projection: { temporaryAssignment: 1, fullName: 1 } },
      );
      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      if (!userData.temporaryAssignment) {
        return NextResponse.json(
          { error: "No active temporary assignment found" },
          { status: 404 },
        );
      }

      await Collections.committees(db).updateOne(
        { slug: userData.temporaryAssignment.committee },
        { $inc: { memberCount: -1 } },
      );

      await Collections.userData(db).updateOne(
        { _id: userDataId },
        {
          $unset: { temporaryAssignment: "" },
          $set: { updatedAt: new Date() },
        },
      );

      return NextResponse.json({ message: "Temporary assignment ended" });
    } catch (err) {
      console.error("[DELETE temp-assign]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
