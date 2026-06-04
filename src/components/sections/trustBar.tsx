"use client";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import { useLandingConfig } from "@/hooks/useLandingConfig";
import unilagLogo from "@/assets/img/logo/unilag.png";
import convenantLogo from "@/assets/img/logo/convenant.jpg";
import googleLogo from "@/assets/img/logo/google-logo-icon-transparent-background_1273375-1570.jpg";
import microsoftLogo from "@/assets/img/logo/microsoft.webp";
import lasuLogo from "@/assets/img/logo/lasu.png";
import type { StaticImageData } from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Partner {
  id: number;
  name: string;
  logo: string | StaticImageData | null;
}

// ─── Static fallback ──────────────────────────────────────────────────────────

const PARTNERS: Partner[] = [
  { id: 1, name: "University of Lagos", logo: unilagLogo },
  { id: 2, name: "Covenant University", logo: convenantLogo },
  { id: 3, name: "Google Africa", logo: googleLogo },
  { id: 4, name: "Microsoft", logo: microsoftLogo },
  { id: 5, name: "Lagos State University", logo: lasuLogo },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const TrustBar = () => {
  const { config } = useLandingConfig();

  const partners: Partner[] = config?.validators?.items?.length
    ? config.validators.items.map((v, idx) => ({
        id: idx + 1,
        name: v.name,
        logo: v.logoUrl || null,
      }))
    : PARTNERS;

  return (
    <section className={cn("w-full", "py-16", "bg-background")}>
      <div className={cn("container", "mx-auto", "px-6")}>
        {/* Section label */}
        <p
          className={cn(
            "text-center",
            "text-xs",
            "font-bold",
            "uppercase",
            "tracking-[0.2em]",
            "text-muted-foreground/60",
            "mb-10",
          )}
        >
          Validated by Industry &amp; Academia
        </p>

        {/* Cards grid */}
        <div className={cn("flex", "flex-wrap", "justify-center", "gap-5")}>
          {partners.map((partner, idx) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.4, ease: "easeOut" }}
              className={cn(
                // Card shell — two-layer flex column
                "group flex flex-col",
                "w-[168px]", // fixed width keeps the grid tidy
                "rounded-2xl overflow-hidden",
                "border border-primary/10",
                "bg-primary/5 backdrop-blur-sm",
                "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10",
                "transition-all duration-400 cursor-pointer",
              )}
            >
              {/* ── Layer 1 : Logo zone ──────────────────────────────────── */}
              {/*
               * Fixed-height container. `object-contain` + generous padding
               * means ANY aspect-ratio logo (wide rectangle, tall badge, circle)
               * will always fully visible without cropping or squashing.
               */}
              <div
                className={cn(
                  "relative",
                  "w-full h-[110px]", // tall enough for any logo shape
                  "flex items-center justify-center",
                  "p-4",
                  "bg-white/60 dark:bg-white/10",
                  "group-hover:bg-white/80 dark:group-hover:bg-white/20",
                  "transition-colors duration-400",
                )}
              >
                {partner.logo !== null ? (
                  <Image
                    src={partner.logo}
                    alt={`${partner.name} logo`}
                    fill
                    sizes="168px"
                    className={cn(
                      "object-contain",
                      "p-3", // inner breathing room so logo never touches edges
                    )}
                  />
                ) : (
                  /* No-logo fallback: large initials */
                  <span
                    className={cn(
                      "text-3xl font-black text-primary/40",
                      "select-none",
                    )}
                  >
                    {partner.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                )}
              </div>

              {/* ── Layer 2 : Name badge ─────────────────────────────────── */}
              <div
                className={cn(
                  "w-full",
                  "px-3 py-3",
                  "bg-foreground/5 dark:bg-foreground/10",
                  "group-hover:bg-primary group-hover:text-background",
                  "transition-colors duration-400",
                  "border-t border-primary/10",
                )}
              >
                <p
                  className={cn(
                    "text-xs font-bold leading-snug text-center",
                    "text-foreground group-hover:text-background",
                    "transition-colors duration-400",
                    "line-clamp-2", // wraps gracefully for long names
                  )}
                >
                  {partner.name}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
