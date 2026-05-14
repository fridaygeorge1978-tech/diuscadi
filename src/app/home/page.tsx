// app/home/page.tsx — Server Component
// completionPct now comes from fetchHomeUser() which uses
// calculateCompletionFromRaw() — same logic as profile/page.tsx

import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { ObjectId } from "mongodb";
import {
  fetchHomeUser,
  fetchFeaturedEvent,
  fetchUpcomingEvents,
  fetchRecommendations,
  getStaticQuickActions,
  getStaticAnnouncements,
  getStaticActivities,
  getStaticContinueItems,
} from "@/lib/homeData";
import { cn } from "@/lib/utils";

import { HomeHeader } from "@/components/sections/homepage/HomeHeader";
import { HomeHero } from "@/components/sections/homepage/homeHero";
import { QuickActions } from "@/components/sections/homepage/quickActions";
import { ContinueSection } from "@/components/sections/homepage/continueSection";
import { RecommendedSection } from "@/components/sections/homepage/recommendationSection";
import { UpcomingEvents } from "@/components/sections/homepage/upcomingEvents";
import { RecentActivity } from "@/components/sections/homepage/recentActivity";
import { Announcements } from "@/components/sections/homepage/announcement";
import { HomeCTAOptional } from "@/components/sections/homepage/CTA";

async function getAuthPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get("diuscadi_token")?.value;
  if (!token) return null;
  try {
    return verifyJWT(token);
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const auth = await getAuthPayload();
  if (!auth) return null;

  const vaultId = new ObjectId(auth.vaultId);

  const [homeUser, featuredEvent, upcomingEvents] = await Promise.all([
    fetchHomeUser(),
    fetchFeaturedEvent(),
    fetchUpcomingEvents(vaultId),
  ]);

  const recommendations = homeUser
    ? await fetchRecommendations({
        skills: homeUser.skills,
        eduStatus: homeUser.eduStatus,
      })
    : [];

  const quickActions = getStaticQuickActions();
  const announcements = getStaticAnnouncements();
  const activities = getStaticActivities();
  const continueItems = getStaticContinueItems();

  // const headerUser = homeUser
  //   ? {
  //       name: homeUser.name,
  //       avatar: homeUser.avatar,
  //       status:
  //         homeUser.eduStatus.charAt(0).toUpperCase() +
  //         homeUser.eduStatus.slice(1).toLowerCase(),
  //       skill: homeUser.skills[0] ?? "",
  //       interest: homeUser.committeeMembership?.committee ?? "General",
  //       projectsParticipated: String(homeUser.eventsAttended),
  //       points: homeUser.eventsRegistered * 50,
  //     }
  //   : {
  //       name: "Member",
  //       avatar: "",
  //       status: "",
  //       skill: "",
  //       interest: "",
  //       projectsParticipated: "0",
  //       points: 0,
  //     };

  const heroEvent = featuredEvent
    ? {
        image: featuredEvent.image,
        title: featuredEvent.title,
        daysLeft: featuredEvent.daysLeft,
        date: featuredEvent.date,
        category: "Upcoming Event",
        slug: featuredEvent.slug,
      }
    : null;

  // ── Use real completion from homeUser (calculated server-side) ────────────
  // No more hardcoded 40% — same logic as profile/page.tsx via calculateCompletionFromRaw()
  const completionPct = homeUser?.completionPct ?? 0;
  const completionNextStep = homeUser?.completionNextStep ?? null;

  const currentTask = {
    title: completionPct >= 100 ? "Continue Module 4" : "Complete Your Profile",
    category: completionPct >= 100 ? "Learning Path" : "Getting Started",
    progress: completionPct,
    nextStep: completionNextStep, // passed to HomeHero for the hint text
  };

  const mappedRecommendations = recommendations.map((r, i) => ({
    id: i,
    type: r.type,
    title: r.title,
    meta: r.meta,
    tag: r.tag,
    href: `/events/${r.slug}`,
  }));

  const mappedEvents = upcomingEvents.map((e) => ({
    id: e.id,
    date: e.date,
    month: e.month,
    type: e.type,
    title: e.title,
    time: e.time,
    location: e.location,
    status: (e.status === "checked-in"
      ? "Confirmed"
      : e.status === "cancelled"
        ? "Completed"
        : "Confirmed") as "Confirmed" | "On Waitlist" | "Completed",
    link: `/events/${e.slug}`,
  }));

  return (
    <main
      className={cn(
        "flex",
        "flex-col",
        "p-5",
        "pt-[90px]",
        "items-center",
        "justify-center",
        "w-full",
        "h-full",
      )}
    >
      <HomeHeader />
      <HomeHero featuredEvent={heroEvent} currentTask={currentTask} />
      <QuickActions actions={quickActions} />
      <ContinueSection items={continueItems} />
      <RecommendedSection
        recommendations={mappedRecommendations}
        userInterests={homeUser?.skills.join(" & ") ?? "General"}
      />
      <UpcomingEvents events={mappedEvents} />
      <RecentActivity activities={activities} />
      <Announcements announcements={announcements} />
      <HomeCTAOptional />
    </main>
  );
}
