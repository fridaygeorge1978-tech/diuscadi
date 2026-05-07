"use client";
import React, { useState, useMemo } from "react";
import { EditProfileHeader } from "@/components/sections/profile/edit/EPHeader";
import { EditProfileSidebar } from "@/components/sections/profile/edit/EPSideBar";
import { ProfilePreviewCard } from "@/components/sections/profile/edit/ProfilePreviewCard";
import { ProfilePhotoSection } from "@/components/sections/profile/edit/ProfilePhoto";
import { BasicInfoSection } from "@/components/sections/profile/edit/BasicInfo";
import { ProfessionalInfoSection } from "@/components/sections/profile/edit/ProInfo";
import { ContactInfoSection } from "@/components/sections/profile/edit/ContactInfo";
import { SocialLinksSection } from "@/components/sections/profile/edit/SocialLink";
import { PreferencesSection } from "@/components/sections/profile/edit/Preferences";
import { SaveChangesSection } from "@/components/sections/profile/edit/SaveChanges";
import { toast, Toaster } from "react-hot-toast";
import { cn } from "../../../lib/utils";
import { useUser } from "@/context/UserContext";

export default function EditProfilePage() {
  const { profile, updateProfile } = useUser();

  // ── Form state ─────────────────────────────────────────────────────────────
  // Seeded from profile on first render via useMemo — no useEffect needed.
  // fullName is split into firstname/lastname for the form inputs; the object
  // shape is reassembled on save.

  const initial = useMemo(() => {
    const fn = profile?.fullName;
    return {
      firstName: fn?.firstname ?? "Alexander",
      secondName: fn?.secondname ?? "",
      lastName: fn?.lastname ?? "Chidubem",
      username: "",
      bio: profile?.profile?.bio ?? "",
      role: "Senior Fullstack Developer", // UI-only, no backend field yet
      organization: profile?.Institution?.name ?? "TechNexus Africa",
      city:
        [
          profile?.location?.city,
          profile?.location?.state,
          profile?.location?.country,
        ]
          .filter(Boolean)
          .join(", ") || "Lagos, Nigeria",
      path: "DEVELOPER",
      // image is a display URL string — extract from CloudinaryImage or use null
      image: profile?.hasAvatar ? (profile.avatar?.imageUrl ?? null) : null,
      socials: {
        linkedin: profile?.socials?.linkedin ?? "",
        github: profile?.socials?.github ?? "",
        twitter: profile?.socials?.twitter ?? "",
        website: profile?.socials?.portfolio ?? "", // portfolio in DB → website in form
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — seed once on mount, user edits control state after

  const [formData, setFormData] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(new Date());
  const [activeSection, setActiveSection] = useState("basic");

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);

    // Reassemble the structured fullName object from form inputs
    const result = await updateProfile({
      fullName: {
        firstname: formData.firstName.trim() || profile.fullName.firstname,
        secondname: formData.secondName.trim() || undefined,
        lastname: formData.lastName.trim() || profile.fullName.lastname,
      },
      bio: formData.bio,
      socials: {
        linkedin: formData.socials.linkedin || undefined,
        github: formData.socials.github || undefined,
        twitter: formData.socials.twitter || undefined,
        portfolio: formData.socials.website || undefined,
      },
    });

    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to update profile");
      return;
    }

    setHasChanges(false);
    setLastSaved(new Date());

    toast.success("Profile Updated Successfully!", {
      style: {
        borderRadius: "20px",
        background: "#0f172a",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "12px",
        letterSpacing: "1px",
      },
    });
  };

  return (
    <main className={cn("min-h-screen w-full", "bg-background")}>
      <Toaster position="bottom-right" />

      <EditProfileHeader
        isSaving={isSaving}
        hasChanges={hasChanges}
        onSave={handleSave}
      />

      <div
        className={cn(
          "max-w-[1600px]",
          "mx-auto",
          "px-4",
          "sm:px-6",
          "lg:px-8",
          "py-10",
        )}
      >
        <div className={cn("grid", "grid-cols-1", "lg:grid-cols-12", "gap-8")}>
          {/* LEFT: Sidebar Nav */}
          <aside className={cn("hidden", "lg:block", "lg:col-span-2")}>
            <EditProfileSidebar
              activeSection={activeSection}
              completedSections={["photo", "basic", "pro"]}
              onSectionClick={(id) => {
                setActiveSection(id);
                document
                  .getElementById(id)
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            />
          </aside>

          {/* CENTER: Main Form */}
          <div className={cn("lg:col-span-7", "space-y-8")}>
            <div id="photo">
              <ProfilePhotoSection />
            </div>
            <div id="basic">
              <BasicInfoSection
                firstName={formData.firstName}
                lastName={formData.lastName}
                username={formData.username}
                bio={formData.bio}
                onChange={(patch) => {
                  setFormData((prev) => ({ ...prev, ...patch }));
                  setHasChanges(true);
                }}
              />
            </div>
            <div id="pro" onChange={() => setHasChanges(true)}>
              <ProfessionalInfoSection />
            </div>
            <div id="contact" onChange={() => setHasChanges(true)}>
              <ContactInfoSection />
            </div>
            <div id="social" onChange={() => setHasChanges(true)}>
              <SocialLinksSection
                links={formData.socials}
                onChange={(patch) => {
                  setFormData((prev) => ({
                    ...prev,
                    socials: { ...prev.socials, ...patch },
                  }));
                  setHasChanges(true);
                }}
              />
            </div>
            <div id="prefs" onChange={() => setHasChanges(true)}>
              <PreferencesSection />
            </div>

            <SaveChangesSection
              isSaving={isSaving}
              lastSaved={lastSaved}
              hasChanges={hasChanges}
              onSave={handleSave}
              onCancel={() => window.location.reload()}
            />
          </div>

          {/* RIGHT: Live Preview */}
          <aside className={cn("hidden", "xl:block", "lg:col-span-3")}>
            <ProfilePreviewCard data={formData} />
          </aside>
        </div>
      </div>

      {/* MOBILE: Sticky Save */}
      <div
        className={cn(
          "lg:hidden",
          "fixed",
          "bottom-6",
          "left-4",
          "right-4",
          "z-50",
        )}
      >
        <button
          onClick={handleSave}
          className={cn(
            "w-full",
            "bg-foreground",
            "text-background",
            "py-5",
            "rounded-[2rem]",
            "font-black",
            "uppercase",
            "tracking-widest",
            "shadow-2xl",
            "flex",
            "items-center",
            "justify-center",
            "gap-3",
          )}
        >
          {isSaving ? "Syncing..." : "Save Profile"}
        </button>
      </div>
    </main>
  );
}
