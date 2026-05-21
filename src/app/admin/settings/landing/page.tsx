"use client";
// app/admin/settings/landing/page.tsx
//
// Wires up:
//  - useAdminAuth  → hooks/useAdminAuth (built on useAuth from authContext)
//  - useToast      → hooks/useToast     (self-contained, no external dep)
//  - image upload  → signed-upload pipeline matching what ImageUploader uses
//                    (POST /api/media/sign → Cloudinary → no confirm needed
//                     for simple URL — we just store the secure_url from CDN)

import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/useToast";
import type {
  LandingSectionKey,
  BannerSlide,
  InitiativeConfig,
  InitiativePhoto,
  ValidatorEntry,
  MissionConfig,
  WorkshopTopic,
  TestimonialsConfig,
  TestimonialEntry,
  SupportEntry,
} from "@/lib/models/landingPageConfig";
import Image from "next/image";
import { X } from "lucide-react";
// ⬇ Use the same ImageUploader your profile page uses
import { ImageUploader } from "@/components/ui/ImageUploader";
import { createPortal } from "react-dom";
import { useEvents } from "@/context/EventContext";
import { EventSummary } from "@/context/EventContext";
import type { UploadType } from "@/lib/services/CloudinaryService";
import type { CloudinaryImage } from "@/types/cloudinary";
import { cn } from "../../../../lib/utils";
import { useAuth } from "@/context/AuthContext";

// ─── Tab labels ────────────────────────────────────────────────────────────

const TABS = [
  { key: "banner", label: "🖼️ Banner Slides" },
  { key: "initiative", label: "📸 Initiative Gallery" },
  { key: "validators", label: "✅ Validated By" },
  { key: "mission", label: "👤 Mission / Leader" },
  { key: "workshopTopics", label: "🎓 Workshop Topics" },
  { key: "testimonials", label: "💬 Testimonials" },
  { key: "support", label: "🤝 Supporters" },
] as const;

type TabKey = LandingSectionKey;


// ─── Typed config state ────────────────────────────────────────────────────

interface LandingConfig {
  banner?: { slides: BannerSlide[] };
  initiative?: InitiativeConfig;
  validators?: { items: ValidatorEntry[] };
  mission?: MissionConfig;
  workshopTopics?: { items: WorkshopTopic[] };
  testimonials?: TestimonialsConfig;
  support?: { items: SupportEntry[] };
}

// Map folder names to upload types
type LandingUploadContext =
  | "landing/banners"
  | "landing/initiative"
  | "landing/validators"
  | "landing/mission"
  | "landing/experts"
  | "landing/testimonials"
  | "landing/sponsors";

function resolveUploadType(folder: LandingUploadContext): UploadType {
  switch (folder) {
    case "landing/banners":    return "landing-banner";
    case "landing/initiative": return "landing-initiative";
    case "landing/validators": return "landing-logo";
    case "landing/sponsors":   return "landing-logo";
    case "landing/mission":    return "landing-person";
    case "landing/experts":    return "landing-person";
    case "landing/testimonials": return "landing-person";
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("diuscadi_token");
}

function authHeaders(json = true): HeadersInit {
  const token = getToken();
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Cloudinary signed-upload helper ──────────────────────────────────────
//
// Mirrors the pipeline in MediaContext / ImageUploader:
//   1. POST /api/media/sign  → { signature, timestamp, apiKey, cloudName, folder, publicId, eager }
//   2. POST directly to Cloudinary upload endpoint
//   3. Return the secure_url from Cloudinary's response
//
// For the admin landing page we use uploadType = "event-banner" for all images
// (wide format, 10 MB limit). Adjust per-field if needed.


// ─── Image Upload Modal (portal) ──────────────────────────────────────────────

function ImageUploadModal({
  open,
  onClose,
  onUploaded,
  folder,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: (url: CloudinaryImage) => void;
  folder: LandingUploadContext;
}) {
  const { user } = useAuth();

  if (!open || typeof window === "undefined") return null;

  const uploadType = resolveUploadType(folder);

  // Shape and aspect hints per type
  const isLogo =
    folder === "landing/validators" || folder === "landing/sponsors";
  const isBanner = folder === "landing/banners";
  const isPerson =
    folder === "landing/mission" ||
    folder === "landing/experts" ||
    folder === "landing/testimonials";

  return createPortal(
    <div
      className={cn(
        "fixed",
        "inset-0",
        "z-50",
        "flex",
        "items-center",
        "justify-center",
        "bg-black/60",
        "backdrop-blur-sm",
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "relative",
          "bg-background",
          "rounded-2xl",
          "shadow-2xl",
          "border",
          "border-border",
          "p-6",
          "w-full",
          "max-w-md",
          "mx-4",
        )}
      >
        <button
          onClick={onClose}
          className={cn(
            "absolute",
            "top-4",
            "right-4",
            "p-1",
            "rounded-full",
            "hover:bg-muted",
          )}
        >
          <X className={cn("w-4", "h-4")} />
        </button>
        <h3 className={cn("font-bold", "text-lg", "mb-4")}>Upload Image</h3>
        <p className={cn("text-xs", "text-muted-foreground", "mb-4")}>
          {isBanner && "Recommended: 1920 × 1080. Max 10 MB."}
          {isLogo && "Logo will be padded to square. Max 3 MB."}
          {isPerson && "Face-aware crop to square. Max 5 MB."}
          {folder === "landing/initiative" && "Landscape photo. Max 8 MB."}
        </p>
        <ImageUploader
          uploadType={uploadType}
          ownerId={user?.id ?? "landing-cms"}
          currentUrl={null}
          currentPublicId={null}
          shape={isPerson ? "circle" : "rect"}
          aspectHint={
            isBanner
              ? "1920 × 1080"
              : isLogo
                ? "400 × 400"
                : isPerson
                  ? "400 × 400"
                  : "1200 × 900"
          }
          label="Upload image"
          cropLabel="Crop image"
          onSuccess={(image: CloudinaryImage) => {
            const url = image.imageUrl ?? image.imageCloudName ?? "";
            if (url) {
              onUploaded(image);
              onClose();
            }
          }}
          onRemove={() => {
            // No-op in modal context — user can remove after modal closes
          }}
        />
      </div>
    </div>,
    document.body,
  );
}

// ─── Shared save bar ──────────────────────────────────────────────────────────

function SaveBar({
  onSave,
  saving,
  saved,
}: {
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <div className={cn('flex', 'items-center', 'justify-end', 'gap-3', 'pt-4', 'border-t')}>
      {saved && (
        <span className={cn('text-sm', 'text-green-600', 'font-medium')}>✓ Saved</span>
      )}
      <button
        onClick={onSave}
        disabled={saving}
        className={cn('px-5', 'py-2', 'rounded-md', 'bg-primary', 'text-primary-foreground', 'text-sm', 'font-medium', 'disabled:opacity-50')}
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function LandingSettingsPage() {
  useAdminAuth();
  const { user } = useAuth(); 
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("banner");
  const [config, setConfig] = useState<LandingConfig>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const { publicEvents, loadPublicEvents } = useEvents();

    useEffect(() => {
      loadPublicEvents(50); // load enough events for the dropdown
    }, [loadPublicEvents]);

  useEffect(() => {
    fetch("/api/admin/settings/landing", {
      headers: authHeaders(), // ← was missing
    })
      .then((r) => r.json())
      .then(
        ({
          sections,
        }: {
          sections: Array<{ sectionKey: LandingSectionKey; data: unknown }>;
        }) => {
          const byKey: LandingConfig = {};
          for (const s of sections) {
            (byKey as Record<string, unknown>)[s.sectionKey] = s.data;
          }
          setConfig(byKey);
        },
      )
      .catch(() =>
        toast({ title: "Failed to load config", variant: "destructive" }),
      )
      .finally(() => setLoading(false));
  }, [toast]);

  async function save(sectionKey: LandingSectionKey, data: unknown) {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings/landing", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ sectionKey, data }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({
        title: "Saved",
        description: `${sectionKey} updated.`,
        variant: "success",
      });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function hideSlide(slideId: string, hidden: boolean) {
    await fetch(`/api/admin/settings/landing/banner/${slideId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ hidden }),
    });
    setConfig((prev) => ({
      ...prev,
      banner: {
        slides:
          prev.banner?.slides?.map((s) =>
            s.id === slideId ? { ...s, hidden } : s,
          ) ?? [],
      },
    }));
  }

  async function deleteSlide(slideId: string) {
    await fetch(`/api/admin/settings/landing/banner/${slideId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken() ?? ""}` },
    });
    setConfig((prev) => ({
      ...prev,
      banner: {
        slides: prev.banner?.slides?.filter((s) => s.id !== slideId) ?? [],
      },
    }));
  }

  if (loading)
    return (
      <div className={cn('flex', 'items-center', 'justify-center', 'h-64', 'text-muted-foreground', 'text-sm')}>
        Loading landing page config…
      </div>
    );

  return (
    <div className={cn('max-w-4xl', 'mx-auto', 'p-6 mt-20', 'space-y-6')}>
      <div>
        <h1 className={cn('text-2xl', 'font-bold')}>Landing Page Settings</h1>
        <p className={cn('text-muted-foreground', 'text-sm', 'mt-1')}>
          Manage every dynamic section of the public landing page. Changes save
          to the database and reflect live within 60 seconds.
        </p>
      </div>

      {/* Tab bar */}
      <div className={cn('flex', 'flex-wrap', 'gap-2', 'border-b', 'pb-3')}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "banner" && (
        <BannerTab
          slides={config.banner?.slides ?? []}
          events={publicEvents}
          onChange={(slides) =>
            setConfig((p) => ({ ...p, banner: { slides } }))
          }
          onSave={() => save("banner", config.banner ?? { slides: [] })}
          onHide={hideSlide}
          onDelete={deleteSlide}
          saving={saving}
          saved={saved}
        />
      )}

      {activeTab === "initiative" && (
        <InitiativeTab
          data={config.initiative}
          onChange={(d) => setConfig((p) => ({ ...p, initiative: d }))}
          onSave={() => save("initiative", config.initiative)}
          saving={saving}
          saved={saved}
        />
      )}

      {activeTab === "validators" && (
        <ValidatorsTab
          items={config.validators?.items ?? []}
          onChange={(items) =>
            setConfig((p) => ({ ...p, validators: { items } }))
          }
          onSave={() => save("validators", config.validators ?? { items: [] })}
          saving={saving}
          saved={saved}
        />
      )}

      {activeTab === "mission" && (
        <MissionTab
          data={config.mission}
          onChange={(d) => setConfig((p) => ({ ...p, mission: d }))}
          onSave={() => save("mission", config.mission)}
          saving={saving}
          saved={saved}
        />
      )}

      {activeTab === "workshopTopics" && (
        <WorkshopTopicsTab
          items={config.workshopTopics?.items ?? []}
          onChange={(items) =>
            setConfig((p) => ({ ...p, workshopTopics: { items } }))
          }
          onSave={() =>
            save("workshopTopics", config.workshopTopics ?? { items: [] })
          }
          saving={saving}
          saved={saved}
        />
      )}

      {activeTab === "testimonials" && (
        <TestimonialsTab
          data={config.testimonials}
          onChange={(d) => setConfig((p) => ({ ...p, testimonials: d }))}
          onSave={() => save("testimonials", config.testimonials)}
          saving={saving}
          saved={saved}
        />
      )}

      {activeTab === "support" && (
        <SupportTab
          items={config.support?.items ?? []}
          onChange={(items) => setConfig((p) => ({ ...p, support: { items } }))}
          onSave={() => save("support", config.support ?? { items: [] })}
          saving={saving}
          saved={saved}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// Banner tab
// ─────────────────────────────────────────────────────────────────────────────

function BannerTab({
  slides,
  events,
  onChange,
  onSave,
  onHide,
  onDelete,
  saving,
  saved,
}: {
  slides: BannerSlide[];
  events: EventSummary[];
  onChange: (slides: BannerSlide[]) => void;
  onSave: () => void;
  onHide: (id: string, hidden: boolean) => void;
  onDelete: (id: string) => void;
  saving: boolean;
  saved: boolean;
}) {
  const [uploadModalFor, setUploadModalFor] = useState<string | null>(null);

  function addSlide() {
    onChange([
      ...slides,
      {
        id: crypto.randomUUID(),
        type: "custom",
        imageUrl: "",
        title: "",
        subtitle: "",
        ctaLabel: "",
        ctaHref: "",
        hidden: false,
        order: slides.length,
      },
    ]);
  }

  function updateSlide(id: string, patch: Record<string, unknown>) {
    onChange(slides.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  // When user picks an event, auto-populate from event data
  function handleEventSelect(slideId: string, eventId: string) {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    updateSlide(slideId, {
      linkedEventId: event.id,
      ctaHref: `/events/${event.slug}`,
      imageUrl: event.image || "",
      // Title and subtitle stay editable for marketing customisation
    });
  }

  return (
    <div className="space-y-4">
      <div className={cn('flex', 'items-center', 'justify-between')}>
        <p className={cn('text-sm', 'text-muted-foreground')}>
          Slides rotate on the landing page hero banner. Hidden slides are saved
          but not shown publicly.
        </p>
        <button
          onClick={addSlide}
          className={cn('px-3', 'py-1.5', 'rounded-md', 'border', 'text-sm', 'hover:bg-muted')}
        >
          + Add Slide
        </button>
      </div>

      <div className="space-y-4">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`border rounded-lg p-4 space-y-3 ${slide.hidden ? "opacity-50" : ""}`}
          >
            <div className={cn('flex', 'items-center', 'justify-between')}>
              <span className={cn('text-xs', 'text-muted-foreground', 'font-mono')}>
                Slide {i + 1} — {slide.type}
              </span>
              <div className={cn('flex', 'gap-2')}>
                <button
                  onClick={() => onHide(slide.id, !slide.hidden)}
                  className={cn('text-xs', 'px-2', 'py-1', 'rounded', 'border', 'hover:bg-muted')}
                >
                  {slide.hidden ? "Show" : "Hide"}
                </button>
                <button
                  onClick={() => onDelete(slide.id)}
                  className={cn('text-xs', 'px-2', 'py-1', 'rounded', 'border', 'border-red-300', 'text-red-500', 'hover:bg-red-50')}
                >
                  Delete
                </button>
              </div>
            </div>

            <div className={cn('grid', 'grid-cols-2', 'gap-3')}>
              <div>
                <label className={cn('text-xs', 'text-muted-foreground')}>
                  Slide Type
                </label>
                <select
                  value={slide.type}
                  onChange={(e) =>
                    updateSlide(slide.id, {
                      type: e.target.value,
                      linkedEventId: undefined,
                    })
                  }
                  className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
                >
                  <option value="custom">Custom / Ad</option>
                  <option value="event">Link to Event</option>
                  <option value="blog">Blog (coming soon)</option>
                </select>
              </div>
              <div>
                <label className={cn('text-xs', 'text-muted-foreground')}>
                  Expires at (optional — nightly cron hides it)
                </label>
                <input
                  type="datetime-local"
                  value={
                    slide.expiresAt
                      ? new Date(slide.expiresAt).toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    updateSlide(slide.id, {
                      expiresAt: e.target.value
                        ? new Date(e.target.value)
                        : undefined,
                    })
                  }
                  className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
                />
              </div>
            </div>

            {/* Event picker — only shown for type === "event" */}
            {slide.type === "event" && (
              <div className={cn('p-3', 'rounded-lg', 'bg-muted', 'border', 'border-border', 'space-y-2')}>
                <label className={cn('text-xs', 'font-medium', 'text-muted-foreground', 'uppercase', 'tracking-wider')}>
                  Select Event
                </label>
                <select
                  value={slide.linkedEventId ?? ""}
                  onChange={(e) => handleEventSelect(slide.id, e.target.value)}
                  className={cn('w-full', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
                >
                  <option value="">— choose an event —</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} —{" "}
                      {new Date(ev.eventDate).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </option>
                  ))}
                </select>
                {slide.linkedEventId && (
                  <p className={cn('text-xs', 'text-muted-foreground')}>
                    CTA will link to{" "}
                    <code className={cn('bg-background', 'px-1', 'rounded')}>
                      {slide.ctaHref}
                    </code>{" "}
                    and image will be pre-filled from event. You can still
                    override the title, subtitle, and CTA label below.
                  </p>
                )}
              </div>
            )}

            {/* Blog placeholder */}
            {slide.type === "blog" && (
              <div className={cn('p-3', 'rounded-lg', 'bg-amber-50', 'border', 'border-amber-200', 'text-amber-800', 'text-sm')}>
                Blog integration coming soon. Use Custom / Ad type for now.
              </div>
            )}

            {/* Title + Subtitle — always editable */}
            <div>
              <label className={cn('text-xs', 'text-muted-foreground')}>
                Title
                {slide.type === "event" &&
                  " (override event title for marketing)"}
              </label>
              <input
                type="text"
                value={slide.title}
                onChange={(e) =>
                  updateSlide(slide.id, { title: e.target.value })
                }
                placeholder={
                  slide.type === "event"
                    ? "e.g. Don't miss LASCADSS 7.0 — Register now"
                    : "Banner headline"
                }
                className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
              />
            </div>

            <div>
              <label className={cn('text-xs', 'text-muted-foreground')}>Subtitle</label>
              <input
                type="text"
                value={slide.subtitle ?? ""}
                onChange={(e) =>
                  updateSlide(slide.id, { subtitle: e.target.value })
                }
                placeholder="Supporting text below the title"
                className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
              />
            </div>

            {/* CTA fields — always editable, pre-filled for events */}
            <div className={cn('grid', 'grid-cols-2', 'gap-3')}>
              <div>
                <label className={cn('text-xs', 'text-muted-foreground')}>
                  CTA Button Label
                </label>
                <input
                  type="text"
                  value={slide.ctaLabel ?? ""}
                  onChange={(e) =>
                    updateSlide(slide.id, { ctaLabel: e.target.value })
                  }
                  placeholder="Register Now"
                  className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
                />
              </div>
              <div>
                <label className={cn('text-xs', 'text-muted-foreground')}>
                  CTA Link
                  {slide.type === "event" && " (auto-filled from event)"}
                </label>
                <input
                  type="text"
                  value={slide.ctaHref ?? ""}
                  onChange={(e) =>
                    updateSlide(slide.id, { ctaHref: e.target.value })
                  }
                  placeholder="/events/my-event"
                  className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
                  readOnly={slide.type === "event" && !!slide.linkedEventId}
                />
              </div>
            </div>

            {/* Image — portal upload modal */}
            <div>
              <label className={cn('text-xs', 'text-muted-foreground')}>
                Banner Image
                {slide.type === "event" && slide.linkedEventId
                  ? " (auto-filled from event — upload to override)"
                  : ""}
              </label>
              <div className={cn('flex', 'items-center', 'gap-3', 'mt-1')}>
                {slide.imageUrl && (
                  <Image
                  width={500}
                  height={300}
                    src={slide.imageUrl}
                    alt=""
                    className={cn('h-16', 'w-28', 'object-cover', 'rounded', 'border')}
                  />
                )}
                <button
                  onClick={() => setUploadModalFor(slide.id)}
                  className={cn('px-3', 'py-1.5', 'rounded', 'border', 'text-sm', 'hover:bg-muted')}
                >
                  📁 {slide.imageUrl ? "Change Image" : "Upload Image"}
                </button>
                {slide.imageUrl && (
                  <button
                    onClick={() => updateSlide(slide.id, { imageUrl: "" })}
                    className={cn('text-xs', 'text-red-500', 'hover:underline')}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <SaveBar onSave={onSave} saving={saving} saved={saved} />

      {/* Image upload portal modal */}
      <ImageUploadModal
        open={uploadModalFor !== null}
        onClose={() => setUploadModalFor(null)}
        folder="landing/banners"
        onUploaded={(image) => {
          if (uploadModalFor) {
            updateSlide(uploadModalFor, { imageUrl: image.imageUrl });
          }
          setUploadModalFor(null);
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Initiative tab
// ─────────────────────────────────────────────────────────────────────────────

function InitiativeTab({
  data,
  onChange,
  onSave,
  saving,
  saved,
}: {
  data: InitiativeConfig | undefined;
  onChange: (d: InitiativeConfig) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
const [uploadOpen, setUploadOpen] = useState(false);
  const d: InitiativeConfig = data ?? {
    sectionTitle: "",
    yearLabel: "",
    photos: [],
  };

  return (
    <div className="space-y-4">
      <div className={cn('grid', 'grid-cols-2', 'gap-4')}>
        <div>
          <label className={cn('text-xs', 'text-muted-foreground')}>Section Title</label>
          <input
            type="text"
            value={d.sectionTitle}
            onChange={(e) => onChange({ ...d, sectionTitle: e.target.value })}
            placeholder="LASCADSS Class of 2026"
            className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
          />
        </div>
        <div>
          <label className={cn('text-xs', 'text-muted-foreground')}>Year Label</label>
          <input
            type="text"
            value={d.yearLabel}
            onChange={(e) => onChange({ ...d, yearLabel: e.target.value })}
            placeholder="2026"
            className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
          />
        </div>
      </div>

      <div>
        <div className={cn('flex', 'items-center', 'justify-between', 'mb-2')}>
          <label className={cn('text-sm', 'font-medium')}>Photos (fade carousel)</label>
          <button
            onClick={() => setUploadOpen(true)}
            className={cn('px-3', 'py-1.5', 'rounded', 'border', 'text-sm', 'hover:bg-muted')}
          >
            + Add Photo
          </button>
        </div>
        <div className={cn('grid', 'grid-cols-3', 'gap-3')}>
          {d.photos.map((photo) => (
            <div key={photo.id} className={cn('relative', 'group')}>
              <Image
                width={500}
                height={300}
                src={photo.imageUrl}
                alt={photo.alt ?? ""}
                className={cn('h-24', 'w-full', 'object-cover', 'rounded', 'border')}
              />
              <button
                onClick={() =>
                  onChange({
                    ...d,
                    photos: d.photos.filter(
                      (p: InitiativePhoto) => p.id !== photo.id,
                    ),
                  })
                }
                className={cn('absolute', 'top-1', 'right-1', 'bg-red-500', 'text-white', 'rounded-full', 'w-5', 'h-5', 'text-xs', 'hidden', 'group-hover:flex', 'items-center', 'justify-center')}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <SaveBar onSave={onSave} saving={saving} saved={saved} />

      <ImageUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        folder="landing/initiative"
        onUploaded={(image) =>
          onChange({
            ...d,
            photos: [
              ...(d.photos ?? []),
              {
                id: crypto.randomUUID(),
                imageUrl: image.imageUrl,
                order: d.photos?.length ?? 0,
              },
            ],
          })
        }
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Validators tab
// ─────────────────────────────────────────────────────────────────────────────

function ValidatorsTab({
  items,
  onChange,
  onSave,
  saving,
  saved,
}: {
  items: ValidatorEntry[];
  onChange: (items: ValidatorEntry[]) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {

    const [uploadFor, setUploadFor] = useState<string | null>(null);

  function add() {
    const entry: ValidatorEntry = {
      id: nanoid(),
      name: "",
      logoUrl: "",
      category: "industry",
      order: items.length,
    };
    onChange([...items, entry]);
  }
  function update(id: string, patch: Partial<ValidatorEntry>) {
    onChange(items.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }
  function remove(id: string) {
    onChange(items.filter((v) => v.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className={cn('flex', 'justify-end')}>
        <button
          onClick={add}
          className={cn('px-3', 'py-1.5', 'rounded-md', 'border', 'text-sm', 'hover:bg-muted')}
        >
          + Add Validator
        </button>
      </div>

      <div className="space-y-3">
        {items.map((v) => (
          <div
            key={v.id}
            className={cn('border', 'rounded-lg', 'p-3', 'flex', 'items-center', 'gap-3')}
          >
            {v.logoUrl && (
              <Image
                width={500}
                height={300}
                src={v.logoUrl}
                alt=""
                className={cn('h-10', 'w-10', 'object-contain', 'rounded', 'border')}
              />
            )}
            <button
              onClick={() => setUploadFor(v.id)}
              className={cn('px-2', 'py-1', 'rounded', 'border', 'text-xs', 'hover:bg-muted', 'shrink-0')}
            >
              {v.logoUrl ? "Change Logo" : "Upload Logo"}
            </button>
            <input
              type="text"
              value={v.name}
              onChange={(e) => update(v.id, { name: e.target.value })}
              placeholder="Organisation name"
              className={cn('flex-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
            />
            <select
              value={v.category}
              onChange={(e) =>
                update(v.id, {
                  category: e.target.value as ValidatorEntry["category"],
                })
              }
              className={cn('rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
            >
              <option value="industry">Industry</option>
              <option value="academia">Academia</option>
            </select>
            <button
              onClick={() => remove(v.id)}
              className={cn('text-red-500', 'text-sm', 'px-2')}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <SaveBar onSave={onSave} saving={saving} saved={saved} />

      <ImageUploadModal
        open={uploadFor !== null}
        onClose={() => setUploadFor(null)}
        folder="landing/validators"
        onUploaded={(image) => {
          if (uploadFor) update(uploadFor, { logoUrl: image.imageUrl });
          setUploadFor(null);
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mission tab
// ─────────────────────────────────────────────────────────────────────────────

function MissionTab({
  data,
  onChange,
  onSave,
  saving,
  saved,
}: {
  data: MissionConfig | undefined;
  onChange: (d: MissionConfig) => void;
  onSave: () => void;
  saving: boolean;
        saved: boolean;
}) {
    const [uploadOpen, setUploadOpen] = useState(false);
  const d: MissionConfig = data ?? {
    photoUrl: "",
    name: "",
    title: "",
    writeup: "",
  };

  return (
    <div className="space-y-4">
      <div className={cn('flex', 'items-start', 'gap-4')}>
        {d.photoUrl && (
          <Image
            width={500}
            height={300}
            src={d.photoUrl}
            alt=""
            className={cn('h-24', 'w-20', 'object-cover', 'rounded-lg', 'border')}
          />
        )}
        <button
          onClick={() => setUploadOpen(true)}
          className={cn('px-3', 'py-1.5', 'rounded', 'border', 'text-sm', 'hover:bg-muted')}
        >
          📁 {d.photoUrl ? "Change Photo" : "Upload Leader Photo"}
        </button>
      </div>

      <div className={cn('grid', 'grid-cols-2', 'gap-4')}>
        <div>
          <label className={cn('text-xs', 'text-muted-foreground')}>Name</label>
          <input
            type="text"
            value={d.name}
            onChange={(e) => onChange({ ...d, name: e.target.value })}
            placeholder="Ikechukwu Innocent Umeh"
            className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
          />
        </div>
        <div>
          <label className={cn('text-xs', 'text-muted-foreground')}>Title / Role</label>
          <input
            type="text"
            value={d.title}
            onChange={(e) => onChange({ ...d, title: e.target.value })}
            placeholder="Founder & Convener, DIUSCADI"
            className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
          />
        </div>
      </div>

      <div>
        <label className={cn('text-xs', 'text-muted-foreground')}>Writeup / Quote</label>
        <textarea
          rows={5}
          value={d.writeup}
          onChange={(e) => onChange({ ...d, writeup: e.target.value })}
          className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
        />
      </div>

      <SaveBar onSave={onSave} saving={saving} saved={saved} />

      <ImageUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        folder="landing/mission"
        onUploaded={(image) => onChange({ ...d, photoUrl: image.imageUrl })}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Workshop Topics tab
// ─────────────────────────────────────────────────────────────────────────────

function WorkshopTopicsTab({
  items,
  onChange,
  onSave,
  saving,
  saved,
}: {
  items: WorkshopTopic[];
  onChange: (items: WorkshopTopic[]) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
    const [uploadFor, setUploadFor] = useState<string | null>(null);
  function add() {
    const entry: WorkshopTopic = {
      id: nanoid(),
      topic: "",
      expertName: "",
      expertTitle: "",
      icon: "🎓",
      order: items.length,
    };
    onChange([...items, entry]);
  }
  function update(id: string, patch: Partial<WorkshopTopic>) {
    onChange(items.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }
  function remove(id: string) {
    onChange(items.filter((w) => w.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className={cn('flex', 'justify-end')}>
        <button
          onClick={add}
          className={cn('px-3', 'py-1.5', 'rounded-md', 'border', 'text-sm', 'hover:bg-muted')}
        >
          + Add Topic
        </button>
      </div>

      <div className="space-y-3">
        {items.map((w) => (
          <div key={w.id} className={cn('border', 'rounded-lg', 'p-3', 'space-y-2')}>
            <div className={cn('flex', 'gap-2')}>
              <input
                type="text"
                value={w.icon ?? ""}
                onChange={(e) => update(w.id, { icon: e.target.value })}
                placeholder="🎓"
                className={cn('w-12', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background', 'text-center')}
              />
              <input
                type="text"
                value={w.topic}
                onChange={(e) => update(w.id, { topic: e.target.value })}
                placeholder="Topic title"
                className={cn('flex-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
              />
              <button
                onClick={() => remove(w.id)}
                className={cn('text-red-500', 'px-2')}
              >
                ×
              </button>
            </div>
            <div className={cn('grid', 'grid-cols-2', 'gap-2')}>
              <input
                type="text"
                value={w.expertName}
                onChange={(e) => update(w.id, { expertName: e.target.value })}
                placeholder="Expert name"
                className={cn('rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
              />
              <input
                type="text"
                value={w.expertTitle ?? ""}
                onChange={(e) => update(w.id, { expertTitle: e.target.value })}
                placeholder="Expert title / organisation"
                className={cn('rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
              />
            </div>
            <div className={cn('flex', 'items-center', 'gap-3')}>
              {w.expertPhotoUrl && (
                <Image
                width={500}
                height={300}
                  src={w.expertPhotoUrl}
                  alt=""
                  className={cn('h-10', 'w-10', 'object-cover', 'rounded-full', 'border')}
                />
              )}
              <button
                onClick={() => setUploadFor(w.id)}
                className={cn('px-2', 'py-1', 'rounded', 'border', 'text-xs', 'hover:bg-muted')}
              >
                {w.expertPhotoUrl ? "Change Photo" : "Expert Photo (optional)"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <SaveBar onSave={onSave} saving={saving} saved={saved} />

      <ImageUploadModal
        open={uploadFor !== null}
        onClose={() => setUploadFor(null)}
        folder="landing/experts"
        onUploaded={(image) => {
          if (uploadFor) update(uploadFor, { expertPhotoUrl: image.imageUrl });
          setUploadFor(null);
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Testimonials tab
// ─────────────────────────────────────────────────────────────────────────────

function TestimonialsTab({
  data,
  onChange,
  onSave,
  saving,
  saved,
}: {
  data: TestimonialsConfig | undefined;
  onChange: (d: TestimonialsConfig) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
    const [uploadFor, setUploadFor] = useState<string | null>(null);
  const d: TestimonialsConfig = data ?? {
    videoUrl: "",
    videoType: "youtube",
    items: [],
  };

  function addTestimonial() {
    const entry: TestimonialEntry = {
      id: nanoid(),
      name: "",
      role: "",
      quote: "",
      order: d.items.length,
    };
    onChange({ ...d, items: [...d.items, entry] });
  }
  function updateItem(id: string, patch: Partial<TestimonialEntry>) {
    onChange({
      ...d,
      items: d.items.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  }
  function removeItem(id: string) {
    onChange({ ...d, items: d.items.filter((t) => t.id !== id) });
  }

  return (
    <div className="space-y-6">
      {/* Video */}
      <div className={cn('border', 'rounded-lg', 'p-4', 'space-y-3')}>
        <h3 className={cn('font-medium', 'text-sm')}>Section Video</h3>
        <div className={cn('grid', 'grid-cols-2', 'gap-3')}>
          <div>
            <label className={cn('text-xs', 'text-muted-foreground')}>Video Type</label>
            <select
              value={d.videoType}
              onChange={(e) =>
                onChange({
                  ...d,
                  videoType: e.target.value as TestimonialsConfig["videoType"],
                })
              }
              className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
            >
              <option value="youtube">YouTube Embed URL</option>
              <option value="cloudinary">Cloudinary Video URL</option>
            </select>
          </div>
          <div>
            <label className={cn('text-xs', 'text-muted-foreground')}>Video URL</label>
            <input
              type="text"
              value={d.videoUrl}
              onChange={(e) => onChange({ ...d, videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/embed/..."
              className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
            />
          </div>
        </div>
      </div>

      {/* Testimonials list */}
      <div>
        <div className={cn('flex', 'items-center', 'justify-between', 'mb-3')}>
          <h3 className={cn('font-medium', 'text-sm')}>Testimonials</h3>
          <button
            onClick={addTestimonial}
            className={cn('px-3', 'py-1.5', 'rounded-md', 'border', 'text-sm', 'hover:bg-muted')}
          >
            + Add
          </button>
        </div>
        <div className="space-y-3">
          {d.items.map((t) => (
            <div key={t.id} className={cn('border', 'rounded-lg', 'p-3', 'space-y-2')}>
              <div className={cn('flex', 'gap-2')}>
                <input
                  type="text"
                  value={t.name}
                  onChange={(e) => updateItem(t.id, { name: e.target.value })}
                  placeholder="Name"
                  className={cn('flex-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
                />
                <input
                  type="text"
                  value={t.role ?? ""}
                  onChange={(e) => updateItem(t.id, { role: e.target.value })}
                  placeholder="Role"
                  className={cn('flex-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
                />
                <button
                  onClick={() => removeItem(t.id)}
                  className={cn('text-red-500', 'px-2')}
                >
                  ×
                </button>
              </div>
              <textarea
                rows={2}
                value={t.quote}
                onChange={(e) => updateItem(t.id, { quote: e.target.value })}
                placeholder="Their testimonial..."
                className={cn('w-full', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
              />
              <div className={cn('flex', 'items-center', 'gap-3')}>
                {t.photoUrl && (
                  <Image
                    width={500}
                    height={300}
                    src={t.photoUrl}
                    alt=""
                    className={cn('h-8', 'w-8', 'rounded-full', 'object-cover', 'border')}
                  />
                )}
                <button
                  onClick={() => setUploadFor(t.id)}
                  className={cn('px-2', 'py-1', 'rounded', 'border', 'text-xs', 'hover:bg-muted')}
                >
                  {t.photoUrl ? "Change Photo" : "Photo (optional)"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SaveBar onSave={onSave} saving={saving} saved={saved} />

      <ImageUploadModal
        open={uploadFor !== null}
        onClose={() => setUploadFor(null)}
        folder="landing/testimonials"
        onUploaded={(image) => {
          if (uploadFor) updateItem(uploadFor, { photoUrl: image.imageUrl });
          setUploadFor(null);
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Support / Sponsors tab
// ─────────────────────────────────────────────────────────────────────────────

function SupportTab({
  items,
  onChange,
  onSave,
  saving,
  saved,
}: {
  items: SupportEntry[];
  onChange: (items: SupportEntry[]) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
    const [uploadFor, setUploadFor] = useState<string | null>(null);

  function add() {
    const entry: SupportEntry = {
      id: nanoid(),
      name: "",
      logoUrl: "",
      tier: "partner",
      order: items.length,
    };
    onChange([...items, entry]);
  }
  function update(id: string, patch: Partial<SupportEntry>) {
    onChange(items.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function remove(id: string) {
    onChange(items.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-4">
      <p className={cn('text-sm', 'text-muted-foreground')}>
        Select which supporters appear on the landing page. Scope sponsors to a
        specific upcoming event using the linked event ID field.
      </p>
      <div className={cn('flex', 'justify-end')}>
        <button
          onClick={add}
          className={cn('px-3', 'py-1.5', 'rounded-md', 'border', 'text-sm', 'hover:bg-muted')}
        >
          + Add Supporter
        </button>
      </div>

      <div className="space-y-3">
        {items.map((s) => (
          <div key={s.id} className={cn('border', 'rounded-lg', 'p-3', 'space-y-2')}>
            <div className={cn('flex', 'items-center', 'gap-3')}>
              {s.logoUrl && (
                <Image
                  width={500}
                  height={300}
                  src={s.logoUrl}
                  alt=""
                  className={cn('h-10', 'w-10', 'object-contain', 'rounded', 'border')}
                />
              )}
              <button
                onClick={() => setUploadFor(s.id)}
                className={cn('px-2', 'py-1', 'rounded', 'border', 'text-xs', 'hover:bg-muted', 'shrink-0')}
              >
                {s.logoUrl ? "Change Logo" : "Upload Logo"}
              </button>
              <input
                type="text"
                value={s.name}
                onChange={(e) => update(s.id, { name: e.target.value })}
                placeholder="Organisation name"
                className={cn('flex-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
              />
              <select
                value={s.tier}
                onChange={(e) =>
                  update(s.id, { tier: e.target.value as SupportEntry["tier"] })
                }
                className={cn('rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
              >
                <option value="headline">Headline</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="partner">Partner</option>
              </select>
              <button
                onClick={() => remove(s.id)}
                className={cn('text-red-500', 'px-2')}
              >
                ×
              </button>
            </div>
            {/* <div className={cn('grid', 'grid-cols-2', 'gap-2')}>
              <div>
                <label className={cn('text-xs', 'text-muted-foreground')}>
                  Website URL (optional)
                </label>
                <input
                  type="text"
                  value={s.websiteUrl ?? ""}
                  onChange={(e) => update(s.id, { websiteUrl: e.target.value })}
                  placeholder="https://example.com"
                  className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
                />
              </div>
              <div>
                <label className={cn('text-xs', 'text-muted-foreground')}>
                  Linked Event ID (optional)
                </label>
                <input
                  type="text"
                  value={s.linkedEventId ?? ""}
                  onChange={(e) =>
                    update(s.id, { linkedEventId: e.target.value })
                  }
                  placeholder="event-slug"
                  className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
                />
              </div>
            </div> */}
          </div>
        ))}
      </div>

      <SaveBar onSave={onSave} saving={saving} saved={saved} />

      <ImageUploadModal
        open={uploadFor !== null}
        onClose={() => setUploadFor(null)}
        folder="landing/sponsors"
        onUploaded={(image) => {
          if (uploadFor) update(uploadFor, { logoUrl: image.imageUrl });
          setUploadFor(null);
        }}
      />
    </div>
  );
}
