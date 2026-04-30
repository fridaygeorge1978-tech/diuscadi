// hooks/useImageCropper.ts
//
// Manages the crop state machine:
//   idle → selected (file chosen) → cropping (user adjusting) → cropped (ready to upload)
//
// Returns:
//   - state:        current step
//   - srcUrl:       object URL of the selected file (for the crop preview)
//   - crop:         react-image-crop PercentCrop value (controlled)
//   - croppedBlob:  the cropped image as a Blob (ready to POST to Cloudinary)
//   - selectFile:   call with a File to enter "selected" state
//   - setCrop:      update the crop rectangle
//   - confirmCrop:  call with the HTMLImageElement ref to produce croppedBlob
//   - reset:        return to idle and revoke the object URL

"use client";

import { useState, useCallback, useRef } from "react";
import type { PercentCrop } from "react-image-crop";
import type { UploadType } from "@/lib/services/CloudinaryService";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CropperState = "idle" | "selected" | "cropping" | "cropped";

export interface CropperResult {
  state: CropperState;
  srcUrl: string | null;
  crop: PercentCrop;
  croppedBlob: Blob | null;
  selectFile: (file: File) => void;
  setCrop: (c: PercentCrop) => void;
  confirmCrop: (imgEl: HTMLImageElement) => Promise<void>;
  reset: () => void;
}

// ─── Default crop rectangles per upload type ──────────────────────────────────
// Centered crops that match the target aspect ratio of each type.
// x/y/width/height are all percentages of the source image dimensions.

const DEFAULT_CROPS: Record<UploadType, PercentCrop> = {
  // ── 1:1 square types ──────────────────────────────────────────────────────
  avatar: {
    unit: "%",
    x: 12.5,
    y: 12.5,
    width: 75,
    height: 75,
  },
  "event-logo": {
    unit: "%",
    x: 12.5,
    y: 12.5,
    width: 75,
    height: 75,
  },
  "inst-logo": {
    // Starts at 100% — pad transform preserves aspect ratio, no forced crop
    unit: "%",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  },

  // ── Wide banner types (1200×630 — ~1.905:1) ───────────────────────────────
  "event-banner": {
    unit: "%",
    x: 0,
    y: 10,
    width: 100,
    height: 80,
  },
  "inst-banner": {
    // 1200×400 — 3:1 — taller/wider than event banners
    unit: "%",
    x: 0,
    y: 17,
    width: 100,
    height: 67,
  },

  // ── Gallery — 4:3 landscape ───────────────────────────────────────────────
  "event-gallery": {
    unit: "%",
    x: 0,
    y: 12.5,
    width: 100,
    height: 75,
  },
};

// ─── Aspect ratios ────────────────────────────────────────────────────────────
// Passed to react-image-crop's `aspect` prop to lock the crop handle ratio.

export const CROP_ASPECT: Record<UploadType, number> = {
  avatar: 1, // 1:1
  "event-logo": 1, // 1:1
  "inst-logo": 1, // 1:1 — pad transform handles non-square logos
  "event-banner": 1200 / 630, // ~1.905:1
  "inst-banner": 1200 / 400, // 3:1
  "event-gallery": 1200 / 900, // 4:3
  "landing-banner":    1920 / 1080,  // 16/9
  "landing-initiative":4 / 3,
  "landing-logo":      1,
  "landing-person":    1,
};

// ─── Output canvas dimensions ─────────────────────────────────────────────────
// Must match the eager transform output in CloudinaryService.ts exactly.
// The canvas produces the blob that gets uploaded — Cloudinary's eager transform
// is a server-side safety net, not a substitute for correct client dimensions.

const OUTPUT_DIMS: Record<UploadType, { width: number; height: number }> = {
  avatar: { width: 400, height: 400 },
  "event-logo": { width: 400, height: 400 },
  "inst-logo": { width: 400, height: 400 },
  "event-banner": { width: 1200, height: 630 },
  "inst-banner": { width: 1200, height: 400 },
  "event-gallery": { width: 1200, height: 900 },
  "landing-banner":     { width: 1920, height: 1080 },
  "landing-initiative": { width: 1200, height: 900  },
  "landing-logo":       { width: 400,  height: 400  },
  "landing-person":     { width: 400,  height: 400  },
};

// ─── Types that use a white background fill ───────────────────────────────────
// Logo types use Cloudinary's c_pad (no crop) which pads with white.
// We replicate that on the canvas so the preview matches the final output.

const WHITE_BG_TYPES = new Set<UploadType>(["inst-logo"]);

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useImageCropper(uploadType: UploadType): CropperResult {
  const [state, setState] = useState<CropperState>("idle");
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<PercentCrop>(DEFAULT_CROPS[uploadType]);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

  // Track the current object URL so we can revoke it on reset
  const objectUrlRef = useRef<string | null>(null);

  // ── selectFile ─────────────────────────────────────────────────────────────
  const selectFile = useCallback(
    (file: File) => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setSrcUrl(url);
      setCrop(DEFAULT_CROPS[uploadType]);
      setCroppedBlob(null);
      setState("selected");
    },
    [uploadType],
  );

  // ── confirmCrop ────────────────────────────────────────────────────────────
  // Renders the cropped region onto an offscreen canvas and produces a Blob.
  const confirmCrop = useCallback(
    async (imgEl: HTMLImageElement) => {
      if (!srcUrl || !imgEl) return;

      setState("cropping");

      const { width: outW, height: outH } = OUTPUT_DIMS[uploadType];

      // Convert percent crop → pixel crop relative to the natural image size
      const naturalW = imgEl.naturalWidth;
      const naturalH = imgEl.naturalHeight;

      const pixelX = (crop.x / 100) * naturalW;
      const pixelY = (crop.y / 100) * naturalH;
      const pixelW = (crop.width / 100) * naturalW;
      const pixelH = (crop.height / 100) * naturalH;

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setState("selected");
        return;
      }

      // White background fill for logo types (replicates Cloudinary's c_pad,b_white)
      if (WHITE_BG_TYPES.has(uploadType)) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, outW, outH);
      }

      // Draw the cropped region scaled to output dimensions
      ctx.drawImage(imgEl, pixelX, pixelY, pixelW, pixelH, 0, 0, outW, outH);

      // Produce a Blob (webp preferred — matches Cloudinary eager f_webp output)
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", 0.92);
      });

      if (!blob) {
        setState("selected");
        return;
      }

      setCroppedBlob(blob);
      setState("cropped");
    },
    [srcUrl, crop, uploadType],
  );

  // ── reset ──────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSrcUrl(null);
    setCrop(DEFAULT_CROPS[uploadType]);
    setCroppedBlob(null);
    setState("idle");
  }, [uploadType]);

  return {
    state,
    srcUrl,
    crop,
    croppedBlob,
    selectFile,
    setCrop,
    confirmCrop,
    reset,
  };
}
