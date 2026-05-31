"use client";
import React from "react";
import { cn } from "@/lib/utils";

const Shimmer = ({ className }: { className?: string }) => (
  <div
    className={cn("text-muted", "animate-pulse", "rounded-2xl", className)}
  />
);

export const TicketDetailSkeleton = () => (
  <main className={cn("min-h-screen min-w-full", "bg-muted/50", "pt-[72px]")}>
    {/* Header */}
    <div
      className={cn(
        "bg-background",
        "border-b",
        "border-border",
        "py-6",
        "px-4",
      )}
    >
      <div className={cn("max-w-4xl", "mx-auto", "space-y-4")}>
        <Shimmer className={cn("h-4", "w-32")} />
        <Shimmer className={cn("h-10", "w-48")} />
      </div>
    </div>

    <div className={cn("max-w-4xl", "mx-auto", "px-4", "py-10", "space-y-8")}>
      {/* Visual card skeleton */}
      <Shimmer
        className={cn(
          "min-h-[460px] h-auto",
          "w-72",
          "mx-auto",
          "rounded-[2.5rem]",
        )}
      />
      {/* Meta info skeleton */}
      <Shimmer className={cn("h-72", "rounded-[2.5rem]")} />
      {/* Actions skeleton */}
      <div className={cn("grid", "grid-cols-2", "gap-3")}>
        <Shimmer className={cn("h-14", "rounded-2xl")} />
        <Shimmer className={cn("h-14", "rounded-2xl")} />
      </div>
    </div>
  </main>
);
