import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest, resolveParams } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

// ── PATCH /api/applications/[id] ──────────────────────────────────────────────
// Admin/webmaster  → approve or reject (body: { status, reviewNote? })
// Own applicant    → withdraw only    (body: { status: "withdrawn" })
export const PATCH = withAuth(
  async (
    req: AuthenticatedRequest,
    context?: {
      params?: Promise<Record<string, string>> | Record<string, string>;
    },
  ) => {
    try {
      const { id } = await resolveParams(context);
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid application ID" },
          { status: 400 },
        );
      }

      const db = await getDb();
      const appId = new ObjectId(id);
      const vaultId = new ObjectId(req.auth.vaultId);
      const isAdmin =
        req.auth.role === "admin" || req.auth.role === "webmaster";

      const application = await Collections.applications(db).findOne({
        _id: appId,
      });
      if (!application) {
        return NextResponse.json(
          { error: "Application not found" },
          { status: 404 },
        );
      }

      const body = await req.json();
      const { status, reviewNote } = body;

      // ── Applicant: withdraw only ───────────────────────────────────────────
      if (!isAdmin) {
        if (!application.vaultId.equals(vaultId)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (status !== "withdrawn") {
          return NextResponse.json(
            { error: "You can only withdraw your own application" },
            { status: 403 },
          );
        }
        if (application.status !== "pending") {
          return NextResponse.json(
            { error: "Only pending applications can be withdrawn" },
            { status: 409 },
          );
        }
        await Collections.applications(db).updateOne(
          { _id: appId },
          { $set: { status: "withdrawn", updatedAt: new Date() } },
        );
        return NextResponse.json({ message: "Application withdrawn" });
      }

      // ── Admin: approve or reject ───────────────────────────────────────────
      if (!["approved", "rejected"].includes(status)) {
        return NextResponse.json(
          { error: "status must be 'approved' or 'rejected'" },
          { status: 400 },
        );
      }
      if (application.status !== "pending") {
        return NextResponse.json(
          { error: "Only pending applications can be reviewed" },
          { status: 409 },
        );
      }

      const now = new Date();

      if (status === "approved") {
        if (application.type === "committee") {
          if (!application.requestedCommittee) {
            return NextResponse.json(
              { error: "Application is missing requestedCommittee" },
              { status: 400 },
            );
          }

          const committeeDoc = await Collections.committees(db).findOne({
            slug: application.requestedCommittee,
            isActive: true,
          });
          if (!committeeDoc) {
            return NextResponse.json(
              { error: "Target committee is no longer active" },
              { status: 409 },
            );
          }

          // Fetch current user to decrement their old committee's memberCount
          const userData = await Collections.userData(db).findOne(
            { _id: application.userId },
            { projection: { committeeMembership: 1 } },
          );

          if (userData?.committeeMembership?.committee) {
            await Collections.committees(db).updateOne(
              { slug: userData.committeeMembership.committee },
              { $inc: { memberCount: -1 } },
            );
          }

          // Assign committee membership — always MEMBER role on application approval
          await Collections.userData(db).updateOne(
            { _id: application.userId },
            {
              $set: {
                committeeMembership: {
                  committee: application.requestedCommittee,
                  role: "MEMBER",
                  joinedAt: now,
                  assignedBy: vaultId,
                },
                updatedAt: now,
              },
            },
          );

          // Increment new committee member count
          await Collections.committees(db).updateOne(
            { slug: application.requestedCommittee },
            { $inc: { memberCount: 1 } },
          );

          // Auto-reject all other pending committee applications from this user
          // — they can only be in one committee at a time
          await Collections.applications(db).updateMany(
            {
              vaultId: application.vaultId,
              type: "committee",
              status: "pending",
              _id: { $ne: appId },
            },
            {
              $set: {
                status: "rejected",
                reviewNote:
                  "Auto-rejected: another committee application was approved.",
                reviewedBy: vaultId,
                reviewedAt: now,
                updatedAt: now,
              },
            },
          );
        }

        // Membership approval — just flip membershipStatus
        if (application.type === "membership") {
          await Collections.userData(db).updateOne(
            { _id: application.userId },
            { $set: { membershipStatus: "approved", updatedAt: now } },
          );
        }
      }

      // Stamp the application itself
      await Collections.applications(db).updateOne(
        { _id: appId },
        {
          $set: {
            status,
            reviewedBy: vaultId,
            reviewedAt: now,
            updatedAt: now,
            ...(reviewNote ? { reviewNote } : {}),
          },
        },
      );

      return NextResponse.json({ message: `Application ${status}` });
    } catch (err) {
      console.error("[PATCH /api/applications/[id]]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
