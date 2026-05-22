"use client";
import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  LuSparkles,
  LuLoader,
  LuChevronLeft,
  LuCheck,
  LuX,
  LuClock,
  LuRefreshCw,
} from "react-icons/lu";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { SkillCategory } from "@/lib/models/platformConfig";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SkillSuggestion {
  id: string;
  name: string;
  suggestedSlug: string;
  category: SkillCategory;
  source: string;
  suggestionCount: number;
  status: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

const CATEGORIES: SkillCategory[] = [
  "Creative",
  "Technical",
  "Business",
  "Communication",
  "Other",
];

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("diuscadi_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SkillSuggestionsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "approved" | "rejected"
  >("pending");

  // Per-row action state
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null,
  );
  const [category, setCategory] = useState<SkillCategory>("Other");
  const [reviewNote, setReviewNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && !["admin", "webmaster"].includes(user.role)) {
      router.push("/admin");
    }
  }, [user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/platform/skills/suggestions?status=${statusFilter}`,
        { headers: authHeaders() },
      );
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } catch {
      toast.error("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function startAction(id: string, type: "approve" | "reject") {
    setActionId(id);
    setActionType(type);
    setCategory("Other");
    setReviewNote("");
  }

  function cancelAction() {
    setActionId(null);
    setActionType(null);
    setReviewNote("");
  }

  async function submitAction() {
    if (!actionId || !actionType) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/platform/skills/suggestions", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          id: actionId,
          action: actionType,
          category: actionType === "approve" ? category : undefined,
          reviewNote: reviewNote || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Action failed");
      }

      toast.success(
        actionType === "approve"
          ? "Skill approved and added to the skills list"
          : "Suggestion rejected",
      );

      cancelAction();
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto mt-20 p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/settings")}
          className="p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
        >
          <LuChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LuSparkles className="w-6 h-6 text-primary" />
            Skill Suggestions
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review user-submitted skill suggestions. Approve to add to the
            platform skills list, or reject with a note.
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer capitalize",
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LuLoader className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : suggestions.length === 0 ? (
        <div
          className={cn(
            "flex flex-col items-center justify-center py-20",
            "border border-dashed border-border rounded-2xl gap-3",
          )}
        >
          <LuSparkles className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-bold text-muted-foreground">
            No {statusFilter} suggestions
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={cn(
                "border-2 rounded-2xl p-5 transition-all",
                actionId === suggestion.id
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-background",
              )}
            >
              {/* Main row */}
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-base font-black text-foreground">
                      {suggestion.name}
                    </p>
                    <span className="text-[9px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {suggestion.suggestedSlug}
                    </span>
                    {suggestion.suggestionCount > 1 && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        <LuRefreshCw className="w-2.5 h-2.5" />
                        {suggestion.suggestionCount}× requested
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    <span className="capitalize">
                      {suggestion.source.replace("-", " ")}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <LuClock className="w-3 h-3" />
                      {new Date(suggestion.createdAt).toLocaleDateString(
                        "en-NG",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                    {suggestion.status !== "pending" && (
                      <>
                        <span>·</span>
                        <span
                          className={cn(
                            suggestion.status === "approved"
                              ? "text-emerald-600"
                              : "text-red-600",
                          )}
                        >
                          {suggestion.status}
                        </span>
                      </>
                    )}
                  </div>
                  {suggestion.reviewNote && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Note: {suggestion.reviewNote}
                    </p>
                  )}
                </div>

                {/* Action buttons — only on pending */}
                {suggestion.status === "pending" &&
                  actionId !== suggestion.id && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => startAction(suggestion.id, "approve")}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2",
                          "bg-emerald-500 text-white rounded-xl",
                          "text-[10px] font-black uppercase tracking-widest",
                          "hover:opacity-90 transition-opacity cursor-pointer",
                        )}
                      >
                        <LuCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => startAction(suggestion.id, "reject")}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2",
                          "bg-muted text-muted-foreground rounded-xl border border-border",
                          "text-[10px] font-black uppercase tracking-widest",
                          "hover:bg-red-50 hover:text-red-600 hover:border-red-200",
                          "transition-colors cursor-pointer",
                        )}
                      >
                        <LuX className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
              </div>

              {/* Expanded action form */}
              {actionId === suggestion.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 pt-4 border-t border-border space-y-3 overflow-hidden"
                >
                  {actionType === "approve" && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Category *
                      </label>
                      <select
                        value={category}
                        onChange={(e) =>
                          setCategory(e.target.value as SkillCategory)
                        }
                        className={cn(
                          "w-full mt-1 bg-muted border border-border rounded-xl",
                          "px-3 py-2 text-xs font-bold outline-none focus:border-primary",
                        )}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Review Note (optional)
                    </label>
                    <input
                      type="text"
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder={
                        actionType === "approve"
                          ? "e.g. Merged with existing Photography skill"
                          : "e.g. Too broad — use an existing skill"
                      }
                      className={cn(
                        "w-full mt-1 bg-muted border border-border rounded-xl",
                        "px-3 py-2 text-xs font-bold outline-none focus:border-primary",
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={submitAction}
                      disabled={saving}
                      className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-xl",
                        "text-[10px] font-black uppercase tracking-widest",
                        "transition-opacity disabled:opacity-60 cursor-pointer",
                        actionType === "approve"
                          ? "bg-emerald-500 text-white hover:opacity-90"
                          : "bg-foreground text-background hover:opacity-90",
                      )}
                    >
                      {saving ? (
                        <LuLoader className="w-3.5 h-3.5 animate-spin" />
                      ) : actionType === "approve" ? (
                        <LuCheck className="w-3.5 h-3.5" />
                      ) : (
                        <LuX className="w-3.5 h-3.5" />
                      )}
                      {saving
                        ? "Saving…"
                        : actionType === "approve"
                          ? "Confirm Approval"
                          : "Confirm Rejection"}
                    </button>
                    <button
                      onClick={cancelAction}
                      className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
