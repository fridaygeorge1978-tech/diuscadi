"use client";
// app/admin/analytics/page.tsx
import React, { useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { LuLoader } from "react-icons/lu";

import { AdminAnalyticsHeader } from "@/components/sections/admin/analytics/AAHeader";
import { AdminAnalyticsFilters } from "@/components/sections/admin/analytics/AAFilter";
import { AdminAnalyticsOverviewStats } from "@/components/sections/admin/analytics/AAOverviewStats";
import { AdminAnalyticsRevenueSection } from "@/components/sections/admin/analytics/AARevenue";
import { AdminAnalyticsAttendanceSection } from "@/components/sections/admin/analytics/AAAttendance";
import { AdminAnalyticsUserInsightsSection } from "@/components/sections/admin/analytics/AAUserInsights";
import { AdminAnalyticsEventPerformanceSection } from "@/components/sections/admin/analytics/AAEventPerfomance";
import { AdminAnalyticsRecentActivitySection } from "@/components/sections/admin/analytics/AARecentActivity";
import { AdminAnalyticsConversionSection } from "@/components/sections/admin/analytics/AAConversion";
import { cn } from "../../../lib/utils";

export default function AnalyticsDashboardPage() {
  const { token } = useAuth();
  const { analytics, loadingAnalytics, loadAnalytics } = useAdmin();

  useEffect(() => {
    if (token) loadAnalytics(token);
  }, [token, loadAnalytics]);

  if (loadingAnalytics && !analytics) {
    return (
      <div className={cn('flex', 'items-center', 'justify-center', 'min-h-[60vh]')}>
        <LuLoader className={cn('w-8', 'h-8', 'text-primary', 'animate-spin')} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "max-w-[1600px]",
        "w-full",
        "px-5",
        "md:mt-[140px] mt-[70px]",
        "mx-auto",
        "pb-20",
        "space-y-12",
        "animate-in",
        "fade-in",
        "slide-in-from-bottom-4",
        "duration-1000",
      )}
    >
      <section className="space-y-6">
        <AdminAnalyticsHeader />
        <AdminAnalyticsFilters />
      </section>

      <section>
        <AdminAnalyticsOverviewStats analytics={analytics} />
      </section>

      <hr className="border-border" />

      <div className={cn("grid", "grid-cols-1", "2xl:grid-cols-2", "gap-12")}>
        <AdminAnalyticsRevenueSection analytics={analytics} />
        <AdminAnalyticsAttendanceSection analytics={analytics} />
      </div>

      <section
        className={cn(
          "bg-muted/50",
          "p-8",
          "rounded-[3rem]",
          "border",
          "border-border",
        )}
      >
        <AdminAnalyticsConversionSection analytics={analytics} />
      </section>

      <div className={cn("grid", "grid-cols-1", "xl:grid-cols-2", "gap-12")}>
        <AdminAnalyticsUserInsightsSection analytics={analytics} />
        <AdminAnalyticsEventPerformanceSection analytics={analytics} />
      </div>

      <section className={cn("max-w-4xl", "mx-auto")}>
        <AdminAnalyticsRecentActivitySection analytics={analytics} />
      </section>
    </div>
  );
}
