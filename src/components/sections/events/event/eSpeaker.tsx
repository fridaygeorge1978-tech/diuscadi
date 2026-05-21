"use client";
import React from "react";
import { motion } from "framer-motion";
import { LuMic, LuLock, LuExternalLink } from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { EventDetail } from "@/app/events/[slug]/page";

export const SpeakersSection = ({ event }: { event: EventDetail }) => {
  const hasSpeakers = event.speakers.length > 0;

  if (!hasSpeakers) {
    return (
      <section className={cn("w-full", "py-16")}>
        <div
          className={cn("max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8")}
        >
          <div className={cn("flex", "items-center", "gap-3", "mb-10")}>
            <div className={cn("p-2", "bg-primary/10", "rounded-xl")}>
              <LuMic className={cn("w-5", "h-5", "text-primary")} />
            </div>
            <h2
              className={cn(
                "text-2xl",
                "font-black",
                "text-foreground",
                "tracking-tight",
              )}
            >
              Speakers & Facilitators
            </h2>
          </div>
          <div
            className={cn(
              "grid",
              "grid-cols-2",
              "sm:grid-cols-3",
              "lg:grid-cols-4",
              "gap-4",
            )}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={cn(
                  "flex",
                  "flex-col",
                  "items-center",
                  "gap-3",
                  "p-6",
                  "bg-muted",
                  "border",
                  "border-border",
                  "rounded-[2rem]",
                  "opacity-50",
                )}
              >
                <div
                  className={cn(
                    "w-16",
                    "h-16",
                    "rounded-full",
                    "bg-slate-200",
                    "flex",
                    "items-center",
                    "justify-center",
                  )}
                >
                  <LuLock
                    className={cn("w-5", "h-5", "text-muted-foreground")}
                  />
                </div>
                <div className="text-center">
                  <div
                    className={cn(
                      "h-3",
                      "w-20",
                      "bg-slate-200",
                      "rounded-full",
                      "mb-2",
                    )}
                  />
                  <div
                    className={cn(
                      "h-2",
                      "w-14",
                      "bg-slate-100",
                      "rounded-full",
                      "mx-auto",
                    )}
                  />
                </div>
              </motion.div>
            ))}
          </div>
          <p
            className={cn(
              "mt-6",
              "text-center",
              "text-xs",
              "text-muted-foreground",
              "font-bold",
            )}
          >
            Speakers will be announced soon.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("w-full", "py-16")}>
      <div className={cn("max-w-7xl", "mx-auto", "px-4", "sm:px-6", "lg:px-8")}>
        <div className={cn("flex", "items-center", "gap-3", "mb-10")}>
          <div className={cn("p-2", "bg-primary/10", "rounded-xl")}>
            <LuMic className={cn("w-5", "h-5", "text-primary")} />
          </div>
          <h2
            className={cn(
              "text-2xl",
              "font-black",
              "text-foreground",
              "tracking-tight",
            )}
          >
            Speakers & Facilitators
          </h2>
        </div>

        <div
          className={cn(
            "grid",
            "grid-cols-2",
            "sm:grid-cols-3",
            "lg:grid-cols-4",
            "gap-6",
          )}
        >
          {event.speakers.map((speaker, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className={cn(
                "flex",
                "flex-col",
                "items-center",
                "gap-3",
                "p-6",
                "bg-muted",
                "border",
                "border-border",
                "rounded-[2rem]",
                "hover:border-primary/20",
                "transition-colors",
              )}
            >
              <div
                className={cn(
                  "w-20",
                  "h-20",
                  "rounded-full",
                  "overflow-hidden",
                  "bg-slate-200",
                  "shrink-0",
                )}
              >
                {(speaker.avatar?.imageUrl ?? speaker.avatarUrl) ? (
                  <Image
                    src={speaker.avatar?.imageUrl ?? speaker.avatarUrl!}
                    alt={speaker.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <LuMic className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className={cn("text-center", "space-y-1")}>
                <p className={cn("text-sm", "font-black", "text-foreground")}>
                  {speaker.name}
                </p>
                {speaker.title && (
                  <p
                    className={cn(
                      "text-[10px]",
                      "font-bold",
                      "text-muted-foreground",
                    )}
                  >
                    {speaker.title}
                  </p>
                )}
                {speaker.organisation && (
                  <p className={cn("text-[10px]", "font-bold", "text-primary")}>
                    {speaker.organisation}
                  </p>
                )}
                {speaker.socialUrl && (
                  <a
                    href={speaker.socialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex",
                      "items-center",
                      "gap-1",
                      "text-[9px]",
                      "font-black",
                      "uppercase",
                      "tracking-widest",
                      "text-muted-foreground",
                      "hover:text-primary",
                      "transition-colors",
                    )}
                  >
                    Profile <LuExternalLink className={cn("w-2.5", "h-2.5")} />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
