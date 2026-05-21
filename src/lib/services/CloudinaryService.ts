// lib/services/CloudinaryService.ts
//
// Server-only. Never import this in client components.
//
// Upload flow:
//   1. Client calls POST /api/media/sign  → signed params from server
//   2. Client POSTs directly to Cloudinary using those params
//   3. Cloudinary returns its full response payload
//   4. Client calls POST /api/media/confirm with the raw Cloudinary response
//   5. confirm route assembles CloudinaryImage and persists it to MongoDB
//
// The context (MediaContext) owns steps 1–4 as a pipeline.
// The confirm route owns step 5 entirely — context never touches the DB.

import crypto from "crypto";
import type { ImageTag } from "@/types/cloudinary";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * UploadType mirrors ImageTag exactly — every tag has a corresponding
 * upload config. Kept as a separate alias so CloudinaryService remains
 * decoupled from the domain type layer.
 */
export type UploadType = ImageTag;

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  publicId: string;
  eager: string;
  maxFileSize: number; // bytes — enforced by Cloudinary
  uploadType: UploadType; // echoed back so the client knows which type was signed
}

// ─── Env validation ───────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

// ─── Transformation presets ───────────────────────────────────────────────────
// eager transforms are applied by Cloudinary server-side after upload.
// The client crops before uploading — these are a server-side safety net.

interface UploadPreset {
  eager: string; // Cloudinary eager transformation string
  folder: string; // Storage folder in Cloudinary
  maxFileSize: number; // bytes
}

const TRANSFORM_PRESETS: Record<UploadType, UploadPreset> = {
  // ── User ──────────────────────────────────────────────────────────────────
  avatar: {
    eager: "c_fill,g_face,w_400,h_400,f_webp,q_auto:good",
    folder: "diuscadi/avatars",
    maxFileSize: 5 * 1024 * 1024, // 5 MB
  },

  // ── Event ─────────────────────────────────────────────────────────────────
  "event-logo": {
    // Square crop, face-aware — used as the event's primary identity badge
    eager: "c_fill,g_auto,w_400,h_400,f_webp,q_auto:good",
    folder: "diuscadi/events/logos",
    maxFileSize: 5 * 1024 * 1024, // 5 MB
  },
  "event-banner": {
    // 1200×630 (OG image ratio) — wide hero / cover image
    eager: "c_fill,w_1200,h_630,f_webp,q_auto:good",
    folder: "diuscadi/events/banners",
    maxFileSize: 10 * 1024 * 1024, // 10 MB
  },
  "event-gallery": {
    // 1200×900 (4:3) — gallery photos, multiple per event
    eager: "c_fill,w_1200,h_900,f_webp,q_auto:good",
    folder: "diuscadi/events/gallery",
    maxFileSize: 15 * 1024 * 1024, // 15 MB — allows short video clips too
  },

  // ── Institution ───────────────────────────────────────────────────────────
  "inst-logo": {
    // Pad (no crop) preserves logo aspect ratio, white bg, square output
    eager: "c_pad,w_400,h_400,b_white,f_webp,q_auto:good",
    folder: "diuscadi/institutions/logos",
    maxFileSize: 3 * 1024 * 1024, // 3 MB
  },
  "inst-banner": {
    // Wide banner for institution profile pages
    eager: "c_fill,w_1200,h_400,f_webp,q_auto:good",
    folder: "diuscadi/institutions/banners",
    maxFileSize: 10 * 1024 * 1024, // 10 MB
  },

  // ── Landing Page ──────────────────────────────────────────────────────────────
  "landing-banner": {
    eager: "c_fill,w_1920,h_1080,f_webp,q_auto:good",
    folder: "diuscadi/landing/banners",
    maxFileSize: 10 * 1024 * 1024, // 10 MB
  },
  "landing-initiative": {
    eager: "c_fill,w_1200,h_900,f_webp,q_auto:good",
    folder: "diuscadi/landing/initiative",
    maxFileSize: 8 * 1024 * 1024,
  },
  "landing-logo": {
    // For validators, sponsors, supporters — pad preserves logo aspect ratio
    eager: "c_pad,w_400,h_400,b_white,f_webp,q_auto:good",
    folder: "diuscadi/landing/logos",
    maxFileSize: 3 * 1024 * 1024,
  },
  "landing-person": {
    // Expert photos, testimonial avatars, leader photo
    eager: "c_fill,g_face,w_400,h_400,f_webp,q_auto:good",
    folder: "diuscadi/landing/people",
    maxFileSize: 5 * 1024 * 1024,
  },
  "gallery-event": {
    eager: "c_fill,w_1200,h_900,f_webp,q_auto:good",
    folder: "diuscadi/gallery/event",
    maxFileSize: 15 * 1024 * 1024,
  },
  "gallery-meeting": {
    eager: "c_fill,w_1200,h_900,f_webp,q_auto:good",
    folder: "diuscadi/gallery/meeting",
    maxFileSize: 15 * 1024 * 1024,
  },
  "gallery-outing": {
    eager: "c_fill,w_1200,h_900,f_webp,q_auto:good",
    folder: "diuscadi/gallery/outing",
    maxFileSize: 15 * 1024 * 1024,
  },
  "gallery-conference": {
    eager: "c_fill,w_1200,h_900,f_webp,q_auto:good",
    folder: "diuscadi/gallery/conference",
    maxFileSize: 15 * 1024 * 1024,
  },
  "gallery-workshop": {
    eager: "c_fill,w_1200,h_900,f_webp,q_auto:good",
    folder: "diuscadi/gallery/workshop",
    maxFileSize: 15 * 1024 * 1024,
  },
  "gallery-celebration": {
    eager: "c_fill,w_1200,h_900,f_webp,q_auto:good",
    folder: "diuscadi/gallery/celebration",
    maxFileSize: 15 * 1024 * 1024,
  },
  "speaker-photo": {
    eager: "c_fill,g_face,w_400,h_400,f_webp,q_auto:good",
    folder: "diuscadi/events/speakers",
    maxFileSize: 5 * 1024 * 1024,
  },
  "sponsor-logo": {
    eager: "c_pad,w_400,h_400,b_white,f_webp,q_auto:good",
    folder: "diuscadi/events/sponsors",
    maxFileSize: 3 * 1024 * 1024,
  },
};

// ─── Public ID generator ──────────────────────────────────────────────────────
// Deterministic per owner so re-uploads overwrite the previous asset.
// Timestamp suffix busts CDN cache on re-upload.
// Pattern: {folder}/{ownerId}_{timestamp}

function buildPublicId(type: UploadType, ownerId: string): string {
  // Don't include the folder — Cloudinary prepends it from the `folder` param
  return `${ownerId}_${Date.now()}`;
}

// ─── Signature ────────────────────────────────────────────────────────────────
// SHA1( sorted_params_string + API_SECRET )

function sign(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(sorted + apiSecret)
    .digest("hex");
}

// ─── Main exports ─────────────────────────────────────────────────────────────

/**
 * Generate signed upload parameters for a direct client-to-Cloudinary upload.
 */
export function generateSignedParams(
  uploadType: UploadType,
  ownerId: string,
): SignedUploadParams {
  const apiKey = requireEnv("CLOUDINARY_API_KEY");
  const apiSecret = requireEnv("CLOUDINARY_API_SECRET");
  const cloudName = requireEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");

  const preset = TRANSFORM_PRESETS[uploadType];
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = buildPublicId(uploadType, ownerId);

  const paramsToSign: Record<string, string | number> = {
    eager: preset.eager,
    folder: preset.folder,
    public_id: publicId,
    timestamp,
  };

  return {
    signature: sign(paramsToSign, apiSecret),
    timestamp,
    apiKey,
    cloudName,
    folder: preset.folder,
    publicId,
    eager: preset.eager,
    maxFileSize: preset.maxFileSize,
    uploadType, // echoed so confirm route can trust the type without re-deriving it
  };
}

/**
 * Delete a Cloudinary asset by its public_id.
 * Returns true if deleted, false if not found.
 */
export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image",
): Promise<boolean> {
  const apiKey = requireEnv("CLOUDINARY_API_KEY");
  const apiSecret = requireEnv("CLOUDINARY_API_SECRET");
  const cloudName = requireEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");

  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign: Record<string, string | number> = {
    public_id: publicId,
    timestamp,
  };

  const signature = sign(paramsToSign, apiSecret);

  const body = new URLSearchParams({
    public_id: publicId,
    signature,
    api_key: apiKey,
    timestamp: String(timestamp),
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
    { method: "POST", body },
  );
  const data = (await res.json()) as { result?: string };
  return data.result === "ok";
}

// ─── Validation helpers ───────────────────────────────────────────────────────

export const ALL_UPLOAD_TYPES = Object.keys(TRANSFORM_PRESETS) as UploadType[];

export function isValidUploadType(value: unknown): value is UploadType {
  return (
    typeof value === "string" && ALL_UPLOAD_TYPES.includes(value as UploadType)
  );
}

/**
 * Returns which roles are allowed to use a given upload type.
 * Used by sign + confirm routes to enforce access control.
 */
export function allowedRolesForType(type: UploadType): string[] {
  switch (type) {
    case "avatar":
      // Any authenticated user — it's their own profile picture
      return ["participant", "moderator", "admin", "webmaster"];
    case "event-logo":
    case "event-banner":
    case "event-gallery":
      return ["admin", "webmaster"];
    case "inst-logo":
    case "inst-banner":
      // Institution media is webmaster-only — institutional identity is sensitive
      return ["webmaster"];
    case "landing-banner":
    case "landing-initiative":
    case "landing-logo":
    case "landing-person":
    case "gallery-event":
    case "gallery-meeting":
    case "gallery-outing":
    case "gallery-conference":
    case "gallery-workshop":
    case "gallery-celebration":
    case "speaker-photo":
    case "sponsor-logo":
      return ["admin", "webmaster"];
  }
}
