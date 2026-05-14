"use client";
// app/admin/settings/committees/page.tsx
// Fixed infinite loop: loadCommittees is now called with a ref guard
// so it only fires once on mount, not on every state.committees change.

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  LuUsers,
  LuPlus,
  LuChevronLeft,
  LuLoader,
  LuPencil,
} from "react-icons/lu";
import { useRouter } from "next/navigation";
import { usePlatform } from "@/context/PlatformContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";
import { SettingsCreateModal } from "@/components/sections/admin/modals/settingsCreateModal";
import { SettingsEditModal } from "@/components/sections/admin/modals/settingsEditModal";
import type { CommitteeItem } from "@/context/PlatformContext";

export default function CommitteesSettingsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { committees, loadingLists, loadCommittees } = usePlatform();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<CommitteeItem | null>(null);

  // ── Fix: run loadCommittees exactly once on mount ──────────────────────────
  // The previous [loadCommittees] dependency caused an infinite loop because
  // loadCommittees is a useCallback that depends on state.committees —
  // loading sets committees → recreates loadCommittees → fires useEffect again.
  // A ref guard breaks the cycle cleanly without touching PlatformContext.
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    loadCommittees();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-[1600px] w-full mt-20 p-5 mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/settings")}
            className="p-3 rounded-2xl border border-border hover:border-foreground transition-all cursor-pointer"
          >
            <LuChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center shadow-xl shadow-foreground/20">
            <LuUsers className="w-7 h-7 text-background" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">
              Committees
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {committees?.length ?? 0} committees
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all shadow-xl cursor-pointer"
        >
          <LuPlus className="w-5 h-5" /> Add Committee
        </button>
      </div>

      {loadingLists ? (
        <div className="flex items-center justify-center py-20">
          <LuLoader className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="bg-background border-2 border-border rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {[
                    "Committee",
                    "Description",
                    "Members",
                    "Status",
                    "Actions",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        "px-6 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]",
                        i === 4 && "text-right",
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(committees ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-xs font-bold text-muted-foreground"
                    >
                      No committees yet
                    </td>
                  </tr>
                ) : (
                  (committees ?? []).map((c, index) => (
                    <motion.tr
                      key={c.slug}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="group hover:bg-muted/50 transition-all"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-background shrink-0"
                            style={{ backgroundColor: c.color }}
                          >
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
                              {c.name}
                            </p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                              {c.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[200px]">
                        <p className="text-[11px] font-medium text-muted-foreground line-clamp-2">
                          {c.description}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-foreground">
                          {c.memberCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                            "bg-emerald-50 text-emerald-600 border-emerald-100",
                          )}
                        >
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setEditing(c)}
                          className="p-2 hover:bg-background border border-transparent hover:border-border rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        >
                          <LuPencil className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Portal>
        <SettingsCreateModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          title="Add Committee"
          fields={[
            { key: "name", label: "Name", type: "text", required: true },
            {
              key: "slug",
              label: "Slug",
              type: "text",
              required: true,
              placeholder: "e.g. socials",
            },
            {
              key: "description",
              label: "Description",
              type: "textarea",
              required: true,
            },
            {
              key: "color",
              label: "Color (hex)",
              type: "text",
              required: true,
              placeholder: "#6366f1",
            },
            {
              key: "icon",
              label: "Icon name",
              type: "text",
              required: true,
              placeholder: "megaphone",
            },
          ]}
          onConfirm={async (data) => {
            if (!token) return;
            try {
              const res = await fetch(
                "/api/admin/platform?resource=committees",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    ...data,
                    memberCount: 0,
                    displayOrder: 99,
                  }),
                },
              );
              if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error ?? "Failed");
              }
              toast.success("Committee created");
              setShowCreate(false);
              loaded.current = false; // allow re-fetch
              loadCommittees();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed");
            }
          }}
        />
      </Portal>

      {/* Edit modal */}
      <Portal>
        {editing && (
          <SettingsEditModal
            isOpen={!!editing}
            onClose={() => setEditing(null)}
            title="Edit Committee"
            fields={[
              {
                key: "name",
                label: "Name",
                type: "text",
                required: true,
                defaultValue: editing.name,
              },
              {
                key: "description",
                label: "Description",
                type: "textarea",
                required: true,
                defaultValue: editing.description,
              },
              {
                key: "color",
                label: "Color (hex)",
                type: "text",
                required: true,
                defaultValue: editing.color,
              },
              {
                key: "icon",
                label: "Icon name",
                type: "text",
                required: true,
                defaultValue: editing.icon,
              },
              {
                key: "headName",
                label: "Head Name",
                type: "text",
                defaultValue: editing.headName ?? "",
              },
            ]}
            onConfirm={async (data) => {
              if (!token) return;
              try {
                const res = await fetch(
                  "/api/admin/platform?resource=committees",
                  {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ slug: editing.slug, ...data }),
                  },
                );
                if (!res.ok) throw new Error("Failed to update");
                toast.success("Committee updated");
                setEditing(null);
                loaded.current = false;
                loadCommittees();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed");
              }
            }}
          />
        )}
      </Portal>
    </motion.div>
  );
}
