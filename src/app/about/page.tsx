"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Users,
  Target,
  ShieldCheck,
  Globe2,
  BookOpen,
  Award,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Rocket,
  Sprout,
  MonitorSmartphone,
  HeartHandshake,
  Laptop,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import mentor from "@/assets/img/downloads/Dr-Ikechukwu-Umeh-1440x1920.jpg";
import { AboutTeamMember, TeamTier } from "@/lib/models/aboutPageConfig";
import { usePathname } from "next/navigation";

// ─── Config shape for fetched data ───────────────────────────────────────────
interface AboutConfig {
  hero?: { cta1Href?: string; cta2Href?: string };
  cta?: { cta1Href?: string; cta2Href?: string };
  team?: { items: AboutTeamMember[] };
}

/* ─── Data ─────────────────────────────────────────────────────────────────── */

const milestones = [
  {
    year: "2020",
    title: "DIUSCADI Founded",
    desc: "Prof. Chief Ikechukwu I. Umeh established DIUSCADI at Nnamdi Azikiwe University, Awka. The inaugural LASCADSS 1.0 drew students from across Anambra State.",
  },
  {
    year: "2021",
    title: "LASCADSS 2.0 — Growing Reach",
    desc: "The second edition expanded with more participants, new facilitators, and a broader curriculum covering ICT, entrepreneurship, and career readiness.",
  },
  {
    year: "2022",
    title: "LASCADSS 3.0 — Sponsored by PA-CENT Technologies",
    desc: "Corporate sponsorship from PA-CENT Technologies Limited enabled a larger event with exhibitions, workshop stations, and laptop prizes for participants.",
  },
  {
    year: "2023",
    title: "LASCADSS 4.0 — Finalist Launchpad Workshop",
    desc: "Themed 'Finalist Launchpad Workshop for Life After School', this edition introduced deep-dive CV preparation, interview training, and mentorship sessions.",
  },
  {
    year: "2024",
    title: "LASCADSS 5.0 — Turn Your Skills into Wealth",
    desc: "Held at ASUU Secretariat, UNIZIK on 23 August 2024 with the theme 'Turn Your Skills into Wealth for Life After School'. Featured workshops, networking, exhibitions, and gifts. Sponsored by MTN Nigeria and others.",
  },
  {
    year: "2025",
    title: "LASCADSS 6.0 — Navigating Your Career Paths",
    desc: "Themed 'Navigating Your Career Paths in a Dynamic World', the 6th edition featured Tech Up sessions, networking, practical hands-on training, and panel discussions. Now with over 5,000 graduates trained in total.",
  },
];

const values = [
  {
    icon: Target,
    title: "Mission",
    desc: "To bridge the gap between academic learning and real-world opportunities by equipping students and graduates with future-ready skills, career guidance, innovation capacity, and entrepreneurial orientation.",
  },
  {
    icon: Lightbulb,
    title: "Vision",
    desc: "To empower the next generation of leaders, innovators, and entrepreneurs — preparing young Nigerians not just for jobs, but for leadership, innovation, and nation-building.",
  },
  {
    icon: ShieldCheck,
    title: "Integrity",
    desc: "All our programmes are transparently managed. Registration for LASCADSS is 100% free for selected participants. We maintain accountability to our community and partners.",
  },
  {
    icon: Globe2,
    title: "Inclusion",
    desc: "DIUSCADI programmes serve students with disabilities, rural communities, and underserved institutions. Over 200 students with disabilities have benefited from our inclusive career training.",
  },
  {
    icon: Users,
    title: "Community",
    desc: "A growing alumni network across universities and polytechnics in Nigeria, connected via WhatsApp communities for ongoing mentorship, job alerts, and peer support.",
  },
  {
    icon: BookOpen,
    title: "Learning",
    desc: "Continuous skill-building through workshops, bootcamps, seminars, and practical training sessions covering ICT, fashion, agriculture, entrepreneurship, and financial literacy.",
  },
];

const focusAreas = [
  {
    icon: MonitorSmartphone,
    label: "Digital Skills & ICT",
    desc: "Training in hardware, AI, software, and emerging technologies",
  },
  {
    icon: Rocket,
    label: "Entrepreneurship",
    desc: "Business incubation and startup support for young founders",
  },
  {
    icon: HeartHandshake,
    label: "Career Mentorship",
    desc: "Personalised coaching and guidance from industry professionals",
  },
  {
    icon: Sprout,
    label: "Agriculture & Livelihood",
    desc: "Training on modern farming, livestock, and agro-enterprise",
  },
  {
    icon: Globe2,
    label: "Financial Literacy",
    desc: "Investment strategies, business finance, and SMART money management",
  },
  {
    icon: ShieldCheck,
    label: "Leadership Development",
    desc: "Building confident, visionary, and impact-driven young leaders",
  },
  {
    icon: Target,
    label: "Career Development & Mentorship",
    desc: "Personalised coaching and career guidance from top industry professionals.",
  },
  {
    icon: Laptop,
    label: "Digital Skills & Innovation",
    desc: "Training in ICT, hardware, AI, and emerging technologies.",
  },
  {
    icon: Briefcase,
    label: "Internships & Job Placements",
    desc: "Connecting students to internships, graduate trainee programmes, and job opportunities.",
  },
  {
    icon: TrendingUp,
    label: "Entrepreneurship & Start-Up Support",
    desc: "Business incubation and training for young entrepreneurs.",
  },
  {
    icon: GraduationCap,
    label: "Financial Literacy & Wealth Creation",
    desc: "Investment strategies, business finance, and SMART money management.",
  },
  {
    icon: Users,
    label: "Women in Tech & Agriculture",
    desc: "Hands-on training in fashion, agro-empowerment, and STEM fields for women.",
  },
];

const stats = [
  { value: "5,000+", label: "Students Trained" },
  { value: "6", label: "LASCADSS Editions" },
  { value: "2,500+", label: "Jobs & Internships" },
  { value: "100+", label: "Startups Launched" },
];

const sdgs = [
  {
    num: "4",
    label: "Quality Education",
    desc: "Equipping students with relevant skills & knowledge.",
  },
  {
    num: "8",
    label: "Decent Work & Economic Growth",
    desc: "Creating job opportunities & entrepreneurial success.",
  },
  {
    num: "9",
    label: "Industry, Innovation & Infrastructure",
    desc: "Fostering tech-driven career development.",
  },
  {
    num: "10",
    label: "Reduced Inequalities",
    desc: "Providing equal opportunities for all students.",
  },
  {
    num: "17",
    label: "Partnerships for the Goals",
    desc: "Collaboration with corporate organisations and institutions.",
  },
];

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex', 'items-center', 'gap-2', 'text-xs', 'font-semibold', 'uppercase', 'tracking-[0.18em]', 'text-primary/80', 'mb-3')}>
      <span className={cn('w-6', 'h-px', 'bg-primary/60', 'rounded-full')} />
      {children}
      <span className={cn('w-6', 'h-px', 'bg-primary/60', 'rounded-full')} />
    </span>
  );
}

function TeamCard({ member }: { member: AboutTeamMember }) {
  const [isHovered, setIsHovered] = React.useState(false);

  const inner = (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "relative w-[300px] group aspect-[3/4] rounded-[2rem] overflow-hidden bg-muted cursor-pointer",
        "border border-border/50 transition-all duration-500 shadow-sm hover:shadow-xl",
      )}
    >
      {/* Background Profile Picture */}
      {member.photoUrl ? (
        <Image
          src={member.photoUrl}
          alt={member.displayName}
          fill
          className={cn(
            "object-cover transition-transform duration-700",
            isHovered ? "scale-110 blur-[2px]" : "scale-100",
          )}
        />
      ) : (
        <div
          className={cn(
            "w-full",
            "h-full",
            "flex",
            "items-center",
            "justify-center",
            "bg-primary/10",
            "text-primary",
            "text-5xl",
            "font-black",
          )}
        >
          {member.displayName.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Gradient Overlay for better text legibility */}
      <div className={cn('absolute', 'inset-0', 'bg-gradient-to-t', 'from-black/60', 'via-transparent', 'to-transparent', 'opacity-60')} />

      {/* Floating Glass Info Card */}
      <motion.div
        initial={false}
        animate={{
          height: isHovered ? "auto" : "85px",
          maxHeight: isHovered ? "80%" : "85px",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "absolute -bottom-[70%] mr-6 inset-x-3 glass glass-shine rounded-[1.5rem] p-4",
          "flex flex-col justify-start overflow-hidden backdrop-blur-md z-20",
        )}
      >
        <div className="shrink-0">
          <p
            className={cn(
              "text-sm md:text-base font-black text-foreground leading-tight line-clamp-1",
            )}
          >
            {member.displayName}
          </p>
          <div className={cn("flex flex-wrap gap-1 mt-1")}>
            <span
              className={cn(
                "text-[9px] font-bold uppercase tracking-wider text-primary",
              )}
            >
              {member.professionalTitle}
            </span>
          </div>
        </div>

        {/* Revealed Content on Hover */}
        <motion.div
          animate={{ opacity: isHovered ? 1 : 0 }}
          className={cn(
            "mt-3 space-y-3 pt-3 border-t border-border/30 overflow-y-auto no-scrollbar",
          )}
        >
          {member.shortBio && (
            <p
              className={cn(
                "text-[11px] text-muted-foreground leading-relaxed line-clamp-4",
              )}
            >
              {member.shortBio}
            </p>
          )}

          <div
            className={cn(
              "flex items-center gap-2 text-[10px] font-bold text-primary",
            )}
          >
            View Full Profile <ArrowRight size={12} />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );

  if (member.userId) {
    return (
      <a href={`/users/${member.userId}`} className={cn("block h-full")}>
        {inner}
      </a>
    );
  }
  return <div className={cn('h-full', 'w-full')}>{inner}</div>;
}


function withRedirect(href: string, currentPath: string): string {
  if (!href || href.startsWith("#")) return href; // anchor links — no redirect needed
  if (href === "/auth" || href.startsWith("/auth?")) {
    return `/auth?redirect=${encodeURIComponent(currentPath)}`;
  }
  return href;
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export default function AboutPage() {
  const pathname = usePathname();
  const [config, setConfig] = useState<AboutConfig>({});

  useEffect(() => {
    fetch("/api/public/about")
      .then((r) => r.json())
      .then(setConfig)
      .catch(console.error);
  }, []);

  const team = config?.team?.items ?? [];
  const visibleTeam = team.filter((m: AboutTeamMember) => m.visible);

  const hero = config?.hero ?? null; // add this
  const cta = config?.cta ?? null; // add this

  return (
    <main
      className={cn(
        "min-h-screen",
        "pt-28",
        "pb-20",
        "px-4",
        "sm:px-6",
        "max-w-7xl",
        "mx-auto",
        "space-y-32",
      )}
    >
      {/* ── Hero ── */}
      <section
        className={cn(
          "relative",
          "text-center",
          "space-y-6",
          "max-w-4xl",
          "mx-auto",
        )}
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none",
            "absolute",
            "-top-16",
            "left-1/2",
            "-translate-x-1/2",
            "w-[520px]",
            "h-[520px]",
            "rounded-full",
            "border",
            "border-primary/10",
            "blur-sm",
          )}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionLabel>About DIUSCADI</SectionLabel>
          <h1
            className={cn(
              "text-5xl",
              "md:text-7xl",
              "font-black",
              "tracking-tight",
              "leading-[1.05]",
              "mt-2",
            )}
          >
            Shaping the Young for{" "}
            <span className="text-primary">Future Career Success</span>
          </h1>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.6 }}
          className={cn(
            "text-muted-foreground",
            "text-lg",
            "md:text-xl",
            "leading-relaxed",
            "max-w-2xl",
            "mx-auto",
          )}
        >
          DIUSCADI (Digitized Initiative for Up-Skilling Career Development and
          Innovation) is a non-profit initiative domiciled at Nnamdi Azikiwe
          University, Awka, Anambra State. Since 2020, we have been empowering
          final-year students and fresh graduates to discover their potential,
          build meaningful careers, and contribute positively to society.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className={cn("flex", "flex-wrap", "justify-center", "gap-4", "pt-2")}
        >
          <a
            href={withRedirect(
              hero?.cta1Href ?? "#mission",
              pathname ?? "/about",
            )}
            className={cn(
              "inline-flex",
              "items-center",
              "gap-2",
              "px-6",
              "py-3",
              "rounded-2xl",
              "bg-primary",
              "text-primary-foreground",
              "font-semibold",
              "text-sm",
              "hover:opacity-90",
              "transition-opacity",
            )}
          >
            Our Mission <ArrowRight size={16} />
          </a>
          <a
            href={withRedirect(
              hero?.cta2Href ?? "#lascadss",
              pathname ?? "/about",
            )}
            className={cn(
              "inline-flex",
              "items-center",
              "gap-2",
              "px-6",
              "py-3",
              "rounded-2xl",
              "glass",
              "font-semibold",
              "text-sm",
              "hover:bg-muted",
              "transition-colors",
            )}
          >
            LASCADSS Programme
          </a>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <FadeIn>
        <div
          className={cn(
            "glass",
            "rounded-3xl",
            "px-6",
            "py-8",
            "grid",
            "grid-cols-2",
            "md:grid-cols-4",
            "divide-x",
            "divide-border/60",
          )}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                "flex-col",
                "items-center",
                "text-center",
                "px-4",
                "gap-1",
              )}
            >
              <span
                className={cn(
                  "text-3xl",
                  "md:text-4xl",
                  "font-black",
                  "text-primary",
                )}
              >
                {s.value}
              </span>
              <span
                className={cn(
                  "text-xs",
                  "text-muted-foreground",
                  "font-medium",
                  "uppercase",
                  "tracking-widest",
                )}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* ── Founder & Story ── */}
      <section
        className={cn("grid", "md:grid-cols-2", "gap-12", "items-center")}
      >
        <FadeIn className="space-y-5">
          <SectionLabel>Our Story</SectionLabel>
          <h2
            className={cn(
              "text-3xl",
              "md:text-4xl",
              "font-bold",
              "leading-tight",
            )}
          >
            Born from a conviction: every graduate deserves to be prepared for
            what comes after school.
          </h2>
          <p className={cn("text-muted-foreground", "leading-relaxed")}>
            DIUSCADI was founded in 2020 by Professor (Chief) Ikechukwu Innocent
            Umeh, FNCS, FIPMD — Head of Department, Information Technology, at
            Nnamdi Azikiwe University, Awka. Driven by the rising unemployment
            rate among Nigerian graduates and a harsh labour market, Prof. Umeh
            established DIUSCADI to change that narrative.
          </p>
          <p className={cn("text-muted-foreground", "leading-relaxed")}>
            Through the Life After School Career Development Seminar Series
            (LASCADSS), DIUSCADI has run 6 editions since 2020, training over
            5,000 graduates from universities and polytechnics across Anambra
            State. We are expanding our reach to include undergraduates before
            they participate in Industrial Training (IT/SIWES).
          </p>
          <p className={cn("text-muted-foreground", "leading-relaxed")}>
            Our programmes focus on career development, digital and
            technological skills, entrepreneurship, sustainable livelihood, and
            leadership development — always with 100% free participation for
            selected final-year students.
          </p>
        </FadeIn>

        <FadeIn delay={0.15} className={cn("relative", "hidden", "md:block")}>
          <div
            className={cn(
              "glass",
              "rounded-3xl",
              "absolute",
              "inset-0",
              "rotate-3",
              "opacity-40",
            )}
          />
          <div
            className={cn(
              "glass",
              "rounded-3xl",
              "absolute",
              "inset-0",
              "-rotate-2",
              "opacity-60",
            )}
          />
          <div
            className={cn(
              "glass",
              "glass-shine",
              "rounded-3xl",
              "absolute",
              "inset-0",
              "flex",
              "flex-col",
              "justify-end",
              "p-8",
              "space-y-3",
              "overflow-hidden",
            )}
          >
            <div className={cn("absolute", "inset-0")}>
              <Image
                src={mentor}
                alt="Prof. Chief Ikechukwu I. Umeh"
                fill
                className={cn("object-cover", "opacity-30")}
              />
            </div>
            <div className={cn("relative", "z-10")}>
              <Award size={36} className={cn("text-primary", "mb-4")} />
              <p className={cn("text-xl", "font-bold", "leading-snug")}>
                &quot;We are preparing young people for leadership, innovation,
                and nation-building — not just jobs.&quot;
              </p>
              <p className={cn("text-sm", "text-muted-foreground", "mt-3")}>
                — Prof. Chief Ikechukwu I. Umeh, FNCS, FIPMD · Founder, DIUSCADI
                · HOD Information Technology, UNIZIK
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Mission / Vision / Values ── */}
      <section id="mission" className="space-y-10">
        <FadeIn className={cn("text-center", "space-y-2")}>
          <SectionLabel>What We Stand For</SectionLabel>
          <h2 className={cn("text-3xl", "md:text-4xl", "font-bold")}>
            Mission, Vision & Values
          </h2>
        </FadeIn>
        <div
          className={cn("grid", "sm:grid-cols-2", "lg:grid-cols-3", "gap-5")}
        >
          {values.map((item, i) => (
            <FadeIn key={i} delay={i * 0.07}>
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className={cn(
                  "glass",
                  "glass-shine",
                  "rounded-3xl",
                  "p-7",
                  "h-full",
                  "space-y-4",
                )}
              >
                <div
                  className={cn(
                    "w-11",
                    "h-11",
                    "rounded-2xl",
                    "bg-primary/10",
                    "flex",
                    "items-center",
                    "justify-center",
                    "text-primary",
                  )}
                >
                  <item.icon size={22} />
                </div>
                <h3 className={cn("text-lg", "font-bold")}>{item.title}</h3>
                <p
                  className={cn(
                    "text-sm",
                    "text-muted-foreground",
                    "leading-relaxed",
                  )}
                >
                  {item.desc}
                </p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Focus Areas ── */}
      <section id="lascadss" className="space-y-10">
        <FadeIn className={cn("text-center", "space-y-2")}>
          <SectionLabel>Programme Focus Areas</SectionLabel>
          <h2 className={cn("text-3xl", "md:text-4xl", "font-bold")}>
            What DIUSCADI Does
          </h2>
          <p
            className={cn(
              "text-muted-foreground",
              "max-w-xl",
              "mx-auto",
              "text-sm",
            )}
          >
            Our programmes span multiple domains to prepare graduates for every
            path — employment, entrepreneurship, or further education.
          </p>
        </FadeIn>
        <div
          className={cn("grid", "sm:grid-cols-2", "lg:grid-cols-3", "gap-5")}
        >
          {focusAreas.map((area, i) => (
            <FadeIn key={i} delay={i * 0.07}>
              <div
                className={cn(
                  "glass",
                  "rounded-3xl",
                  "p-6",
                  "h-full",
                  "space-y-3",
                  "hover:border-primary/30",
                  "transition-colors",
                )}
              >
                <div
                  className={cn(
                    "w-10",
                    "h-10",
                    "rounded-xl",
                    "bg-primary/10",
                    "flex",
                    "items-center",
                    "justify-center",
                    "text-primary",
                  )}
                >
                  <area.icon size={20} />
                </div>
                <h3 className={cn("font-bold", "text-base")}>{area.label}</h3>
                <p
                  className={cn(
                    "text-sm",
                    "text-muted-foreground",
                    "leading-relaxed",
                  )}
                >
                  {area.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── LASCADSS Timeline ── */}
      <section className="space-y-10">
        <FadeIn className={cn("text-center", "space-y-2")}>
          <SectionLabel>LASCADSS History</SectionLabel>
          <h2 className={cn("text-3xl", "md:text-4xl", "font-bold")}>
            Six Editions. One Mission.
          </h2>
          <p
            className={cn(
              "text-muted-foreground",
              "max-w-xl",
              "mx-auto",
              "text-sm",
            )}
          >
            From a single seminar in 2020 to a nationally recognised career
            development platform in 2025.
          </p>
        </FadeIn>

        <div className={cn("relative", "space-y-0")}>
          <div
            className={cn(
              "absolute",
              "left-[calc(50%-1px)]",
              "top-0",
              "bottom-0",
              "w-px",
              "bg-border",
              "hidden",
              "md:block",
            )}
          />
          {milestones.map((m, i) => {
            const isLeft = i % 2 === 0;
            return (
              <FadeIn
                key={i}
                delay={i * 0.08}
                className={cn(
                  "md:grid",
                  "md:grid-cols-2",
                  "md:gap-10",
                  "relative",
                  "mb-10",
                  "last:mb-0",
                )}
              >
                <div
                  className={cn(
                    "",
                    isLeft ? "md:pr-8 md:text-right" : "md:col-start-2 md:pl-8",
                  )}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={cn(
                      "glass",
                      "rounded-3xl",
                      "p-6",
                      "space-y-2",
                      "inline-block",
                      "w-full",
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs",
                        "font-bold",
                        "text-primary",
                        "uppercase",
                        "tracking-widest",
                      )}
                    >
                      {m.year}
                    </span>
                    <h4 className={cn("text-lg", "font-bold")}>{m.title}</h4>
                    <p
                      className={cn(
                        "text-sm",
                        "text-muted-foreground",
                        "leading-relaxed",
                      )}
                    >
                      {m.desc}
                    </p>
                  </motion.div>
                </div>
                <div
                  className={cn(
                    "absolute",
                    "left-1/2",
                    "top-6",
                    "-translate-x-1/2",
                    "w-4",
                    "h-4",
                    "rounded-full",
                    "bg-primary",
                    "border-4",
                    "border-background",
                    "hidden",
                    "md:block",
                    "z-10",
                  )}
                />
                {isLeft && <div className={cn("hidden", "md:block")} />}
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* ── SDG Alignment ── */}
      <section className="space-y-8">
        <FadeIn className={cn("text-center", "space-y-2")}>
          <SectionLabel>UN Sustainable Development Goals</SectionLabel>
          <h2 className={cn("text-3xl", "font-bold")}>
            Driving Sustainable Development
          </h2>
          <p
            className={cn(
              "text-muted-foreground",
              "max-w-xl",
              "mx-auto",
              "text-sm",
            )}
          >
            DIUSCADI&apos;s mission directly aligns with the United Nations SDGs
            by fostering inclusive education, economic empowerment, and
            sustainable community development.
          </p>
        </FadeIn>
        <FadeIn>
          <div className={cn("glass", "rounded-3xl", "p-8")}>
            <div
              className={cn(
                "grid",
                "grid-cols-1",
                "sm:grid-cols-2",
                "md:grid-cols-3",
                "lg:grid-cols-5",
                "gap-4",
              )}
            >
              {sdgs.map((sdg, i) => (
                <div
                  key={i}
                  className={cn(
                    "glass-subtle",
                    "rounded-2xl",
                    "p-5",
                    "text-center",
                    "space-y-2",
                  )}
                >
                  <div
                    className={cn(
                      "w-12",
                      "h-12",
                      "bg-primary/10",
                      "rounded-xl",
                      "flex",
                      "items-center",
                      "justify-center",
                      "mx-auto",
                    )}
                  >
                    <span
                      className={cn("text-primary", "font-black", "text-xl")}
                    >
                      {sdg.num}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-xs",
                      "font-bold",
                      "text-foreground",
                      "leading-tight",
                    )}
                  >
                    {sdg.label}
                  </p>
                  <p
                    className={cn(
                      "text-[10px]",
                      "text-muted-foreground",
                      "leading-relaxed",
                    )}
                  >
                    {sdg.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Partners ── */}
      <section className="space-y-8">
        <FadeIn className={cn("text-center", "space-y-2")}>
          <SectionLabel>Partners & Sponsors</SectionLabel>
          <h2 className={cn("text-3xl", "font-bold")}>
            Supported by Leading Organisations
          </h2>
        </FadeIn>
        <FadeIn>
          <div className={cn("glass", "rounded-3xl", "p-8")}>
            <div
              className={cn(
                "grid",
                "grid-cols-2",
                "sm:grid-cols-3",
                "md:grid-cols-4",
                "gap-6",
                "items-center",
                "text-center",
              )}
            >
              {[
                "MTN Nigeria",
                "Airtel Nigeria",
                "PA-CENT Technologies Limited",
                "AICIC",
                "Codex Microsystems",
                "Nnamdi Azikiwe University",
                "ASUU, UNIZIK",
                "Anambra State Government",
                "Ministry of Communications",
                "Corporate Sponsors (LASCADSS 7.0 — Open)",
              ].map((partner, i) => (
                <div
                  key={i}
                  className={cn(
                    "glass-subtle",
                    "rounded-2xl",
                    "px-4",
                    "py-4",
                    "text-xs",
                    "font-semibold",
                    "text-muted-foreground",
                    "hover:text-foreground",
                    "transition-colors",
                  )}
                >
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Team ── */}
      {visibleTeam.length > 0 && (
        <section className="space-y-10">
          <FadeIn className={cn("text-center", "space-y-2")}>
            <SectionLabel>The People Behind DIUSCADI</SectionLabel>
            <h2 className={cn("text-3xl", "md:text-4xl", "font-bold")}>
              Our Team
            </h2>
            <p
              className={cn(
                "text-muted-foreground",
                "max-w-xl",
                "mx-auto",
                "text-sm",
              )}
            >
              The dedicated individuals who make DIUSCADI&apos;s mission a
              reality.
            </p>
          </FadeIn>

          {(["leadership", "core", "volunteer"] as TeamTier[]).map((tier) => {
            const members = visibleTeam.filter((m) => m.tier === tier);
            if (members.length === 0) return null;

            const tierLabel: Record<TeamTier, string> = {
              leadership: "Leadership",
              core: "Core Team",
              volunteer: "Volunteer Team",
            };

            return (
              <div key={tier} className="space-y-4">
                <h3
                  className={cn(
                    "text-sm",
                    "font-black",
                    "uppercase",
                    "tracking-widest",
                    "text-muted-foreground",
                    "pl-1",
                  )}
                >
                  {tierLabel[tier]}
                </h3>
                <div
                  className={cn(
                    "grid",
                    "grid-cols-2",
                    "sm:grid-cols-3",
                    "md:grid-cols-4", // was lg:grid-cols-5
                    "gap-5",
                  )}
                >
                  {members.map((member, i) => (
                    <FadeIn key={member.id} delay={i * 0.05}>
                      <TeamCard member={member} />
                    </FadeIn>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ── CTA ── */}
      <FadeIn>
        <div
          className={cn(
            "glass",
            "glass-shine",
            "rounded-3xl",
            "p-10",
            "md:p-14",
            "text-center",
            "space-y-5",
            "relative",
            "overflow-hidden",
          )}
        >
          <div
            aria-hidden
            className={cn(
              "pointer-events-none",
              "absolute",
              "-top-20",
              "-right-20",
              "w-72",
              "h-72",
              "rounded-full",
              "bg-primary/10",
              "blur-3xl",
            )}
          />
          <TrendingUp size={36} className={cn("text-primary", "mx-auto")} />
          <h3 className={cn("text-3xl", "md:text-4xl", "font-black")}>
            Ready to shape your future?
          </h3>
          <p
            className={cn(
              "text-muted-foreground",
              "max-w-lg",
              "mx-auto",
              "text-sm",
              "leading-relaxed",
            )}
          >
            Join thousands of students and graduates who have transformed their
            academic knowledge into career success through DIUSCADI&apos;s
            programmes. Whether you are a student, graduate, mentor, partner, or
            supporter — DIUSCADI welcomes you.
          </p>
          <div
            className={cn(
              "flex",
              "flex-wrap",
              "justify-center",
              "gap-4",
              "pt-2",
            )}
          >
            <a
              href={withRedirect(
                cta?.cta1Href ?? "/auth",
                pathname ?? "/about",
              )}
              className={cn(
                "inline-flex",
                "items-center",
                "gap-2",
                "px-8",
                "py-3.5",
                "rounded-2xl",
                "bg-primary",
                "text-primary-foreground",
                "font-semibold",
                "text-sm",
                "hover:opacity-90",
                "transition-opacity",
              )}
            >
              Join DIUSCADI <ArrowRight size={16} />
            </a>
            <a
              href={withRedirect(
                cta?.cta2Href ?? "/contact",
                pathname ?? "/about",
              )}
              className={cn(
                "inline-flex",
                "items-center",
                "gap-2",
                "px-8",
                "py-3.5",
                "rounded-2xl",
                "glass",
                "font-semibold",
                "text-sm",
                "hover:bg-muted",
                "transition-colors",
              )}
            >
              Partner With Us
            </a>
          </div>
        </div>
      </FadeIn>
    </main>
  );
}
