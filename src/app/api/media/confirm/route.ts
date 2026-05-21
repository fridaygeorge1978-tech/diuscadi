// app/api/media/confirm/route.ts
//
// Called by the client AFTER a successful direct Cloudinary upload.
// This route:
//   1. Receives the raw Cloudinary response payload from the client
//   2. Assembles a CloudinaryImage object server-side
//   3. Persists it to the correct MongoDB field
//   4. Returns the assembled CloudinaryImage to the client
//
// The client (MediaContext) is a pure pipeline — it never assembles or stores
// anything. All DB logic lives here.
//
// Request body:
//   {
//     uploadType:  UploadType,
//     ownerId?:    string,           // required for non-avatar types
//     imageAlt?:   string,           // optional alt text — defaults to uploadType label
//     // Raw Cloudinary response fields:
//     asset_id:    string,           // Cloudinary's opaque asset id
//     public_id:   string,
//     secure_url:  string,
//     signature:   string,
//     timestamp:   number,
//     format:      string,
//     bytes:       number,
//     width:       number,
//     height:      number,
//     created_at:  string,
//     etag:        string,
//   }

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";
import {
  isValidUploadType,
  allowedRolesForType,
  deleteCloudinaryAsset,
  UploadType,
} from "@/lib/services/CloudinaryService";
import type { CloudinaryImage } from "@/types/cloudinary";

// ─── Raw Cloudinary response shape (subset we care about) ─────────────────────
interface CloudinaryResponse {
  asset_id: string;
  public_id: string;
  secure_url: string;
  signature: string;
  timestamp: number;
  format: string;
  bytes: number;
  width: number;
  height: number;
  created_at: string;
  etag: string;
}

interface ConfirmBody extends Partial<CloudinaryResponse> {
  uploadType?: UploadType;
  ownerId?: string;
  imageAlt?: string;
}

// ─── Default alt text per upload type ────────────────────────────────────────
const DEFAULT_ALT: Record<string, string> = {
  avatar: "Profile picture",
  "event-logo": "Event logo",
  "event-banner": "Event banner",
  "event-gallery": "Event photo",
  "inst-logo": "Institution logo",
  "inst-banner": "Institution banner",
  "landing-banner": "Landing banner",
  "landing-initiative": "Initiative photo",
  "landing-logo": "Organisation logo",
  "landing-person": "Person photo",
  "speaker-photo": "Speaker photo",
  "sponsor-logo": "Sponsor logo",
};

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = (await req.json()) as ConfirmBody;
    const {
      uploadType,
      ownerId,
      imageAlt,
      asset_id,
      public_id,
      secure_url,
      signature,
      timestamp,
      format,
      bytes,
      width,
      height,
      created_at,
      etag,
    } = body;

    // Add this right after: const { uploadType, ownerId, ... etag } = body;
    console.log("[confirm] received body keys:", Object.keys(body));
    console.log("[confirm] missing fields check:", {
      asset_id: !!asset_id,
      public_id: !!public_id,
      secure_url: !!secure_url,
      signature: !!signature,
      timestamp: !!timestamp,
      format: !!format,
      bytes: !!bytes,
      width: !!width,
      height: !!height,
      created_at: !!created_at,
      etag: !!etag,
    });

    // ── Validate uploadType ───────────────────────────────────────────────────
    if (!isValidUploadType(uploadType)) {
      return NextResponse.json(
        { error: "Invalid or missing uploadType" },
        { status: 400 },
      );
    }

    // ── Validate required Cloudinary fields ───────────────────────────────────
    if (
      !asset_id ||
      !public_id ||
      !secure_url ||
      !signature ||
      !timestamp ||
      !format ||
      !bytes ||
      !width ||
      !height ||
      !created_at ||
      !etag
    ) {
      return NextResponse.json(
        { error: "Missing required Cloudinary response fields" },
        { status: 400 },
      );
    }

    // Optional — provide fallbacks so confirm never 400s on these
    // const safeSignature = signature ?? "";
    // const safeTimestamp = timestamp ?? Math.floor(Date.now() / 1000);
    // const safeEtag = etag ?? "";

    // Basic URL sanity check
    try {
      new URL(secure_url);
    } catch {
      return NextResponse.json(
        { error: "Invalid secure_url" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const vault = await Collections.vault(db).findOne({
      _id: new ObjectId(req.auth.vaultId),
    });

    if (!vault) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // ── Role guard ────────────────────────────────────────────────────────────
    const allowed = allowedRolesForType(uploadType);
    if (!allowed.includes(vault.role as string)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Assemble CloudinaryImage ──────────────────────────────────────────────
    // Done server-side so the DB always receives a fully validated, typed object.
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

    const cloudinaryImage: CloudinaryImage = {
      imageId: asset_id,
      imagePublicId: public_id,
      imageCloudName: cloudName,
      imageUrl: secure_url,
      imageAlt: imageAlt?.trim() || DEFAULT_ALT[uploadType],
      tag: uploadType,
      metadata: {
        signature,
        timestamp,
        format,
        bytes,
        width,
        height,
        createdAt: created_at,
        etag,
      },
    };

    // ── Persist to correct DB field ───────────────────────────────────────────

    // ── avatar ────────────────────────────────────────────────────────────────
    if (uploadType === "avatar") {
      const userData = await Collections.userData(db).findOne({
        vaultId: new ObjectId(req.auth.vaultId),
      });

      // Delete old Cloudinary asset before replacing — no orphaned files
      if (userData?.avatar?.imagePublicId) {
        await deleteCloudinaryAsset(userData.avatar.imagePublicId).catch(() =>
          console.warn(
            "[media/confirm] Failed to delete old avatar:",
            userData.avatar!.imagePublicId,
          ),
        );
      }

      await Collections.userData(db).updateOne(
        { vaultId: new ObjectId(req.auth.vaultId) },
        {
          $set: {
            hasAvatar: true,
            avatar: cloudinaryImage,
            updatedAt: new Date(),
          },
        },
      );

      return NextResponse.json({ image: cloudinaryImage });
    }

    // ── event-logo ────────────────────────────────────────────────────────────
    if (uploadType === "event-logo") {
      if (!ownerId) {
        return NextResponse.json(
          { error: "ownerId required for event-logo" },
          { status: 400 },
        );
      }

      const query = ObjectId.isValid(ownerId)
        ? { _id: new ObjectId(ownerId) }
        : { slug: ownerId };

      const event = await Collections.events(db).findOne(query);
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      if (event.eventLogo?.imagePublicId) {
        await deleteCloudinaryAsset(event.eventLogo.imagePublicId).catch(() =>
          console.warn(
            "[media/confirm] Failed to delete old event logo:",
            event.eventLogo!.imagePublicId,
          ),
        );
      }

      await Collections.events(db).updateOne(query, {
        $set: {
          hasEventLogo: true,
          eventLogo: cloudinaryImage,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ image: cloudinaryImage });
    }

    // ── event-banner ──────────────────────────────────────────────────────────
    if (uploadType === "event-banner") {
      if (!ownerId) {
        return NextResponse.json(
          { error: "ownerId required for event-banner" },
          { status: 400 },
        );
      }

      const query = ObjectId.isValid(ownerId)
        ? { _id: new ObjectId(ownerId) }
        : { slug: ownerId };

      const event = await Collections.events(db).findOne(query);
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      if (event.eventBanner?.imagePublicId) {
        await deleteCloudinaryAsset(event.eventBanner.imagePublicId).catch(() =>
          console.warn(
            "[media/confirm] Failed to delete old event banner:",
            event.eventBanner!.imagePublicId,
          ),
        );
      }

      await Collections.events(db).updateOne(query, {
        $set: {
          hasEventBanner: true,
          eventBanner: cloudinaryImage,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ image: cloudinaryImage });
    }

    // ── event-gallery ─────────────────────────────────────────────────────────
    // Gallery is append-only via confirm — individual items removed via /remove.
    if (uploadType === "event-gallery") {
      if (!ownerId) {
        return NextResponse.json(
          { error: "ownerId required for event-gallery" },
          { status: 400 },
        );
      }

      const query = ObjectId.isValid(ownerId)
        ? { _id: new ObjectId(ownerId) }
        : { slug: ownerId };

      const event = await Collections.events(db).findOne(query);
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      await Collections.events(db).updateOne(query, {
        $set: { hasEventGallery: true, updatedAt: new Date() },
        $push: { eventGallery: cloudinaryImage },
      });

      return NextResponse.json({ image: cloudinaryImage });
    }

    // ── inst-logo ─────────────────────────────────────────────────────────────
    if (uploadType === "inst-logo") {
      if (!ownerId || !ObjectId.isValid(ownerId)) {
        return NextResponse.json(
          {
            error:
              "Valid ownerId (institution ObjectId) required for inst-logo",
          },
          { status: 400 },
        );
      }

      const institution = await Collections.institutions(db).findOne({
        _id: new ObjectId(ownerId),
      });
      if (!institution) {
        return NextResponse.json(
          { error: "Institution not found" },
          { status: 404 },
        );
      }

      if (institution.logo?.imagePublicId) {
        await deleteCloudinaryAsset(institution.logo.imagePublicId).catch(() =>
          console.warn(
            "[media/confirm] Failed to delete old inst logo:",
            institution.logo!.imagePublicId,
          ),
        );
      }

      await Collections.institutions(db).updateOne(
        { _id: new ObjectId(ownerId) },
        {
          $set: {
            hasLogo: true,
            logo: cloudinaryImage,
            updatedAt: new Date(),
          },
        },
      );

      return NextResponse.json({ image: cloudinaryImage });
    }

    // ── inst-banner ───────────────────────────────────────────────────────────
    if (uploadType === "inst-banner") {
      if (!ownerId || !ObjectId.isValid(ownerId)) {
        return NextResponse.json(
          {
            error:
              "Valid ownerId (institution ObjectId) required for inst-banner",
          },
          { status: 400 },
        );
      }

      const institution = await Collections.institutions(db).findOne({
        _id: new ObjectId(ownerId),
      });
      if (!institution) {
        return NextResponse.json(
          { error: "Institution not found" },
          { status: 404 },
        );
      }

      if (institution.banner?.imagePublicId) {
        await deleteCloudinaryAsset(institution.banner.imagePublicId).catch(
          () =>
            console.warn(
              "[media/confirm] Failed to delete old inst banner:",
              institution.banner!.imagePublicId,
            ),
        );
      }

      await Collections.institutions(db).updateOne(
        { _id: new ObjectId(ownerId) },
        {
          $set: {
            hasBanner: true,
            banner: cloudinaryImage,
            updatedAt: new Date(),
          },
        },
      );

      return NextResponse.json({ image: cloudinaryImage });
    }

    if (
      uploadType === "landing-banner" ||
      uploadType === "landing-initiative" ||
      uploadType === "landing-logo" ||
      uploadType === "landing-person"
    ) {
      // ownerId is the admin's vaultId — used only for publicId scoping in the
      // sign step. No DB lookup required here since we're not attaching this
      // image to any specific document.
      return NextResponse.json({ image: cloudinaryImage });
    }

    // ── gallery-* ─────────────────────────────────────────────────────────────
    // Gallery items are stored in the dedicated gallery collection,
    // not embedded in any parent document.
    // The ownerId carries a JSON-encoded metadata payload from the bulk uploader.
    if (
      uploadType === "gallery-event" ||
      uploadType === "gallery-meeting" ||
      uploadType === "gallery-outing" ||
      uploadType === "gallery-conference" ||
      uploadType === "gallery-workshop" ||
      uploadType === "gallery-celebration"
    ) {
      // ownerId encodes the gallery item metadata as a JSON string so the
      // bulk uploader can pass caption, eventId, featured, published, order
      // through the existing sign → confirm pipeline without a schema change.
      // Shape: { caption?, eventId?, featured, published, order }
      let galleryMeta: {
        caption?: string;
        eventId?: string;
        featured?: boolean;
        published?: boolean;
        order?: number;
      } = {};

      if (ownerId) {
        try {
          galleryMeta = JSON.parse(ownerId);
        } catch {
          // ownerId may just be a plain string if called outside bulk uploader
          galleryMeta = {};
        }
      }

      const category = uploadType.replace(
        "gallery-",
        "",
      ) as import("@/lib/models/Gallery").GalleryCategory;

      const doc: import("@/lib/models/Gallery").GalleryDocument = {
        mediaType: "image",
        imageUrl: secure_url,
        imagePublicId: public_id,
        imageCloudName: cloudName,
        category,
        caption: galleryMeta.caption?.trim() || undefined,
        eventId: galleryMeta.eventId
          ? new ObjectId(galleryMeta.eventId)
          : undefined,
        featured: galleryMeta.featured ?? false,
        published: galleryMeta.published ?? false,
        order: galleryMeta.order ?? 0,
        createdBy: new ObjectId(req.auth.vaultId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await Collections.gallery(db).insertOne(doc);
      return NextResponse.json({ image: cloudinaryImage });
    }

    // ── speaker-photo + sponsor-logo ──────────────────────────────────────────
    // These are NOT persisted to any document here — the admin modal holds them
    // in local state and PATCHes the full speakers/sponsors array on save.
    // confirm just assembles and returns the CloudinaryImage.
    if (uploadType === "speaker-photo" || uploadType === "sponsor-logo") {
      return NextResponse.json({ image: cloudinaryImage });
    }

    return NextResponse.json(
      { error: "Unhandled uploadType" },
      { status: 400 },
    );
  } catch (err) {
    console.error("[POST /api/media/confirm]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

