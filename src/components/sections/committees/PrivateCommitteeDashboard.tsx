"use client";

import React, { useEffect, useState } from "react";
import {
  LuMessageSquare,
  LuMegaphone,
  LuUserCheck,
  LuExternalLink,
  LuActivity,
} from "react-icons/lu";
import { motion } from "framer-motion";
import { cn } from "../../../lib/utils";

// Define the exact structural interface for incoming data streams
interface ApiCommittee {
  id: string;
  slug: string;
  name: string;
  shortDesc?: string;
  description: string;
  memberCount: number;
  whatsappLink?: string | null;
}

interface PrivateDashboardProps {
  userCommittee: string;
  userCommitteeRole: string;
}

export default function PrivateCommitteeDashboard({
  userCommittee,
  userCommitteeRole,
}: PrivateDashboardProps) {
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [committeeName, setCommitteeName] = useState<string>("");

  useEffect(() => {
    async function extractProtectedWorkspace() {
      try {
        const res = await fetch(`/api/platform/committees`);
        const data = await res.json();

        if (data.committees && Array.isArray(data.committees)) {
          // Explicit typing inside the find loop instead of implicit 'any'
          const matchedDocument = (data.committees as ApiCommittee[]).find(
            (c) => c.slug === userCommittee,
          );

          if (matchedDocument) {
            setCommitteeName(matchedDocument.name);
            setWhatsappLink(matchedDocument.whatsappLink || null);
          }
        }
      } catch (err) {
        console.error("Dashboard Analytics Pipeline Error:", err);
      }
    }
    extractProtectedWorkspace();
  }, [userCommittee]);

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Verified Workspace Title Card */}
      <div
        className={cn(
          "glass",
          "glass-shine",
          "rounded-3xl",
          "p-5",
          "sm:p-6",
          "md:p-8",
          "flex",
          "flex-col",
          "lg:flex-row",
          "items-start",
          "lg:items-center",
          "justify-between",
          "gap-6",
          "w-full",
        )}
      >
        <div className="w-full min-w-0">
          <div
            className={cn("flex", "flex-wrap", "items-center", "gap-2", "mb-3")}
          >
            <span
              className={cn(
                "glass-subtle",
                "text-primary",
                "text-[9px]",
                "sm:text-[10px]",
                "uppercase",
                "font-mono",
                "font-bold",
                "tracking-widest",
                "px-2.5",
                "py-1",
                "rounded-md",
                "border",
                "border-primary/10",
              )}
            >
              Assigned Node: Operational
            </span>
            <span
              className={cn(
                "bg-foreground/5",
                "text-foreground/80",
                "text-[9px]",
                "sm:text-[10px]",
                "uppercase",
                "font-mono",
                "font-bold",
                "tracking-widest",
                "px-2.5",
                "py-1",
                "rounded-md",
                "truncate",
                "max-w-[200px]",
              )}
            >
              Clearance: {userCommitteeRole}
            </span>
          </div>
          <h1
            className={cn(
              "text-xl",
              "sm:text-2xl",
              "md:text-3xl",
              "font-black",
              "uppercase",
              "tracking-tight",
              "text-foreground",
              "break-words",
            )}
          >
            {committeeName || userCommittee} Headspace
          </h1>
          <p
            className={cn(
              "text-xs",
              "md:text-sm",
              "text-muted-foreground",
              "mt-1.5",
              "max-w-xl",
              "leading-relaxed",
            )}
          >
            You are authenticated inside this system workspace block. Sync live
            operations and project channels through our linked real-time
            instance.
          </p>
        </div>

        {/* SECURE HIGH-PRIORITY WHATSAPP ANCHOR ENGINE */}
        {whatsappLink && (
          <motion.a
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex",
              "items-center",
              "justify-center",
              "gap-2.5",
              "bg-[#25D366]",
              "hover:bg-[#20ba5a]",
              "text-white",
              "font-bold",
              "uppercase",
              "tracking-wider",
              "text-xs",
              "px-6",
              "py-4",
              "rounded-xl",
              "transition-all",
              "duration-300",
              "shadow-xl",
              "shadow-emerald-950/10",
              "w-full",
              "lg:w-auto",
              "shrink-0",
              "select-none",
            )}
          >
            <LuMessageSquare className={cn("w-4", "h-4")} /> Join Team WhatsApp
            Group
            <LuExternalLink className={cn("w-3.5", "h-3.5")} />
          </motion.a>
        )}
      </div>

      {/* DASHBOARD SYSTEM DATA ROWS */}
      <div
        className={cn(
          "grid",
          "grid-cols-1",
          "lg:grid-cols-12",
          "gap-6",
          "w-full",
        )}
      >
        {/* Left Side: Internal Announcements Board */}
        <div
          className={cn(
            "col-span-12",
            "lg:col-span-8",
            "glass",
            "rounded-2xl",
            "p-5",
            "sm:p-6",
            "space-y-4",
            "w-full",
            "min-w-0",
          )}
        >
          <h3
            className={cn(
              "font-bold",
              "uppercase",
              "tracking-wider",
              "text-xs",
              "text-muted-foreground",
              "flex",
              "items-center",
              "gap-2",
              "border-b",
              "border-border",
              "pb-3",
            )}
          >
            <LuMegaphone className={cn("w-4", "h-4", "text-primary")} /> Active
            Workspace Broadcasts
          </h3>

          <div className="space-y-4 w-full">
            <div
              className={cn(
                "border-l-2",
                "border-primary/40",
                "pl-4",
                "py-0.5",
                "w-full",
                "min-w-0",
              )}
            >
              <h4
                className={cn(
                  "text-sm",
                  "font-bold",
                  "text-foreground",
                  "break-words",
                )}
              >
                Structural Setup Completed
              </h4>
              <p
                className={cn(
                  "text-xs",
                  "text-muted-foreground",
                  "mt-1",
                  "leading-relaxed",
                  "break-words",
                )}
              >
                Your account is linked to this operational unit. Please join the
                central communications channel above to map out upcoming
                milestone deadlines.
              </p>
              <span
                className={cn(
                  "text-[9px]",
                  "font-mono",
                  "text-muted-foreground/50",
                  "mt-2",
                  "block",
                )}
              >
                SYSTEM DISPATCH • CORE ENGINE
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Deployment & Operational Status */}
        <div
          className={cn(
            "col-span-12",
            "lg:col-span-4",
            "glass",
            "rounded-2xl",
            "p-5",
            "sm:p-6",
            "flex",
            "flex-col",
            "justify-between",
            "gap-6",
            "w-full",
            "min-w-0",
          )}
        >
          <div className="w-full">
            <h3
              className={cn(
                "font-bold",
                "uppercase",
                "tracking-wider",
                "text-xs",
                "text-muted-foreground",
                "flex",
                "items-center",
                "gap-2",
                "mb-4",
                "border-b",
                "border-border",
                "pb-3",
              )}
            >
              <LuUserCheck className={cn("w-4", "h-4", "text-primary")} />{" "}
              Module Status
            </h3>
            <p
              className={cn(
                "text-xs",
                "text-muted-foreground",
                "leading-relaxed",
                "break-words",
              )}
            >
              Task alignment tools, asset boards, and member rosters are
              currently routing communication dependencies entirely through the
              designated primary external channel.
            </p>
          </div>

          <div
            className={cn(
              "pt-4",
              "border-t",
              "border-border",
              "flex",
              "items-center",
              "justify-between",
              "text-[10px]",
              "font-mono",
              "text-muted-foreground/60",
              "w-full",
            )}
          >
            <span className={cn("flex", "items-center", "gap-1.5")}>
              <LuActivity
                className={cn(
                  "w-3.5",
                  "h-3.5",
                  "text-emerald-500",
                  "animate-pulse",
                )}
              />
              Channel Sync Active
            </span>
            <span>V2.0-GLASS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
