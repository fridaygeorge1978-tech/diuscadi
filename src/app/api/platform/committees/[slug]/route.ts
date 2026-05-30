import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest, resolveParams } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

// GET /api/committees/[slug]
// Protected. Returns full committee details (including whatsappLink) + member list.
// Access: own committee members + admin/webmaster.
export const GET = withAuth(
   async (
    req: AuthenticatedRequest,
    context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  ) => {
    try {
      const { slug } = await resolveParams(context);
      if (!slug) {
        return NextResponse.json({ error: "Missing slug" }, { status: 400 });
        }
        
      const db = await getDb();
      const vaultId = new ObjectId(req.auth.vaultId);
      const isAdmin =
        req.auth.role === "admin" || req.auth.role === "webmaster";

      const committee = await Collections.committees(db).findOne({
        slug,
        isActive: true,
      });
      if (!committee) {
        return NextResponse.json(
          { error: "Committee not found" },
          { status: 404 },
        );
      }

      // Non-admins must be in this committee (permanent or active temp)
      if (!isAdmin) {
        const userData = await Collections.userData(db).findOne(
          { vaultId },
          {
            projection: {
              committeeMembership: 1,
              temporaryAssignment: 1,
            },
          },
        );

        const now = new Date();
        const effectiveCommittee =
          userData?.temporaryAssignment &&
          userData.temporaryAssignment.endsAt > now
            ? userData.temporaryAssignment.committee
            : userData?.committeeMembership?.committee;

        if (effectiveCommittee !== slug) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }

      // Fetch all members — permanent + active temporary
      const now = new Date();
      const members = await Collections.userData(db)
        .find(
          {
            $or: [
              { "committeeMembership.committee": slug },
              {
                "temporaryAssignment.committee": slug,
                "temporaryAssignment.endsAt": { $gt: now },
              },
            ],
          },
          {
            projection: {
              _id: 1,
              fullName: 1,
              hasAvatar: 1,
              avatar: 1,
              committeeMembership: 1,
              temporaryAssignment: 1,
              skills: 1,
            },
          },
        )
        .toArray();

      const memberList = members.map((m) => {
        const isTemp =
          m.temporaryAssignment?.committee === slug &&
          m.temporaryAssignment.endsAt > now;
        return {
          id: m._id?.toString(),
          fullName: m.fullName,
          hasAvatar: m.hasAvatar,
          avatar: m.avatar,
          role: isTemp
            ? m.temporaryAssignment!.role
            : m.committeeMembership?.role,
          joinedAt: isTemp
            ? m.temporaryAssignment!.assignedAt
            : m.committeeMembership?.joinedAt,
          isTemporary: isTemp,
          tempEndsAt: isTemp ? m.temporaryAssignment!.endsAt : undefined,
          skills: m.skills,
        };
      });

      return NextResponse.json({
        committee: {
          slug: committee.slug,
          name: committee.name,
          shortDesc: committee.shortDesc,
          description: committee.description,
          color: committee.color,
          icon: committee.icon,
          headName: committee.headName,
          memberCount: committee.memberCount,
          whatsappLink: committee.whatsappLink, // private — only here
        },
        members: memberList,
      });
    } catch (err) {
      console.error("[GET /api/committees/[slug]]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
