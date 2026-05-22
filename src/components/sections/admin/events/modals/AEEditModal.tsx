"use client";
// modals/AEEditModal.tsx
// 5-step wizard covering the complete EventDocument payload.
// Step 1 — Identity:  title, slug, category, level, tags, shortDescription,
//                     overview, description
// Step 2 — Logistics: format, eventDate, endDate, duration, registrationDeadline,
//                     location (all 5 fields), locationScope
// Step 3 — Audience:  targetEduStatus, requiredSkills (DB-driven + suggestions),
//                     learningOutcomes, instructor, capacity, ticketPrice,
//                     enableWaitlist
// Step 4 — Content:   Speakers, Sponsors, Schedule, FAQs (sub-tabs)
// Step 5 — Review:    learningOutcomes summary, visibility, publish

import React, {
  useState, useEffect, useCallback, useRef,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuChevronRight,
  LuChevronLeft,
  LuCheck,
  LuImage,
  LuMapPin,
  LuUsers,
  LuMic,
  LuShield,
  LuInfo,
  LuEye,
  LuCircleCheck,
  LuClock,
  LuTicket,
  LuTimer,
  LuCalendar,
  LuLoader,
  LuPencil,
  LuRefreshCcw,
  LuTriangleAlert,
  LuPlus,
  LuTrash2,
  LuGripVertical,
  LuBuilding2,
  LuLink,
  LuSearch,
  LuCalendarClock,
  LuCoffee,
  LuWrench,
  LuNetwork,
  LuUpload,
  LuTag,
  LuGlobe,
  LuGraduationCap,
  LuBookOpen,
  LuCircleHelp,
  LuStar,
  LuSparkles,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import Image from "next/image";
import type { CloudinaryImage } from "@/types/cloudinary";
import type {
  EventSpeaker, EventSponsor, EventScheduleItem, EventFAQ,
} from "@/lib/models/Events";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  eventId?: string;
  initialData?: Partial<EventFormData>;
}

interface SkillOption {
  slug: string;
  name: string;
  category: string;
}

interface EventFormData {
  // Step 1 — Identity
  title: string;
  slug: string;
  slugManuallyEdited: boolean;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "";
  tags: string[];
  tagInput: string;
  shortDescription: string;
  overview: string;
  description: string;

  // Step 2 — Logistics
  format: "Physical" | "Virtual" | "Hybrid";
  eventDate: string;
  endDate: string;
  duration: string;
  registrationDeadline: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  country: string;
  locationScope: "local" | "state" | "national";

  // Step 3 — Audience
  targetEduStatus: "ALL" | "STUDENT" | "GRADUATE";
  requiredSkills: string[];         // slugs of approved skills
  pendingSkills: string[];          // free-text names pending suggestion
  learningOutcomes: string[];
  outcomeInput: string;
  instructor: string;
  maxCapacity: number;
  ticketPrice: number;
  enableWaitlist: boolean;

  // Step 4 — Content
  speakers: EventSpeaker[];
  sponsors: EventSponsor[];
  schedule: EventScheduleItem[];
  faqs: EventFAQ[];

  // Step 5 — Review
  visibility: "Public" | "Invite-Only";
  bannerBlob: Blob | null;
  bannerPreviewUrl: string | null;
  _originalStatus?: string;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;
type ContentTab = "speakers" | "sponsors" | "schedule" | "faqs";
type ScheduleType = "session" | "break" | "workshop" | "keynote" | "networking";
type SponsorTier = "gold" | "silver" | "bronze" | "partner";

interface StepConfig {
  id: WizardStep;
  label: string;
  icon: IconType;
}

interface StepProps {
  formData: EventFormData;
  setFormData: React.Dispatch<React.SetStateAction<EventFormData>>;
  ownerId?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS: StepConfig[] = [
  { id: 1, label: "Identity",  icon: LuInfo },
  { id: 2, label: "Logistics", icon: LuMapPin },
  { id: 3, label: "Audience",  icon: LuUsers },
  { id: 4, label: "Content",   icon: LuMic },
  { id: 5, label: "Review",    icon: LuShield },
];

const CATEGORIES = [
  "Technology", "Business", "Governance", "Career",
  "Networking", "Seminar", "Workshop", "Conference",
  "Bootcamp", "Other",
];

const SCHEDULE_TYPES: ScheduleType[] = [
  "session", "break", "workshop", "keynote", "networking",
];

const TIER_OPTIONS: SponsorTier[] = [
  "gold", "silver", "bronze", "partner",
];

const DEFAULT_FORM: EventFormData = {
  title: "",
  slug: "",
  slugManuallyEdited: false,
  category: "Seminar",
  level: "",
  tags: [],
  tagInput: "",
  shortDescription: "",
  overview: "",
  description: "",
  format: "Physical",
  eventDate: "",
  endDate: "",
  duration: "",
  registrationDeadline: "",
  venue: "",
  address: "",
  city: "",
  state: "",
  country: "Nigeria",
  locationScope: "local",
  targetEduStatus: "ALL",
  requiredSkills: [],
  pendingSkills: [],
  learningOutcomes: [],
  outcomeInput: "",
  instructor: "",
  maxCapacity: 100,
  ticketPrice: 0,
  enableWaitlist: false,
  speakers: [],
  sponsors: [],
  schedule: [],
  faqs: [],
  visibility: "Public",
  bannerBlob: null,
  bannerPreviewUrl: null,
  _originalStatus: undefined,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function localDatetimeToIso(value: string): string {
  if (!value) return "";
  return new Date(`${value}:00+01:00`).toISOString();
}

// function isoToLocalDatetime(iso: string): string {
//   if (!iso) return "";
//   const d = new Date(new Date(iso).getTime() + 60 * 60 * 1000);
//   return d.toISOString().slice(0, 16);
// }

function toSlug(title: string): string {
  return title.trim().toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("diuscadi_token");
}

async function uploadImageForEvent(
  file: File,
  uploadType: "speaker-photo" | "sponsor-logo",
  ownerId: string,
  token: string,
): Promise<CloudinaryImage | null> {
  try {
    const signRes = await fetch("/api/media/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ uploadType, ownerId }),
    });
    if (!signRes.ok) return null;
    const params = await signRes.json();

    const form = new FormData();
    form.append("file", file, file.name);
    form.append("api_key", params.apiKey);
    form.append("timestamp", String(params.timestamp));
    form.append("signature", params.signature);
    form.append("folder", params.folder);
    form.append("public_id", params.publicId);
    if (params.eager) form.append("eager", params.eager);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`,
      { method: "POST", body: form },
    );
    if (!uploadRes.ok) return null;
    const uploadData = await uploadRes.json();

    const confirmRes = await fetch("/api/media/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        uploadType, ownerId,
        asset_id:   uploadData.asset_id,
        public_id:  uploadData.public_id,
        secure_url: uploadData.secure_url,
        signature:  uploadData.signature,
        timestamp:  uploadData.timestamp ?? params.timestamp,
        format:     uploadData.format,
        bytes:      uploadData.bytes,
        width:      uploadData.width,
        height:     uploadData.height,
        created_at: uploadData.created_at,
        etag:       uploadData.etag ?? "",
      }),
    });
    if (!confirmRes.ok) return null;
    const { image } = await confirmRes.json();
    return image as CloudinaryImage;
  } catch { return null; }
}

async function uploadBanner(blob: Blob, slug: string, token: string) {
  try {
    const signRes = await fetch("/api/media/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ uploadType: "event-banner", ownerId: slug }),
    });
    if (!signRes.ok) return;
    const params = await signRes.json();

    const form = new FormData();
    form.append("file", blob, `banner_${Date.now()}.webp`);
    form.append("api_key", params.apiKey);
    form.append("timestamp", String(params.timestamp));
    form.append("signature", params.signature);
    form.append("folder", params.folder);
    form.append("public_id", params.publicId);
    if (params.eager) form.append("eager", params.eager);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`,
      { method: "POST", body: form },
    );
    if (!uploadRes.ok) return;
    const uploadData = await uploadRes.json();

    await fetch("/api/media/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        uploadType: "event-banner", ownerId: slug,
        asset_id:   uploadData.asset_id,
        public_id:  uploadData.public_id,
        secure_url: uploadData.secure_url,
        signature:  uploadData.signature,
        timestamp:  uploadData.timestamp ?? params.timestamp,
        format:     uploadData.format,
        bytes:      uploadData.bytes,
        width:      uploadData.width,
        height:     uploadData.height,
        created_at: uploadData.created_at,
        etag:       uploadData.etag ?? "",
      }),
    });
  } catch {
    toast.error("Banner upload failed — update it from the event edit page.");
  }
}

// ── Shared input components ───────────────────────────────────────────────────

interface InputGroupProps {
  label: string;
  icon?: IconType;
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
  required?: boolean;
}

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className={cn("text-[10px]","font-black","uppercase","tracking-widest","text-slate-400")}>
    {children}{required && <span className={cn('text-red-400', 'ml-1')}>*</span>}
  </label>
);

const InputGroup: React.FC<InputGroupProps> = ({
  label, icon: Icon, type = "text", placeholder, value, onChange, hint, required,
}) => (
  <div className="space-y-1.5">
    <FieldLabel required={required}>{label}</FieldLabel>
    <div className="relative">
      {Icon && <Icon className={cn('absolute', 'left-4', 'top-1/2', '-translate-y-1/2', 'w-4', 'h-4', 'text-slate-400')} />}
      <input
        type={type} placeholder={placeholder} value={value} onChange={onChange}
        className={cn(
          "w-full","p-4","rounded-2xl","text-xs","font-bold","outline-none","border","transition-all",
          "bg-muted","border-border","text-foreground","focus:border-primary",
          Icon ? "pl-12" : "pl-4",
        )}
      />
    </div>
    {hint && <p className={cn('text-[9px]', 'text-muted-foreground', 'font-bold', 'uppercase', 'tracking-widest')}>{hint}</p>}
  </div>
);

const TextareaGroup: React.FC<{
  label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string; rows?: number; hint?: string; required?: boolean;
  maxLength?: number;
}> = ({ label, value, onChange, placeholder, rows = 3, hint, required, maxLength }) => (
  <div className="space-y-1.5">
    <div className={cn('flex', 'items-center', 'justify-between')}>
      <FieldLabel required={required}>{label}</FieldLabel>
      {maxLength && (
        <span className={cn('text-[9px]', 'font-bold', 'text-muted-foreground')}>{value.length}/{maxLength}</span>
      )}
    </div>
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      maxLength={maxLength}
      className={cn("w-full","p-4","rounded-2xl","text-xs","font-medium","outline-none","border","transition-all","bg-muted","border-border","text-foreground","focus:border-primary","resize-none")}
    />
    {hint && <p className={cn('text-[9px]', 'text-muted-foreground', 'font-bold', 'uppercase', 'tracking-widest')}>{hint}</p>}
  </div>
);

// ── Toggle switch ─────────────────────────────────────────────────────────────

const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={cn("w-14","h-8","rounded-full","p-1","cursor-pointer","transition-colors", value ? "bg-primary" : "bg-muted")}
  >
    <motion.div
      animate={{ x: value ? 24 : 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn('w-6', 'h-6', 'bg-background', 'rounded-full', 'shadow-md')}
    />
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — IDENTITY
// title, slug (auto + editable), category, level, tags,
// shortDescription, overview, description
// ─────────────────────────────────────────────────────────────────────────────

const IdentityStep: React.FC<StepProps> = ({ formData, setFormData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTitleChange = (title: string) => {
    setFormData((p) => ({
      ...p,
      title,
      slug: p.slugManuallyEdited ? p.slug : toSlug(title),
    }));
  };

  const addTag = () => {
    const tag = formData.tagInput.trim().toLowerCase();
    if (!tag || formData.tags.includes(tag)) {
      setFormData((p) => ({ ...p, tagInput: "" }));
      return;
    }
    setFormData((p) => ({ ...p, tags: [...p.tags, tag], tagInput: "" }));
  };

  return (
    <div className="space-y-6">
      {/* Title + Slug */}
      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-4')}>
        <InputGroup
          label="Event Title" required icon={LuInfo}
          placeholder="e.g. LASCADSS 7.0"
          value={formData.title}
          onChange={(e) => handleTitleChange(e.target.value)}
        />
        <div className="space-y-1.5">
          <FieldLabel>URL Slug</FieldLabel>
          <div className={cn('flex', 'items-center', 'gap-2')}>
            <input
              type="text" value={formData.slug}
              onChange={(e) => setFormData((p) => ({
                ...p, slug: toSlug(e.target.value), slugManuallyEdited: true,
              }))}
              placeholder="lascadss-7"
              className={cn("flex-1","p-4","rounded-2xl","text-xs","font-mono","outline-none","border","transition-all","bg-muted","border-border","text-foreground","focus:border-primary")}
            />
            {formData.slug && (
              <span className={cn('text-[9px]', 'font-bold', 'text-emerald-600', 'uppercase', 'tracking-widest', 'whitespace-nowrap')}>
                /events/{formData.slug}
              </span>
            )}
          </div>
          <p className={cn('text-[9px]', 'text-muted-foreground', 'font-bold', 'uppercase', 'tracking-widest')}>
            Auto-generated from title — edit only if needed
          </p>
        </div>
      </div>

      {/* Category + Level */}
      <div className={cn('grid', 'grid-cols-2', 'gap-4')}>
        <div className="space-y-1.5">
          <FieldLabel required>Category</FieldLabel>
          <select
            value={formData.category}
            onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
            className={cn("w-full","bg-muted","border","border-border","p-4","rounded-2xl","text-xs","font-bold","outline-none","focus:border-primary","transition-all","appearance-none")}
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Level</FieldLabel>
          <select
            value={formData.level}
            onChange={(e) => setFormData((p) => ({
              ...p, level: e.target.value as EventFormData["level"],
            }))}
            className={cn("w-full","bg-muted","border","border-border","p-4","rounded-2xl","text-xs","font-bold","outline-none","focus:border-primary","transition-all","appearance-none")}
          >
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <FieldLabel>Tags</FieldLabel>
        <div className={cn('flex', 'gap-2')}>
          <div className={cn('relative', 'flex-1')}>
            <LuTag className={cn('absolute', 'left-4', 'top-1/2', '-translate-y-1/2', 'w-4', 'h-4', 'text-slate-400')} />
            <input
              type="text"
              value={formData.tagInput}
              onChange={(e) => setFormData((p) => ({ ...p, tagInput: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
              placeholder="Type a tag and press Enter"
              className={cn("w-full","p-4","pl-12","rounded-2xl","text-xs","font-bold","outline-none","border","bg-muted","border-border","text-foreground","focus:border-primary")}
            />
          </div>
          <button
            onClick={addTag}
            className={cn('px-4', 'py-2', 'bg-primary', 'text-primary-foreground', 'rounded-2xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'cursor-pointer')}
          >
            Add
          </button>
        </div>
        {formData.tags.length > 0 && (
          <div className={cn('flex', 'flex-wrap', 'gap-2', 'mt-2')}>
            {formData.tags.map((tag) => (
              <span key={tag} className={cn('flex', 'items-center', 'gap-1.5', 'px-3', 'py-1', 'bg-primary/10', 'text-primary', 'rounded-full', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest')}>
                {tag}
                <button onClick={() => setFormData((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }))} className={cn('hover:text-red-500', 'transition-colors', 'cursor-pointer')}>
                  <LuX className={cn('w-3', 'h-3')} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Short description */}
      <TextareaGroup
        label="Short Description" required rows={2} maxLength={160}
        placeholder="One compelling sentence shown in event cards and previews"
        value={formData.shortDescription}
        onChange={(e) => setFormData((p) => ({ ...p, shortDescription: e.target.value }))}
        hint="Shown in event cards — keep under 160 chars"
      />

      {/* Overview */}
      <TextareaGroup
        label="Overview" required rows={3}
        placeholder="Mission statement and high-level summary of the event"
        value={formData.overview}
        onChange={(e) => setFormData((p) => ({ ...p, overview: e.target.value }))}
        hint="Shown at the top of the event detail page"
      />

      {/* Full description */}
      <TextareaGroup
        label="Full Description" rows={5}
        placeholder="Full event description — context, what to expect, who should attend"
        value={formData.description}
        onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
      />

      {/* Banner */}
      <div className="space-y-1.5">
        <FieldLabel>Event Banner</FieldLabel>
        <input
          ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const url = URL.createObjectURL(file);
              setFormData((p) => ({ ...p, bannerBlob: file, bannerPreviewUrl: url }));
            }
            e.target.value = "";
          }}
        />
        {formData.bannerPreviewUrl ? (
          <div className={cn('relative', 'group', 'rounded-[2rem]', 'overflow-hidden', 'aspect-[1200/630]', 'bg-muted')}>
            <Image width={500} height={300} src={formData.bannerPreviewUrl} alt="Banner" className={cn('w-full', 'h-full', 'object-cover')} />
            <div className={cn('absolute', 'inset-0', 'bg-black/40', 'opacity-0', 'group-hover:opacity-100', 'transition-opacity', 'flex', 'items-center', 'justify-center', 'gap-3')}>
              <button onClick={() => fileInputRef.current?.click()} className={cn('px-4', 'py-2', 'bg-background', 'text-foreground', 'rounded-xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'cursor-pointer')}>Change</button>
              <button onClick={() => setFormData((p) => ({ ...p, bannerBlob: null, bannerPreviewUrl: null }))} className={cn('px-4', 'py-2', 'bg-destructive', 'text-white', 'rounded-xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'cursor-pointer')}>Remove</button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => formData.title.trim() && fileInputRef.current?.click()}
            className={cn("p-8","border-2","border-dashed","border-border","rounded-[2rem]","bg-muted/50","flex","flex-col","items-center","justify-center","text-center","gap-2","transition-colors", formData.title.trim() ? "cursor-pointer hover:border-primary/50 hover:bg-primary/5" : "opacity-50 cursor-not-allowed")}
          >
            <LuImage className={cn('w-8', 'h-8', 'text-muted-foreground')} />
            <p className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-[0.2em]', 'text-foreground')}>
              {formData.title.trim() ? "Upload Event Banner" : "Enter a title first"}
            </p>
            <p className={cn('text-[9px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'mt-1')}>
              PNG, JPG or WebP · Max 10MB · 1200 × 630 recommended
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — LOGISTICS
// format, eventDate, endDate, duration, registrationDeadline,
// location (all 5 fields), locationScope
// ─────────────────────────────────────────────────────────────────────────────

const LogisticsStep: React.FC<StepProps> = ({ formData, setFormData }) => (
  <div className="space-y-6">
    {/* Format picker */}
    <div className="space-y-1.5">
      <FieldLabel required>Event Format</FieldLabel>
      <div className={cn('flex', 'items-center', 'gap-2', 'p-1.5', 'bg-muted', 'rounded-2xl', 'w-fit', 'border', 'border-border')}>
        {(["Physical","Virtual","Hybrid"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFormData((p) => ({ ...p, format: type }))}
            className={cn("px-6","py-2.5","rounded-xl","text-[10px]","font-black","uppercase","tracking-widest","transition-all","cursor-pointer", formData.format === type ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {type}
          </button>
        ))}
      </div>
    </div>

    {/* Dates row */}
    <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-4')}>
      <div className="space-y-1.5">
        <FieldLabel required>Event Date & Time (WAT)</FieldLabel>
        <div className="relative">
          <LuCalendar className={cn('absolute', 'left-4', 'top-1/2', '-translate-y-1/2', 'w-4', 'h-4', 'text-slate-400')} />
          <input
            type="datetime-local" value={formData.eventDate}
            onChange={(e) => setFormData((p) => ({ ...p, eventDate: e.target.value }))}
            className={cn("w-full","p-4","pl-12","rounded-2xl","text-xs","font-bold","outline-none","border","bg-muted","border-border","text-foreground","focus:border-primary")}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <FieldLabel>End Date & Time (WAT)</FieldLabel>
        <div className="relative">
          <LuCalendar className={cn('absolute', 'left-4', 'top-1/2', '-translate-y-1/2', 'w-4', 'h-4', 'text-slate-400')} />
          <input
            type="datetime-local" value={formData.endDate}
            onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
            className={cn("w-full","p-4","pl-12","rounded-2xl","text-xs","font-bold","outline-none","border","bg-muted","border-border","text-foreground","focus:border-primary")}
          />
        </div>
      </div>
      <InputGroup
        label="Duration" icon={LuTimer}
        placeholder="e.g. 2 days, 3 hours"
        value={formData.duration}
        onChange={(e) => setFormData((p) => ({ ...p, duration: e.target.value }))}
        hint="Free text — e.g. '2 days' or '4 hours'"
      />
    </div>

    {/* Registration deadline */}
    <div className="space-y-1.5">
      <FieldLabel required>Registration Deadline (WAT)</FieldLabel>
      <div className="relative">
        <LuClock className={cn('absolute', 'left-4', 'top-1/2', '-translate-y-1/2', 'w-4', 'h-4', 'text-slate-400')} />
        <input
          type="datetime-local" value={formData.registrationDeadline}
          onChange={(e) => setFormData((p) => ({ ...p, registrationDeadline: e.target.value }))}
          className={cn("w-full","p-4","pl-12","rounded-2xl","text-xs","font-bold","outline-none","border","bg-muted","border-border","text-foreground","focus:border-primary")}
        />
      </div>
      <p className={cn('text-[9px]', 'text-muted-foreground', 'font-bold', 'uppercase', 'tracking-widest')}>
        Registrations close automatically at this time
      </p>
    </div>

    {/* Location scope */}
    <div className="space-y-1.5">
      <FieldLabel>Location Scope</FieldLabel>
      <div className={cn('flex', 'items-center', 'gap-2', 'p-1.5', 'bg-muted', 'rounded-2xl', 'w-fit', 'border', 'border-border')}>
        {(["local","state","national"] as const).map((scope) => (
          <button
            key={scope}
            onClick={() => setFormData((p) => ({ ...p, locationScope: scope }))}
            className={cn("px-5","py-2","rounded-xl","text-[10px]","font-black","uppercase","tracking-widest","transition-all","cursor-pointer", formData.locationScope === scope ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {scope}
          </button>
        ))}
      </div>
      <p className={cn('text-[9px]', 'text-muted-foreground', 'font-bold', 'uppercase', 'tracking-widest')}>
        Used to filter the event feed for relevant users
      </p>
    </div>

    {/* Location fields — hidden for Virtual */}
    {formData.format !== "Virtual" && (
      <div className={cn('space-y-4', 'p-6', 'bg-muted/50', 'rounded-2xl', 'border', 'border-border')}>
        <p className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-400', 'flex', 'items-center', 'gap-2')}>
          <LuMapPin className={cn('w-3.5', 'h-3.5')} /> Venue Details
        </p>
        <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-4')}>
          <InputGroup
            label="Venue Name" icon={LuBuilding2}
            placeholder="e.g. ASUU Multipurpose Hall"
            value={formData.venue}
            onChange={(e) => setFormData((p) => ({ ...p, venue: e.target.value }))}
          />
          <InputGroup
            label="Street Address" icon={LuMapPin}
            placeholder="e.g. Nnamdi Azikiwe University"
            value={formData.address}
            onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
          />
          <InputGroup
            label="City" icon={LuGlobe}
            placeholder="e.g. Awka"
            value={formData.city}
            onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
          />
          <InputGroup
            label="State"
            placeholder="e.g. Anambra"
            value={formData.state}
            onChange={(e) => setFormData((p) => ({ ...p, state: e.target.value }))}
          />
          <InputGroup
            label="Country"
            placeholder="Nigeria"
            value={formData.country}
            onChange={(e) => setFormData((p) => ({ ...p, country: e.target.value }))}
          />
        </div>
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — AUDIENCE & CAPACITY
// targetEduStatus, requiredSkills (DB + suggestions), learningOutcomes,
// instructor, capacity, ticketPrice, waitlist
// ─────────────────────────────────────────────────────────────────────────────

// ── Skill combobox ────────────────────────────────────────────────────────────

function RequiredSkillsInput({
  selectedSlugs,
  pendingSkills,
  onChangeSlugs,
  onChangePending,
}: {
  selectedSlugs: string[];
  pendingSkills: string[];
  onChangeSlugs: (slugs: string[]) => void;
  onChangePending: (skills: string[]) => void;
}) {
  const [query, setQuery]       = useState("");
  const [allSkills, setAll]     = useState<SkillOption[]>([]);
  // const [setFiltered] = useState<SkillOption[]>([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load skills once on mount
  useEffect(() => {
  fetch("/api/platform/skills")
    .then((r) => r.json())
    .then((data: { skills: SkillOption[] }) => {
      setAll(data.skills ?? []);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
}, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allSkills;
    return allSkills.filter(
      (s) => s.name.toLowerCase().includes(q) || s.slug.includes(q),
    );
  }, [query, allSkills]);

  // Check if typed query matches any existing skill
  const queryMatchesExisting = allSkills.some(
    (s) => s.name.toLowerCase() === query.trim().toLowerCase(),
  );

  // Check if it's already pending
  const queryAlreadyPending = pendingSkills.some(
    (s) => s.toLowerCase() === query.trim().toLowerCase(),
  );

  function toggleSlug(slug: string) {
    if (selectedSlugs.includes(slug)) {
      onChangeSlugs(selectedSlugs.filter((s) => s !== slug));
    } else {
      onChangeSlugs([...selectedSlugs, slug]);
    }
  }

  async function suggestNewSkill() {
    const name = query.trim();
    if (!name || queryMatchesExisting || queryAlreadyPending) return;

    const token = getToken();
    try {
      const res = await fetch("/api/platform/skills/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, source: "event-form" }),
      });
      const data = await res.json();

      if (data.alreadyExists) {
        // Skill exists — add it as an approved skill instead
        if (!selectedSlugs.includes(data.slug)) {
          onChangeSlugs([...selectedSlugs, data.slug]);
        }
        toast.success(`"${data.name}" already exists — added to skills`);
      } else {
        onChangePending([...pendingSkills, name]);
        toast.success(`"${name}" submitted for admin review`);
      }
    } catch {
      // Offline fallback — add to pending locally
      onChangePending([...pendingSkills, name]);
    }

    setQuery("");
    setOpen(false);
  }

  // Get display name for a slug
  const nameForSlug = (slug: string) =>
    allSkills.find((s) => s.slug === slug)?.name ?? slug;

  return (
    <div className="space-y-2">
      <FieldLabel>Required Skills</FieldLabel>
      <p className={cn('text-[9px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest')}>
        Select from the list or type a new skill to suggest it for approval
      </p>

      {/* Search input */}
      <div className="relative">
        <div className={cn("flex","items-center","gap-2","bg-muted","border","border-border","rounded-2xl","px-4","py-3","transition-all", open ? "border-primary/40 ring-2 ring-primary/10" : "")}>
          <LuSearch className={cn('w-4', 'h-4', 'text-muted-foreground', 'shrink-0')} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search or add a skill…"
            className={cn('flex-1', 'bg-transparent', 'outline-none', 'text-xs', 'font-bold', 'text-foreground', 'placeholder:text-muted-foreground')}
          />
          {loading && <LuLoader className={cn('w-3.5', 'h-3.5', 'animate-spin', 'text-muted-foreground', 'shrink-0')} />}
        </div>

        {/* Dropdown */}
        {open && (
          <div className={cn("absolute","top-full","left-0","right-0","mt-1","bg-background","border","border-border","rounded-2xl","shadow-2xl","z-50","overflow-hidden")}>
            <div className={cn('max-h-48', 'overflow-y-auto')}>
              {filtered.length === 0 && !query.trim() ? (
                <p className={cn('text-[10px]', 'text-muted-foreground', 'text-center', 'py-4')}>
                  No skills found
                </p>
              ) : (
                filtered.map((skill) => {
                  const selected = selectedSlugs.includes(skill.slug);
                  return (
                    <button
                      key={skill.slug}
                      onMouseDown={() => toggleSlug(skill.slug)}
                      className={cn("w-full","flex","items-center","gap-3","px-4","py-2.5","hover:bg-muted","transition-colors","text-left", selected && "bg-primary/5")}
                    >
                      <div className={cn("w-4","h-4","rounded","border-2","flex","items-center","justify-center","transition-colors", selected ? "bg-primary border-primary" : "border-border")}>
                        {selected && <LuCheck className={cn('w-2.5', 'h-2.5', 'text-primary-foreground')} />}
                      </div>
                      <div>
                        <p className={cn('text-xs', 'font-bold', 'text-foreground')}>{skill.name}</p>
                        <p className={cn('text-[9px]', 'text-muted-foreground')}>{skill.category}</p>
                      </div>
                    </button>
                  );
                })
              )}

              {/* Suggest new skill */}
              {query.trim() && !queryMatchesExisting && !queryAlreadyPending && (
                <button
                  onMouseDown={suggestNewSkill}
                  className={cn('w-full', 'flex', 'items-center', 'gap-3', 'px-4', 'py-3', 'hover:bg-amber-50', 'transition-colors', 'text-left', 'border-t', 'border-border')}
                >
                  <LuSparkles className={cn('w-4', 'h-4', 'text-amber-600', 'shrink-0')} />
                  <div>
                    <p className={cn('text-xs', 'font-black', 'text-amber-700')}>
                      Suggest &ldquo;{query.trim()}&rdquo; as new skill
                    </p>
                    <p className={cn('text-[9px]', 'text-amber-600')}>
                      Will be submitted for webmaster approval
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected approved skills */}
      {selectedSlugs.length > 0 && (
        <div className={cn('flex', 'flex-wrap', 'gap-2', 'mt-2')}>
          {selectedSlugs.map((slug) => (
            <span key={slug} className={cn('flex', 'items-center', 'gap-1.5', 'px-3', 'py-1', 'bg-primary/10', 'text-primary', 'rounded-full', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest')}>
              {nameForSlug(slug)}
              <button onClick={() => onChangeSlugs(selectedSlugs.filter((s) => s !== slug))} className={cn('hover:text-red-500', 'transition-colors', 'cursor-pointer')}>
                <LuX className={cn('w-3', 'h-3')} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Pending suggested skills */}
      {pendingSkills.length > 0 && (
        <div>
          <p className={cn('text-[9px]', 'font-black', 'uppercase', 'tracking-widest', 'text-amber-600', 'mb-1.5')}>
            Pending approval ({pendingSkills.length})
          </p>
          <div className={cn('flex', 'flex-wrap', 'gap-2')}>
            {pendingSkills.map((name) => (
              <span key={name} className={cn('flex', 'items-center', 'gap-1.5', 'px-3', 'py-1', 'bg-amber-50', 'text-amber-700', 'border', 'border-amber-200', 'rounded-full', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest')}>
                <LuClock className={cn('w-3', 'h-3')} /> {name}
                <button onClick={() => onChangePending(pendingSkills.filter((s) => s !== name))} className={cn('hover:text-red-500', 'transition-colors', 'cursor-pointer')}>
                  <LuX className={cn('w-3', 'h-3')} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const AudienceStep: React.FC<StepProps> = ({ formData, setFormData }) => {
  const addOutcome = () => {
    const outcome = formData.outcomeInput.trim();
    if (!outcome || formData.learningOutcomes.includes(outcome)) {
      setFormData((p) => ({ ...p, outcomeInput: "" }));
      return;
    }
    setFormData((p) => ({
      ...p,
      learningOutcomes: [...p.learningOutcomes, outcome],
      outcomeInput: "",
    }));
  };

  return (
    <div className="space-y-6">
      {/* Target edu status */}
      <div className="space-y-1.5">
        <FieldLabel>Target Audience</FieldLabel>
        <div className={cn('flex', 'items-center', 'gap-2', 'p-1.5', 'bg-muted', 'rounded-2xl', 'w-fit', 'border', 'border-border')}>
          {(["ALL","STUDENT","GRADUATE"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFormData((p) => ({ ...p, targetEduStatus: s }))}
              className={cn("px-5","py-2","rounded-xl","text-[10px]","font-black","uppercase","tracking-widest","transition-all","cursor-pointer", formData.targetEduStatus === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
            >
              {s === "ALL" ? "Everyone" : s === "STUDENT" ? "Students" : "Graduates"}
            </button>
          ))}
        </div>
        <p className={cn('text-[9px]', 'text-muted-foreground', 'font-bold', 'uppercase', 'tracking-widest')}>
          Controls who sees this event in their personalised feed
        </p>
      </div>

      {/* Required skills */}
      <RequiredSkillsInput
        selectedSlugs={formData.requiredSkills}
        pendingSkills={formData.pendingSkills}
        onChangeSlugs={(slugs) => setFormData((p) => ({ ...p, requiredSkills: slugs }))}
        onChangePending={(skills) => setFormData((p) => ({ ...p, pendingSkills: skills }))}
      />

      {/* Instructor */}
      <InputGroup
        label="Lead Instructor / Facilitator" icon={LuGraduationCap}
        placeholder="e.g. Prof. Ikechukwu Umeh"
        value={formData.instructor}
        onChange={(e) => setFormData((p) => ({ ...p, instructor: e.target.value }))}
        hint="Optional — name of the lead facilitator for this event"
      />

      {/* Learning outcomes */}
      <div className="space-y-2">
        <FieldLabel>Learning Outcomes</FieldLabel>
        <div className={cn('flex', 'gap-2')}>
          <div className={cn('relative', 'flex-1')}>
            <LuBookOpen className={cn('absolute', 'left-4', 'top-1/2', '-translate-y-1/2', 'w-4', 'h-4', 'text-slate-400')} />
            <input
              type="text"
              value={formData.outcomeInput}
              onChange={(e) => setFormData((p) => ({ ...p, outcomeInput: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOutcome(); } }}
              placeholder="Type an outcome and press Enter"
              className={cn("w-full","p-4","pl-12","rounded-2xl","text-xs","font-bold","outline-none","border","bg-muted","border-border","text-foreground","focus:border-primary")}
            />
          </div>
          <button onClick={addOutcome} className={cn('px-4', 'py-2', 'bg-primary', 'text-primary-foreground', 'rounded-2xl', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'cursor-pointer')}>
            Add
          </button>
        </div>
        {formData.learningOutcomes.length > 0 && (
          <div className={cn('space-y-1.5', 'mt-2')}>
            {formData.learningOutcomes.map((outcome, i) => (
              <div key={i} className={cn('flex', 'items-center', 'gap-3', 'p-3', 'bg-emerald-50', 'border', 'border-emerald-100', 'rounded-xl')}>
                <LuCheck className={cn('w-3.5', 'h-3.5', 'text-emerald-600', 'shrink-0')} />
                <p className={cn('text-xs', 'font-bold', 'text-emerald-800', 'flex-1')}>{outcome}</p>
                <button onClick={() => setFormData((p) => ({ ...p, learningOutcomes: p.learningOutcomes.filter((_, j) => j !== i) }))} className={cn('text-emerald-400', 'hover:text-red-500', 'transition-colors', 'cursor-pointer')}>
                  <LuX className={cn('w-3.5', 'h-3.5')} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Capacity + Ticket */}
      <div className={cn('grid', 'grid-cols-2', 'gap-4')}>
        <InputGroup
          label="Max Capacity" required icon={LuUsers} type="number"
          placeholder="1000"
          value={formData.maxCapacity}
          onChange={(e) => setFormData((p) => ({ ...p, maxCapacity: Number(e.target.value) }))}
        />
        <InputGroup
          label="Ticket Price (₦)" icon={LuTicket} type="number"
          placeholder="0"
          value={formData.ticketPrice}
          onChange={(e) => setFormData((p) => ({ ...p, ticketPrice: Number(e.target.value) }))}
          hint="0 = Free event"
        />
      </div>

      {/* Waitlist */}
      <div className={cn('p-5', 'border-2', 'border-border', 'rounded-[2rem]', 'flex', 'items-center', 'justify-between')}>
        <div>
          <p className={cn('text-[11px]', 'font-black', 'uppercase', 'tracking-widest', 'text-foreground')}>Enable Waitlist</p>
          <p className={cn('text-[9px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'mt-0.5')}>Allow queue once capacity is reached</p>
        </div>
        <Toggle value={formData.enableWaitlist} onChange={() => setFormData((p) => ({ ...p, enableWaitlist: !p.enableWaitlist }))} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — CONTENT: Speakers, Sponsors, Schedule, FAQs
// ─────────────────────────────────────────────────────────────────────────────

// ── Member picker (reused from previous implementation) ───────────────────────

interface MemberOption {
  id: string;
  fullName: { firstname: string; secondname?: string; lastname: string };
  email: string;
  avatarUrl: string | null;
}

function MemberSearchDropdown({
  onSelect, onClose,
}: {
  onSelect: (m: MemberOption) => void;
  onClose: () => void;
}) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const token = getToken();
        const res = await fetch(
          `/api/admin/users/search?q=${encodeURIComponent(q)}&limit=10`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );
        const data = await res.json();
        setResults(data.users ?? []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
  }, []);

  useEffect(() => { search(""); }, [search]);

  return (
    <div className={cn('absolute', 'top-full', 'left-0', 'right-0', 'mt-1', 'bg-background', 'border', 'border-border', 'rounded-2xl', 'shadow-2xl', 'z-50', 'overflow-hidden')}>
      <div className={cn('flex', 'items-center', 'gap-2', 'px-3', 'py-2', 'border-b', 'border-border')}>
        <LuSearch className={cn('w-4', 'h-4', 'text-muted-foreground', 'shrink-0')} />
        <input
          ref={inputRef} type="text" value={query}
          onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
          placeholder="Search by name or email…"
          className={cn('flex-1', 'text-xs', 'bg-transparent', 'outline-none', 'text-foreground', 'placeholder:text-muted-foreground')}
        />
        <button onClick={onClose} className={cn('text-muted-foreground', 'hover:text-foreground')}><LuX className={cn('w-3.5', 'h-3.5')} /></button>
      </div>
      <div className={cn('max-h-48', 'overflow-y-auto')}>
        {loading ? (
          <div className={cn('flex', 'items-center', 'justify-center', 'py-6')}><LuLoader className={cn('w-4', 'h-4', 'animate-spin', 'text-muted-foreground')} /></div>
        ) : results.length === 0 ? (
          <p className={cn('text-[10px]', 'text-muted-foreground', 'text-center', 'py-6')}>No approved members found</p>
        ) : (
          results.map((m) => {
            const name = [m.fullName.firstname, m.fullName.secondname, m.fullName.lastname].filter(Boolean).join(" ");
            return (
              <button key={m.id} onClick={() => { onSelect(m); onClose(); }} className={cn('w-full', 'flex', 'items-center', 'gap-3', 'px-4', 'py-2.5', 'hover:bg-muted', 'transition-colors', 'text-left')}>
                <div className={cn('w-8', 'h-8', 'rounded-full', 'bg-primary/10', 'overflow-hidden', 'shrink-0', 'flex', 'items-center', 'justify-center')}>
                  {m.avatarUrl
                    ? <Image src={m.avatarUrl} alt={name} width={32} height={32} className={cn('object-cover', 'w-full', 'h-full')} />
                    : <span className={cn('text-primary', 'text-xs', 'font-black')}>{m.fullName.firstname[0]}</span>
                  }
                </div>
                <div className={cn('flex-1', 'min-w-0')}>
                  <p className={cn('text-xs', 'font-bold', 'text-foreground', 'truncate')}>{name}</p>
                  <p className={cn('text-[10px]', 'text-muted-foreground', 'truncate')}>{m.email}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Speakers sub-tab ──────────────────────────────────────────────────────────

function SpeakersTab({
  speakers, onChange, ownerId,
}: {
  speakers: EventSpeaker[];
  onChange: (s: EventSpeaker[]) => void;
  ownerId: string;
}) {
  const { token } = useAuth();
  const [showMemberSearch, setShowMemberSearch] = useState<number | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  function addBlank() {
    onChange([...speakers, { name: "", title: "", organisation: "", bio: "", socialUrl: "" }]);
  }

  function update(idx: number, patch: Partial<EventSpeaker>) {
    onChange(speakers.map((s, i) => i === idx ? { ...s, ...patch } : s));
  }

  function remove(idx: number) { onChange(speakers.filter((_, i) => i !== idx)); }

  async function handlePhotoUpload(idx: number, file: File) {
    if (!token) return;
    setUploadingIdx(idx);
    const image = await uploadImageForEvent(file, "speaker-photo", `${ownerId}-spk-${idx}`, token);
    if (image) update(idx, { avatar: image });
    else toast.error("Photo upload failed");
    setUploadingIdx(null);
  }

  if (speakers.length === 0) {
    return (
      <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'py-12', 'gap-4')}>
        <div className={cn('w-14', 'h-14', 'rounded-2xl', 'bg-muted', 'flex', 'items-center', 'justify-center')}><LuMic className={cn('w-6', 'h-6', 'text-muted-foreground')} /></div>
        <div className="text-center">
          <p className={cn('text-sm', 'font-black', 'text-foreground')}>No speakers yet</p>
          <p className={cn('text-xs', 'text-muted-foreground', 'mt-1')}>Link platform members or create manual entries</p>
        </div>
        <button onClick={addBlank} className={cn('flex', 'items-center', 'gap-2', 'px-5', 'py-2.5', 'bg-primary', 'text-primary-foreground', 'rounded-xl', 'text-xs', 'font-black', 'uppercase', 'tracking-widest', 'cursor-pointer', 'hover:opacity-90')}>
          <LuPlus className={cn('w-4', 'h-4')} /> Add Speaker
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {speakers.map((speaker, idx) => {
        const avatarUrl = speaker.avatar?.imageUrl ?? speaker.avatarUrl ?? null;
        return (
          <div
            key={idx}
            className={cn(
              "border",
              "border-border",
              "rounded-2xl",
              "p-5",
              "space-y-4",
              "bg-background",
            )}
          >
            <div className={cn("flex", "items-center", "justify-between")}>
              <div className={cn("flex", "items-center", "gap-3")}>
                <label className={cn("relative", "cursor-pointer", "group")}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhotoUpload(idx, f);
                      e.target.value = "";
                    }}
                  />
                  <div
                    className={cn(
                      "w-12",
                      "h-12",
                      "rounded-full",
                      "overflow-hidden",
                      "bg-muted",
                      "border",
                      "border-border",
                      "flex",
                      "items-center",
                      "justify-center",
                      "relative",
                    )}
                  >
                    {uploadingIdx === idx ? (
                      <LuLoader
                        className={cn(
                          "w-5",
                          "h-5",
                          "animate-spin",
                          "text-muted-foreground",
                        )}
                      />
                    ) : avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={speaker.name}
                        width={48}
                        height={48}
                        className={cn("object-cover", "w-full", "h-full")}
                      />
                    ) : (
                      <span
                        className={cn(
                          "text-lg",
                          "font-black",
                          "text-muted-foreground",
                        )}
                      >
                        {speaker.name ? (
                          speaker.name[0].toUpperCase()
                        ) : (
                          <LuMic className={cn("w-5", "h-5")} />
                        )}
                      </span>
                    )}
                    <div
                      className={cn(
                        "absolute",
                        "inset-0",
                        "bg-black/40",
                        "opacity-0",
                        "group-hover:opacity-100",
                        "transition-opacity",
                        "rounded-full",
                        "flex",
                        "items-center",
                        "justify-center",
                      )}
                    >
                      <LuUpload className={cn("w-4", "h-4", "text-white")} />
                    </div>
                  </div>
                </label>
                <div>
                  <p className={cn("text-sm", "font-bold", "text-foreground")}>
                    {speaker.name || "Unnamed speaker"}
                  </p>
                  {speaker.userId && (
                    <span
                      className={cn(
                        "text-[9px]",
                        "px-1.5",
                        "py-0.5",
                        "rounded-full",
                        "bg-primary/10",
                        "text-primary",
                        "font-black",
                        "uppercase",
                        "tracking-wider",
                      )}
                    >
                      Platform member
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => remove(idx)}
                className={cn(
                  "p-2",
                  "hover:bg-red-50",
                  "hover:text-red-600",
                  "rounded-lg",
                  "transition-colors",
                  "text-muted-foreground",
                  "cursor-pointer",
                )}
              >
                <LuTrash2 className={cn("w-4", "h-4")} />
              </button>
            </div>

            {/* Member picker */}
            <div className="relative">
              <button
                onClick={() =>
                  setShowMemberSearch(showMemberSearch === idx ? null : idx)
                }
                className={cn(
                  "flex",
                  "items-center",
                  "gap-2",
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "text-primary",
                  "hover:underline",
                  "cursor-pointer",
                )}
              >
                <LuLink className={cn("w-3", "h-3")} />
                {speaker.userId
                  ? "Change linked member"
                  : "Link to platform member"}
              </button>
              {showMemberSearch === idx && (
                <MemberSearchDropdown
                  onSelect={(m) => {
                    const name = [
                      m.fullName.firstname,
                      m.fullName.secondname,
                      m.fullName.lastname,
                    ]
                      .filter(Boolean)
                      .join(" ");
                    update(idx, { name, userId: m.id });
                  }}
                  onClose={() => setShowMemberSearch(null)}
                />
              )}
            </div>

            <div className={cn("grid", "grid-cols-2", "gap-3")}>
              {[
                { label: "Name *", field: "name", placeholder: "Full name" },
                {
                  label: "Title",
                  field: "title",
                  placeholder: "e.g. Senior Engineer",
                },
                {
                  label: "Organisation",
                  field: "organisation",
                  placeholder: "Company / Institution",
                },
                {
                  label: "Social URL",
                  field: "socialUrl",
                  placeholder: "https://linkedin.com/in/...",
                },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label
                    className={cn(
                      "text-[10px]",
                      "font-black",
                      "uppercase",
                      "tracking-widest",
                      "text-slate-400",
                    )}
                  >
                    {label}
                  </label>
                  <input
                    type="text"
                    value={
                      (speaker[field as keyof EventSpeaker] as string) ?? ""
                    }
                    onChange={(e) =>
                      update(idx, {
                        [field as keyof EventSpeaker]: e.target.value,
                      })
                    }
                    placeholder={placeholder}
                    className={cn(
                      "w-full",
                      "mt-1",
                      "bg-muted",
                      "border",
                      "border-border",
                      "rounded-xl",
                      "px-3",
                      "py-2",
                      "text-xs",
                      "font-bold",
                      "outline-none",
                      "focus:border-primary",
                      "transition-colors",
                    )}
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label
                  className={cn(
                    "text-[10px]",
                    "font-black",
                    "uppercase",
                    "tracking-widest",
                    "text-slate-400",
                  )}
                >
                  Short Bio
                </label>
                <textarea
                  value={speaker.bio ?? ""}
                  onChange={(e) => update(idx, { bio: e.target.value })}
                  placeholder="One or two sentences about this speaker…"
                  rows={2}
                  className={cn(
                    "w-full",
                    "mt-1",
                    "bg-muted",
                    "border",
                    "border-border",
                    "rounded-xl",
                    "px-3",
                    "py-2",
                    "text-xs",
                    "font-medium",
                    "outline-none",
                    "focus:border-primary",
                    "transition-colors",
                    "resize-none",
                  )}
                />
              </div>
            </div>
          </div>
        );
      })}
      <button onClick={addBlank} className={cn("flex","items-center","justify-center","gap-2","w-full","py-3","border-2","border-dashed","border-border","rounded-2xl","text-[10px]","font-black","uppercase","tracking-widest","text-muted-foreground","hover:border-primary/50","hover:text-primary","transition-colors","cursor-pointer")}>
        <LuPlus className={cn('w-4', 'h-4')} /> Add Another Speaker
      </button>
    </div>
  );
}

// ── Sponsors sub-tab ──────────────────────────────────────────────────────────

function SponsorsTab({
  sponsors, onChange, ownerId,
}: {
  sponsors: EventSponsor[];
  onChange: (s: EventSponsor[]) => void;
  ownerId: string;
}) {
  const { token } = useAuth();
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  function addBlank() { onChange([...sponsors, { name: "", tier: "partner", website: "" }]); }
  function update(idx: number, patch: Partial<EventSponsor>) { onChange(sponsors.map((s, i) => i === idx ? { ...s, ...patch } : s)); }
  function remove(idx: number) { onChange(sponsors.filter((_, i) => i !== idx)); }

  async function handleLogoUpload(idx: number, file: File) {
    if (!token) return;
    setUploadingIdx(idx);
    const image = await uploadImageForEvent(file, "sponsor-logo", `${ownerId}-spn-${idx}`, token);
    if (image) update(idx, { logo: image });
    else toast.error("Logo upload failed");
    setUploadingIdx(null);
  }

  const TIER_COLORS: Record<SponsorTier, string> = {
    gold: "bg-amber-100 text-amber-700 border-amber-200",
    silver: "bg-slate-100 text-slate-600 border-slate-200",
    bronze: "bg-orange-100 text-orange-700 border-orange-200",
    partner: "bg-blue-100 text-blue-700 border-blue-200",
  };

  if (sponsors.length === 0) {
    return (
      <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'py-12', 'gap-4')}>
        <div className={cn('w-14', 'h-14', 'rounded-2xl', 'bg-muted', 'flex', 'items-center', 'justify-center')}><LuBuilding2 className={cn('w-6', 'h-6', 'text-muted-foreground')} /></div>
        <div className="text-center">
          <p className={cn('text-sm', 'font-black', 'text-foreground')}>No sponsors yet</p>
          <p className={cn('text-xs', 'text-muted-foreground', 'mt-1')}>Add sponsors and partners for this event</p>
        </div>
        <button onClick={addBlank} className={cn('flex', 'items-center', 'gap-2', 'px-5', 'py-2.5', 'bg-primary', 'text-primary-foreground', 'rounded-xl', 'text-xs', 'font-black', 'uppercase', 'tracking-widest', 'cursor-pointer', 'hover:opacity-90')}>
          <LuPlus className={cn('w-4', 'h-4')} /> Add Sponsor
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sponsors.map((sponsor, idx) => {
        const logoUrl = sponsor.logo?.imageUrl ?? sponsor.logoUrl ?? null;
        return (
          <div key={idx} className={cn('border', 'border-border', 'rounded-2xl', 'p-5', 'space-y-4', 'bg-background')}>
            <div className={cn('flex', 'items-center', 'justify-between')}>
              <div className={cn('flex', 'items-center', 'gap-3')}>
                <label className={cn('relative', 'cursor-pointer', 'group')}>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(idx, f); e.target.value = ""; }} />
                  <div className={cn('w-16', 'h-10', 'rounded-xl', 'overflow-hidden', 'bg-muted', 'border', 'border-border', 'flex', 'items-center', 'justify-center', 'relative')}>
                    {uploadingIdx === idx
                      ? <LuLoader className={cn('w-4', 'h-4', 'animate-spin', 'text-muted-foreground')} />
                      : logoUrl
                        ? <Image src={logoUrl} alt={sponsor.name} width={64} height={40} className={cn('object-contain', 'w-full', 'h-full', 'p-1')} />
                        : <LuBuilding2 className={cn('w-5', 'h-5', 'text-muted-foreground')} />
                    }
                    <div className={cn('absolute', 'inset-0', 'bg-black/40', 'opacity-0', 'group-hover:opacity-100', 'transition-opacity', 'rounded-xl', 'flex', 'items-center', 'justify-center')}>
                      <LuUpload className={cn('w-3', 'h-3', 'text-white')} />
                    </div>
                  </div>
                </label>
                <div>
                  <p className={cn('text-sm', 'font-bold', 'text-foreground')}>{sponsor.name || "Unnamed sponsor"}</p>
                  <span className={cn("text-[9px]","font-black","uppercase","tracking-wider","px-2","py-0.5","rounded-full","border", TIER_COLORS[sponsor.tier ?? "partner"])}>{sponsor.tier ?? "partner"}</span>
                </div>
              </div>
              <button onClick={() => remove(idx)} className={cn('p-2', 'hover:bg-red-50', 'hover:text-red-600', 'rounded-lg', 'transition-colors', 'text-muted-foreground', 'cursor-pointer')}><LuTrash2 className={cn('w-4', 'h-4')} /></button>
            </div>
            <div className={cn('grid', 'grid-cols-2', 'gap-3')}>
              <div>
                <label className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-400')}>Name *</label>
                <input type="text" value={sponsor.name} onChange={(e) => update(idx, { name: e.target.value })} placeholder="Sponsor name"
                  className={cn("w-full","mt-1","bg-muted","border","border-border","rounded-xl","px-3","py-2","text-xs","font-bold","outline-none","focus:border-primary","transition-colors")} />
              </div>
              <div>
                <label className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-400')}>Tier</label>
                <select value={sponsor.tier ?? "partner"} onChange={(e) => update(idx, { tier: e.target.value as SponsorTier })}
                  className={cn("w-full","mt-1","bg-muted","border","border-border","rounded-xl","px-3","py-2","text-xs","font-bold","outline-none","focus:border-primary","transition-colors")}>
                  {TIER_OPTIONS.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-400')}>Website URL</label>
                <input type="url" value={sponsor.website ?? ""} onChange={(e) => update(idx, { website: e.target.value })} placeholder="https://company.com"
                  className={cn("w-full","mt-1","bg-muted","border","border-border","rounded-xl","px-3","py-2","text-xs","font-bold","outline-none","focus:border-primary","transition-colors")} />
              </div>
            </div>
          </div>
        );
      })}
      <button onClick={addBlank} className={cn("flex","items-center","justify-center","gap-2","w-full","py-3","border-2","border-dashed","border-border","rounded-2xl","text-[10px]","font-black","uppercase","tracking-widest","text-muted-foreground","hover:border-primary/50","hover:text-primary","transition-colors","cursor-pointer")}>
        <LuPlus className={cn('w-4', 'h-4')} /> Add Another Sponsor
      </button>
    </div>
  );
}

// ── Schedule sub-tab (drag-and-drop) ──────────────────────────────────────────

const SCHEDULE_TYPE_COLORS: Record<ScheduleType, string> = {
  session:    "bg-primary/10 text-primary",
  break:      "bg-amber-100 text-amber-700",
  workshop:   "bg-emerald-100 text-emerald-700",
  keynote:    "bg-violet-100 text-violet-700",
  networking: "bg-sky-100 text-sky-700",
};

const SCHEDULE_TYPE_ICONS: Record<ScheduleType, React.ReactNode> = {
  session:    <LuCalendarClock className={cn('w-3.5', 'h-3.5')} />,
  break:      <LuCoffee className={cn('w-3.5', 'h-3.5')} />,
  workshop:   <LuWrench className={cn('w-3.5', 'h-3.5')} />,
  keynote:    <LuMic className={cn('w-3.5', 'h-3.5')} />,
  networking: <LuNetwork className={cn('w-3.5', 'h-3.5')} />,
};

function ScheduleTab({
  schedule, onChange,
}: {
  schedule: EventScheduleItem[];
  onChange: (s: EventScheduleItem[]) => void;
}) {
  const dragIdx = useRef<number | null>(null);
  const overIdx = useRef<number | null>(null);

  function addBlank() {
    onChange([...schedule, { time: "", title: "", type: "session", description: "", speaker: "" }]);
  }
  function update(idx: number, patch: Partial<EventScheduleItem>) {
    onChange(schedule.map((s, i) => i === idx ? { ...s, ...patch } : s));
  }
  function remove(idx: number) { onChange(schedule.filter((_, i) => i !== idx)); }

  const onDragStart = (idx: number) => { dragIdx.current = idx; };
  const onDragEnter = (idx: number) => { overIdx.current = idx; };
  const onDragEnd = () => {
    const from = dragIdx.current; const to = overIdx.current;
    if (from === null || to === null || from === to) { dragIdx.current = null; overIdx.current = null; return; }
    const arr = [...schedule];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    onChange(arr);
    dragIdx.current = null; overIdx.current = null;
  };

  if (schedule.length === 0) {
    return (
      <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'py-12', 'gap-4')}>
        <div className={cn('w-14', 'h-14', 'rounded-2xl', 'bg-muted', 'flex', 'items-center', 'justify-center')}><LuCalendarClock className={cn('w-6', 'h-6', 'text-muted-foreground')} /></div>
        <div className="text-center">
          <p className={cn('text-sm', 'font-black', 'text-foreground')}>No schedule items yet</p>
          <p className={cn('text-xs', 'text-muted-foreground', 'mt-1')}>Build the agenda — drag rows to reorder</p>
        </div>
        <button onClick={addBlank} className={cn('flex', 'items-center', 'gap-2', 'px-5', 'py-2.5', 'bg-primary', 'text-primary-foreground', 'rounded-xl', 'text-xs', 'font-black', 'uppercase', 'tracking-widest', 'cursor-pointer', 'hover:opacity-90')}>
          <LuPlus className={cn('w-4', 'h-4')} /> Add Item
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'flex', 'items-center', 'gap-1.5')}>
        <LuGripVertical className={cn('w-3.5', 'h-3.5')} /> Drag rows to reorder the agenda
      </p>
      {schedule.map((item, idx) => (
        <div key={idx} draggable onDragStart={() => onDragStart(idx)} onDragEnter={() => onDragEnter(idx)} onDragEnd={onDragEnd} onDragOver={(e) => e.preventDefault()}
          className={cn('border', 'border-border', 'rounded-2xl', 'p-4', 'bg-background', 'cursor-grab', 'active:cursor-grabbing', 'hover:shadow-md', 'transition-shadow')}>
          <div className={cn('flex', 'items-center', 'gap-3', 'mb-3')}>
            <LuGripVertical className={cn('w-4', 'h-4', 'text-muted-foreground', 'shrink-0')} />
            <div className={cn("flex","items-center","gap-1.5","px-2.5","py-1","rounded-lg","text-[10px]","font-black","uppercase","tracking-widest", SCHEDULE_TYPE_COLORS[item.type])}>
              {SCHEDULE_TYPE_ICONS[item.type]} {item.type}
            </div>
            <button onClick={() => remove(idx)} className={cn('ml-auto', 'p-1.5', 'hover:bg-red-50', 'hover:text-red-600', 'rounded-lg', 'transition-colors', 'text-muted-foreground', 'cursor-pointer')}>
              <LuTrash2 className={cn('w-3.5', 'h-3.5')} />
            </button>
          </div>
          <div className={cn('grid', 'grid-cols-2', 'gap-3')}>
            <div>
              <label className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-400')}>Time</label>
              <input type="time" value={item.time} onChange={(e) => update(idx, { time: e.target.value })}
                className={cn("w-full","mt-1","bg-muted","border","border-border","rounded-xl","px-3","py-2","text-xs","font-bold","outline-none","focus:border-primary","transition-colors")} />
            </div>
            <div>
              <label className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-400')}>Type</label>
              <select value={item.type} onChange={(e) => update(idx, { type: e.target.value as ScheduleType })}
                className={cn("w-full","mt-1","bg-muted","border","border-border","rounded-xl","px-3","py-2","text-xs","font-bold","outline-none","focus:border-primary","transition-colors")}>
                {SCHEDULE_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-400')}>Title *</label>
              <input type="text" value={item.title} onChange={(e) => update(idx, { title: e.target.value })} placeholder="e.g. Opening Keynote"
                className={cn("w-full","mt-1","bg-muted","border","border-border","rounded-xl","px-3","py-2","text-xs","font-bold","outline-none","focus:border-primary","transition-colors")} />
            </div>
            <div>
              <label className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-400')}>Speaker</label>
              <input type="text" value={item.speaker ?? ""} onChange={(e) => update(idx, { speaker: e.target.value })} placeholder="Speaker name"
                className={cn("w-full","mt-1","bg-muted","border","border-border","rounded-xl","px-3","py-2","text-xs","font-bold","outline-none","focus:border-primary","transition-colors")} />
            </div>
            <div>
              <label className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-400')}>Description</label>
              <input type="text" value={item.description ?? ""} onChange={(e) => update(idx, { description: e.target.value })} placeholder="Brief description"
                className={cn("w-full","mt-1","bg-muted","border","border-border","rounded-xl","px-3","py-2","text-xs","font-bold","outline-none","focus:border-primary","transition-colors")} />
            </div>
          </div>
        </div>
      ))}
      <button onClick={addBlank} className={cn("flex","items-center","justify-center","gap-2","w-full","py-3","border-2","border-dashed","border-border","rounded-2xl","text-[10px]","font-black","uppercase","tracking-widest","text-muted-foreground","hover:border-primary/50","hover:text-primary","transition-colors","cursor-pointer")}>
        <LuPlus className={cn('w-4', 'h-4')} /> Add Schedule Item
      </button>
    </div>
  );
}

// ── FAQs sub-tab ──────────────────────────────────────────────────────────────

function FAQsTab({
  faqs, onChange,
}: {
  faqs: EventFAQ[];
  onChange: (f: EventFAQ[]) => void;
}) {
  function addBlank() { onChange([...faqs, { question: "", answer: "" }]); }
  function update(idx: number, patch: Partial<EventFAQ>) { onChange(faqs.map((f, i) => i === idx ? { ...f, ...patch } : f)); }
  function remove(idx: number) { onChange(faqs.filter((_, i) => i !== idx)); }

  if (faqs.length === 0) {
    return (
      <div
        className={cn(
          "flex",
          "flex-col",
          "items-center",
          "justify-center",
          "py-12",
          "gap-4",
        )}
      >
        <div
          className={cn(
            "w-14",
            "h-14",
            "rounded-2xl",
            "bg-muted",
            "flex",
            "items-center",
            "justify-center",
          )}
        >
          <LuCircleHelp className={cn("w-6", "h-6", "text-muted-foreground")} />
        </div>
        <div className="text-center">
          <p className={cn("text-sm", "font-black", "text-foreground")}>
            No FAQs yet
          </p>
          <p className={cn("text-xs", "text-muted-foreground", "mt-1")}>
            Add common questions — falls back to platform defaults if empty
          </p>
        </div>
        <button
          onClick={addBlank}
          className={cn(
            "flex",
            "items-center",
            "gap-2",
            "px-5",
            "py-2.5",
            "bg-primary",
            "text-primary-foreground",
            "rounded-xl",
            "text-xs",
            "font-black",
            "uppercase",
            "tracking-widest",
            "cursor-pointer",
            "hover:opacity-90",
          )}
        >
          <LuPlus className={cn("w-4", "h-4")} /> Add FAQ
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {faqs.map((faq, idx) => (
        <div key={idx} className={cn('border', 'border-border', 'rounded-2xl', 'p-5', 'space-y-3', 'bg-background')}>
          <div className={cn('flex', 'items-center', 'justify-between')}>
            <span className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-muted-foreground', 'flex', 'items-center', 'gap-1.5')}>
              <LuCircleHelp className={cn('w-3.5', 'h-3.5')} /> FAQ {idx + 1}
            </span>
            <button onClick={() => remove(idx)} className={cn('p-1.5', 'hover:bg-red-50', 'hover:text-red-600', 'rounded-lg', 'transition-colors', 'text-muted-foreground', 'cursor-pointer')}>
              <LuTrash2 className={cn('w-3.5', 'h-3.5')} />
            </button>
          </div>
          <div>
            <label className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-400')}>Question *</label>
            <input type="text" value={faq.question} onChange={(e) => update(idx, { question: e.target.value })} placeholder="e.g. Where is the venue located?"
              className={cn("w-full","mt-1","bg-muted","border","border-border","rounded-xl","px-3","py-2","text-xs","font-bold","outline-none","focus:border-primary","transition-colors")} />
          </div>
          <div>
            <label className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-slate-400')}>Answer *</label>
            <textarea value={faq.answer} onChange={(e) => update(idx, { answer: e.target.value })} placeholder="The answer to this question…" rows={2}
              className={cn("w-full","mt-1","bg-muted","border","border-border","rounded-xl","px-3","py-2","text-xs","font-medium","outline-none","focus:border-primary","transition-colors","resize-none")} />
          </div>
        </div>
      ))}
      <button onClick={addBlank} className={cn("flex","items-center","justify-center","gap-2","w-full","py-3","border-2","border-dashed","border-border","rounded-2xl","text-[10px]","font-black","uppercase","tracking-widest","text-muted-foreground","hover:border-primary/50","hover:text-primary","transition-colors","cursor-pointer")}>
        <LuPlus className={cn('w-4', 'h-4')} /> Add Another FAQ
      </button>
    </div>
  );
}

// ── ContentStep wrapper ───────────────────────────────────────────────────────

const ContentStep: React.FC<StepProps & { ownerId: string }> = ({
  formData, setFormData, ownerId,
}) => {
  const [activeTab, setActiveTab] = useState<ContentTab>("speakers");

  const TABS: {
    key: ContentTab;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    {
      key: "speakers",
      label: "Speakers",
      icon: <LuMic className={cn("w-4", "h-4")} />,
      count: formData.speakers.length,
    },
    {
      key: "sponsors",
      label: "Sponsors",
      icon: <LuBuilding2 className={cn("w-4", "h-4")} />,
      count: formData.sponsors.length,
    },
    {
      key: "schedule",
      label: "Schedule",
      icon: <LuCalendarClock className={cn("w-4", "h-4")} />,
      count: formData.schedule.length,
    },
    {
      key: "faqs",
      label: "FAQs",
      icon: <LuCircleHelp className={cn("w-4", "h-4")} />,
      count: formData.faqs.length,
    },
  ];

  return (
    <div className="space-y-6">
      <div className={cn('flex', 'gap-2', 'border-b', 'border-border', 'pb-4', 'flex-wrap')}>
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn("flex","items-center","gap-2","px-4","py-2","rounded-xl","text-xs","font-black","uppercase","tracking-widest","transition-all","cursor-pointer", activeTab === tab.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            {tab.icon} {tab.label}
            {tab.count > 0 && (
              <span className={cn("ml-0.5","w-5","h-5","rounded-full","flex","items-center","justify-center","text-[9px]","font-black", activeTab === tab.key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground")}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {activeTab === "speakers" && <SpeakersTab speakers={formData.speakers} onChange={(s) => setFormData((p) => ({ ...p, speakers: s }))} ownerId={ownerId} />}
          {activeTab === "sponsors" && <SponsorsTab sponsors={formData.sponsors} onChange={(s) => setFormData((p) => ({ ...p, sponsors: s }))} ownerId={ownerId} />}
          {activeTab === "schedule" && <ScheduleTab schedule={formData.schedule} onChange={(s) => setFormData((p) => ({ ...p, schedule: s }))} />}
          {activeTab === "faqs"     && <FAQsTab     faqs={formData.faqs}         onChange={(f) => setFormData((p) => ({ ...p, faqs: f }))} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — REVIEW
// ─────────────────────────────────────────────────────────────────────────────

const ReviewStep: React.FC<StepProps & { isEditing?: boolean; isRepublishing?: boolean }> = ({
  formData, setFormData, isEditing, isRepublishing,
}) => (
  <div className="space-y-6">
    {isRepublishing && (
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className={cn('flex', 'items-start', 'gap-4', 'p-5', 'rounded-2xl', 'bg-emerald-50', 'border', 'border-emerald-200')}>
        <LuRefreshCcw className={cn('w-5', 'h-5', 'text-emerald-600', 'shrink-0', 'mt-0.5')} />
        <div>
          <p className={cn('text-[11px]', 'font-black', 'uppercase', 'tracking-widest', 'text-emerald-700')}>Republishing a cancelled event</p>
          <p className={cn('text-[10px]', 'font-medium', 'text-emerald-600', 'mt-1', 'leading-relaxed')}>
            Selecting <strong>Public</strong> will make this event live again immediately.
          </p>
        </div>
      </motion.div>
    )}

    {isEditing && !isRepublishing && formData.visibility === "Invite-Only" && (
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className={cn('flex', 'items-start', 'gap-4', 'p-5', 'rounded-2xl', 'bg-amber-50', 'border', 'border-amber-200')}>
        <LuTriangleAlert className={cn('w-5', 'h-5', 'text-amber-600', 'shrink-0', 'mt-0.5')} />
        <div>
          <p className={cn('text-[11px]', 'font-black', 'uppercase', 'tracking-widest', 'text-amber-700')}>Saving as draft</p>
          <p className={cn('text-[10px]', 'font-medium', 'text-amber-600', 'mt-1')}>This event will be hidden from public listing.</p>
        </div>
      </motion.div>
    )}

    {/* Status card */}
    <div className={cn("p-8","rounded-[2.5rem]","border","text-center", isRepublishing ? "bg-emerald-50/50 border-emerald-200" : "bg-primary/10 border-primary/20")}>
      <div className={cn("w-16","h-16","rounded-2xl","flex","items-center","justify-center","mx-auto","mb-6","shadow-xl", isRepublishing ? "bg-emerald-500 shadow-emerald-500/20" : "bg-primary shadow-primary/20")}>
        {isRepublishing
          ? <LuRefreshCcw className={cn('w-8', 'h-8', 'text-white')} />
          : isEditing ? <LuPencil className={cn('w-8', 'h-8', 'text-foreground')} /> : <LuCircleCheck className={cn('w-8', 'h-8', 'text-foreground')} />
        }
      </div>
      <h3 className={cn('text-xl', 'font-black', 'text-foreground', 'uppercase', 'tracking-tighter')}>
        {isRepublishing ? "Ready to Republish" : isEditing ? "Ready to Save" : "Ready for Deployment"}
      </h3>
    </div>

    {/* Summary grid */}
    <div className={cn('grid', 'grid-cols-2', 'sm:grid-cols-3', 'gap-3', 'text-[10px]', 'font-black', 'uppercase', 'tracking-widest')}>
      {[
        { label: "Title",      value: formData.title || "—" },
        { label: "Category",   value: formData.category },
        { label: "Format",     value: formData.format },
        { label: "Date",       value: formData.eventDate ? formData.eventDate.split("T")[0] : "—" },
        { label: "Capacity",   value: String(formData.maxCapacity) },
        { label: "Ticket",     value: formData.ticketPrice === 0 ? "Free" : `₦${formData.ticketPrice}` },
        { label: "Audience",   value: formData.targetEduStatus === "ALL" ? "Everyone" : formData.targetEduStatus === "STUDENT" ? "Students" : "Graduates" },
        { label: "Speakers",   value: formData.speakers.length > 0 ? `${formData.speakers.length} added` : "None" },
        { label: "Schedule",   value: formData.schedule.length > 0 ? `${formData.schedule.length} items` : "None" },
        { label: "Sponsors",   value: formData.sponsors.length > 0 ? `${formData.sponsors.length} added` : "None" },
        { label: "FAQs",       value: formData.faqs.length > 0 ? `${formData.faqs.length} added` : "Platform default" },
        { label: "Outcomes",   value: formData.learningOutcomes.length > 0 ? `${formData.learningOutcomes.length} listed` : "None" },
      ].map(({ label, value }) => (
        <div key={label} className={cn('p-4', 'rounded-2xl', 'bg-muted', 'border', 'border-border')}>
          <p className={cn('text-muted-foreground', 'text-[9px]', 'mb-1')}>{label}</p>
          <p className={cn('text-foreground', 'truncate')}>{value}</p>
        </div>
      ))}
    </div>

    {/* Pending skills notice */}
    {formData.pendingSkills.length > 0 && (
      <div className={cn('flex', 'items-start', 'gap-3', 'p-4', 'bg-amber-50', 'border', 'border-amber-200', 'rounded-2xl')}>
        <LuStar className={cn('w-4', 'h-4', 'text-amber-600', 'shrink-0', 'mt-0.5')} />
        <div>
          <p className={cn('text-[11px]', 'font-black', 'uppercase', 'tracking-widest', 'text-amber-700')}>Pending skill suggestions</p>
          <p className={cn('text-[10px]', 'text-amber-600', 'mt-1')}>
            {formData.pendingSkills.join(", ")} — submitted for webmaster review. The event will save with these noted.
          </p>
        </div>
      </div>
    )}

    {/* Visibility picker */}
    <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-4')}>
      {(["Public","Invite-Only"] as const).map((visibility) => (
        <button key={visibility} onClick={() => setFormData((p) => ({ ...p, visibility }))}
          className={cn("p-6","rounded-2xl","border-2","flex","items-center","justify-between","transition-all", formData.visibility === visibility ? "bg-muted border-foreground" : "bg-background border-border opacity-50")}>
          <div className="text-left">
            <span className={cn("font-black","uppercase","tracking-widest","text-sm","block", formData.visibility === visibility ? "text-foreground" : "text-slate-400")}>{visibility}</span>
            <span className={cn('text-[9px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-0.5', 'block')}>
              {visibility === "Public"
                ? isRepublishing ? "Make live again" : "Visible to everyone"
                : "Save as hidden draft"}
            </span>
          </div>
          {visibility === "Public" ? <LuEye className={cn('w-4', 'h-4', 'text-muted-foreground')} /> : <LuShield className={cn('w-4', 'h-4', 'text-muted-foreground')} />}
        </button>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MODAL ROOT
// ─────────────────────────────────────────────────────────────────────────────

export const AdminEventModal: React.FC<EventModalProps> = ({
  isOpen, onClose, onSuccess, eventId, initialData,
}) => {
  const { token } = useAuth();
  const { createEvent } = useAdmin();

  const isEditing      = Boolean(eventId);
  const isRepublishing = isEditing && initialData?._originalStatus === "cancelled";

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [submitting,  setSubmitting]  = useState(false);

  // ── Map initialData into full EventFormData ───────────────────────────────
  function buildFormFromInitial(init: Partial<EventFormData>): EventFormData {
    return {
      ...DEFAULT_FORM,
      ...init,
      // Arrays — ensure they default to [] if init doesn't have them
      tags:             init.tags             ?? [],
      learningOutcomes: init.learningOutcomes ?? [],
      requiredSkills:   init.requiredSkills   ?? [],
      pendingSkills:    [],
      speakers:         (init as EventFormData).speakers ?? [],
      sponsors:         (init as EventFormData).sponsors ?? [],
      schedule:         (init as EventFormData).schedule ?? [],
      faqs:             (init as EventFormData).faqs     ?? [],
      // String fields with defaults
      tagInput:         "",
      outcomeInput:     "",
      slugManuallyEdited: Boolean(init.slug),
    };
  }

  const [formData, setFormData] = useState<EventFormData>(
    () => buildFormFromInitial(initialData ?? {}),
  );

  useEffect(() => {
    if (isOpen) {
      setFormData(buildFormFromInitial(initialData ?? {}));
      setCurrentStep(1);
    }
  }, [isOpen, eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const nextStep = () => setCurrentStep((p) => Math.min(p + 1, 5) as WizardStep);
  const prevStep = () => setCurrentStep((p) => Math.max(p - 1, 1) as WizardStep);

  const ownerId = formData.slug || eventId || "new-event";

  // ── Build API payload from form state ─────────────────────────────────────
  function buildPayload() {
    return {
      title:                formData.title.trim(),
      slug:                 formData.slug.trim(),
      overview:             formData.overview,
      shortDescription:     formData.shortDescription,
      description:          formData.description,
      category:             formData.category,
      tags:                 formData.tags,
      level:                formData.level || undefined,
      format:               formData.format.toLowerCase() as "physical" | "virtual" | "hybrid",
      eventDate:            localDatetimeToIso(formData.eventDate),
      endDate:              formData.endDate ? localDatetimeToIso(formData.endDate) : undefined,
      duration:             formData.duration || undefined,
      registrationDeadline: localDatetimeToIso(formData.registrationDeadline),
      location: {
        venue:   formData.venue,
        address: formData.address,
        city:    formData.city,
        state:   formData.state,
        country: formData.country,
      },
      locationScope:     formData.locationScope,
      targetEduStatus:   formData.targetEduStatus,
      requiredSkills:    formData.requiredSkills,
      learningOutcomes:  formData.learningOutcomes,
      instructor:        formData.instructor || undefined,
      capacity:          formData.maxCapacity,
      ticketPrice:       formData.ticketPrice,
      speakers:          formData.speakers,
      sponsors:          formData.sponsors,
      schedule:          formData.schedule,
      faqs:              formData.faqs,
      status:            formData.visibility === "Public" ? "published" : "draft",
    };
  }

  function validate(): string | null {
    if (!formData.title.trim())            return "Event title is required";
    if (!formData.slug.trim())             return "URL slug is required";
    if (!formData.eventDate)               return "Event date is required";
    if (!formData.registrationDeadline)    return "Registration deadline is required";
    if (!formData.shortDescription.trim()) return "Short description is required";
    if (!formData.overview.trim())         return "Overview is required";
    return null;
  }

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!token) return;
    const err = validate();
    if (err) { toast.error(err); return; }
    setSubmitting(true);
    try {
      await createEvent(buildPayload(), token);
      if (formData.bannerBlob) await uploadBanner(formData.bannerBlob, formData.slug, token);
      toast.success("Event created successfully!");
      handleClose(); onSuccess?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create event");
    } finally { setSubmitting(false); }
  };

  // ── Update ────────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!token || !eventId) return;
    const err = validate();
    if (err) { toast.error(err); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update event");
      }
      if (formData.bannerBlob) await uploadBanner(formData.bannerBlob, formData.slug, token);
      toast.success(isRepublishing ? "Event republished!" : "Event updated!");
      handleClose(); onSuccess?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update event");
    } finally { setSubmitting(false); }
  };

  const handleSubmit = isEditing ? handleUpdate : handleCreate;

  const handleClose = () => {
    setFormData(DEFAULT_FORM);
    setCurrentStep(1);
    onClose();
  };

  const submitLabel = () => {
    if (submitting) return isRepublishing ? "Republishing…" : isEditing ? "Saving…" : "Creating…";
    return isRepublishing ? "Republish Event" : isEditing ? "Save Changes" : "Deploy Event";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={cn('fixed', 'inset-0', 'z-[100]', 'flex', 'items-center', 'justify-center', 'p-4')}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose} className={cn('absolute', 'inset-0', 'bg-foreground/80', 'backdrop-blur-md')} />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn('relative', 'w-full', 'max-w-4xl', 'bg-background', 'rounded-[3rem]', 'shadow-2xl', 'overflow-hidden', 'flex', 'flex-col', 'max-h-[90vh]')}
          >
            {/* Header */}
            <div className={cn('px-10', 'py-7', 'border-b', 'border-border', 'flex', 'items-center', 'justify-between', 'bg-background', 'sticky', 'top-0', 'z-10')}>
              <div>
                <h2 className={cn('text-2xl', 'font-black', 'text-foreground', 'tracking-tighter', 'uppercase', 'flex', 'items-center', 'gap-3')}>
                  {isRepublishing && <span className={cn('inline-flex', 'items-center', 'justify-center', 'w-8', 'h-8', 'rounded-xl', 'bg-emerald-500/10', 'text-emerald-600')}><LuRefreshCcw className={cn('w-4', 'h-4')} /></span>}
                  {!isRepublishing && isEditing && <span className={cn('inline-flex', 'items-center', 'justify-center', 'w-8', 'h-8', 'rounded-xl', 'bg-primary/10', 'text-primary')}><LuPencil className={cn('w-4', 'h-4')} /></span>}
                  {isRepublishing ? "Republish Event" : isEditing ? "Edit Event" : "Create New Event"}
                </h2>
                <p className={cn('text-[10px]', 'font-bold', 'text-muted-foreground', 'uppercase', 'tracking-widest', 'mt-1')}>
                  Step {currentStep} of 5 — {STEPS[currentStep - 1].label}
                  {isRepublishing && <span className={cn('ml-2', 'text-emerald-600')}>· Republishing</span>}
                  {isEditing && !isRepublishing && <span className={cn('ml-2', 'text-primary')}>· Editing</span>}
                </p>
              </div>
              <button onClick={handleClose} className={cn('p-3', 'hover:bg-muted', 'rounded-2xl', 'text-muted-foreground', 'transition-colors', 'cursor-pointer')}>
                <LuX className={cn('w-6', 'h-6')} />
              </button>
            </div>

            {/* Step indicator */}
            <div className={cn('px-10', 'py-5', 'bg-muted/50', 'flex', 'items-center', 'justify-between', 'border-b', 'border-border')}>
              {STEPS.map((step) => (
                <React.Fragment key={step.id}>
                  <div className={cn('flex', 'items-center', 'gap-2.5')}>
                    <div className={cn("w-8","h-8","rounded-lg","flex","items-center","justify-center","text-[10px]","font-black","transition-all","duration-300", currentStep >= step.id ? "bg-primary text-foreground shadow-lg shadow-primary/20" : "bg-slate-200 text-muted-foreground")}>
                      {currentStep > step.id ? <LuCheck className={cn('w-4', 'h-4')} /> : step.id}
                    </div>
                    <span className={cn("text-[9px]","font-black","uppercase","tracking-widest","hidden","md:block","transition-colors", currentStep >= step.id ? "text-foreground" : "text-slate-300")}>
                      {step.label}
                    </span>
                  </div>
                  {step.id !== 5 && (
                    <div className={cn("h-[2px]","w-8","mx-2","hidden","lg:block", currentStep > step.id ? "bg-primary" : "bg-muted")} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Content */}
            <div className={cn('flex-1', 'overflow-y-auto', 'p-10')}>
              <AnimatePresence mode="wait">
                <motion.div key={currentStep} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
                  {currentStep === 1 && <IdentityStep  formData={formData} setFormData={setFormData} ownerId={ownerId} />}
                  {currentStep === 2 && <LogisticsStep formData={formData} setFormData={setFormData} />}
                  {currentStep === 3 && <AudienceStep  formData={formData} setFormData={setFormData} />}
                  {currentStep === 4 && <ContentStep   formData={formData} setFormData={setFormData} ownerId={ownerId} />}
                  {currentStep === 5 && <ReviewStep    formData={formData} setFormData={setFormData} isEditing={isEditing} isRepublishing={isRepublishing} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className={cn('px-10', 'py-7', 'border-t', 'border-border', 'flex', 'items-center', 'justify-between', 'bg-background', 'sticky', 'bottom-0', 'z-10')}>
              <button onClick={prevStep} disabled={currentStep === 1}
                className={cn("flex","items-center","gap-2","px-6","py-3","rounded-xl","text-[10px]","font-black","uppercase","tracking-widest","transition-all", currentStep === 1 ? "opacity-0 pointer-events-none" : "text-muted-foreground hover:text-foreground cursor-pointer")}>
                <LuChevronLeft className={cn('w-4', 'h-4')} /> Previous
              </button>
              <div className={cn('flex', 'items-center', 'gap-4')}>
                <button onClick={handleClose} className={cn('text-[10px]', 'font-black', 'uppercase', 'tracking-widest', 'text-rose-500', 'px-6', 'cursor-pointer')}>
                  Cancel
                </button>
                {currentStep < 5 ? (
                  <button onClick={nextStep} className={cn("flex","items-center","gap-2","px-8","py-4","bg-foreground","text-background","rounded-2xl","text-[11px]","font-black","uppercase","tracking-widest","hover:bg-primary","hover:text-foreground","transition-colors","shadow-xl","shadow-foreground/10","cursor-pointer")}>
                    Continue <LuChevronRight className={cn('w-4', 'h-4')} />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting}
                    className={cn("flex","items-center","gap-2","px-8","py-4","rounded-2xl","text-[11px]","font-black","uppercase","tracking-widest","transition-all","shadow-xl","disabled:opacity-60","cursor-pointer", isRepublishing ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-primary text-foreground shadow-primary/20")}>
                    {submitting ? <LuLoader className={cn('w-4', 'h-4', 'animate-spin')} /> : isRepublishing ? <LuRefreshCcw className={cn('w-4', 'h-4')} /> : <LuCheck className={cn('w-4', 'h-4')} />}
                    {submitLabel()}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export type { EventModalProps, EventFormData };