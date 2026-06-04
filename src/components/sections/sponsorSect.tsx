"use client";
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import Image from "next/image";
import { useLandingConfig } from "@/hooks/useLandingConfig";
import airtel from "@/assets/img/logo/Airtel.webp";
import mtn from "@/assets/img/logo/mtn.jpg";
import i1960 from "@/assets/img/logo/1960.webp";
import codex from "@/assets/img/logo/codex.webp";
import radopin from "@/assets/img/logo/adopin.jpg";
import lovebite from "@/assets/img/logo/Lovebite.webp";
import AICIC from "@/assets/img/logo/AICIC.png";
import { cn } from "../../lib/utils";
import type { StaticImageData } from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Partner {
  name: string;
  logo: string | StaticImageData | null;
}

// ─── Static fallback ──────────────────────────────────────────────────────────

const PARTNERS: Partner[] = [
  { name: "Airtel", logo: airtel },
  { name: "MTN", logo: mtn },
  { name: "1960 Laundry", logo: i1960 },
  { name: "Codex Microsystem", logo: codex },
  { name: "RADOPIN", logo: radopin },
  { name: "Lovebite", logo: lovebite },
  { name: "AICIC", logo: AICIC },
];

// ─── Shared card width / logo-zone height ─────────────────────────────────────
// Adjust these two constants to resize every scroll card in one place.
const CARD_W = 148; // px  — card total width
const LOGO_H = 100; // px  — logo-zone height (tall enough for any logo shape)

// ─── Component ────────────────────────────────────────────────────────────────

export const SponsorSection = () => {
  const { config } = useLandingConfig();

  const partners: Partner[] = config?.support?.items?.length
    ? config.support.items.map((s) => ({
        name: s.name,
        logo: s.logoUrl || null,
      }))
    : PARTNERS;

  // Triple the array so the loop never shows a gap
  const scrollItems = [...partners, ...partners, ...partners];

  return (
    <section
      className={cn(
        "py-24",
        "w-full",
        "bg-slate-200",
        "mt-5",
        "rounded-2xl",
        "overflow-hidden",
      )}
    >
      <div className={cn("container", "mx-auto", "px-6")}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className={cn("max-w-3xl", "mb-16")}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn(
              "inline-flex items-center gap-2",
              "px-4 py-2 rounded-full",
              "bg-primary/10 text-primary",
              "text-sm font-bold mb-6",
            )}
          >
            <Heart className="w-4 h-4" />
            <span>Pay It Forward</span>
          </motion.div>

          <h2
            className={cn(
              "text-4xl md:text-5xl font-black",
              "text-foreground mb-6 leading-tight",
            )}
          >
            Support Career Development of Nigerian Youths
          </h2>
          <p className={cn("text-xl text-slate-600 leading-relaxed")}>
            At DIUSCADI, we believe one person can make a big difference and
            that kindness should be passed on. Join these leading brands in
            fueling the next generation of tech talent.
          </p>
        </div>

        {/* ── Infinite logo slider ────────────────────────────────────────── */}
        <div
          className={cn(
            "relative mt-10 flex overflow-hidden",
            // Extra vertical room so card shadows aren't clipped
            "py-2",
          )}
        >
          <motion.div
            className={cn("flex items-stretch gap-4 whitespace-nowrap")}
            animate={{ x: [0, -(CARD_W + 16) * partners.length] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                // Scale speed with number of cards so it never feels rushed
                duration: partners.length * 5,
                ease: "linear",
              },
            }}
          >
            {scrollItems.map((partner, index) => (
              <div
                key={`${partner.name}-${index}`}
                style={{ width: CARD_W }}
                className={cn(
                  // Two-layer card — flex column, fixed width, auto height
                  "flex-none flex flex-col",
                  "rounded-xl overflow-hidden",
                  "border border-slate-300",
                  "bg-white",
                  "shadow-sm",
                  "hover:shadow-md hover:border-primary/30",
                  "transition-all duration-300 cursor-pointer",
                  "group",
                )}
              >
                {/* ── Layer 1: Logo zone ─────────────────────────────────── */}
                {/*
                 * `relative` + `fill` Image + `object-contain` + padding:
                 * the logo scales to fit whatever space it gets without
                 * stretching — wide telecom bar, round badge, tall emblem, all fine.
                 */}
                <div
                  style={{ height: LOGO_H }}
                  className={cn(
                    "relative w-full flex-shrink-0",
                    "bg-white",
                    "group-hover:bg-slate-50",
                    "transition-colors duration-300",
                  )}
                >
                  {partner.logo !== null ? (
                    <Image
                      src={partner.logo}
                      alt={`${partner.name} logo`}
                      fill
                      sizes={`${CARD_W}px`}
                      className={cn(
                        "object-contain",
                        "p-3", // breathing room inside the zone
                      )}
                    />
                  ) : (
                    <div
                      className={cn(
                        "w-full h-full flex items-center justify-center",
                        "bg-slate-100 text-slate-400 text-2xl font-black select-none",
                      )}
                    >
                      {partner.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                  )}
                </div>

                {/* ── Layer 2: Name badge ────────────────────────────────── */}
                <div
                  className={cn(
                    "px-2 py-2",
                    "border-t border-slate-100",
                    "bg-slate-50 group-hover:bg-primary",
                    "transition-colors duration-300",
                  )}
                >
                  <p
                    className={cn(
                      "text-[11px] font-bold text-center leading-tight",
                      "text-slate-700 group-hover:text-white",
                      "transition-colors duration-300",
                      // Allow the name to wrap — no more invisible overflow
                      "whitespace-normal break-words line-clamp-2",
                    )}
                  >
                    {partner.name}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Gradient fade edges */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-200 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-200 to-transparent z-10 pointer-events-none" />
        </div>

        {/* ── Action card ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className={cn(
            "mt-20 p-8 md:p-12 rounded-[3rem]",
            "bg-foreground text-background",
            "flex flex-col md:flex-row items-center justify-between gap-8",
            "relative overflow-hidden",
          )}
        >
          <div className="relative z-10">
            <h3 className={cn("text-2xl md:text-3xl font-bold mb-2")}>
              Ready to make an impact?
            </h3>
            <p className={cn("text-muted-foreground text-lg")}>
              Partner with us for the 2026 Academic Session.
            </p>
          </div>

          <a
            href="/sponsor"
            className={cn(
              "relative z-10 group flex items-center gap-3",
              "bg-primary hover:bg-orange-600 text-background",
              "px-8 py-4 rounded-2xl font-bold",
              "transition-all transform hover:scale-105 active:scale-95",
              "shadow-lg shadow-primary/25",
            )}
          >
            Sponsor DIUSCADI
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>

          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
        </motion.div>
      </div>
    </section>
  );
};
