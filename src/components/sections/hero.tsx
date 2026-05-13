"use client";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { motion } from "framer-motion";
import Image from "next/image";
import { GraduationCap, CalendarCheck } from "lucide-react";
import student from "@/assets/img/downloads/Esther-Chiamaka.webp";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Hero = () => {
  const pathname = usePathname();

  
  return (
    <section
      className={cn(
        "relative min-h-[90vh] w-full flex items-center overflow-hidden bg-background pt-20 pb-12",
      )}
    >
      {/* Background glow */}
      <div
        className={cn(
          "absolute",
          "top-0",
          "right-0",
          "-translate-y-1/2",
          "translate-x-1/4",
          "w-[500px]",
          "h-[500px]",
          "bg-primary/5",
          "rounded-full",
          "blur-[120px]",
          "-z-10",
        )}
      />

      <div
        className={cn(
          "container",
          "mx-auto",
          "px-6",
          "grid",
          "grid-cols-1",
          "lg:grid-cols-2",
          "gap-12",
          "items-center",
        )}
      >
        {/* LEFT CONTENT */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-left"
        >
          {/* Trust badge */}
          <div
            className={cn(
              "inline-flex",
              "items-center",
              "gap-2",
              "px-3",
              "py-1",
              "rounded-full",
              "bg-primary/10",
              "border",
              "border-primary/20",
              "text-primary",
              "text-sm",
              "font-semibold",
              "mb-6",
            )}
          >
            <GraduationCap className={cn("w-4", "h-4")} />
            <span>LASCADSS — Now in its 7th Edition</span>
          </div>

          <h1
            className={cn(
              "text-4xl",
              "md:text-6xl",
              "font-bold",
              "text-foreground",
              "leading-[1.1]",
              "tracking-tight",
            )}
          >
            Shaping the Young for <br />
            <span className="text-primary">Future Career Success</span>
          </h1>

          <p
            className={cn(
              "mt-6",
              "text-lg",
              "md:text-xl",
              "text-muted-foreground",
              "max-w-xl",
              "leading-relaxed",
            )}
          >
            DIUSCADI bridges the gap between academic learning and real-world
            opportunities. Through our Life After School Career Development
            Seminar Series, we equip final-year students and graduates with the
            skills, mentorship, and connections they need to thrive.
          </p>

          <div className={cn("mt-10", "flex", "flex-wrap", "gap-4")}>
            <Button
              size="lg"
              className={cn(
                "h-12",
                "px-8",
                "text-base",
                "shadow-lg",
                "shadow-primary/20",
              )}
              asChild
            >
              <Link
                href={`/auth?redirect=${encodeURIComponent(pathname ?? "/")}`}
              >
                Apply Free — LASCADSS 7.0
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className={cn("h-12", "px-8", "text-base", "border-2")}
              asChild
            >
              <Link href="/about">Our Story</Link>
            </Button>
          </div>

          {/* Impact numbers */}
          <div
            className={cn(
              "mt-12",
              "pt-8",
              "border-t",
              "border-border",
              "flex",
              "flex-wrap",
              "items-center",
              "gap-8",
            )}
          >
            <div className={cn("flex", "flex-col")}>
              <span className={cn("text-2xl", "font-bold", "text-foreground")}>
                5,000+
              </span>
              <span className={cn("text-sm", "text-muted-foreground")}>
                Students Trained
              </span>
            </div>
            <div className={cn("flex", "flex-col")}>
              <span className={cn("text-2xl", "font-bold", "text-foreground")}>
                6
              </span>
              <span className={cn("text-sm", "text-muted-foreground")}>
                Seminar Editions
              </span>
            </div>
            <div className={cn("flex", "flex-col")}>
              <span className={cn("text-2xl", "font-bold", "text-foreground")}>
                2,500+
              </span>
              <span className={cn("text-sm", "text-muted-foreground")}>
                Jobs & Internships
              </span>
            </div>
          </div>
        </motion.div>

        {/* RIGHT IMAGE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={cn(
            "relative",
            "group",
            "hover:scale-105",
            "duration-700",
            "ease-in-out",
            "transition-all",
          )}
        >
          <div
            className={cn(
              "relative",
              "w-full",
              "aspect-4/5",
              "md:aspect-square",
              "rounded-[2rem]",
              "overflow-hidden",
              "border-8",
              "border-background",
              "shadow-2xl",
            )}
          >
            <Image
              src={student}
              alt="DIUSCADI Student at LASCADSS"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Floating card */}
          <div
            className={cn(
              "absolute",
              "-bottom-6",
              "-left-5",
              "lg:-left-12",
              "p-5",
              "rounded-2xl",
              "transition-all",
              "duration-300",
              "bg-background/10",
              "backdrop-blur-xl",
              "border",
              "border-background/20",
              "shadow-2xl",
              "hover:bg-black/40",
              "group-hover:scale-105",
            )}
          >
            <div
              className={cn("flex", "items-center", "cursor-pointer", "gap-4")}
            >
              <div
                className={cn(
                  "p-3",
                  "bg-primary/20",
                  "rounded-lg",
                  "text-primary",
                )}
              >
                <CalendarCheck className={cn("w-6", "h-6")} />
              </div>
              <div>
                <p
                  className={cn(
                    "text-xs",
                    "font-semibold",
                    "text-background/70",
                    "uppercase",
                    "tracking-wider",
                  )}
                >
                  Coming Soon
                </p>
                <p className={cn("text-background", "font-bold")}>
                  LASCADSS 7.0
                </p>
              </div>
            </div>
          </div>

          {/* Decorative ring */}
          <div
            className={cn(
              "absolute",
              "-top-6",
              "-right-6",
              "w-32",
              "h-32",
              "border-12",
              "border-secondary/20",
              "rounded-full",
              "-z-10",
            )}
          />
        </motion.div>
      </div>
    </section>
  );
};
