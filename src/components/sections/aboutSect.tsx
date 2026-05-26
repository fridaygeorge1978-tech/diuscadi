"use client";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import { Target, Lightbulb, Users2, Rocket, BookOpen, Globe } from "lucide-react";
import mentor from "@/assets/img/downloads/Dr-Ikechukwu-Umeh-1440x1920.jpg";

const PROGRAMMES = [
  "DIUSCADI Women in Tech & Enterprise",
  "DIUSCADI Agro-Youth Empowerment Scheme",
  "DIUSCADI Graduate Skills & Employment Readiness",
  "DIUSCADI Community Outreach & Empowerment",
];

const FOCUS_AREAS = [
  { icon: Target, label: "Career Development & Mentorship" },
  { icon: BookOpen, label: "Digital Skills & ICT Training" },
  { icon: Rocket, label: "Entrepreneurship & Startup Support" },
  { icon: Globe, label: "Financial Literacy & Wealth Creation" },
];

export const AboutSection = () => {
  return (
    <section className={cn("w-full rounded-2xl py-24 bg-background overflow-hidden")}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* LEFT: Founder image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative hover:scale-102 lg:hover:scale-105 duration-700 ease-in-out transition-all"
          >
            <div className="relative w-full aspect-4/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <Image src={mentor} alt="Prof. Ikechukwu I. Umeh, Founder of DIUSCADI" fill className="object-cover" />
            </div>

            <div className="absolute -bottom-8 -right-4 md:-right-8 p-6 max-w-xs rounded-2xl bg-background/10 backdrop-blur-xl border border-background/20 shadow-2xl hover:bg-black/60 transition-all duration-500 group">
              <p className="text-background font-bold text-lg leading-tight">
                Prof. Ikechukwu Umeh
              </p>
              <p className="text-background/70 text-sm mt-1">
                FNCS, FIPMD · Founder & Convener, DIUSCADI
              </p>
              <p className="text-background/50 text-xs mt-1">
                HOD, Information Technology, UNIZIK
              </p>
              <div className="mt-3 h-1 w-12 bg-primary rounded-full" />
            </div>
          </motion.div>

          {/* RIGHT: Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h4 className="text-primary font-bold tracking-widest uppercase text-sm">
                Founded 2020 · UNIZIK, Awka
              </h4>
              <h2 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight">
                Turn Your Skills into Wealth for{" "}
                <span className="text-secondary">Life After School</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Life after tertiary education is not a bed of roses. With rising
                unemployment and a harsh labour market, many graduates find themselves
                unprepared. <strong>DIUSCADI</strong> was born in 2020 to change that
                narrative — through practical training, mentorship, and real-world
                career connections.
              </p>
            </div>

            {/* Mission & Vision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-muted border border-border hover:border-primary/30 hover:scale-105 scale-100 duration-500 transition-all ease-in-out">
                <Target className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-bold text-xl mb-2 text-foreground">Our Mission</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  To bridge the gap between academia and professionalism — equipping
                  students with practical skills, mentorship, and employment
                  opportunities for life after school.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-muted border border-border hover:border-primary/30 hover:scale-105 scale-100 duration-500 transition-all ease-in-out">
                <Lightbulb className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-bold text-xl mb-2 text-foreground">Our Vision</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  To empower the next generation of leaders, innovators, and
                  entrepreneurs — preparing young Nigerians not just for jobs, but for
                  leadership and nation-building.
                </p>
              </div>
            </div>

            {/* Programmes */}
            <div className="space-y-3">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                Active Programmes
              </p>
              <div className="flex flex-col gap-2">
                {PROGRAMMES.map((p) => (
                  <div key={p} className="flex items-center gap-3">
                    <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                    <p className="text-sm text-muted-foreground">{p}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Who we help */}
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex items-start gap-4">
                <div className="mt-1 shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <Rocket className="w-3 h-3" />
                </div>
                <p className="text-muted-foreground text-sm">
                  <span className="font-bold text-foreground">Who we help: </span>
                  Final-year students and fresh graduates across Nigerian universities,
                  polytechnics, and Colleges of Education.
                </p>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Users2 className="w-3 h-3" />
                </div>
                <p className="text-muted-foreground text-sm">
                  <span className="font-bold text-foreground">The Goal: </span>
                  Transforming academic knowledge into employable skills and
                  entrepreneurial ventures — 5,000+ students trained since 2020.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};