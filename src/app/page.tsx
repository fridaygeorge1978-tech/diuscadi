"use client";
// app/page.tsx
// Public landing page. Authenticated users are redirected to /home.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Banner } from "@/components/sections/banner";
import { Hero } from "@/components/sections/hero";
import { cn } from "@/lib/utils";
import { TrustBar } from "@/components/sections/trustBar";
import { AboutSection } from "@/components/sections/aboutSect";
import { ProgramsSection } from "@/components/sections/programSect";
import { UpcomingEvent } from "@/components/sections/upcomingEvent";
import { PastEventsSection } from "@/components/sections/pastEvents";
import { Testimonials } from "@/components/sections/testimonial";
import { ImpactSection } from "@/components/sections/impactSection";
import { EventSchedule } from "@/components/sections/eventSchedule";
import { SponsorSection } from "@/components/sections/sponsorSect";
import { FAQSection } from "@/components/sections/faq";
import { CTA } from "@/components/sections/CTA";
import { Newsletter } from "@/components/sections/newsletter";

export default function LandingPage() {
  // const router = useRouter();
  // const { isAuthenticated, sessionStatus } = useAuth();

  // useEffect(() => {
  //   // Wait until auth resolves before redirecting
  //   if (sessionStatus === "restored" && isAuthenticated) {
  //     router.replace("/home");
  //   }
  // }, [sessionStatus, router, isAuthenticated]);

  // // Show nothing while auth is resolving to prevent flash
  // if (sessionStatus === "pending") return null;

  // // Authenticated — redirect in progress, don't flash landing page
  // if (isAuthenticated) return null;

  return (
    <main
      className={cn(
        "flex",
        "flex-col",
        "p-5 gap-5",
        "pt-[90px]",
        "items-center",
        "justify-center",
        "w-screen",
        "min-h-screen",
      )}
    >
      <Banner />
      <Hero />
      <TrustBar />
      <AboutSection />
      <ProgramsSection />
      <EventSchedule />
      <UpcomingEvent />
      <PastEventsSection />
      <Testimonials />
      <ImpactSection />
      <SponsorSection />
      <FAQSection />
      <CTA />
      <Newsletter />
    </main>
  );
}
