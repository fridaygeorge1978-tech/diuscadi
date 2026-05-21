"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuBuilding2 } from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { EventDetail } from "@/app/events/[slug]/page";
import { EventSponsor } from "@/lib/models/Events";

const TIER_ORDER = ["gold", "silver", "bronze", "partner"];

export const SponsorsSection = ({ event }: { event: EventDetail }) => {
  const hasSponsors = event.sponsors.length > 0;

  // const resolvedLogoUrl = sponsor.logo?.imageUrl ?? sponsor.logoUrl ?? null;

  if (!hasSponsors) {
    return (
      <section className={cn("w-full", "bg-muted", "py-14")}>
        <div
          className={cn(
            "max-w-7xl",
            "mx-auto",
            "px-4",
            "sm:px-6",
            "lg:px-8",
            "text-center",
          )}
        >
          <div
            className={cn(
              "flex",
              "items-center",
              "justify-center",
              "gap-3",
              "mb-8",
            )}
          >
            <LuBuilding2
              className={cn("w-5", "h-5", "text-muted-foreground")}
            />
            <h2
              className={cn(
                "text-sm",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-muted-foreground",
              )}
            >
              Powered By
            </h2>
          </div>
          <div
            className={cn(
              "flex",
              "flex-wrap",
              "items-center",
              "justify-center",
              "gap-6",
            )}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  "h-8",
                  "w-24",
                  "bg-slate-200",
                  "rounded-lg",
                  "opacity-40",
                )}
              />
            ))}
          </div>
          <p className={cn("mt-6", "text-xs", "text-slate-300", "font-bold")}>
            Interested in sponsoring {event.title}?{" "}
            <span className={cn("underline", "cursor-pointer")}>
              Get in touch
            </span>
            .
          </p>
        </div>
      </section>
    );
  }

  // Group by tier
  const grouped = TIER_ORDER.reduce<Record<string, typeof event.sponsors>>(
    (acc, tier) => {
      const items = event.sponsors.filter(
        (s) => (s.tier ?? "partner") === tier,
      );
      if (items.length > 0) acc[tier] = items;
      return acc;
    },
    {},
  );

  const TIER_LABEL: Record<string, string> = {
    gold: "Gold Sponsors",
    silver: "Silver Sponsors",
    bronze: "Bronze Sponsors",
    partner: "Partners",
  };

  return (
    <section className={cn("w-full", "bg-muted", "py-14")}>
      <div className={cn("max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8")}>
        <div
          className={cn(
            "flex",
            "items-center",
            "justify-center",
            "gap-3",
            "mb-10",
          )}
        >
          <LuBuilding2 className={cn("w-5", "h-5", "text-muted-foreground")} />
          <h2
            className={cn(
              "text-sm",
              "font-black",
              "uppercase",
              "tracking-widest",
              "text-muted-foreground",
            )}
          >
            Powered By
          </h2>
        </div>

        {Object.entries(grouped).map(([tier, sponsors]) => (
          <div key={tier} className="mb-8 last:mb-0">
            <p
              className={cn(
                "text-center",
                "text-[9px]",
                "font-black",
                "uppercase",
                "tracking-widest",
                "text-muted-foreground/60",
                "mb-4",
              )}
            >
              {TIER_LABEL[tier]}
            </p>
            <div
              className={cn(
                "flex",
                "flex-wrap",
                "items-center",
                "justify-center",
                "gap-6",
              )}
            >
              {sponsors.map((sponsor, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  {sponsor.website ? (
                    <a
                      href={sponsor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:opacity-80 transition-opacity"
                    >
                      <SponsorLogo sponsor={sponsor} tier={tier} />
                    </a>
                  ) : (
                    <SponsorLogo sponsor={sponsor} tier={tier} />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        <p
          className={cn(
            "mt-6",
            "text-center",
            "text-xs",
            "text-slate-400",
            "font-bold",
          )}
        >
          Interested in sponsoring {event.title}?{" "}
          <span className={cn("underline", "cursor-pointer")}>
            Get in touch
          </span>
          .
        </p>
      </div>
    </section>
  );
};

function SponsorLogo({
  sponsor,
  tier,
}: {
  sponsor: EventSponsor;
  tier: string;
}) {
  const sizes: Record<string, { w: number; h: number; cls: string }> = {
    gold: { w: 140, h: 48, cls: "h-12 w-36" },
    silver: { w: 112, h: 40, cls: "h-10 w-28" },
    bronze: { w: 96, h: 32, cls: "h-8  w-24" },
    partner: { w: 96, h: 32, cls: "h-8  w-24" },
  };
  const { w, h, cls } = sizes[tier] ?? sizes.partner;
  const resolvedLogoUrl = sponsor.logo?.imageUrl ?? sponsor.logoUrl ?? null;

  if (resolvedLogoUrl) {
    return (
      <div className={cn("relative", cls)}>
        <Image
          src={resolvedLogoUrl}
          alt={sponsor.name}
          width={w}
          height={h}
          className="object-contain w-full h-full"
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex",
        "items-center",
        "justify-center",
        cls,
        "bg-background",
        "rounded-xl",
        "border",
        "border-border",
        "px-4",
      )}
    >
      <span className={cn("text-xs", "font-black", "text-muted-foreground")}>
        {sponsor.name}
      </span>
    </div>
  );
}
