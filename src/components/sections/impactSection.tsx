"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  Mic2,
  Hammer,
  Briefcase,
  GraduationCap,
  Users,
  Rocket,
} from "lucide-react";
import { cn } from "../../lib/utils";

const STATS = [
  {
    id: 1,
    label: "Students Trained",
    value: "5,000+",
    subtext: "Through LASCADSS since 2020",
    icon: GraduationCap,
    color: "text-primary",
    border: "border-primary/20",
  },
  {
    id: 2,
    label: "Tech Talents Empowered",
    value: "3,000+",
    subtext: "Digital Skills & IT Training Programs",
    icon: Mic2,
    color: "text-secondary",
    border: "border-secondary/20",
  },
  {
    id: 3,
    label: "Jobs & Internships",
    value: "2,500+",
    subtext: "Placed via Employer Partnerships",
    icon: Briefcase,
    color: "text-blue-400",
    border: "border-blue-400/20",
  },
  {
    id: 4,
    label: "Startups Launched",
    value: "100+",
    subtext: "Through Entrepreneurship Bootcamp",
    icon: Rocket,
    color: "text-green-400",
    border: "border-green-400/20",
  },
  {
    id: 5,
    label: "PWDs Supported",
    value: "200+",
    subtext: "Inclusive Career Training Programs",
    icon: Users,
    color: "text-rose-400",
    border: "border-rose-400/20",
  },
  {
    id: 6,
    label: "Seminar Editions",
    value: "6",
    subtext: "LASCADSS 1.0 — 6.0 (2020–2025)",
    icon: Hammer,
    color: "text-amber-400",
    border: "border-amber-400/20",
  },
];

export const ImpactSection = () => {
  return (
    <section
      className={cn(
        "relative",
        "py-24",
        "bg-[#060C2C]/70",
        "overflow-hidden",
        "w-[99%]",
        "lg:w-[95%]",
        "mt-5",
        "rounded-2xl",
      )}
    >
      <div
        className={cn(
          "absolute",
          "top-0",
          "right-0",
          "w-[500px]",
          "h-[500px]",
          "bg-primary/5",
          "rounded-full",
          "blur-[120px]",
          "-translate-y-1/2",
          "translate-x-1/2",
        )}
      />
      <div
        className={cn(
          "absolute",
          "bottom-0",
          "left-0",
          "w-[500px]",
          "h-[500px]",
          "bg-secondary/5",
          "rounded-full",
          "blur-[120px]",
          "translate-y-1/2",
          "-translate-x-1/2",
        )}
      />

      <div className={cn("container", "relative", "z-10", "mx-auto", "px-6")}>
        <div className={cn("text-center", "mb-16", "space-y-3")}>
          <h4
            className={cn(
              "text-primary",
              "font-bold",
              "tracking-widest",
              "uppercase",
              "text-sm",
            )}
          >
            Our Impact Since 2020
          </h4>
          <h2
            className={cn(
              "text-3xl",
              "md:text-5xl",
              "font-extrabold",
              "text-background",
              "tracking-tight",
            )}
          >
            Numbers That Tell the Story
          </h2>
          <p className={cn("text-slate-100", "max-w-xl", "mx-auto")}>
            Every figure represents a life touched, a career launched, and a
            future changed by DIUSCADI&apos;s programmes.
          </p>
        </div>

        <div
          className={cn(
            "grid",
            "grid-cols-1",
            "md:grid-cols-2",
            "lg:grid-cols-3",
            "gap-8",
          )}
        >
          {STATS.map((stat, idx) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className={cn(
                "relative group p-8 rounded-[2rem] cursor-pointer",
                "bg-background/5 backdrop-blur-sm border",
                stat.border,
                "hover:bg-background/10 transition-all duration-500",
              )}
            >
              <div
                className={cn(
                  "w-14",
                  "h-14",
                  "rounded-2xl",
                  "flex",
                  "items-center",
                  "justify-center",
                  "mb-6",
                  "bg-background/5",
                  "border",
                  "border-background/10",
                  "group-hover:scale-110",
                  "transition-transform",
                  "duration-500",
                )}
              >
                <stat.icon className={cn("w-7 h-7", stat.color)} />
              </div>
              <div className="space-y-2">
                <h3
                  className={cn(
                    "text-4xl",
                    "md:text-5xl",
                    "font-black",
                    "text-background",
                    "tracking-tight",
                  )}
                >
                  {stat.value}
                </h3>
                <div>
                  <p className={cn("text-lg", "font-bold", "text-slate-200")}>
                    {stat.label}
                  </p>
                  <p className={cn("text-sm", "text-slate-100", "mt-1")}>
                    {stat.subtext}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "absolute bottom-0 left-8 right-8 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity rounded-full",
                  stat.id === 1
                    ? "bg-primary"
                    : stat.id === 2
                      ? "bg-secondary"
                      : stat.id === 3
                        ? "bg-blue-400"
                        : stat.id === 4
                          ? "bg-green-400"
                          : stat.id === 5
                            ? "bg-amber-400"
                            : "bg-rose-400",
                )}
              />
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className={cn(
            "text-center",
            "mt-16",
            "text-slate-100",
            "text-sm",
            "font-medium",
            "tracking-widest",
            "uppercase",
          )}
        >
          Verified projections — DIUSCADI Academic Committee
        </motion.p>
      </div>
    </section>
  );
};
