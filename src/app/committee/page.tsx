"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import { LuLoader } from "react-icons/lu";

import PublicShowcaseView from "@/components/sections/committees/PublicShowcaseView";
import PrivateCommitteeDashboard from "@/components/sections/committees/PrivateCommitteeDashboard";
import { cn } from "@/lib/utils";

export default function CommitteePage() {
  const router = useRouter();
  const { token, sessionStatus } = useAuth();
  const { profile, isLoading: profileLoading } = useUser();

  useEffect(() => {
    // ── Wait for session to finish restoring ──────────────────────────────
    if (sessionStatus === "pending") return;

    // ── Wait for UserContext to finish fetching the full profile ──────────
    // After sessionStatus becomes "restored", UserContext calls refreshProfile
    // which is async. profile is null during this window even though the
    // user is authenticated — acting here would redirect them to /auth.
    if (profileLoading) return;

    // ── Edge case: restored but profile seed hasn't run yet ───────────────
    if (sessionStatus === "restored" && !profile) return;

    // ── Now we can safely make an access decision ─────────────────────────
    if (!token || !profile) {
      router.push("/auth");
      return;
    }

    if (
      profile.role === "participant" &&
      profile.membershipStatus !== "approved"
    ) {
      router.push("/application");
    }
  }, [profile, profileLoading, sessionStatus, token, router]);

  // ── Show loader while session is restoring OR profile is loading ──────────
  // sessionStatus "pending"  → /api/auth/me in flight
  // profileLoading           → UserContext fetching full profile after restore
  // Both need to resolve before we can make an access decision
  const isResolving =
    sessionStatus === "pending" ||
    profileLoading ||
    // Edge case: session restored but UserContext hasn't seeded profile yet
    (sessionStatus === "restored" && !profile);

  if (isResolving) {
    return (
      <div
        className={cn(
          "min-h-screen",
          "w-full",
          "flex",
          "items-center",
          "justify-center",
          "bg-background",
        )}
      >
        <div className={cn("flex", "flex-col", "items-center", "gap-3")}>
          <LuLoader
            className={cn("w-8", "h-8", "animate-spin", "text-primary")}
          />
          <span
            className={cn(
              "text-xs",
              "uppercase",
              "tracking-widest",
              "font-mono",
              "text-muted-foreground",
              "animate-pulse",
            )}
          >
            Syncing Org State...
          </span>
        </div>
      </div>
    );
  }

  // ── TypeScript narrowing guard ────────────────────────────────────────────
  // isResolving covers all null-profile cases above.
  // This is unreachable at runtime but satisfies the compiler.
  if (!profile) return null;

  const membership = profile.committeeMembership;

  return (
    <main
      className={cn(
        "min-h-screen",
        "w-full",
        "relative",
        "z-10",
        "pt-24",
        "pb-16",
        "px-4",
        "sm:px-6",
        "lg:px-8",
        "max-w-7xl",
        "mx-auto",
      )}
    >
      {membership?.committee ? (
        <PrivateCommitteeDashboard
          userCommittee={membership.committee}
          userCommitteeRole={membership.role}
        />
      ) : (
        <PublicShowcaseView />
      )}
    </main>
  );
}
