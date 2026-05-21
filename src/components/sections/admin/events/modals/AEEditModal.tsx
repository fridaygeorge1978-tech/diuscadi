"use client";
// modals/AEEditModal.tsx
// Handles BOTH creating a new event (no initialData / no eventId) and
// editing an existing one (initialData + eventId supplied by the parent).

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  LuExternalLink,
  LuUpload,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import Image from "next/image";
import type { CloudinaryImage } from "@/types/cloudinary";
import type {
  EventSpeaker,
  EventSponsor,
  EventScheduleItem,
} from "@/lib/models/Events";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  eventId?: string;
  initialData?: Partial<EventFormData>;
}

interface EventFormData {
  title: string;
  category: string;
  description: string;
  date: string;
  startTime: string;
  duration: number;
  type: "Physical" | "Virtual" | "Hybrid";
  venueName: string;
  coordinates: { lat: string; lng: string };
  maxCapacity: number;
  ticketPrice: number;
  enableWaitlist: boolean;
  registrationDeadline: string;
  visibility: "Public" | "Invite-Only";
  bannerBlob: Blob | null;
  bannerPreviewUrl: string | null;
  _originalStatus?: string;
  // Rich content — managed in Step 4
  speakers: EventSpeaker[];
  sponsors: EventSponsor[];
  schedule: EventScheduleItem[];
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

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
  { id: 1, label: "Basic Info", icon: LuInfo },
  { id: 2, label: "Schedule", icon: LuMapPin },
  { id: 3, label: "Capacity", icon: LuUsers },
  { id: 4, label: "Content", icon: LuMic },
  { id: 5, label: "Review", icon: LuShield },
];

const DEFAULT_FORM: EventFormData = {
  title: "",
  category: "Technology",
  description: "",
  date: "",
  startTime: "",
  duration: 2,
  type: "Physical",
  venueName: "",
  coordinates: { lat: "", lng: "" },
  maxCapacity: 100,
  ticketPrice: 0,
  enableWaitlist: false,
  registrationDeadline: "",
  visibility: "Public",
  bannerBlob: null,
  bannerPreviewUrl: null,
  _originalStatus: undefined,
  speakers: [],
  sponsors: [],
  schedule: [],
};

// ── Timezone helpers ──────────────────────────────────────────────────────────

function localDatetimeToIso(value: string): string {
  if (!value) return "";
  return new Date(`${value}:00+01:00`).toISOString();
}

function isoToLocalDatetime(iso: string): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

// ── Auth helpers (used inside upload functions) ───────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("diuscadi_token");
}

// ── Cloudinary upload helper (used for speaker photos + sponsor logos) ────────

async function uploadImageForEvent(
  file: File,
  uploadType: "speaker-photo" | "sponsor-logo",
  ownerId: string,
  token: string,
): Promise<CloudinaryImage | null> {
  try {
    const signRes = await fetch("/api/media/sign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        uploadType,
        ownerId,
        asset_id: uploadData.asset_id,
        public_id: uploadData.public_id,
        secure_url: uploadData.secure_url,
        signature: uploadData.signature,
        timestamp: uploadData.timestamp ?? params.timestamp,
        format: uploadData.format,
        bytes: uploadData.bytes,
        width: uploadData.width,
        height: uploadData.height,
        created_at: uploadData.created_at,
        etag: uploadData.etag ?? "",
      }),
    });
    if (!confirmRes.ok) return null;
    const { image } = await confirmRes.json();
    return image as CloudinaryImage;
  } catch {
    return null;
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export const AdminEventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  eventId,
  initialData,
}) => {
  const { token } = useAuth();
  const { createEvent } = useAdmin();

  const isEditing = Boolean(eventId);
  const isRepublishing =
    isEditing && initialData?._originalStatus === "cancelled";

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    ...DEFAULT_FORM,
    ...initialData,
    speakers: (initialData as EventFormData | undefined)?.speakers ?? [],
    sponsors: (initialData as EventFormData | undefined)?.sponsors ?? [],
    schedule: (initialData as EventFormData | undefined)?.schedule ?? [],
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...DEFAULT_FORM,
        ...(initialData ?? {}),
        speakers: (initialData as EventFormData | undefined)?.speakers ?? [],
        sponsors: (initialData as EventFormData | undefined)?.sponsors ?? [],
        schedule: (initialData as EventFormData | undefined)?.schedule ?? [],
      });
      setCurrentStep(1);
    }
  }, [isOpen, eventId, initialData]);

  if (!isOpen) return null;

  const nextStep = () =>
    setCurrentStep((p) => Math.min(p + 1, 5) as WizardStep);
  const prevStep = () =>
    setCurrentStep((p) => Math.max(p - 1, 1) as WizardStep);

  // ── Create ──────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!token) return;
    if (
      !formData.title.trim() ||
      !formData.date ||
      !formData.registrationDeadline
    ) {
      toast.error("Title, date and registration deadline are required");
      return;
    }
    setSubmitting(true);
    try {
      const eventDateIso = formData.startTime
        ? localDatetimeToIso(`${formData.date}T${formData.startTime}`)
        : new Date(`${formData.date}T00:00:00+01:00`).toISOString();

      const slug = formData.title
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      await createEvent(
        {
          title: formData.title.trim(),
          slug,
          overview: formData.description,
          category: formData.category,
          format: formData.type.toLowerCase() as
            | "physical"
            | "virtual"
            | "hybrid",
          eventDate: eventDateIso,
          registrationDeadline: localDatetimeToIso(
            formData.registrationDeadline,
          ),
          capacity: formData.maxCapacity,
          ticketPrice: formData.ticketPrice,
          locationScope: formData.type === "Virtual" ? "online" : "local",
          location: formData.venueName
            ? { venue: formData.venueName }
            : undefined,
          status: formData.visibility === "Public" ? "published" : "draft",
        },
        token,
      );

      if (formData.bannerBlob)
        await uploadBanner(formData.bannerBlob, slug, token);

      toast.success("Event created successfully!");
      handleClose();
      onSuccess?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create event",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Update ──────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!token || !eventId) return;
    if (
      !formData.title.trim() ||
      !formData.date ||
      !formData.registrationDeadline
    ) {
      toast.error("Title, date and registration deadline are required");
      return;
    }
    setSubmitting(true);
    try {
      const eventDateIso = formData.startTime
        ? localDatetimeToIso(`${formData.date}T${formData.startTime}`)
        : new Date(`${formData.date}T00:00:00+01:00`).toISOString();

      const slug = formData.title
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          slug,
          description: formData.description,
          category: formData.category,
          format: formData.type.toLowerCase(),
          eventDate: eventDateIso,
          registrationDeadline: localDatetimeToIso(
            formData.registrationDeadline,
          ),
          capacity: formData.maxCapacity,
          location: formData.venueName
            ? { venue: formData.venueName }
            : undefined,
          status: formData.visibility === "Public" ? "published" : "draft",
          // Rich content arrays — always sent so they overwrite cleanly
          speakers: formData.speakers,
          sponsors: formData.sponsors,
          schedule: formData.schedule,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update event");
      }

      if (formData.bannerBlob)
        await uploadBanner(formData.bannerBlob, slug, token);

      toast.success(
        isRepublishing
          ? "Event republished successfully!"
          : "Event updated successfully!",
      );
      handleClose();
      onSuccess?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update event",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = isEditing ? handleUpdate : handleCreate;

  const handleClose = () => {
    setFormData(DEFAULT_FORM);
    setCurrentStep(1);
    onClose();
  };

  const submitLabel = () => {
    if (submitting) {
      if (isRepublishing) return "Republishing…";
      if (isEditing) return "Saving…";
      return "Creating…";
    }
    if (isRepublishing) return "Republish Event";
    if (isEditing) return "Save Changes";
    return "Deploy Event";
  };

  const ownerId = formData.title.trim()
    ? formData.title
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
    : (eventId ?? "new-event");

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "fixed",
            "inset-0",
            "z-[100]",
            "flex",
            "items-center",
            "justify-center",
            "p-4",
          )}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className={cn(
              "absolute",
              "inset-0",
              "bg-foreground/80",
              "backdrop-blur-md",
            )}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative",
              "w-full",
              "max-w-4xl",
              "bg-background",
              "rounded-[3rem]",
              "shadow-2xl",
              "overflow-hidden",
              "flex",
              "flex-col",
              "max-h-[90vh]",
            )}
          >
            {/* Header */}
            <div
              className={cn(
                "px-10",
                "py-8",
                "border-b",
                "border-border",
                "flex",
                "items-center",
                "justify-between",
                "bg-background",
                "sticky",
                "top-0",
                "z-10",
              )}
            >
              <div>
                <h2
                  className={cn(
                    "text-2xl",
                    "font-black",
                    "text-foreground",
                    "tracking-tighter",
                    "uppercase",
                    "flex",
                    "items-center",
                    "gap-3",
                  )}
                >
                  {isRepublishing && (
                    <span
                      className={cn(
                        "inline-flex",
                        "items-center",
                        "justify-center",
                        "w-8",
                        "h-8",
                        "rounded-xl",
                        "bg-emerald-500/10",
                        "text-emerald-600",
                      )}
                    >
                      <LuRefreshCcw className="w-4 h-4" />
                    </span>
                  )}
                  {!isRepublishing && isEditing && (
                    <span
                      className={cn(
                        "inline-flex",
                        "items-center",
                        "justify-center",
                        "w-8",
                        "h-8",
                        "rounded-xl",
                        "bg-primary/10",
                        "text-primary",
                      )}
                    >
                      <LuPencil className="w-4 h-4" />
                    </span>
                  )}
                  {currentStep === 5
                    ? isRepublishing
                      ? "Republish Event"
                      : isEditing
                        ? "Save Changes"
                        : "Finalize Event"
                    : isRepublishing
                      ? "Republish Event"
                      : isEditing
                        ? "Edit Event"
                        : "Create New Event"}
                </h2>
                <p
                  className={cn(
                    "text-[10px]",
                    "font-bold",
                    "text-muted-foreground",
                    "uppercase",
                    "tracking-widest",
                    "mt-1",
                  )}
                >
                  Step {currentStep} of 5 — {STEPS[currentStep - 1].label}
                  {isRepublishing && (
                    <span className="ml-2 text-emerald-600">
                      · Republishing cancelled event
                    </span>
                  )}
                  {isEditing && !isRepublishing && (
                    <span className="ml-2 text-primary">
                      · Editing existing event
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={handleClose}
                className={cn(
                  "p-3",
                  "hover:bg-muted",
                  "rounded-2xl",
                  "text-muted-foreground",
                  "transition-colors",
                )}
              >
                <LuX className="w-6 h-6" />
              </button>
            </div>

            {/* Step indicator */}
            <div
              className={cn(
                "px-10",
                "py-6",
                "bg-muted/50",
                "flex",
                "items-center",
                "justify-between",
                "border-b",
                "border-border",
              )}
            >
              {STEPS.map((step) => (
                <React.Fragment key={step.id}>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8",
                        "h-8",
                        "rounded-lg",
                        "flex",
                        "items-center",
                        "justify-center",
                        "text-[10px]",
                        "font-black",
                        "transition-all",
                        "duration-300",
                        currentStep >= step.id
                          ? "bg-primary text-foreground shadow-lg shadow-primary/20"
                          : "bg-slate-200 text-muted-foreground",
                      )}
                    >
                      {currentStep > step.id ? (
                        <LuCheck className="w-4 h-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[9px]",
                        "font-black",
                        "uppercase",
                        "tracking-widest",
                        "hidden",
                        "md:block",
                        "transition-colors",
                        currentStep >= step.id
                          ? "text-foreground"
                          : "text-slate-300",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {step.id !== 5 && (
                    <div
                      className={cn(
                        "h-[2px]",
                        "w-8",
                        "mx-2",
                        "hidden",
                        "lg:block",
                        currentStep > step.id ? "bg-primary" : "bg-muted",
                      )}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Content */}
            <div className={cn("flex-1", "overflow-y-auto", "p-10")}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 1 && (
                    <BasicInfoStep
                      formData={formData}
                      setFormData={setFormData}
                      ownerId={ownerId}
                    />
                  )}
                  {currentStep === 2 && (
                    <ScheduleStep
                      formData={formData}
                      setFormData={setFormData}
                    />
                  )}
                  {currentStep === 3 && (
                    <CapacityStep
                      formData={formData}
                      setFormData={setFormData}
                    />
                  )}
                  {currentStep === 4 && (
                    <ContentStep
                      formData={formData}
                      setFormData={setFormData}
                      ownerId={ownerId}
                    />
                  )}
                  {currentStep === 5 && (
                    <PublishStep
                      formData={formData}
                      setFormData={setFormData}
                      isEditing={isEditing}
                      isRepublishing={isRepublishing}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div
              className={cn(
                "px-10",
                "py-8",
                "border-t",
                "border-border",
                "flex",
                "items-center",
                "justify-between",
                "bg-background",
                "sticky",
                "bottom-0",
                "z-10",
              )}
            >
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={cn(
                  "flex",
                  "items-center",
                  "gap-2",
                  "px-6",
                  "py-3",
                  "rounded-xl",
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "transition-all",
                  currentStep === 1
                    ? "opacity-0 pointer-events-none"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LuChevronLeft className="w-4 h-4" /> Previous
              </button>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleClose}
                  className={cn(
                    "text-[10px]",
                    "font-black",
                    "uppercase",
                    "tracking-widest",
                    "text-rose-500",
                    "px-6",
                  )}
                >
                  Cancel
                </button>
                {currentStep < 5 ? (
                  <button
                    onClick={nextStep}
                    className={cn(
                      "flex",
                      "items-center",
                      "gap-2",
                      "px-8",
                      "py-4",
                      "bg-foreground",
                      "text-background",
                      "rounded-2xl",
                      "text-[11px]",
                      "font-black",
                      "uppercase",
                      "tracking-widest",
                      "hover:bg-primary",
                      "hover:text-foreground",
                      "transition-colors",
                      "shadow-xl",
                      "shadow-foreground/10",
                    )}
                  >
                    Continue <LuChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={cn(
                      "flex",
                      "items-center",
                      "gap-2",
                      "px-8",
                      "py-4",
                      "rounded-2xl",
                      "text-[11px]",
                      "font-black",
                      "uppercase",
                      "tracking-widest",
                      "transition-all",
                      "shadow-xl",
                      "disabled:opacity-60",
                      isRepublishing
                        ? "bg-emerald-500 text-white shadow-emerald-500/20"
                        : "bg-primary text-foreground shadow-primary/20",
                    )}
                  >
                    {submitting ? (
                      <LuLoader className="w-4 h-4 animate-spin" />
                    ) : isRepublishing ? (
                      <LuRefreshCcw className="w-4 h-4" />
                    ) : (
                      <LuCheck className="w-4 h-4" />
                    )}
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

// ── Banner upload helper ──────────────────────────────────────────────────────

async function uploadBanner(blob: Blob, slug: string, token: string) {
  try {
    const res = await fetch("/api/media/sign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ uploadType: "event-banner", ownerId: slug }),
    });
    if (!res.ok) return;
    const params = await res.json();

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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        uploadType: "event-banner",
        ownerId: slug,
        asset_id: uploadData.asset_id,
        public_id: uploadData.public_id,
        secure_url: uploadData.secure_url,
        signature: uploadData.signature,
        timestamp: uploadData.timestamp ?? params.timestamp,
        format: uploadData.format,
        bytes: uploadData.bytes,
        width: uploadData.width,
        height: uploadData.height,
        created_at: uploadData.created_at,
        etag: uploadData.etag ?? "",
      }),
    });
  } catch {
    console.warn("[AEEditModal] Banner upload failed");
    toast.error(
      "Banner upload failed — you can update it from the event edit page.",
    );
  }
}

// ── Shared sub-components ─────────────────────────────────────────────────────

interface InputGroupProps {
  label: string;
  icon: IconType;
  dark?: boolean;
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputGroup: React.FC<InputGroupProps> = ({
  label,
  icon: Icon,
  dark = false,
  type = "text",
  placeholder,
  value,
  onChange,
}) => (
  <div className="space-y-2">
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
    <div className="relative">
      <Icon
        className={cn(
          "absolute",
          "left-4",
          "top-1/2",
          "-translate-y-1/2",
          "w-4",
          "h-4",
          dark ? "text-muted-foreground" : "text-slate-400",
        )}
      />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn(
          "w-full",
          "p-4",
          "pl-12",
          "rounded-2xl",
          "text-xs",
          "font-bold",
          "outline-none",
          "border",
          "transition-all",
          dark
            ? "bg-background/5 border-background/10 text-background focus:border-primary/50"
            : "bg-muted border-border text-foreground focus:border-primary",
        )}
      />
    </div>
  </div>
);

// ── Step 1: Basic Info ────────────────────────────────────────────────────────
// (unchanged from original)

const BasicInfoStep: React.FC<StepProps> = ({ formData, setFormData }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleBannerFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      bannerBlob: file,
      bannerPreviewUrl: url,
    }));
  };

  return (
    <div className="space-y-6">
      <div className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-6")}>
        <InputGroup
          label="Event Title"
          placeholder="e.g. DIUSCADI Annual Summit"
          icon={LuInfo}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
        <div className="space-y-2">
          <label
            className={cn(
              "text-[10px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              "text-slate-400",
            )}
          >
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className={cn(
              "w-full",
              "bg-muted",
              "border",
              "border-border",
              "p-4",
              "rounded-2xl",
              "text-xs",
              "font-bold",
              "outline-none",
              "focus:border-primary",
              "transition-all",
              "appearance-none",
            )}
          >
            {[
              "Technology",
              "Business",
              "Governance",
              "Career",
              "Networking",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label
          className={cn(
            "text-[10px]",
            "font-black",
            "uppercase",
            "tracking-widest",
            "text-slate-400",
          )}
        >
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="What is this event about?"
          rows={3}
          className={cn(
            "w-full",
            "bg-muted",
            "border",
            "border-border",
            "p-4",
            "rounded-2xl",
            "text-xs",
            "font-medium",
            "outline-none",
            "focus:border-primary",
            "transition-all",
            "resize-none",
          )}
        />
      </div>
      <div className="space-y-2">
        <label
          className={cn(
            "text-[10px]",
            "font-black",
            "uppercase",
            "tracking-widest",
            "text-slate-400",
          )}
        >
          Event Banner
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleBannerFile(file);
            e.target.value = "";
          }}
        />
        {formData.bannerPreviewUrl ? (
          <div
            className={cn(
              "relative",
              "group",
              "rounded-[2rem]",
              "overflow-hidden",
              "aspect-[1200/630]",
              "bg-muted",
            )}
          >
            <Image
              width={500}
              height={300}
              src={formData.bannerPreviewUrl}
              alt="Banner preview"
              className="w-full h-full object-cover"
            />
            <div
              className={cn(
                "absolute",
                "inset-0",
                "bg-black/40",
                "opacity-0",
                "group-hover:opacity-100",
                "transition-opacity",
                "flex",
                "items-center",
                "justify-center",
                "gap-3",
              )}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "px-4",
                  "py-2",
                  "bg-background",
                  "text-foreground",
                  "rounded-xl",
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "cursor-pointer",
                )}
              >
                Change
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((p) => ({
                    ...p,
                    bannerBlob: null,
                    bannerPreviewUrl: null,
                  }))
                }
                className={cn(
                  "px-4",
                  "py-2",
                  "bg-destructive",
                  "text-white",
                  "rounded-xl",
                  "text-[10px]",
                  "font-black",
                  "uppercase",
                  "tracking-widest",
                  "cursor-pointer",
                )}
              >
                Remove
              </button>
            </div>
            <div
              className={cn(
                "absolute",
                "bottom-3",
                "right-3",
                "bg-emerald-500",
                "text-white",
                "text-[9px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "px-2",
                "py-1",
                "rounded-lg",
              )}
            >
              Ready to upload
            </div>
          </div>
        ) : (
          <div
            onClick={() =>
              formData.title.trim() && fileInputRef.current?.click()
            }
            className={cn(
              "p-10",
              "border-2",
              "border-dashed",
              "border-border",
              "rounded-[2rem]",
              "bg-muted/50",
              "flex",
              "flex-col",
              "items-center",
              "justify-center",
              "text-center",
              "gap-2",
              "transition-colors",
              formData.title.trim()
                ? "cursor-pointer hover:border-primary/50 hover:bg-primary/5"
                : "opacity-50 cursor-not-allowed",
            )}
          >
            <LuImage className="w-8 h-8 text-muted-foreground" />
            <p
              className={cn(
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-[0.2em]",
                "text-foreground",
              )}
            >
              {formData.title.trim()
                ? "Upload Event Banner"
                : "Enter a title first"}
            </p>
            <p
              className={cn(
                "text-[9px]",
                "font-bold",
                "text-muted-foreground",
                "uppercase",
                "mt-1",
              )}
            >
              PNG, JPG or WebP · Max 10MB · 1200 × 630 recommended
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Step 2: Schedule (unchanged) ──────────────────────────────────────────────

const ScheduleStep: React.FC<StepProps> = ({ formData, setFormData }) => (
  <div className="space-y-8">
    <div className={cn("grid", "grid-cols-1", "md:grid-cols-3", "gap-6")}>
      <InputGroup
        label="Date"
        type="date"
        icon={LuCalendar}
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
      />
      <InputGroup
        label="Start Time (WAT)"
        type="time"
        icon={LuClock}
        value={formData.startTime}
        onChange={(e) =>
          setFormData({ ...formData, startTime: e.target.value })
        }
      />
      <InputGroup
        label="Duration (Hrs)"
        type="number"
        icon={LuTimer}
        value={formData.duration}
        onChange={(e) =>
          setFormData({ ...formData, duration: Number(e.target.value) })
        }
      />
    </div>
    <div
      className={cn(
        "flex",
        "items-center",
        "gap-4",
        "p-2",
        "text-muted",
        "rounded-2xl",
        "w-fit",
      )}
    >
      {(["Physical", "Virtual", "Hybrid"] as const).map((type) => (
        <button
          key={type}
          onClick={() => setFormData({ ...formData, type })}
          className={cn(
            "px-6",
            "py-2",
            "rounded-xl",
            "text-[10px]",
            "font-black",
            "uppercase",
            "tracking-widest",
            "transition-all",
            formData.type === type
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          {type}
        </button>
      ))}
    </div>
    <InputGroup
      label="Venue Name"
      placeholder="e.g. Eko Convention Center"
      icon={LuMapPin}
      value={formData.venueName}
      onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
    />
  </div>
);

// ── Step 3: Capacity (unchanged) ──────────────────────────────────────────────

const CapacityStep: React.FC<StepProps> = ({ formData, setFormData }) => (
  <div className="space-y-8">
    <div className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-8")}>
      <InputGroup
        label="Max Capacity"
        type="number"
        placeholder="500"
        icon={LuUsers}
        value={formData.maxCapacity}
        onChange={(e) =>
          setFormData({ ...formData, maxCapacity: Number(e.target.value) })
        }
      />
      <InputGroup
        label="Ticket Price (₦)"
        type="number"
        placeholder="0.00"
        icon={LuTicket}
        value={formData.ticketPrice}
        onChange={(e) =>
          setFormData({ ...formData, ticketPrice: Number(e.target.value) })
        }
      />
    </div>
    <div
      className={cn(
        "p-8",
        "border-2",
        "border-border",
        "rounded-[2.5rem]",
        "flex",
        "items-center",
        "justify-between",
      )}
    >
      <div>
        <h4
          className={cn(
            "text-[11px]",
            "font-black",
            "uppercase",
            "tracking-widest",
            "text-foreground",
          )}
        >
          Enable Waitlist
        </h4>
        <p
          className={cn(
            "text-[9px]",
            "font-bold",
            "text-muted-foreground",
            "uppercase",
          )}
        >
          Allow queue once capacity is reached
        </p>
      </div>
      <button
        onClick={() =>
          setFormData({ ...formData, enableWaitlist: !formData.enableWaitlist })
        }
        className={cn(
          "w-14",
          "h-8",
          "rounded-full",
          "p-1",
          "cursor-pointer",
          "transition-colors",
          formData.enableWaitlist ? "bg-primary" : "bg-muted",
        )}
      >
        <motion.div
          animate={{ x: formData.enableWaitlist ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="w-6 h-6 bg-background rounded-full shadow-md"
        />
      </button>
    </div>
    <div className="space-y-2">
      <label
        className={cn(
          "text-[10px]",
          "font-black",
          "uppercase",
          "tracking-widest",
          "text-slate-400",
        )}
      >
        Registration Deadline{" "}
        <span className="text-primary normal-case font-bold tracking-normal">
          (WAT — UTC+1)
        </span>
      </label>
      <div className="relative">
        <LuClock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="datetime-local"
          value={formData.registrationDeadline}
          onChange={(e) =>
            setFormData({ ...formData, registrationDeadline: e.target.value })
          }
          className={cn(
            "w-full",
            "p-4",
            "pl-12",
            "rounded-2xl",
            "text-xs",
            "font-bold",
            "outline-none",
            "border",
            "transition-all",
            "bg-muted",
            "border-border",
            "text-foreground",
            "focus:border-primary",
          )}
        />
      </div>
      <p
        className={cn(
          "text-[9px]",
          "text-muted-foreground",
          "font-bold",
          "uppercase",
          "tracking-widest",
        )}
      >
        Saved as West Africa Time. Registrations close automatically at this
        time.
      </p>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4: CONTENT — Speakers, Sponsors, Schedule
// ═══════════════════════════════════════════════════════════════════════════════

type ContentTab = "speakers" | "sponsors" | "schedule";

const SCHEDULE_TYPES = [
  "session",
  "break",
  "workshop",
  "keynote",
  "networking",
] as const;
type ScheduleType = (typeof SCHEDULE_TYPES)[number];

const SCHEDULE_TYPE_ICONS: Record<ScheduleType, React.ReactNode> = {
  session: <LuCalendarClock className="w-3.5 h-3.5" />,
  break: <LuCoffee className="w-3.5 h-3.5" />,
  workshop: <LuWrench className="w-3.5 h-3.5" />,
  keynote: <LuMic className="w-3.5 h-3.5" />,
  networking: <LuNetwork className="w-3.5 h-3.5" />,
};

const TIER_OPTIONS = ["gold", "silver", "bronze", "partner"] as const;
type SponsorTier = (typeof TIER_OPTIONS)[number];

// ── Member search dropdown ─────────────────────────────────────────────────────

interface MemberOption {
  id: string;
  fullName: { firstname: string; secondname?: string; lastname: string };
  email: string;
  avatarUrl: string | null;
}

function MemberSearchDropdown({
  onSelect,
  onClose,
}: {
  onSelect: (member: MemberOption) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    search("");
  }, [search]);

  return (
    <div
      className={cn(
        "absolute",
        "top-full",
        "left-0",
        "right-0",
        "mt-1",
        "bg-background",
        "border",
        "border-border",
        "rounded-2xl",
        "shadow-2xl",
        "z-50",
        "overflow-hidden",
      )}
    >
      <div
        className={cn(
          "flex",
          "items-center",
          "gap-2",
          "px-3",
          "py-2",
          "border-b",
          "border-border",
        )}
      >
        <LuSearch className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            search(e.target.value);
          }}
          placeholder="Search by name or email…"
          className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
        />
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <LuX className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <LuLoader className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : results.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-6">
            No members found
          </p>
        ) : (
          results.map((m) => {
            const name = [
              m.fullName.firstname,
              m.fullName.secondname,
              m.fullName.lastname,
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={m.id}
                onClick={() => {
                  onSelect(m);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center">
                  {m.avatarUrl ? (
                    <Image
                      src={m.avatarUrl}
                      alt={name}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-primary text-xs font-black">
                      {m.fullName.firstname[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {m.email}
                  </p>
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
  speakers,
  onChange,
  ownerId,
}: {
  speakers: EventSpeaker[];
  onChange: (s: EventSpeaker[]) => void;
  ownerId: string;
}) {
  const { token } = useAuth();
  const [showMemberSearch, setShowMemberSearch] = useState<number | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  function addBlank() {
    onChange([
      ...speakers,
      {
        name: "",
        title: "",
        organisation: "",
        bio: "",
        socialUrl: "",
        userId: undefined,
      },
    ]);
  }

  function update(idx: number, patch: Partial<EventSpeaker>) {
    onChange(speakers.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function remove(idx: number) {
    onChange(speakers.filter((_, i) => i !== idx));
  }

  function populateFromMember(idx: number, member: MemberOption) {
    const name = [
      member.fullName.firstname,
      member.fullName.secondname,
      member.fullName.lastname,
    ]
      .filter(Boolean)
      .join(" ");
    update(idx, {
      name,
      userId: member.id,
      // Don't override existing Cloudinary avatar if already set
      avatar: speakers[idx]?.avatar ?? undefined,
    });
  }

  async function handlePhotoUpload(idx: number, file: File) {
    if (!token) return;
    setUploadingIdx(idx);
    try {
      const image = await uploadImageForEvent(
        file,
        "speaker-photo",
        `${ownerId}-speaker-${idx}`,
        token,
      );
      if (image) update(idx, { avatar: image });
      else toast.error("Photo upload failed");
    } finally {
      setUploadingIdx(null);
    }
  }

  if (speakers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
          <LuMic className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-foreground">
            No speakers added yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Add platform members or create manual entries
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
            "hover:opacity-90",
            "transition-opacity",
            "cursor-pointer",
          )}
        >
          <LuPlus className="w-4 h-4" /> Add Speaker
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {speakers.map((speaker, idx) => {
        const avatarUrl = speaker.avatar?.imageUrl ?? speaker.avatarUrl ?? null;
        const isUploading = uploadingIdx === idx;

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
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <label className="relative cursor-pointer group">
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
                    {isUploading ? (
                      <LuLoader className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={speaker.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-lg font-black text-muted-foreground">
                        {speaker.name ? (
                          speaker.name[0].toUpperCase()
                        ) : (
                          <LuMic className="w-5 h-5" />
                        )}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                      <LuUpload className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </label>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {speaker.name || "Unnamed speaker"}
                  </p>
                  {speaker.userId && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-black uppercase tracking-wider">
                      Platform member
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => remove(idx)}
                className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-muted-foreground cursor-pointer"
              >
                <LuTrash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Member picker trigger */}
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
                <LuLink className="w-3 h-3" />
                {speaker.userId
                  ? "Change linked member"
                  : "Link to platform member"}
              </button>
              {showMemberSearch === idx && (
                <MemberSearchDropdown
                  onSelect={(m) => populateFromMember(idx, m)}
                  onClose={() => setShowMemberSearch(null)}
                />
              )}
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Name *
                </label>
                <input
                  type="text"
                  value={speaker.name}
                  onChange={(e) => update(idx, { name: e.target.value })}
                  placeholder="Full name"
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
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Title
                </label>
                <input
                  type="text"
                  value={speaker.title ?? ""}
                  onChange={(e) => update(idx, { title: e.target.value })}
                  placeholder="e.g. Senior Engineer"
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
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Organisation
                </label>
                <input
                  type="text"
                  value={speaker.organisation ?? ""}
                  onChange={(e) =>
                    update(idx, { organisation: e.target.value })
                  }
                  placeholder="Company / Institution"
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
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Social / Profile URL
                </label>
                <input
                  type="url"
                  value={speaker.socialUrl ?? ""}
                  onChange={(e) => update(idx, { socialUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
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
              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
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

      <button
        onClick={addBlank}
        className={cn(
          "flex",
          "items-center",
          "justify-center",
          "gap-2",
          "w-full",
          "py-3",
          "border-2",
          "border-dashed",
          "border-border",
          "rounded-2xl",
          "text-[10px]",
          "font-black",
          "uppercase",
          "tracking-widest",
          "text-muted-foreground",
          "hover:border-primary/50",
          "hover:text-primary",
          "transition-colors",
          "cursor-pointer",
        )}
      >
        <LuPlus className="w-4 h-4" /> Add Another Speaker
      </button>
    </div>
  );
}

// ── Sponsors sub-tab ──────────────────────────────────────────────────────────

function SponsorsTab({
  sponsors,
  onChange,
  ownerId,
}: {
  sponsors: EventSponsor[];
  onChange: (s: EventSponsor[]) => void;
  ownerId: string;
}) {
  const { token } = useAuth();
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  function addBlank() {
    onChange([...sponsors, { name: "", tier: "partner", website: "" }]);
  }

  function update(idx: number, patch: Partial<EventSponsor>) {
    onChange(sponsors.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function remove(idx: number) {
    onChange(sponsors.filter((_, i) => i !== idx));
  }

  async function handleLogoUpload(idx: number, file: File) {
    if (!token) return;
    setUploadingIdx(idx);
    try {
      const image = await uploadImageForEvent(
        file,
        "sponsor-logo",
        `${ownerId}-sponsor-${idx}`,
        token,
      );
      if (image) update(idx, { logo: image });
      else toast.error("Logo upload failed");
    } finally {
      setUploadingIdx(null);
    }
  }

  const TIER_COLORS: Record<SponsorTier, string> = {
    gold: "bg-amber-100 text-amber-700 border-amber-200",
    silver: "bg-slate-100 text-slate-600 border-slate-200",
    bronze: "bg-orange-100 text-orange-700 border-orange-200",
    partner: "bg-blue-100 text-blue-700 border-blue-200",
  };

  if (sponsors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
          <LuBuilding2 className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-foreground">
            No sponsors added yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Add sponsors and partners for this event
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
            "hover:opacity-90",
            "transition-opacity",
            "cursor-pointer",
          )}
        >
          <LuPlus className="w-4 h-4" /> Add Sponsor
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sponsors.map((sponsor, idx) => {
        const logoUrl = sponsor.logo?.imageUrl ?? sponsor.logoUrl ?? null;
        const isUploading = uploadingIdx === idx;

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Logo */}
                <label className="relative cursor-pointer group">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLogoUpload(idx, f);
                      e.target.value = "";
                    }}
                  />
                  <div
                    className={cn(
                      "w-16",
                      "h-10",
                      "rounded-xl",
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
                    {isUploading ? (
                      <LuLoader className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt={sponsor.name}
                        width={64}
                        height={40}
                        className="object-contain w-full h-full p-1"
                      />
                    ) : (
                      <LuBuilding2 className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <LuUpload className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </label>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {sponsor.name || "Unnamed sponsor"}
                  </p>
                  <span
                    className={cn(
                      "text-[9px]",
                      "font-black",
                      "uppercase",
                      "tracking-wider",
                      "px-2",
                      "py-0.5",
                      "rounded-full",
                      "border",
                      TIER_COLORS[sponsor.tier ?? "partner"],
                    )}
                  >
                    {sponsor.tier ?? "partner"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => remove(idx)}
                className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-muted-foreground cursor-pointer"
              >
                <LuTrash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Name *
                </label>
                <input
                  type="text"
                  value={sponsor.name}
                  onChange={(e) => update(idx, { name: e.target.value })}
                  placeholder="Sponsor / partner name"
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
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Tier
                </label>
                <select
                  value={sponsor.tier ?? "partner"}
                  onChange={(e) =>
                    update(idx, { tier: e.target.value as SponsorTier })
                  }
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
                >
                  {TIER_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Website URL
                </label>
                <input
                  type="url"
                  value={sponsor.website ?? ""}
                  onChange={(e) => update(idx, { website: e.target.value })}
                  placeholder="https://company.com"
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
            </div>
          </div>
        );
      })}

      <button
        onClick={addBlank}
        className={cn(
          "flex",
          "items-center",
          "justify-center",
          "gap-2",
          "w-full",
          "py-3",
          "border-2",
          "border-dashed",
          "border-border",
          "rounded-2xl",
          "text-[10px]",
          "font-black",
          "uppercase",
          "tracking-widest",
          "text-muted-foreground",
          "hover:border-primary/50",
          "hover:text-primary",
          "transition-colors",
          "cursor-pointer",
        )}
      >
        <LuPlus className="w-4 h-4" /> Add Another Sponsor
      </button>
    </div>
  );
}

// ── Schedule sub-tab (drag-and-drop) ──────────────────────────────────────────

function ScheduleTab({
  schedule,
  onChange,
}: {
  schedule: EventScheduleItem[];
  onChange: (s: EventScheduleItem[]) => void;
}) {
  const dragIdx = useRef<number | null>(null);
  const overIdx = useRef<number | null>(null);

  function addBlank() {
    onChange([
      ...schedule,
      { time: "", title: "", type: "session", description: "", speaker: "" },
    ]);
  }

  function update(idx: number, patch: Partial<EventScheduleItem>) {
    onChange(schedule.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function remove(idx: number) {
    onChange(schedule.filter((_, i) => i !== idx));
  }

  // ── Drag handlers ───────────────────────────────────────────────────────
  const onDragStart = (idx: number) => {
    dragIdx.current = idx;
  };

  const onDragEnter = (idx: number) => {
    overIdx.current = idx;
  };

  const onDragEnd = () => {
    const from = dragIdx.current;
    const to = overIdx.current;
    if (from === null || to === null || from === to) {
      dragIdx.current = null;
      overIdx.current = null;
      return;
    }
    const reordered = [...schedule];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    onChange(reordered);
    dragIdx.current = null;
    overIdx.current = null;
  };

  const TYPE_COLORS: Record<ScheduleType, string> = {
    session: "bg-primary/10 text-primary",
    break: "bg-amber-100 text-amber-700",
    workshop: "bg-emerald-100 text-emerald-700",
    keynote: "bg-violet-100 text-violet-700",
    networking: "bg-sky-100 text-sky-700",
  };

  if (schedule.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
          <LuCalendarClock className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-foreground">
            No schedule items yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Build the event agenda — drag to reorder
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
            "hover:opacity-90",
            "transition-opacity",
            "cursor-pointer",
          )}
        >
          <LuPlus className="w-4 h-4" /> Add Schedule Item
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drag hint */}
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
        <LuGripVertical className="w-3.5 h-3.5" /> Drag rows to reorder the
        agenda
      </p>

      {schedule.map((item, idx) => (
        <div
          key={idx}
          draggable
          onDragStart={() => onDragStart(idx)}
          onDragEnter={() => onDragEnter(idx)}
          onDragEnd={onDragEnd}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            "border",
            "border-border",
            "rounded-2xl",
            "p-4",
            "bg-background",
            "cursor-grab",
            "active:cursor-grabbing",
            "transition-shadow",
            "hover:shadow-md",
          )}
        >
          <div className="flex items-center gap-3 mb-3">
            {/* Drag handle */}
            <LuGripVertical className="w-4 h-4 text-muted-foreground shrink-0" />

            {/* Type badge */}
            <div
              className={cn(
                "flex",
                "items-center",
                "gap-1.5",
                "px-2.5",
                "py-1",
                "rounded-lg",
                "text-[10px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                TYPE_COLORS[item.type],
              )}
            >
              {SCHEDULE_TYPE_ICONS[item.type]}
              {item.type}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => remove(idx)}
                className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-muted-foreground cursor-pointer"
              >
                <LuTrash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Time
              </label>
              <input
                type="time"
                value={item.time}
                onChange={(e) => update(idx, { time: e.target.value })}
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
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Type
              </label>
              <select
                value={item.type}
                onChange={(e) =>
                  update(idx, { type: e.target.value as ScheduleType })
                }
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
              >
                {SCHEDULE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Session Title *
              </label>
              <input
                type="text"
                value={item.title}
                onChange={(e) => update(idx, { title: e.target.value })}
                placeholder="e.g. Opening Keynote Address"
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
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Speaker (optional)
              </label>
              <input
                type="text"
                value={item.speaker ?? ""}
                onChange={(e) => update(idx, { speaker: e.target.value })}
                placeholder="Speaker name"
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
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Description (optional)
              </label>
              <input
                type="text"
                value={item.description ?? ""}
                onChange={(e) => update(idx, { description: e.target.value })}
                placeholder="Brief description"
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
          </div>
        </div>
      ))}

      <button
        onClick={addBlank}
        className={cn(
          "flex",
          "items-center",
          "justify-center",
          "gap-2",
          "w-full",
          "py-3",
          "border-2",
          "border-dashed",
          "border-border",
          "rounded-2xl",
          "text-[10px]",
          "font-black",
          "uppercase",
          "tracking-widest",
          "text-muted-foreground",
          "hover:border-primary/50",
          "hover:text-primary",
          "transition-colors",
          "cursor-pointer",
        )}
      >
        <LuPlus className="w-4 h-4" /> Add Schedule Item
      </button>
    </div>
  );
}

// ── ContentStep (Step 4) — tab wrapper ────────────────────────────────────────

const ContentStep: React.FC<StepProps & { ownerId: string }> = ({
  formData,
  setFormData,
  ownerId,
}) => {
  const [activeTab, setActiveTab] = useState<ContentTab>("speakers");

  const TAB_CONFIG: {
    key: ContentTab;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    {
      key: "speakers",
      label: "Speakers",
      icon: <LuMic className="w-4 h-4" />,
      count: formData.speakers.length,
    },
    {
      key: "sponsors",
      label: "Sponsors",
      icon: <LuBuilding2 className="w-4 h-4" />,
      count: formData.sponsors.length,
    },
    {
      key: "schedule",
      label: "Schedule",
      icon: <LuCalendarClock className="w-4 h-4" />,
      count: formData.schedule.length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-2 border-b border-border pb-4">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex",
              "items-center",
              "gap-2",
              "px-4",
              "py-2",
              "rounded-xl",
              "text-xs",
              "font-black",
              "uppercase",
              "tracking-widest",
              "transition-all",
              "cursor-pointer",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span
                className={cn(
                  "ml-0.5",
                  "w-5",
                  "h-5",
                  "rounded-full",
                  "flex",
                  "items-center",
                  "justify-center",
                  "text-[9px]",
                  "font-black",
                  activeTab === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === "speakers" && (
            <SpeakersTab
              speakers={formData.speakers}
              onChange={(s) => setFormData((p) => ({ ...p, speakers: s }))}
              ownerId={ownerId}
            />
          )}
          {activeTab === "sponsors" && (
            <SponsorsTab
              sponsors={formData.sponsors}
              onChange={(s) => setFormData((p) => ({ ...p, sponsors: s }))}
              ownerId={ownerId}
            />
          )}
          {activeTab === "schedule" && (
            <ScheduleTab
              schedule={formData.schedule}
              onChange={(s) => setFormData((p) => ({ ...p, schedule: s }))}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ── Step 5: Review / Publish (unchanged) ──────────────────────────────────────

const PublishStep: React.FC<
  StepProps & { isEditing?: boolean; isRepublishing?: boolean }
> = ({ formData, setFormData, isEditing, isRepublishing }) => (
  <div className="space-y-8">
    {isRepublishing && (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex",
          "items-start",
          "gap-4",
          "p-5",
          "rounded-2xl",
          "bg-emerald-50",
          "border",
          "border-emerald-200",
        )}
      >
        <LuRefreshCcw className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p
            className={cn(
              "text-[11px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              "text-emerald-700",
            )}
          >
            Republishing a cancelled event
          </p>
          <p
            className={cn(
              "text-[10px]",
              "font-medium",
              "text-emerald-600",
              "mt-1",
              "leading-relaxed",
            )}
          >
            This event was previously cancelled. Selecting{" "}
            <strong>Public</strong> and saving will make it live again
            immediately.
          </p>
        </div>
      </motion.div>
    )}

    {isEditing && !isRepublishing && formData.visibility === "Invite-Only" && (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex",
          "items-start",
          "gap-4",
          "p-5",
          "rounded-2xl",
          "bg-amber-50",
          "border",
          "border-amber-200",
        )}
      >
        <LuTriangleAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p
            className={cn(
              "text-[11px]",
              "font-black",
              "uppercase",
              "tracking-widest",
              "text-amber-700",
            )}
          >
            Saving as draft
          </p>
          <p
            className={cn(
              "text-[10px]",
              "font-medium",
              "text-amber-600",
              "mt-1",
              "leading-relaxed",
            )}
          >
            This event will be hidden from the public listing.
          </p>
        </div>
      </motion.div>
    )}

    <div
      className={cn(
        "p-8",
        "rounded-[2.5rem]",
        "border",
        "text-center",
        isRepublishing
          ? "bg-emerald-50/50 border-emerald-200"
          : "bg-primary/10 border-primary/20",
      )}
    >
      <div
        className={cn(
          "w-16",
          "h-16",
          "rounded-2xl",
          "flex",
          "items-center",
          "justify-center",
          "mx-auto",
          "mb-6",
          "shadow-xl",
          isRepublishing
            ? "bg-emerald-500 shadow-emerald-500/20"
            : "bg-primary shadow-primary/20",
        )}
      >
        {isRepublishing ? (
          <LuRefreshCcw className="w-8 h-8 text-white" />
        ) : isEditing ? (
          <LuPencil className="w-8 h-8 text-foreground" />
        ) : (
          <LuCircleCheck className="w-8 h-8 text-foreground" />
        )}
      </div>
      <h3
        className={cn(
          "text-xl",
          "font-black",
          "text-foreground",
          "uppercase",
          "tracking-tighter",
        )}
      >
        {isRepublishing
          ? "Ready to Republish"
          : isEditing
            ? "Ready to Save"
            : "Ready for Deployment"}
      </h3>
      <p
        className={cn(
          "text-[10px]",
          "font-bold",
          "text-muted-foreground",
          "uppercase",
          "mt-2",
          "tracking-widest",
          "max-w-[300px]",
          "mx-auto",
          "leading-relaxed",
        )}
      >
        {isRepublishing
          ? "Review your changes. This event will go live again once you republish."
          : isEditing
            ? "Review your changes below. Once saved, the event listing will update immediately."
            : "Review your configurations. Once published, notifications will be sent to subscribed members."}
      </p>
    </div>

    {/* Quick summary — now includes rich content counts */}
    <div
      className={cn(
        "grid",
        "grid-cols-2",
        "gap-3",
        "text-[10px]",
        "font-black",
        "uppercase",
        "tracking-widest",
      )}
    >
      {[
        { label: "Title", value: formData.title || "—" },
        { label: "Date", value: formData.date || "—" },
        { label: "Type", value: formData.type },
        { label: "Capacity", value: String(formData.maxCapacity) },
        {
          label: "Speakers",
          value:
            formData.speakers.length > 0
              ? `${formData.speakers.length} added`
              : "None",
        },
        {
          label: "Schedule",
          value:
            formData.schedule.length > 0
              ? `${formData.schedule.length} items`
              : "None",
        },
        {
          label: "Sponsors",
          value:
            formData.sponsors.length > 0
              ? `${formData.sponsors.length} added`
              : "None",
        },
        {
          label: "Ticket",
          value:
            formData.ticketPrice === 0 ? "Free" : `₦${formData.ticketPrice}`,
        },
      ].map(({ label, value }) => (
        <div
          key={label}
          className={cn(
            "p-4",
            "rounded-2xl",
            "bg-muted",
            "border",
            "border-border",
          )}
        >
          <p className="text-muted-foreground text-[9px] mb-1">{label}</p>
          <p className="text-foreground truncate">{value}</p>
        </div>
      ))}
    </div>

    <div className={cn("grid", "grid-cols-1", "md:grid-cols-2", "gap-4")}>
      {(["Public", "Invite-Only"] as const).map((visibility) => (
        <button
          key={visibility}
          onClick={() => setFormData({ ...formData, visibility })}
          className={cn(
            "p-6",
            "rounded-2xl",
            "border-2",
            "flex",
            "items-center",
            "justify-between",
            "transition-all",
            formData.visibility === visibility
              ? "bg-muted border-foreground"
              : "bg-background border-border opacity-50",
          )}
        >
          <div className="text-left">
            <span
              className={cn(
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-sm",
                "block",
                formData.visibility === visibility
                  ? "text-foreground"
                  : "text-slate-400",
              )}
            >
              {visibility}
            </span>
            <span
              className={cn(
                "text-[9px]",
                "font-bold",
                "text-muted-foreground",
                "uppercase",
                "tracking-widest",
                "mt-0.5",
                "block",
              )}
            >
              {visibility === "Public"
                ? isRepublishing
                  ? "Make live again"
                  : "Visible to everyone"
                : "Save as hidden draft"}
            </span>
          </div>
          {visibility === "Public" ? (
            <LuEye className="w-4 h-4 text-muted-foreground" />
          ) : (
            <LuShield className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      ))}
    </div>
  </div>
);

export type { EventModalProps, EventFormData };
