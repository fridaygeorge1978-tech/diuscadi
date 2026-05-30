"use client";
// app/profile/applications/page.tsx
// Role-gated applications page.
// Participant (not yet member) → Membership card only.
// Approved member / moderator / admin → Committee, Skills, Writer, Program, Sponsorship.

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import { useApplications } from "@/context/ApplicationContext";
import { usePlatform } from "@/context/PlatformContext";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import {
  LuArrowLeft,
  LuLoader,
  LuInbox,
  LuShieldCheck,
  LuCode,
  LuCircleCheck,
  LuCircleX,
  LuClock,
  LuPlus,
  LuX,
  LuChevronDown,
  LuInfo,
  LuUsers,
  LuPenLine,
  LuBriefcase,
  LuGraduationCap,
  LuLock,
} from "react-icons/lu";
import type {
  Application,
  ApplicationType,
} from "@/context/ApplicationContext";
import type { ApplicationStatus, AvailabilityCategory } from "@/lib/models/Application";
import {
  AVAILABILITY_CATEGORIES,
  AVAILABILITY_LABELS,
} from "@/lib/models/Application";

// ── Status styles ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> =
  {
    pending: {
      bg: "bg-amber-50 border-amber-100",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    approved: {
      bg: "bg-emerald-50 border-emerald-100",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    rejected: {
      bg: "bg-rose-50 border-rose-100",
      text: "text-rose-700",
      dot: "bg-rose-500",
    },
    withdrawn: {
      bg: "bg-slate-50 border-slate-100",
      text: "text-slate-500",
      dot: "bg-slate-400",
    },
  };

const STATUS_ICONS: Record<ApplicationStatus, React.ElementType> = {
  pending: LuClock,
  approved: LuCircleCheck,
  rejected: LuCircleX,
  withdrawn: LuX,
};

// ── Application type config ───────────────────────────────────────────────────

interface AppTypeConfig {
  type: ApplicationType;
  label: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  memberOnly: boolean; // false = visible to all, true = member only
}

const APP_TYPE_CONFIGS: AppTypeConfig[] = [
  {
    type: "membership",
    label: "DIUSCADI Membership",
    description:
      "Apply to become an official DIUSCADI member and unlock all platform features",
    icon: LuUsers,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    memberOnly: false,
  },
  {
    type: "committee",
    label: "Join a Committee",
    description:
      "Apply to join one of our active committees and contribute to DIUSCADI's mission",
    icon: LuShieldCheck,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    memberOnly: true,
  },
  {
    type: "skills",
    label: "Skills Verification",
    description:
      "Add verified skills to your profile for recognition and career opportunities",
    icon: LuCode,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    memberOnly: true,
  },
  {
    type: "writer",
    label: "Content Writer",
    description:
      "Apply to become a DIUSCADI content contributor and publish articles on the platform",
    icon: LuPenLine,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    memberOnly: true,
  },
  {
    type: "program",
    label: "Program Expert",
    description:
      "Apply to lead or participate in DIUSCADI's career development programs",
    icon: LuGraduationCap,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    memberOnly: true,
  },
  {
    type: "sponsorship",
    label: "Sponsorship",
    description:
      "Apply to sponsor DIUSCADI events and programmes and gain brand visibility",
    icon: LuBriefcase,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    memberOnly: true,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfileApplicationsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { profile } = useUser();
  const {
    applications,
    loading,
    submitting,
    loadMyApplications,
    submitApplication,
    hasPending,
    hasApproved,
  } = useApplications();
  const { committees, skills, loadCommittees, loadSkills } = usePlatform();

  // ── Role gate ─────────────────────────────────────────────────────────────
  // isMember = approved member OR any elevated role
  const isMember =
    profile?.membershipStatus === "approved" ||
    (profile?.role !== "participant" && profile?.role !== undefined);

  // Visible application types based on membership status
  const visibleTypes = APP_TYPE_CONFIGS.filter((cfg) =>
    isMember ? cfg.type !== "membership" : !cfg.memberOnly,
  );

  // ── Form state ────────────────────────────────────────────────────────────
  const [activeForm, setActiveForm] = useState<ApplicationType | null>(null);
  const [selectedComm, setSelectedComm] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [requestedProgram, setRequestedProgram] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState("");
  const [reason, setReason] = useState("");

  const [committeeSkills, setCommitteeSkills] = useState<string[]>([]);
  const [availabilityCategory, setAvailabilityCategory] = useState<
    AvailabilityCategory | ""
  >("");
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [references, setReferences] = useState("");

  useEffect(() => {
    if (token) loadMyApplications();
    loadCommittees();
    loadSkills();
  }, [loadCommittees, loadMyApplications, loadSkills, token]);

  const resetForm = () => {
    setActiveForm(null);
    setSelectedComm("");
    setSelectedSkills([]);
    setCommitteeSkills([]);
    setAvailabilityCategory("");
    setAvailabilityNote("");
    setReferences("");
    setRequestedProgram("");
    setTopics([]);
    setTopicInput("");
    setReason("");
  };

  const handleSubmit = async () => {
    if (!token || !activeForm) return;

    try {
      if (activeForm === "membership") {
        await submitApplication(
          { type: "membership", reason: reason || undefined },
          token,
        );
      } else if (activeForm === "committee") {
        if (!selectedComm) {
          toast.error("Select a committee");
          return;
        }
        if (!availabilityCategory) {
          toast.error("Select your availability");
          return;
        }
        if (!reason.trim()) {
          toast.error("Tell us why you want to join this committee");
          return;
        }
        await submitApplication(
          {
            type: "committee",
            requestedCommittee: selectedComm,
            reason: reason.trim(),
            committeeSkills:
              committeeSkills.length > 0 ? committeeSkills : undefined,
            availability: {
              category: availabilityCategory as AvailabilityCategory,
              ...(availabilityNote.trim()
                ? { note: availabilityNote.trim() }
                : {}),
            },
            ...(references.trim() ? { references: references.trim() } : {}),
          },
          token,
        );
      } else if (activeForm === "skills") {
        if (selectedSkills.length === 0) {
          toast.error("Select at least one skill");
          return;
        }
        await submitApplication(
          {
            type: "skills",
            requestedSkills: selectedSkills,
            reason: reason || undefined,
          },
          token,
        );
      } else if (activeForm === "program") {
        if (!requestedProgram.trim()) {
          toast.error("Enter a program name or area");
          return;
        }
        await submitApplication(
          {
            type: "program",
            requestedProgram: requestedProgram.trim(),
            reason: reason || undefined,
          },
          token,
        );
      } else if (activeForm === "writer") {
        if (topics.length === 0) {
          toast.error("Add at least one topic area");
          return;
        }
        await submitApplication(
          { type: "writer", topics, reason: reason || undefined },
          token,
        );
      } else if (activeForm === "sponsorship") {
        if (!reason.trim()) {
          toast.error("Please describe your sponsorship interest");
          return;
        }
        await submitApplication(
          { type: "sponsorship", reason: reason.trim() },
          token,
        );
      }

      toast.success("Application submitted successfully");
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    }
  };

  const toggleSkill = (slug: string) => {
    setSelectedSkills((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const addTopic = () => {
    const t = topicInput.trim();
    if (t && !topics.includes(t)) {
      setTopics((prev) => [...prev, t]);
      setTopicInput("");
    }
  };

  const removeTopic = (t: string) =>
    setTopics((prev) => prev.filter((x) => x !== t));

  const activeCfg = APP_TYPE_CONFIGS.find((c) => c.type === activeForm);

  return (
    <main className={cn("min-h-screen w-full px-5 mt-25 pb-20")}>
      {/* Header */}
      <div className={cn("border-b rounded-2xl border-border bg-background")}>
        <div className={cn("max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8")}>
          <button
            onClick={() => router.back()}
            className={cn(
              "flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors cursor-pointer mb-6",
            )}
          >
            <LuArrowLeft className="w-4 h-4" /> Back to Profile
          </button>
          <div
            className={cn(
              "flex flex-col sm:flex-row sm:items-end justify-between gap-6",
            )}
          >
            <div className={cn("flex items-center gap-4")}>
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center shadow-xl shadow-foreground/20",
                )}
              >
                <LuInbox className="w-7 h-7 text-background" />
              </div>
              <div>
                <h1
                  className={cn(
                    "text-3xl font-black text-foreground tracking-tighter uppercase",
                  )}
                >
                  My Applications
                </h1>
                <p
                  className={cn(
                    "text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1",
                  )}
                >
                  {applications.length} submission
                  {applications.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn("max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8")}
      >
        {/* ── Membership gate banner ──────────────────────────────────────── */}
        {!isMember &&
          !hasApproved("membership") &&
          !hasPending("membership") && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl",
              )}
            >
              <LuInfo className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p
                  className={cn(
                    "text-[11px] font-black text-primary uppercase tracking-widest",
                  )}
                >
                  Become a Member First
                </p>
                <p
                  className={cn(
                    "text-[10px] font-bold text-muted-foreground mt-1 leading-relaxed",
                  )}
                >
                  Apply for DIUSCADI membership below. Once approved,
                  you&apos;ll unlock committee applications, skills
                  verification, writer applications, and more.
                </p>
              </div>
            </motion.div>
          )}

        {/* Membership pending notice */}
        {!isMember && hasPending("membership") && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl",
            )}
          >
            <LuClock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p
                className={cn(
                  "text-[11px] font-black text-amber-700 uppercase tracking-widest",
                )}
              >
                Membership Application Under Review
              </p>
              <p
                className={cn(
                  "text-[10px] font-bold text-amber-600 mt-1 leading-relaxed",
                )}
              >
                Your membership application is pending. Other application types
                will unlock once your membership is approved.
              </p>
            </div>
          </motion.div>
        )}

        {/* Locked features preview — shown to non-members so they know what awaits */}
        {!isMember && (
          <div className="space-y-3">
            <p
              className={cn(
                "text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]",
              )}
            >
              Unlocks After Membership Approval
            </p>
            <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3")}>
              {APP_TYPE_CONFIGS.filter((c) => c.memberOnly).map((cfg) => {
                const Icon = cfg.icon;
                return (
                  <div
                    key={cfg.type}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border border-border bg-muted/30 opacity-50",
                    )}
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        cfg.iconBg,
                      )}
                    >
                      <Icon className={cn("w-4 h-4", cfg.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-[11px] font-black text-foreground uppercase tracking-wide truncate",
                        )}
                      >
                        {cfg.label}
                      </p>
                    </div>
                    <LuLock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Application type cards ──────────────────────────────────────── */}
        <div className="space-y-3">
          <p
            className={cn(
              "text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]",
            )}
          >
            {isMember ? "Available Applications" : "Open to All"}
          </p>
          <div className={cn("grid grid-cols-1 gap-4")}>
            {visibleTypes.map((cfg) => {
              const Icon = cfg.icon;
              const isPending = hasPending(cfg.type);
              const isApproved = hasApproved(cfg.type);
              const isActive = activeForm === cfg.type;

              return (
                <div
                  key={cfg.type}
                  className={cn(
                    "bg-background border-2 rounded-[2rem] overflow-hidden transition-all",
                    isActive ? "border-primary" : "border-border",
                  )}
                >
                  {/* Card header — always visible */}
                  <div className={cn("flex items-center justify-between p-6")}>
                    <div className={cn("flex items-center gap-4")}>
                      <div
                        className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                          cfg.iconBg,
                        )}
                      >
                        <Icon className={cn("w-6 h-6", cfg.iconColor)} />
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-sm font-black text-foreground uppercase tracking-tight",
                          )}
                        >
                          {cfg.label}
                        </p>
                        <p
                          className={cn(
                            "text-[10px] font-bold text-muted-foreground mt-0.5 leading-relaxed max-w-sm",
                          )}
                        >
                          {cfg.description}
                        </p>
                      </div>
                    </div>

                    <div
                      className={cn("flex items-center gap-3 shrink-0 ml-4")}
                    >
                      {isApproved && (
                        <span
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border-emerald-100",
                          )}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Approved
                        </span>
                      )}
                      {isPending && !isApproved && (
                        <span
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border-amber-100",
                          )}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Pending
                        </span>
                      )}
                      {!isPending && !isApproved && (
                        <button
                          onClick={() =>
                            setActiveForm(isActive ? null : cfg.type)
                          }
                          className={cn(
                            "flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                            isActive
                              ? "bg-muted text-muted-foreground"
                              : "bg-foreground text-background hover:bg-primary hover:text-foreground",
                          )}
                        >
                          {isActive ? (
                            <LuX className="w-3.5 h-3.5" />
                          ) : (
                            <LuPlus className="w-3.5 h-3.5" />
                          )}
                          {isActive ? "Cancel" : "Apply"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline form — expands inside card */}
                  <AnimatePresence>
                    {isActive && activeCfg && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div
                          className={cn(
                            "px-6 pb-6 pt-0 border-t border-border space-y-5",
                          )}
                        >
                          <div className="pt-5 space-y-5">
                            {/* ── MEMBERSHIP form ────────────────────────── */}
                            {activeForm === "membership" && (
                              <div
                                className={cn(
                                  "p-4 bg-primary/5 border border-primary/20 rounded-2xl",
                                )}
                              >
                                <p
                                  className={cn(
                                    "text-[11px] font-bold text-primary leading-relaxed",
                                  )}
                                >
                                  Applying for DIUSCADI membership gives you
                                  access to events, committees, skills
                                  verification, career programs, and more. Your
                                  application will be reviewed by an admin.
                                </p>
                              </div>
                            )}

                            {/* ── COMMITTEE form ─────────────────────────── */}
                            {activeForm === "committee" && (
                              <div className="space-y-5">
                                {/* Committee selector — unchanged */}
                                <div className="space-y-2">
                                  <label
                                    className={cn(
                                      "text-[10px] font-black text-muted-foreground uppercase tracking-widest",
                                    )}
                                  >
                                    Select Committee{" "}
                                    {activeForm === "committee" ||
                                    activeForm === "sponsorship" ? (
                                      <span className="text-rose-500 ml-1">
                                        *
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground ml-1">
                                        (optional)
                                      </span>
                                    )}
                                  </label>
                                  <div
                                    className={cn(
                                      "grid grid-cols-1 sm:grid-cols-2 gap-2",
                                    )}
                                  >
                                    {(committees ?? []).map((c) => (
                                      <button
                                        key={c.slug}
                                        onClick={() => setSelectedComm(c.slug)}
                                        className={cn(
                                          "flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer",
                                          selectedComm === c.slug
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-slate-300",
                                        )}
                                      >
                                        <div
                                          className={cn(
                                            "w-8 h-8 rounded-xl flex items-center justify-center text-background text-[11px] font-black shrink-0",
                                          )}
                                          style={{ backgroundColor: c.color }}
                                        >
                                          {c.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                          <p
                                            className={cn(
                                              "text-[11px] font-black uppercase tracking-wide truncate",
                                              selectedComm === c.slug
                                                ? "text-primary"
                                                : "text-foreground",
                                            )}
                                          >
                                            {c.name}
                                          </p>
                                          <p
                                            className={cn(
                                              "text-[9px] font-bold text-muted-foreground mt-0.5",
                                            )}
                                          >
                                            {c.memberCount} members
                                          </p>
                                        </div>
                                        {selectedComm === c.slug && (
                                          <LuCircleCheck className="w-4 h-4 text-primary ml-auto shrink-0" />
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Skills to highlight — pulled from user's own profile skills */}
                                {profile?.skills &&
                                  profile.skills.length > 0 && (
                                    <div className="space-y-2">
                                      <label
                                        className={cn(
                                          "text-[10px] font-black text-muted-foreground uppercase tracking-widest",
                                        )}
                                      >
                                        Skills You&apos;re Bringing{" "}
                                        <span className="text-muted-foreground">
                                          (optional)
                                        </span>
                                      </label>
                                      <p
                                        className={cn(
                                          "text-[9px] font-bold text-muted-foreground leading-relaxed",
                                        )}
                                      >
                                        Select which of your profile skills are
                                        most relevant to this committee.
                                      </p>
                                      <div
                                        className={cn("flex flex-wrap gap-2")}
                                      >
                                        {profile.skills.map((slug) => {
                                          const skillItem = (skills ?? []).find(
                                            (s) => s.slug === slug,
                                          );
                                          const label = skillItem?.name ?? slug;
                                          const selected =
                                            committeeSkills.includes(slug);
                                          return (
                                            <button
                                              key={slug}
                                              onClick={() =>
                                                setCommitteeSkills((prev) =>
                                                  prev.includes(slug)
                                                    ? prev.filter(
                                                        (s) => s !== slug,
                                                      )
                                                    : [...prev, slug],
                                                )
                                              }
                                              className={cn(
                                                "px-3 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                                                selected
                                                  ? "border-primary bg-primary/10 text-primary"
                                                  : "border-border text-muted-foreground hover:border-slate-300 hover:text-foreground",
                                              )}
                                            >
                                              {label}
                                            </button>
                                          );
                                        })}
                                      </div>
                                      {committeeSkills.length > 0 && (
                                        <p
                                          className={cn(
                                            "text-[9px] font-bold text-primary uppercase tracking-widest",
                                          )}
                                        >
                                          {committeeSkills.length} skill
                                          {committeeSkills.length !== 1
                                            ? "s"
                                            : ""}{" "}
                                          selected
                                        </p>
                                      )}
                                    </div>
                                  )}

                                {/* Availability */}
                                <div className="space-y-2">
                                  <label
                                    className={cn(
                                      "text-[10px] font-black text-muted-foreground uppercase tracking-widest",
                                    )}
                                  >
                                    Availability{" "}
                                    <span className="text-rose-500">*</span>
                                  </label>
                                  <div
                                    className={cn(
                                      "grid grid-cols-2 sm:grid-cols-3 gap-2",
                                    )}
                                  >
                                    {AVAILABILITY_CATEGORIES.map((cat) => (
                                      <button
                                        key={cat}
                                        onClick={() =>
                                          setAvailabilityCategory(cat)
                                        }
                                        className={cn(
                                          "p-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-wider text-left transition-all cursor-pointer",
                                          availabilityCategory === cat
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-border text-muted-foreground hover:border-slate-300",
                                        )}
                                      >
                                        {AVAILABILITY_LABELS[cat]}
                                      </button>
                                    ))}
                                  </div>
                                  {/* Availability note */}
                                  <input
                                    type="text"
                                    value={availabilityNote}
                                    onChange={(e) =>
                                      setAvailabilityNote(e.target.value)
                                    }
                                    placeholder="Any notes on your availability? e.g. not available during exams"
                                    className={cn(
                                      "w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-primary transition-all",
                                    )}
                                  />
                                </div>

                                {/* References / past experience */}
                                <div className="space-y-2">
                                  <label
                                    className={cn(
                                      "text-[10px] font-black text-muted-foreground uppercase tracking-widest",
                                    )}
                                  >
                                    Past Experience & References{" "}
                                    <span className="text-muted-foreground">
                                      (optional)
                                    </span>
                                  </label>
                                  <textarea
                                    value={references}
                                    onChange={(e) =>
                                      setReferences(e.target.value)
                                    }
                                    placeholder="Any relevant past experience, links to work, or references you'd like to include…"
                                    rows={3}
                                    className={cn(
                                      "w-full bg-muted border border-border rounded-2xl p-4 text-sm font-medium outline-none focus:border-primary transition-all resize-none",
                                    )}
                                  />
                                </div>
                              </div>
                            )}

                            {/* ── SKILLS form ────────────────────────────── */}
                            {activeForm === "skills" && (
                              <div className="space-y-2">
                                <label
                                  className={cn(
                                    "text-[10px] font-black text-muted-foreground uppercase tracking-widest",
                                  )}
                                >
                                  Select Skills{" "}
                                  <span className="text-rose-500">*</span>
                                </label>
                                <div className={cn("flex flex-wrap gap-2")}>
                                  {(skills ?? []).map((s) => {
                                    const selected = selectedSkills.includes(
                                      s.slug,
                                    );
                                    return (
                                      <button
                                        key={s.slug}
                                        onClick={() => toggleSkill(s.slug)}
                                        className={cn(
                                          "px-3 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                                          selected
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border text-muted-foreground hover:border-slate-300 hover:text-foreground",
                                        )}
                                      >
                                        {s.name}
                                      </button>
                                    );
                                  })}
                                </div>
                                {selectedSkills.length > 0 && (
                                  <p
                                    className={cn(
                                      "text-[9px] font-bold text-primary uppercase tracking-widest",
                                    )}
                                  >
                                    {selectedSkills.length} skill
                                    {selectedSkills.length !== 1
                                      ? "s"
                                      : ""}{" "}
                                    selected
                                  </p>
                                )}
                              </div>
                            )}

                            {/* ── WRITER form ────────────────────────────── */}
                            {activeForm === "writer" && (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label
                                    className={cn(
                                      "text-[10px] font-black text-muted-foreground uppercase tracking-widest",
                                    )}
                                  >
                                    Topics You&apos;d Write About{" "}
                                    <span className="text-rose-500">*</span>
                                  </label>
                                  <div className={cn("flex gap-2")}>
                                    <input
                                      type="text"
                                      value={topicInput}
                                      onChange={(e) =>
                                        setTopicInput(e.target.value)
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          addTopic();
                                        }
                                      }}
                                      placeholder="e.g. Artificial Intelligence"
                                      className={cn(
                                        "flex-1 bg-muted border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-primary transition-all",
                                      )}
                                    />
                                    <button
                                      onClick={addTopic}
                                      className={cn(
                                        "px-4 py-3 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all cursor-pointer",
                                      )}
                                    >
                                      Add
                                    </button>
                                  </div>
                                  {topics.length > 0 && (
                                    <div
                                      className={cn(
                                        "flex flex-wrap gap-2 mt-2",
                                      )}
                                    >
                                      {topics.map((t) => (
                                        <span
                                          key={t}
                                          className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[9px] font-black uppercase tracking-widest",
                                          )}
                                        >
                                          {t}
                                          <button
                                            onClick={() => removeTopic(t)}
                                            className="hover:text-rose-500 cursor-pointer"
                                          >
                                            <LuX className="w-3 h-3" />
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* ── PROGRAM form ───────────────────────────── */}
                            {activeForm === "program" && (
                              <div className="space-y-2">
                                <label
                                  className={cn(
                                    "text-[10px] font-black text-muted-foreground uppercase tracking-widest",
                                  )}
                                >
                                  Program / Area of Expertise{" "}
                                  <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={requestedProgram}
                                  onChange={(e) =>
                                    setRequestedProgram(e.target.value)
                                  }
                                  placeholder="e.g. Career Development, Tech Entrepreneurship"
                                  className={cn(
                                    "w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-primary transition-all",
                                  )}
                                />
                              </div>
                            )}

                            {/* ── SPONSORSHIP form ───────────────────────── */}
                            {activeForm === "sponsorship" && (
                              <div
                                className={cn(
                                  "p-4 bg-rose-50 border border-rose-100 rounded-2xl",
                                )}
                              >
                                <p
                                  className={cn(
                                    "text-[11px] font-bold text-rose-700 leading-relaxed",
                                  )}
                                >
                                  Describe your sponsorship interest in the
                                  field below — include your organisation name,
                                  the type of support you&apos;re offering, and
                                  any events or programmes you&apos;d like to be
                                  associated with.
                                </p>
                              </div>
                            )}

                            {/* Reason / motivation — shown for all types */}
                            <div className="space-y-2">
                              <label
                                className={cn(
                                  "text-[10px] font-black text-muted-foreground uppercase tracking-widest",
                                )}
                              >
                                {activeForm === "sponsorship"
                                  ? "Sponsorship Details & Motivation"
                                  : "Reason / Motivation"}
                                {activeForm === "sponsorship" && (
                                  <span className="text-rose-500 ml-1">*</span>
                                )}
                                {activeForm !== "sponsorship" && (
                                  <span className="text-muted-foreground ml-1">
                                    (optional)
                                  </span>
                                )}
                              </label>
                              <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder={
                                  activeForm === "sponsorship"
                                    ? "Tell us about your organisation and sponsorship interest…"
                                    : "Tell us why you're interested…"
                                }
                                rows={3}
                                className={cn(
                                  "w-full bg-muted border border-border rounded-2xl p-4 text-sm font-medium outline-none focus:border-primary transition-all resize-none",
                                )}
                              />
                            </div>

                            {/* Submit row */}
                            <div className={cn("flex gap-3 pt-2")}>
                              <button
                                onClick={resetForm}
                                className={cn(
                                  "flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all cursor-pointer",
                                )}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className={cn(
                                  "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-foreground text-background hover:bg-primary hover:text-foreground transition-all shadow-xl cursor-pointer disabled:opacity-60",
                                )}
                              >
                                {submitting ? (
                                  <>
                                    <LuLoader className="w-4 h-4 animate-spin" />{" "}
                                    Submitting…
                                  </>
                                ) : (
                                  <>
                                    <LuPlus className="w-4 h-4" /> Submit
                                    Application
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Applications history ────────────────────────────────────────── */}
        {applications.length > 0 && (
          <div className="space-y-3">
            <p
              className={cn(
                "text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]",
              )}
            >
              Submission History
            </p>
            {loading ? (
              <div className={cn("flex items-center justify-center py-12")}>
                <LuLoader className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app, index) => (
                  <ApplicationCard key={app.id} app={app} index={index} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && applications.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("py-16 text-center space-y-4")}
          >
            <div
              className={cn(
                "w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto",
              )}
            >
              <LuInbox className="w-10 h-10 text-slate-300" />
            </div>
            <h3
              className={cn(
                "text-xl font-black text-foreground uppercase tracking-tighter",
              )}
            >
              No Applications Yet
            </h3>
            <p
              className={cn(
                "text-[11px] font-bold text-muted-foreground uppercase tracking-widest",
              )}
            >
              {isMember
                ? "Use the cards above to submit your first application."
                : "Apply for membership above to get started."}
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}

// ── ApplicationCard ───────────────────────────────────────────────────────────

const TYPE_DISPLAY: Record<
  ApplicationType,
  { label: string; icon: React.ElementType; iconBg: string; iconColor: string }
> = {
  membership: {
    label: "Membership",
    icon: LuUsers,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  committee: {
    label: "Committee",
    icon: LuShieldCheck,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  skills: {
    label: "Skills",
    icon: LuCode,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  writer: {
    label: "Writer",
    icon: LuPenLine,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  program: {
    label: "Program Expert",
    icon: LuGraduationCap,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  sponsorship: {
    label: "Sponsorship",
    icon: LuBriefcase,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
};

const ApplicationCard: React.FC<{ app: Application; index: number }> = ({
  app,
  index,
}) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_STYLES[app.status];
  const StatusIcon = STATUS_ICONS[app.status];
  const typeDef = TYPE_DISPLAY[app.type] ?? TYPE_DISPLAY.committee;
  const TypeIcon = typeDef.icon;

  const typeTitle =
    app.type === "committee"
      ? (app.requestedCommittee ?? "Committee")
      : app.type === "skills"
        ? `${app.requestedSkills?.length ?? 0} Skill${(app.requestedSkills?.length ?? 0) !== 1 ? "s" : ""}`
        : app.type === "program"
          ? (app.requestedProgram ?? "Program Expert")
          : typeDef.label;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "bg-background border-2 border-border rounded-[2rem] overflow-hidden",
      )}
    >
      <div className={cn("flex items-center justify-between p-6")}>
        <div className={cn("flex items-center gap-4")}>
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              typeDef.iconBg,
            )}
          >
            <TypeIcon className={cn("w-5 h-5", typeDef.iconColor)} />
          </div>
          <div>
            <p
              className={cn(
                "text-sm font-black text-foreground uppercase tracking-tight",
              )}
            >
              {typeTitle}
            </p>
            <p
              className={cn(
                "text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5",
              )}
            >
              {new Date(app.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className={cn("flex items-center gap-3")}>
          <span
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest",
              cfg.bg,
              cfg.text,
            )}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
            {app.status}
          </span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              "p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
            )}
          >
            <LuChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className={cn("px-6 pb-6 space-y-4 border-t border-border pt-4")}
            >
              {/* Skills list */}
              {app.type === "skills" && app.requestedSkills && (
                <div className={cn("flex flex-wrap gap-2")}>
                  {app.requestedSkills.map((s) => (
                    <span
                      key={s}
                      className={cn(
                        "px-3 py-1.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-xl text-[9px] font-black uppercase tracking-widest",
                      )}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Topics list for writer */}
              {app.type === "writer" && app.topics && app.topics.length > 0 && (
                <div className="space-y-1">
                  <p
                    className={cn(
                      "text-[9px] font-black text-muted-foreground uppercase tracking-widest",
                    )}
                  >
                    Topics
                  </p>
                  <div className={cn("flex flex-wrap gap-2")}>
                    {app.topics.map((t) => (
                      <span
                        key={t}
                        className={cn(
                          "px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[9px] font-black uppercase tracking-widest",
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Program */}
              {app.type === "program" && app.requestedProgram && (
                <div className="space-y-1">
                  <p
                    className={cn(
                      "text-[9px] font-black text-muted-foreground uppercase tracking-widest",
                    )}
                  >
                    Program
                  </p>
                  <p className={cn("text-xs font-bold text-foreground")}>
                    {app.requestedProgram}
                  </p>
                </div>
              )}

              {/* Reason */}
              {app.reason && (
                <div className="space-y-1">
                  <p
                    className={cn(
                      "text-[9px] font-black text-muted-foreground uppercase tracking-widest",
                    )}
                  >
                    Your Reason
                  </p>
                  <p
                    className={cn(
                      "text-xs font-medium text-foreground leading-relaxed",
                    )}
                  >
                    {app.reason}
                  </p>
                </div>
              )}

              {/* Review note */}
              {app.reviewNote && (
                <div className={cn("p-4 rounded-2xl border space-y-1", cfg.bg)}>
                  <p
                    className={cn(
                      "text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5",
                      cfg.text,
                    )}
                  >
                    <StatusIcon className="w-3.5 h-3.5" /> Review Note
                  </p>
                  <p
                    className={cn(
                      "text-xs font-medium leading-relaxed",
                      cfg.text,
                    )}
                  >
                    {app.reviewNote}
                  </p>
                </div>
              )}

              {/* Reviewed at */}
              {app.reviewedAt && (
                <p
                  className={cn(
                    "text-[9px] font-bold text-muted-foreground uppercase tracking-widest",
                  )}
                >
                  Reviewed{" "}
                  {new Date(app.reviewedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}

              {/* Pending notice */}
              {app.status === "pending" && (
                <div
                  className={cn(
                    "flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-2xl",
                  )}
                >
                  <LuClock className="w-4 h-4 text-amber-600 shrink-0" />
                  <p
                    className={cn(
                      "text-[10px] font-bold text-amber-700 uppercase tracking-widest",
                    )}
                  >
                    Under review — you will be notified once a decision is made
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
