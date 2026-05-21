// /types/cloudinary.ts
// ─────────────────────────────────────────────────────────────────────────────
// Canonical Cloudinary image type used across all DIUSCADI models.
// Replace every `string | StaticImageData` image field with `CloudinaryImage`
// or `CloudinaryImage | null` (optional slots) as documented per model.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The role / slot this image fills in its parent document.
 * Extend the union as new upload contexts are added.
 */
export type ImageTag =
  | "avatar" // UserData: profile picture
  | "event-logo" // Event: primary square/round identity image
  | "event-banner" // Event: wide hero / cover image
  | "event-gallery" // Event: gallery item
  | "inst-logo" // Institution: square logo
  | "inst-banner" // Institution: wide banner / cover
  | "landing-banner"
  | "landing-initiative"
  | "landing-logo"
  | "landing-person"
  | "gallery-event"
  | "gallery-meeting"
  | "gallery-outing"
  | "gallery-conference"
  | "gallery-workshop"
  | "gallery-celebration"
   | "speaker-photo"   // Speaker headshot — 400×400, face-aware crop
  | "sponsor-logo";   // Sponsor logo — 400×400, padded, white bg

/**
 * Subset of Cloudinary's signed upload response that we persist.
 * All fields come directly from the response body — no derivation needed.
 */
export interface CloudinaryUploadMetadata {
  /** HMAC-SHA1 signature returned by Cloudinary — use to verify authenticity. */
  signature: string;

  /** Unix timestamp (seconds) at the moment of upload. */
  timestamp: number;

  /** MIME-derived format: "jpg" | "png" | "webp" | "gif" etc. */
  format: string;

  /** File size in bytes. */
  bytes: number;

  /** Pixel width of the original upload. */
  width: number;

  /** Pixel height of the original upload. */
  height: number;

  /** Cloudinary ISO-8601 created_at string, e.g. "2026-03-16T10:00:00Z". */
  createdAt: string;

  /** Content hash (ETag) — useful for deduplication. */
  etag: string;
}

/**
 * A fully structured Cloudinary image record.
 * Stored inline inside parent documents — no separate collection.
 *
 * Deriving the delivery URL at runtime:
 *   `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`
 * Apply transformations by injecting a transformation string before the publicId.
 */
export interface CloudinaryImage {
  // ── Cloudinary identifiers ────────────────────────────────────────────────

  /** Opaque asset ID assigned by Cloudinary (e.g. "a1b2c3d4e5f6..."). */
  imageId: string;

  /**
   * Public ID used in delivery URLs and transformation pipelines.
   * Includes folder path if one was used, e.g. "diuscadi/avatars/user_123".
   */
  imagePublicId: string;

  /**
   * Your Cloudinary cloud name — kept here so each image is self-contained
   * and the URL can be reconstructed without reaching for env vars.
   */
  imageCloudName: string;

  // ── Delivery ──────────────────────────────────────────────────────────────

  /**
   * Full optimised delivery URL as returned by Cloudinary after upload.
   * Stored for zero-cost reads; regenerate from publicId when transformations change.
   */
  imageUrl: string;

  /** Alt text for accessibility. Should always be provided before storing. */
  imageAlt: string;

  // ── Slot / usage tag ──────────────────────────────────────────────────────

  /**
   * Semantic tag that identifies which slot this image fills.
   * Used by UI components and profile-completion checks.
   */
  tag: ImageTag;

  // ── Upload metadata ───────────────────────────────────────────────────────

  /** Subset of Cloudinary's signed upload response, persisted for verification & display. */
  metadata: CloudinaryUploadMetadata;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers (pure — no DB or API calls)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a base Cloudinary delivery URL from a CloudinaryImage.
 * Pass a transformation string to inject it before the public ID.
 *
 * @example
 * buildCloudinaryUrl(avatar)
 * // → "https://res.cloudinary.com/mycloud/image/upload/diuscadi/avatars/user_123"
 *
 * buildCloudinaryUrl(avatar, "w_200,h_200,c_fill,q_auto,f_auto")
 * // → "https://res.cloudinary.com/mycloud/image/upload/w_200,h_200,c_fill,q_auto,f_auto/diuscadi/avatars/user_123"
 */
export function buildCloudinaryUrl(
  image: CloudinaryImage,
  transformation?: string,
): string {
  const base = `https://res.cloudinary.com/${image.imageCloudName}/image/upload`;
  return transformation
    ? `${base}/${transformation}/${image.imagePublicId}`
    : `${base}/${image.imagePublicId}`;
}
