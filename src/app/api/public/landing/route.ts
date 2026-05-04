import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import type {
  BannerSlide,
  InitiativeConfig,
  MissionConfig,
  TestimonialsConfig,
  SectionDataMap,
} from "@/lib/models/landingPageConfig";
import {
  defaultBannerSlides,
  defaultInitiative,
  defaultValidators,
  defaultMission,
  defaultWorkshopTopics,
  defaultTestimonials,
  defaultSupport,
} from "@/lib/defaults/landingDef";

export const revalidate = 60;

export async function GET() {
  try {
    const db = await getDb();
    const docs = await Collections.landingPageConfig(db).find({}).toArray();

    const byKey = Object.fromEntries(
      docs.map((d) => [d.sectionKey, d.data]),
    ) as Partial<SectionDataMap>;

    const bannerData = byKey.banner as { slides: BannerSlide[] } | undefined;
    const bannerSlides = bannerData
      ? bannerData.slides.filter((s) => !s.hidden)
      : defaultBannerSlides;

    return NextResponse.json({
      banner: { slides: bannerSlides },
      initiative:
        (byKey.initiative as InitiativeConfig | undefined) ?? defaultInitiative,
      validators: byKey.validators ?? { items: defaultValidators },
      mission: (byKey.mission as MissionConfig | undefined) ?? defaultMission,
      workshopTopics: byKey.workshopTopics ?? { items: defaultWorkshopTopics },
      testimonials:
        (byKey.testimonials as TestimonialsConfig | undefined) ??
        defaultTestimonials,
      support: byKey.support ?? { items: defaultSupport },
    });
  } catch (err) {
    console.error("[/api/public/landing]", err);
    return NextResponse.json({
      banner: { slides: defaultBannerSlides },
      initiative: defaultInitiative,
      validators: { items: defaultValidators },
      mission: defaultMission,
      workshopTopics: { items: defaultWorkshopTopics },
      testimonials: defaultTestimonials,
      support: { items: defaultSupport },
    });
  }
}
