"use client";
// app/admin/page.tsx
import React, { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import { AdminHeader } from "@/components/sections/admin/adminHeader";
import { AdminSidebar } from "@/components/sections/admin/AdminSidebar";
import { AdminStatsOverview } from "@/components/sections/admin/AdminStatsOverview";
import { AdminQuickActions } from "@/components/sections/admin/AdminQuickActions";
import { AdminRecentActivity } from "@/components/sections/admin/AdminRecentActivity";
import { AdminUpcomingEventsPreview } from "@/components/sections/admin/AUEventsPreview";
import { LuMenu, LuX, LuLoader } from "react-icons/lu";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { token } = useAuth();
  const { profile } = useUser();
  const {
    analytics,
    loadingAnalytics,
    loadAnalytics,
    loadAdminEvents,
    adminEvents,
  } = useAdmin();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadAnalytics(token);
    loadAdminEvents({ status: "published", page: 1 }, token);
  }, [token, loadAnalytics, loadAdminEvents]);

  return (
    <div
      className={cn(
        "min-h-screen w-full mt-20",
        "bg-background",
        "flex",
        "overflow-hidden",
      )}
    >
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:col-span-3`}
      >
        <AdminSidebar />
      </div>
      {isSidebarOpen && (
        <div
          className={cn(
            "fixed",
            "inset-0",
            "bg-foreground/50",
            "backdrop-blur-sm",
            "z-40",
            "lg:hidden",
          )}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={cn(
          "flex-1",
          "flex",
          "flex-col",
          "min-w-0",
          "overflow-y-auto",
        )}
      >
        {/* Mobile header toggle */}
        <div
          className={cn(
            "lg:hidden",
            "flex md:rounded-t-2xl",
            "items-center",
            "justify-between",
            "p-4",
            "bg-foreground",
            "text-background",
          )}
        >
          <span
            className={cn(
              "font-black",
              "uppercase",
              "tracking-widest",
              "text-[10px]",
            )}
          >
            DIUSCADI Admin
          </span>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn("p-2", "bg-background/10", "rounded-lg")}
          >
            {isSidebarOpen ? (
              <LuX className={cn("w-5", "h-5")} />
            ) : (
              <LuMenu className={cn("w-5", "h-5")} />
            )}
          </button>
        </div>

        <AdminHeader profile={profile} />

        <main
          className={cn(
            "p-4",
            "md:p-8",
            "lg:p-12",
            "space-y-8",
            "max-w-[1600px]",
            "mx-auto",
            "w-full",
          )}
        >
          {loadingAnalytics && !analytics ? (
            <div
              className={cn("flex", "items-center", "justify-center", "py-20")}
            >
              <LuLoader
                className={cn("w-8", "h-8", "text-primary", "animate-spin")}
              />
            </div>
          ) : (
            <>
              <AdminStatsOverview analytics={analytics} />
              <AdminQuickActions />
              <div
                className={cn(
                  "grid",
                  "grid-cols-1",
                  "lg:grid-cols-12",
                  "gap-8",
                  "items-start",
                )}
              >
                <div className={cn("lg:col-span-7")}>
                  <AdminRecentActivity
                    recentSignups={analytics?.recentSignups ?? []}
                  />
                </div>
                <div className={cn("lg:col-span-5")}>
                  <AdminUpcomingEventsPreview events={adminEvents} />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
