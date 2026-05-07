// GET /api/member/[id]
// Public endpoint. Resolves user by MongoDB _id.
// Applies privacy filter based on viewer role from JWT cookie.
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { verifyJWT } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { DEFAULT_PREFERENCES, UserPreferences, Visibility } from "@/types/domain";

// type Visibility = "public" | "members" | "private";
type ViewerRole = "public" | "participant" | "member" | "admin";

function resolveViewerRole(
  membershipStatus: string | undefined,
  role: string | undefined,
): ViewerRole {
  if (!role) return "public";
  if (role === "admin" || role === "webmaster") return "admin";
  if (membershipStatus === "approved") return "member";
  return "participant";
}

function canSee(setting: Visibility, viewer: ViewerRole): boolean {
  if (viewer === "admin") return true;
  if (setting === "public") return true;
  if (
    setting === "members" &&
    (viewer === "member" || viewer === "participant")
  )
    return true;
  return false;
}

// ── Normalise old shape → new shape ──────────────────────────────────────────
// Old: { profilePrivate, showEmail, showPhone }
// New: { profileVisibility, fieldPermissions: { email, phone, location, socials, academic } }
// Change signature to use your actual Type
function normalisePrivacy(prefs: UserPreferences) {
  const privacy = prefs.privacy;

  // We check if the NEW fields exist
  if (privacy.profileVisibility && privacy.fieldPermissions) {
    return {
      profileVisibility: privacy.profileVisibility,
      fieldPermissions: privacy.fieldPermissions as Record<string, Visibility>,
    };
  }

  // Fallback to legacy migration (using the optional keys we added to the interface)
  return {
    profileVisibility: (privacy.profilePrivate ? "private" : "members") as Visibility,
    fieldPermissions: {
      email:    (privacy.showEmail ? "members" : "private") as Visibility,
      phone:    (privacy.showPhone ? "members" : "private") as Visibility,
      location: "private" as Visibility,
      socials:  "members" as Visibility,
      academic: "private" as Visibility,
    },
  };
}

type Context = {
  params?: Promise<Record<string, string>> | Record<string, string>;
};

export async function GET(req: Request, context?: Context) {
  try {
    const params = context?.params ? await Promise.resolve(context.params) : {};
    const id = params.id as string;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing id" },
        { status: 400 },
      );
    }

    const db = await getDb();

    const userData = await Collections.userData(db).findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          "Institution.cgpa": 0,
          "Institution.cgpaScale": 0,
          "Institution.gpaRecord": 0,
          signupInviteCode: 0,
          vaultId: 0,
          referredBy: 0,
        },
      },
    );

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine viewer role from cookie
    let viewerRole: ViewerRole = "public";
    let viewerId: string | null = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("diuscadi_token")?.value;
      if (token) {
        const payload = verifyJWT(token);
        if (payload?.vaultId) {
          const viewerData = await Collections.userData(db).findOne(
            { vaultId: new ObjectId(payload.vaultId) },
            { projection: { membershipStatus: 1, role: 1 } },
          );
          viewerRole = resolveViewerRole(
            viewerData?.membershipStatus,
            viewerData?.role ?? payload.role,
          );
          viewerId = viewerData?._id?.toString() ?? null;
        }
      }
    } catch {
      /* unauthenticated */
    }

    const isOwnProfile = viewerId === userData._id!.toString();

    // Inside your GET function
    const { profileVisibility, fieldPermissions } = normalisePrivacy(
      userData.preferences ?? DEFAULT_PREFERENCES,
    );

    // ── Private profile guard ─────────────────────────────────────────────────
    // Admins and the owner always bypass this
    const isPrivate = profileVisibility === "private";
    if (isPrivate && viewerRole !== "admin" && !isOwnProfile) {
      // Return minimal profile with private flag
      return NextResponse.json({
        profile: {
          id: userData._id!.toString(),
          fullName: userData.fullName,
          avatar: userData.avatar ?? null,
          isPrivate: true,
        },
        viewerRole,
        isPrivate: true,
      });
    }

    // ── Build full profile with field-level privacy ───────────────────────────
    const profile: Record<string, unknown> = {
      id: userData._id!.toString(),
      fullName: userData.fullName,
      hasAvatar: userData.hasAvatar,
      avatar: userData.avatar ?? null,
      role: userData.role,
      eduStatus: userData.eduStatus,
      membershipStatus: userData.membershipStatus,
      committeeMembership: userData.committeeMembership ?? null,
      skills: userData.skills ?? [],
      verifiedSkills: userData.verifiedSkills ?? [],
      profile: userData.profile ?? null,
      createdAt: userData.createdAt,
      isPrivate: false,
    };

    // Owner sees everything regardless of field settings
    if (isOwnProfile) {
      profile.email = userData.email;
      profile.phone = userData.phone;
      profile.location = userData.location;
      profile.socials = userData.socials;
      profile.institution = userData.Institution
        ? {
            name: userData.Institution.name,
            abbreviation: userData.Institution.abbreviation,
            type: userData.Institution.Type,
            faculty: userData.Institution.faculty,
            department: userData.Institution.department,
            degreeType: userData.Institution.degreeType,
            level: userData.Institution.level,
            currentStatus: userData.Institution.currentStatus,
          }
        : null;
    } else {
      // Apply field-level permissions for other viewers
      const fp = fieldPermissions;
      if (canSee((fp.email ?? "members") as Visibility, viewerRole))
        profile.email = userData.email;
      if (canSee((fp.phone ?? "private") as Visibility, viewerRole))
        profile.phone = userData.phone;
      if (canSee((fp.location ?? "private") as Visibility, viewerRole))
        profile.location = userData.location;
      if (canSee((fp.socials ?? "members") as Visibility, viewerRole))
        profile.socials = userData.socials;
      if (canSee((fp.academic ?? "private") as Visibility, viewerRole)) {
        profile.institution = userData.Institution
          ? {
              name: userData.Institution.name,
              abbreviation: userData.Institution.abbreviation,
              type: userData.Institution.Type,
              faculty: userData.Institution.faculty,
              department: userData.Institution.department,
              degreeType: userData.Institution.degreeType,
              level: userData.Institution.level,
              currentStatus: userData.Institution.currentStatus,
            }
          : null;
      }
    }

    return NextResponse.json({ profile, viewerRole, isPrivate: false });
  } catch (err) {
    console.error("[GET /api/member/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
