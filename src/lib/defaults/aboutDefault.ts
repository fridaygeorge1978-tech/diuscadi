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

export const defaultHero: AboutHero = {
  headline: "Shaping the Young for",
  headlineAccent: "Future Career Success",
  subtitle:
    "DIUSCADI (Digitized Initiative for Up-Skilling Career Development and Innovation) is a non-profit initiative domiciled at Nnamdi Azikiwe University, Awka, Anambra State. Since 2020, we have been empowering final-year students and fresh graduates to discover their potential, build meaningful careers, and contribute positively to society.",
  cta1Label: "Our Mission",
  cta1Href: "#mission",
  cta2Label: "LASCADSS Programme",
  cta2Href: "#lascadss",
};

export const defaultStats: AboutStat[] = [
  { value: "5,000+", label: "Students Trained" },
  { value: "6", label: "LASCADSS Editions" },
  { value: "2,500+", label: "Jobs & Internships" },
  { value: "100+", label: "Startups Launched" },
];

export const defaultFounderStory: AboutFounderStory = {
  heading:
    "Born from a conviction: every graduate deserves to be prepared for what comes after school.",
  paragraphs: [
    "DIUSCADI was founded in 2020 by Professor (Chief) Ikechukwu Innocent Umeh, FNCS, FIPMD — Head of Department, Information Technology, at Nnamdi Azikiwe University, Awka. Driven by the rising unemployment rate among Nigerian graduates and a harsh labour market, Prof. Umeh established DIUSCADI to change that narrative.",
    "Through the Life After School Career Development Seminar Series (LASCADSS), DIUSCADI has run 6 editions since 2020, training over 5,000 graduates from universities and polytechnics across Anambra State. We are expanding our reach to include undergraduates before they participate in Industrial Training (IT/SIWES).",
    "Our programmes focus on career development, digital and technological skills, entrepreneurship, sustainable livelihood, and leadership development — always with 100% free participation for selected final-year students.",
  ],
  quoteText:
    "We are preparing young people for leadership, innovation, and nation-building — not just jobs.",
  quoteAttribution:
    "Prof. Chief Ikechukwu I. Umeh, FNCS, FIPMD · Founder, DIUSCADI · HOD Information Technology, UNIZIK",
  photoUrl: "", // falls back to local static import in the component
  photoAlt: "Prof. Chief Ikechukwu I. Umeh",
};

export const defaultValues: AboutValueCard[] = [
  {
    id: "v1",
    iconKey: "Target",
    title: "Mission",
    order: 0,
    desc: "To bridge the gap between academic learning and real-world opportunities by equipping students and graduates with future-ready skills, career guidance, innovation capacity, and entrepreneurial orientation.",
  },
  {
    id: "v2",
    iconKey: "Lightbulb",
    title: "Vision",
    order: 1,
    desc: "To empower the next generation of leaders, innovators, and entrepreneurs — preparing young Nigerians not just for jobs, but for leadership, innovation, and nation-building.",
  },
  {
    id: "v3",
    iconKey: "ShieldCheck",
    title: "Integrity",
    order: 2,
    desc: "All our programmes are transparently managed. Registration for LASCADSS is 100% free for selected participants. We maintain accountability to our community and partners.",
  },
  {
    id: "v4",
    iconKey: "Globe2",
    title: "Inclusion",
    order: 3,
    desc: "DIUSCADI programmes serve students with disabilities, rural communities, and underserved institutions. Over 200 students with disabilities have benefited from our inclusive career training.",
  },
  {
    id: "v5",
    iconKey: "Users",
    title: "Community",
    order: 4,
    desc: "A growing alumni network across universities and polytechnics in Nigeria, connected via WhatsApp communities for ongoing mentorship, job alerts, and peer support.",
  },
  {
    id: "v6",
    iconKey: "BookOpen",
    title: "Learning",
    order: 5,
    desc: "Continuous skill-building through workshops, bootcamps, seminars, and practical training sessions covering ICT, fashion, agriculture, entrepreneurship, and financial literacy.",
  },
];

export const defaultFocusAreas: AboutFocusArea[] = [
  {
    id: "f1",
    iconKey: "MonitorSmartphone",
    label: "Digital Skills & ICT",
    order: 0,
    desc: "Training in hardware, AI, software, and emerging technologies",
  },
  {
    id: "f2",
    iconKey: "Rocket",
    label: "Entrepreneurship",
    order: 1,
    desc: "Business incubation and startup support for young founders",
  },
  {
    id: "f3",
    iconKey: "HeartHandshake",
    label: "Career Mentorship",
    order: 2,
    desc: "Personalised coaching and guidance from industry professionals",
  },
  {
    id: "f4",
    iconKey: "Sprout",
    label: "Agriculture & Livelihood",
    order: 3,
    desc: "Training on modern farming, livestock, and agro-enterprise",
  },
  {
    id: "f5",
    iconKey: "Globe2",
    label: "Financial Literacy",
    order: 4,
    desc: "Investment strategies, business finance, and SMART money management",
  },
  {
    id: "f6",
    iconKey: "ShieldCheck",
    label: "Leadership Development",
    order: 5,
    desc: "Building confident, visionary, and impact-driven young leaders",
  },
  {
    id: "f7",
    iconKey: "Target",
    label: "Career Development & Mentorship",
    order: 6,
    desc: "Personalised coaching and career guidance from top industry professionals.",
  },
  {
    id: "f8",
    iconKey: "Laptop",
    label: "Digital Skills & Innovation",
    order: 7,
    desc: "Training in ICT, hardware, AI, and emerging technologies.",
  },
  {
    id: "f9",
    iconKey: "Briefcase",
    label: "Internships & Job Placements",
    order: 8,
    desc: "Connecting students to internships, graduate trainee programmes, and job opportunities.",
  },
  {
    id: "f10",
    iconKey: "TrendingUp",
    label: "Entrepreneurship & Start-Up Support",
    order: 9,
    desc: "Business incubation and training for young entrepreneurs.",
  },
  {
    id: "f11",
    iconKey: "GraduationCap",
    label: "Financial Literacy & Wealth Creation",
    order: 10,
    desc: "Investment strategies, business finance, and SMART money management.",
  },
  {
    id: "f12",
    iconKey: "Users",
    label: "Women in Tech & Agriculture",
    order: 11,
    desc: "Hands-on training in fashion, agro-empowerment, and STEM fields for women.",
  },
];

export const defaultTimeline: AboutMilestone[] = [
  {
    id: "m1",
    year: "2020",
    title: "DIUSCADI Founded",
    order: 0,
    desc: "Prof. Chief Ikechukwu I. Umeh established DIUSCADI at Nnamdi Azikiwe University, Awka. The inaugural LASCADSS 1.0 drew students from across Anambra State.",
  },
  {
    id: "m2",
    year: "2021",
    title: "LASCADSS 2.0 — Growing Reach",
    order: 1,
    desc: "The second edition expanded with more participants, new facilitators, and a broader curriculum covering ICT, entrepreneurship, and career readiness.",
  },
  {
    id: "m3",
    year: "2022",
    title: "LASCADSS 3.0 — Sponsored by PA-CENT",
    order: 2,
    desc: "Corporate sponsorship from PA-CENT Technologies Limited enabled a larger event with exhibitions, workshop stations, and laptop prizes for participants.",
  },
  {
    id: "m4",
    year: "2023",
    title: "LASCADSS 4.0 — Finalist Launchpad",
    order: 3,
    desc: "Themed 'Finalist Launchpad Workshop for Life After School', this edition introduced deep-dive CV preparation, interview training, and mentorship sessions.",
  },
  {
    id: "m5",
    year: "2024",
    title: "LASCADSS 5.0 — Turn Your Skills into Wealth",
    order: 4,
    desc: "Held at ASUU Secretariat, UNIZIK on 23 August 2024. Featured workshops, networking, exhibitions, and gifts. Sponsored by MTN Nigeria and others.",
  },
  {
    id: "m6",
    year: "2025",
    title: "LASCADSS 6.0 — Navigating Your Career Paths",
    order: 5,
    desc: "Themed 'Navigating Your Career Paths in a Dynamic World', the 6th edition featured Tech Up sessions, networking, practical hands-on training, and panel discussions. Over 5,000 graduates trained in total.",
  },
];

export const defaultSDGs: AboutSDG[] = [
  {
    id: "s1",
    num: "4",
    label: "Quality Education",
    order: 0,
    desc: "Equipping students with relevant skills & knowledge.",
  },
  {
    id: "s2",
    num: "8",
    label: "Decent Work & Economic Growth",
    order: 1,
    desc: "Creating job opportunities & entrepreneurial success.",
  },
  {
    id: "s3",
    num: "9",
    label: "Industry, Innovation & Infrastructure",
    order: 2,
    desc: "Fostering tech-driven career development.",
  },
  {
    id: "s4",
    num: "10",
    label: "Reduced Inequalities",
    order: 3,
    desc: "Providing equal opportunities for all students.",
  },
  {
    id: "s5",
    num: "17",
    label: "Partnerships for the Goals",
    order: 4,
    desc: "Collaboration with corporate organisations and institutions.",
  },
];

export const defaultTeam: AboutTeamMember[] = [];

export const defaultPartners: AboutPartner[] = [
  { id: "p1", name: "MTN Nigeria", order: 0 },
  { id: "p2", name: "Airtel Nigeria", order: 1 },
  { id: "p3", name: "PA-CENT Technologies Limited", order: 2 },
  { id: "p4", name: "AICIC", order: 3 },
  { id: "p5", name: "Codex Microsystems", order: 4 },
  { id: "p6", name: "Nnamdi Azikiwe University", order: 5 },
  { id: "p7", name: "ASUU, UNIZIK", order: 6 },
  { id: "p8", name: "Anambra State Government", order: 7 },
  { id: "p9", name: "Ministry of Communications", order: 8 },
  { id: "p10", name: "Corporate Sponsors (LASCADSS 7.0 — Open)", order: 9 },
];

export const defaultCTA: AboutCTA = {
  heading: "Ready to shape your future?",
  subtitle:
    "Join thousands of students and graduates who have transformed their academic knowledge into career success through DIUSCADI's programmes. Whether you are a student, graduate, mentor, partner, or supporter — DIUSCADI welcomes you.",
  cta1Label: "Join DIUSCADI",
  cta1Href: "/auth",
  cta2Label: "Partner With Us",
  cta2Href: "/contact",
};
