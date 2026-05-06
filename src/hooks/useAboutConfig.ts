import useSWR from "swr";
import type {
  AboutHero,
  AboutStat,
  AboutFounderStory,
  AboutValueCard,
  AboutFocusArea,
  AboutMilestone,
  AboutSDG,
  AboutPartner,
  AboutCTA,
  AboutTeamMember,
} from "@/lib/models/aboutPageConfig";

export interface AboutConfig {
  hero: AboutHero;
  stats: { items: AboutStat[] };
  founderStory: AboutFounderStory;
  values: { items: AboutValueCard[] };
  focusAreas: { items: AboutFocusArea[] };
  timeline: { items: AboutMilestone[] };
  team: { items: AboutTeamMember[] };
  sdgs: { items: AboutSDG[] };
  partners: { items: AboutPartner[] };
  cta: AboutCTA;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useAboutConfig() {
  const { data, error, isLoading } = useSWR<AboutConfig>(
    "/api/public/about",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );
  return { config: data ?? null, isLoading, isError: !!error };
}
