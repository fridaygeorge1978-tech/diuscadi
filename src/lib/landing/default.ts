// Fallback data — mirrors the shape your existing components already use.
// Each component checks if its config prop is undefined and uses these instead.

export const defaultBannerSlides = [
  {
    id: "default-1",
    type: "custom" as const,
    imageUrl: "", // banner.tsx will fall back to its local static import
    title: "LASCADSS 7.0 — Coming 2026",
    subtitle: "Life After School Career Development Seminar Series",
    ctaLabel: "Register Now",
    ctaHref: "/auth",
    hidden: false,
    order: 0,
  },
];

export const defaultInitiative = {
  sectionTitle: "LASCADSS Class of 2025",
  yearLabel: "2025",
  photos: [] as { id: string; imageUrl: string; order: number }[],
};

export const defaultValidators = [
  {
    id: "v1",
    name: "University of Lagos",
    logoUrl: "",
    category: "academia" as const,
    order: 0,
  },
  {
    id: "v2",
    name: "Covenant University",
    logoUrl: "",
    category: "academia" as const,
    order: 1,
  },
  {
    id: "v3",
    name: "Google Africa",
    logoUrl: "",
    category: "industry" as const,
    order: 2,
  },
  {
    id: "v4",
    name: "Microsoft",
    logoUrl: "",
    category: "industry" as const,
    order: 3,
  },
  {
    id: "v5",
    name: "Lagos State University",
    logoUrl: "",
    category: "academia" as const,
    order: 4,
  },
];

export const defaultMission = {
  photoUrl: "", // aboutSect.tsx uses its local static import as fallback
  name: "Ikechukwu Innocent Umeh",
  title: "Founder & Convener, DIUSCADI",
  writeup:
    "DIUSCADI was born from a simple conviction: no Nigerian student should leave university unprepared for life after school. Since 2020, we have worked tirelessly to bridge the gap between classroom learning and real-world career readiness — through practical training, mentorship, and industry exposure.",
};

export const defaultWorkshopTopics = [
  {
    id: "w1",
    topic: "CV and Interview Presentations",
    expertName: "Prof A.F Nwofor",
    icon: "📄",
    order: 0,
  },
  {
    id: "w2",
    topic: "Solar Systems and CCTVs",
    expertName: "Ikechukwu Kenneth Nwachukwu",
    icon: "⚡",
    order: 1,
  },
  {
    id: "w3",
    topic: "ICT Prospects for Fresh Graduates",
    expertName: "Chukwuemeka Fred Agbata (CFA)",
    icon: "💻",
    order: 2,
  },
  {
    id: "w4",
    topic: "Further Studies After School",
    expertName: "Comr. Okechukwu F. Cyril-Nwuche",
    icon: "🎓",
    order: 3,
  },
];

export const defaultTestimonials = {
  videoUrl: "",
  videoType: "youtube" as const,
  items: [
    {
      id: "t1",
      name: "Stephanie Nkamigbo",
      role: "Participant & Organiser, LASCADSS",
      edition: "LASCADSS 2.0",
      quote:
        "Being part of DIUSCADI was an amazing opportunity. The Finalist Launchpad Workshop gave me insight into what life after school really looks like.",
      order: 0,
    },
    {
      id: "t2",
      name: "Okoro Esther Chiamaka",
      role: "Graduate Participant",
      edition: "LASCADSS 2023",
      quote:
        "DIUSCADI taught me that one needs little to no capital to start — for example, in digital marketing.",
      order: 1,
    },
    {
      id: "t3",
      name: "Mbah Divine Chinecherem",
      role: "Teacher & LASCADSS Attendee",
      edition: "LASCADSS 5.0",
      quote:
        "The last edition helped me understand the job market better. I was able to network more and connect with potential mentors.",
      order: 2,
    },
    {
      id: "t4",
      name: "Azubike Desiree",
      role: "Participant",
      edition: "LASCADSS 4.0",
      quote:
        "I personally gained practical knowledge in solar panel installation and digital marketing.",
      order: 3,
    },
  ],
};

export const defaultSupport = [
  {
    id: "s1",
    name: "Airtel",
    logoUrl: "",
    tier: "headline" as const,
    order: 0,
  },
  { id: "s2", name: "MTN", logoUrl: "", tier: "gold" as const, order: 1 },
  {
    id: "s3",
    name: "1960 Laundry",
    logoUrl: "",
    tier: "silver" as const,
    order: 2,
  },
  {
    id: "s4",
    name: "Codex Microsystem",
    logoUrl: "",
    tier: "partner" as const,
    order: 3,
  },
  {
    id: "s5",
    name: "RADOPIN",
    logoUrl: "",
    tier: "partner" as const,
    order: 4,
  },
  {
    id: "s6",
    name: "Lovebite",
    logoUrl: "",
    tier: "partner" as const,
    order: 5,
  },
  { id: "s7", name: "AICIC", logoUrl: "", tier: "partner" as const, order: 6 },
];
