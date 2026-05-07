"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuShare2,
  LuLinkedin,
  LuGithub,
  LuTwitter,
  LuGlobe,
  LuCircleCheck,
  LuCircleAlert,
} from "react-icons/lu";
import { IconType } from "react-icons";
import { cn } from "../../../../lib/utils";

type SocialPlatform = "linkedin" | "github" | "twitter" | "website";

export interface SocialLinks {
  linkedin: string;
  github: string;
  twitter: string;
  website: string; // maps to "portfolio" in DB — translation happens in page
}

interface SocialInputConfig {
  id: keyof SocialLinks;
  label: string;
  icon: IconType;
  placeholder: string;
}

type ValidationResult = boolean | null;

const validateUrl = (
  url: string,
  platform: SocialPlatform,
): ValidationResult => {
  if (!url) return null;
  const patterns: Record<SocialPlatform, RegExp> = {
    linkedin: /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[A-z0-9_-]+\/?$/,
    github: /^(https?:\/\/)?(www\.)?github\.com\/[A-z0-9_-]+\/?$/,
    twitter: /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[A-z0-9_-]+\/?$/,
    website: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  };
  return patterns[platform].test(url);
};

interface SocialLinksSectionProps {
  links: SocialLinks;
  onChange: (patch: Partial<SocialLinks>) => void;
}

export const SocialLinksSection = ({
  links,
  onChange,
}: SocialLinksSectionProps) => {
  const socialInputs: SocialInputConfig[] = [
    {
      id: "linkedin",
      label: "LinkedIn Profile",
      icon: LuLinkedin,
      placeholder: "linkedin.com/in/username",
    },
    {
      id: "twitter",
      label: "X / Twitter",
      icon: LuTwitter,
      placeholder: "x.com/username",
    },
    {
      id: "github",
      label: "GitHub Profile",
      icon: LuGithub,
      placeholder: "github.com/username",
    },
    {
      id: "website",
      label: "Portfolio Website",
      icon: LuGlobe,
      placeholder: "https://yourportfolio.com",
    },
  ];

  const renderInput = (config: SocialInputConfig, index: number) => {
    const { id, label, icon: Icon, placeholder } = config;
    const isValid = validateUrl(links[id], id);

    return (
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
        className="space-y-2"
      >
        <label
          className={cn(
            "text-[10px]",
            "font-black",
            "text-muted-foreground",
            "uppercase",
            "tracking-widest",
            "ml-1",
          )}
        >
          {label}
        </label>
        <div className={cn("relative", "group")}>
          <div
            className={cn(
              "absolute",
              "left-6",
              "top-1/2",
              "-translate-y-1/2",
              "text-muted-foreground",
              "group-focus-within:text-primary",
              "transition-colors",
            )}
          >
            <Icon className="w-4 h-4" />
          </div>

          <motion.input
            type="url"
            value={links[id]}
            onChange={(e) => onChange({ [id]: e.target.value })}
            placeholder={placeholder}
            whileFocus={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
              "w-full",
              "bg-muted",
              "border-2",
              "rounded-2xl",
              "pl-12",
              "pr-12",
              "py-4",
              "text-sm",
              "font-bold",
              "outline-none",
              "transition-all",
              "duration-300",
              isValid === true
                ? "border-emerald-100 bg-emerald-50/30 text-slate-700"
                : isValid === false
                  ? "border-rose-100 bg-rose-50/30 text-slate-700"
                  : "border-slate-50 text-slate-700 focus:bg-background focus:border-primary/20",
            )}
          />

          <div
            className={cn("absolute", "right-5", "top-1/2", "-translate-y-1/2")}
          >
            <AnimatePresence mode="wait">
              {isValid === true && (
                <motion.div
                  key="valid"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <LuCircleCheck className="w-4 h-4 text-emerald-500" />
                </motion.div>
              )}
              {isValid === false && (
                <motion.div
                  key="invalid"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, x: [0, -2, 2, -2, 2, 0] }}
                  exit={{ scale: 0 }}
                  transition={{
                    scale: { type: "spring", stiffness: 300, damping: 15 },
                    x: { duration: 0.4 },
                  }}
                >
                  <LuCircleAlert className="w-4 h-4 text-rose-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ borderColor: "rgba(251, 146, 60, 0.2)" }}
      className={cn(
        "bg-background",
        "border-2",
        "border-border",
        "rounded-[2.5rem]",
        "p-8",
        "md:p-10",
        "shadow-sm",
        "transition-all",
      )}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className={cn("flex", "items-center", "gap-3", "mb-10")}
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={cn(
            "w-10",
            "h-10",
            "rounded-xl",
            "bg-muted",
            "flex",
            "items-center",
            "justify-center",
            "text-primary",
            "border",
            "border-border",
          )}
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <LuShare2 className="w-5 h-5" />
          </motion.div>
        </motion.div>
        <div>
          <h3
            className={cn(
              "text-xl",
              "font-black",
              "text-foreground",
              "tracking-tight",
            )}
          >
            Social Presence
          </h3>
          <p
            className={cn(
              "text-[10px]",
              "font-bold",
              "text-muted-foreground",
              "uppercase",
              "tracking-widest",
              "mt-1",
            )}
          >
            Connect your professional networks
          </p>
        </div>
      </motion.div>

      <div
        className={cn(
          "grid",
          "grid-cols-1",
          "md:grid-cols-2",
          "gap-x-8",
          "gap-y-8",
        )}
      >
        {socialInputs.map((config, index) => renderInput(config, index))}
      </div>
    </motion.section>
  );
};

export type { SocialPlatform, SocialInputConfig, ValidationResult };
