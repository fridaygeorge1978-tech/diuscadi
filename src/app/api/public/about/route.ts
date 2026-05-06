import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import {
  defaultHero,
  defaultStats,
  defaultFounderStory,
  defaultValues,
  defaultFocusAreas,
  defaultTimeline,
  defaultSDGs,
  defaultPartners,
  defaultCTA,
  defaultTeam,
} from "@/lib/defaults/aboutDefault";

export const revalidate = 60;

export async function GET() {
  try {
    const db = await getDb();
    const docs = await Collections.aboutPageConfig(db).find({}).toArray();
    const byKey = Object.fromEntries(docs.map((d) => [d.sectionKey, d.data]));

    return NextResponse.json({
      hero: byKey.hero ?? defaultHero,
      stats: byKey.stats ?? { items: defaultStats },
      founderStory: byKey.founderStory ?? defaultFounderStory,
      values: byKey.values ?? { items: defaultValues },
      focusAreas: byKey.focusAreas ?? { items: defaultFocusAreas },
      timeline: byKey.timeline ?? { items: defaultTimeline },
      team: byKey.team ?? { items: defaultTeam },
      sdgs: byKey.sdgs ?? { items: defaultSDGs },
      partners: byKey.partners ?? { items: defaultPartners },
      cta: byKey.cta ?? defaultCTA,
    });
  } catch (err) {
    console.error("[/api/public/about]", err);
    return NextResponse.json({
      hero: defaultHero,
      stats: { items: defaultStats },
      founderStory: defaultFounderStory,
      values: { items: defaultValues },
      focusAreas: { items: defaultFocusAreas },
      timeline: { items: defaultTimeline },
      team: { items: defaultTeam },
      sdgs: { items: defaultSDGs },
      partners: { items: defaultPartners },
      cta: defaultCTA,
    });
  }
}
