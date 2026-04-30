"use client";
import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Briefcase,
  Mic,
  Users,
  TicketCheck,
  ShieldCheck,
  BookOpen,
  ChevronRight,
} from "lucide-react";

import nwafor from "@/assets/img/downloads/Prof.-Nwofor.webp";
import ikechukwu from "@/assets/img/downloads/Ikechukwu_kenneth.jpeg";
import fred from "@/assets/img/downloads/Chukwu_Emeka_Fred.jpeg";
import Okechukwu from "@/assets/img/downloads/Okechukwu-Ferdinand.webp";

// --- DATA ---
const FEATURES = [
  {
    id: 1,
    title: "Hands-on Workshops",
    desc: "Tailored to today's job market realities.",
    icon: Briefcase,
  },
  {
    id: 2,
    title: "Expert Speakers",
    desc: "Learn from leaders across various industries.",
    icon: Mic,
  },
  {
    id: 3,
    title: "Network & Mentorship",
    desc: "Connect with like-minded peers and mentors.",
    icon: Users,
  },
  {
    id: 4,
    title: "Free Participation",
    desc: "100% free registration and attendance.",
    icon: TicketCheck,
  },
  {
    id: 5,
    title: "Closed Community",
    desc: "Access to exclusive job & growth opportunities.",
    icon: ShieldCheck,
  },
  {
    id: 6,
    title: "Exclusive Resources",
    desc: "Tools and guides to accelerate your career.",
    icon: BookOpen,
  },
];

const PROGRAMS = [
  {
    id: "cv-interview",
    topic: "CV and Interview Presentations",
    speaker: "Prof A.F Nwofor",
    role: "Information Management Consultant",
    image: nwafor, // Replace with actual image
    bio: "Florence has over 32 years of experience in Information and Knowledge Management in the higher education industry. She is well versed in issues of collection and preservation of indigenous knowledge, oral history, and culture, positioning her as a seasoned consultant.",
  },
  {
    id: "solar-cctv",
    topic: "Solar Systems and CCTVs",
    speaker: "Ikechukwu Kenneth Nwachukwu",
    role: "Tech Evangelist & Director, Codex Microsystem",
    image: ikechukwu,
    bio: "A renowned Tech Evangelist specializing in IT Solutions, Solar System Design and Installation, CCTV Camera, and Home/Office Automation. He holds a Diploma in Engineering from Federal Polytechnic Oko and a BSc in Computer Science from Nnamdi Azikiwe University.",
  },
  {
    id: "ict-prospects",
    topic: "ICT Prospects for Fresh Graduates",
    speaker: "Chukwuemeka Fred Agbata (CFA)",
    role: "MD/CEO, Anambra State ICT Agency",
    image: fred,
    bio: "Mr. Chukwuemeka Fred Agbata, widely known as CFA, is a leading voice in Nigeria's tech ecosystem. He currently serves as the MD/CEO of the Anambra State ICT Agency, driving digital transformation and tech adoption.",
  },
  {
    id: "further-studies",
    topic: "Further Studies After School",
    speaker: "Comr. Okechukwu F. Cyril-Nwuche",
    role: "Founder, African Entrepreneurship Foundation",
    image: Okechukwu,
    bio: "Okey Nwuche serves in the Department of Entrepreneurship Studies at Nnamdi Azikiwe University, Awka. As the Founder of the African Entrepreneurship Foundation, Nigeria, he is dedicated to fostering business acumen in young graduates.",
  },
];

export const ProgramsSection = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className={cn('w-full', 'rounded-2xl py-24', 'bg-muted')}>
      <div className={cn('container', 'mx-auto', 'px-6', 'space-y-24')}>
        {/* --- PART 1: FEATURES GRID --- */}
        <div className="space-y-12">
          <div className={cn('text-center', 'max-w-2xl', 'mx-auto', 'space-y-4')}>
            <h4 className={cn('text-primary', 'font-bold', 'tracking-widest', 'uppercase', 'text-sm')}>
              Why should you attend #LASCDSS5?
            </h4>
            <h2 className={cn('text-3xl', 'md:text-5xl', 'font-extrabold', 'text-foreground')}>
              Career Growth Starts Here.
            </h2>
          </div>

          <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6')}>
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn('bg-background', 'p-6', 'rounded-2xl', 'shadow-sm', 'border', 'border-border', 'hover:shadow-md', 'hover:border-primary/20', 'transition-all', 'group')}
                >
                  <div className={cn('w-12', 'h-12', 'bg-primary/10', 'text-primary', 'rounded-xl', 'flex', 'items-center', 'justify-center', 'mb-4', 'group-hover:bg-primary', 'group-hover:text-background', 'transition-colors')}>
                    <Icon className={cn('w-6', 'h-6')} />
                  </div>
                  <h3 className={cn('font-bold', 'text-lg', 'text-foreground', 'mb-2')}>
                    {feature.title}
                  </h3>
                  <p className={cn('text-muted-foreground', 'text-sm', 'leading-relaxed')}>
                    {feature.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* --- PART 2: INTERACTIVE SPEAKERS SECTION --- */}
        <div className="space-y-12">
          <div className={cn('text-center', 'max-w-3xl', 'mx-auto', 'space-y-4')}>
            <h4 className={cn('text-secondary', 'font-bold', 'tracking-widest', 'uppercase', 'text-sm')}>
              2026 Speakers
            </h4>
            <h2 className={cn('text-3xl', 'md:text-5xl', 'font-extrabold', 'text-foreground')}>
              Learn From The Best Minds in the Field
            </h2>
            <p className={cn('text-muted-foreground', 'text-lg')}>
              We’re bringing together the most audacious thinkers, doers, and
              professionals in Nigeria, working in a variety of fields.
            </p>
          </div>

          <div className={cn('grid', 'grid-cols-1', 'lg:grid-cols-12', 'gap-8', 'lg:gap-12', 'items-start')}>
            {/* LEFT: Programs List (Tabs) */}
            <div className={cn('lg:col-span-5', 'flex', 'flex-col', 'gap-3')}>
              {PROGRAMS.map((program, idx) => (
                <button
                  key={program.id}
                  onClick={() => setActiveTab(idx)}
                  className={cn(
                    "text-left p-5 rounded-xl transition-all duration-300 flex items-center justify-between group border",
                    activeTab === idx
                      ? "bg-primary text-background border-primary shadow-lg shadow-primary/20"
                      : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted",
                  )}
                >
                  <div>
                    <p
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wider mb-1",
                        activeTab === idx
                          ? "text-background/80"
                          : "text-muted-foreground group-hover:text-primary",
                      )}
                    >
                      Workshop Topic
                    </p>
                    <h3
                      className={cn(
                        "font-bold text-lg leading-tight",
                        activeTab === idx
                          ? "text-background"
                          : "text-foreground",
                      )}
                    >
                      {program.topic}
                    </h3>
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-5 h-5 transition-transform",
                      activeTab === idx
                        ? "text-background translate-x-1"
                        : "text-slate-300 group-hover:text-primary group-hover:translate-x-1",
                    )}
                  />
                </button>
              ))}
            </div>

            {/* RIGHT: Active Speaker Bio Card (With Glass Effect) */}
            <div className={cn('lg:col-span-7', 'relative', 'min-h-[400px]')}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={cn('bg-background', 'rounded-3xl', 'overflow-hidden', 'shadow-2xl', 'border', 'border-border', 'flex', 'flex-col', 'md:flex-row', 'h-full')}
                >
                  {/* Speaker Image */}
                  <div className={cn('relative', 'w-full', 'md:w-2/5', 'h-64', 'md:h-auto', 'text-muted')}>
                    <Image
                      src={PROGRAMS[activeTab].image}
                      alt={PROGRAMS[activeTab].speaker}
                      fill
                      className="object-cover"
                    />
                    {/* Glass gradient overlay on image */}
                    <div className={cn('absolute', 'inset-0', 'bg-linear-to-t', 'from-black/60', 'via-transparent', 'to-transparent', 'md:hidden')} />
                  </div>

                  {/* Speaker Details */}
                  <div className={cn('p-8', 'md:w-3/5', 'flex', 'flex-col', 'justify-center', 'bg-background', 'relative')}>
                    {/* Decorative quotes background */}
                    <span className={cn('absolute', 'top-4', 'right-4', 'text-6xl', 'text-slate-200', 'font-serif', 'leading-none')}>
                      &quot;
                    </span>

                    <h3 className={cn('text-2xl', 'font-bold', 'text-foreground', 'mb-1')}>
                      {PROGRAMS[activeTab].speaker}
                    </h3>
                    <p className={cn('text-primary', 'font-medium', 'text-sm', 'mb-6')}>
                      {PROGRAMS[activeTab].role}
                    </p>
                    <div className={cn('w-12', 'h-1', 'bg-secondary', 'rounded-full', 'mb-6')} />
                    <p className={cn('text-muted-foreground', 'text-sm', 'leading-relaxed')}>
                      {PROGRAMS[activeTab].bio}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
