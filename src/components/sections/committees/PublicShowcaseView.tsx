"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { LuChevronRight, LuUsers, LuSparkles, LuLayers, LuMenu } from "react-icons/lu";

interface CommitteeListItem {
  id: string;
  slug: string;
  name: string;
  shortDesc?: string;
  description: string;
  memberCount: number;
}

export default function PublicShowcaseView() {
  const router = useRouter();
  const [committees, setCommittees] = useState<CommitteeListItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchPublicEcosystem() {
      try {
        const res = await fetch("/api/platform/committees");
        const data = await res.json();
        if (data.committees && data.committees.length > 0) {
          setCommittees(data.committees);
          setSelectedSlug(data.committees[0].slug);
        }
      } catch (err) {
        console.error("Layout Hydration Failure:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPublicEcosystem();
  }, []);

  const currentSelection = committees.find((c) => c.slug === selectedSlug);

  if (loading) {
    return (
      <div className={cn('w-full', 'text-center', 'py-24', 'font-mono', 'text-xs', 'uppercase', 'tracking-widest', 'text-muted-foreground')}>
        Loading Functional Units...
      </div>
    );
  }

  return (
    <div className={cn('grid', 'grid-cols-1', 'lg:grid-cols-12', 'gap-6', 'items-start', 'w-full')}>
      {/* Structural Banner Announcement */}
      <div className={cn('col-span-12', 'glass', 'glass-shine', 'p-5', 'sm:p-6', 'md:p-8', 'rounded-3xl', 'w-full')}>
        <div className={cn('flex', 'flex-col', 'sm:flex-row', 'items-start', 'sm:items-center', 'gap-4')}>
          <div className={cn('p-2.5', 'rounded-xl', 'bg-primary/10', 'text-primary', 'shrink-0')}>
            <LuSparkles className={cn('w-5', 'h-5')} />
          </div>
          <div className="space-y-1">
            <h1 className={cn('text-xl', 'sm:text-2xl', 'md:text-3xl', 'font-black', 'uppercase', 'tracking-tight', 'text-foreground', 'break-words')}>
              DIUSCADI Operational Wings
            </h1>
            <p className={cn('text-xs', 'md:text-sm', 'text-muted-foreground', 'leading-relaxed')}>
              Select an active core committee from the register deck below to review operational assignments and profiles.
            </p>
          </div>
        </div>
      </div>

      {/* MOBILE SELECTOR TRIGGER BUTTON (Visible only on Tab/Mobile) */}
      <div className="col-span-12 lg:hidden w-full">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full flex items-center justify-between p-4 glass rounded-2xl border-primary/20 text-sm font-medium text-foreground"
        >
          <div className="flex items-center gap-2">
            <LuMenu className="w-4 h-4 text-primary" />
            <span>Active Unit: <strong className="text-primary">{currentSelection?.name || "None"}</strong></span>
          </div>
          <span className="text-xs font-mono uppercase bg-foreground/5 px-2.5 py-1 rounded-md text-muted-foreground">
            Browse Deck ({committees.length})
          </span>
        </button>

        {/* Mobile Dropdown Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 p-2 glass rounded-2xl space-y-1 w-full z-20 relative max-h-[300px] overflow-y-auto no-scrollbar"
            >
              {committees.map((committee) => {
                const isSelected = committee.slug === selectedSlug;
                return (
                  <button
                    key={committee.id}
                    onClick={() => {
                      setSelectedSlug(committee.slug);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full text-left p-3.5 rounded-xl text-xs transition-all duration-200 flex items-center justify-between",
                      isSelected ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted/40 text-foreground"
                    )}
                  >
                    <span className="truncate pr-4">{committee.name}</span>
                    <LuChevronRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LEFT BLOCK: The Selector Deck (Visible only on Desktop Layouts) */}
      <div className={cn('hidden', 'lg:block', 'lg:col-span-4', 'space-y-3')}>
        <span className={cn('text-[10px]', 'font-mono', 'uppercase', 'tracking-widest', 'text-muted-foreground', 'px-1', 'block', 'mb-1')}>
          Available Functional Track Modules
        </span>
        <div className="space-y-2.5">
          {committees.map((committee) => {
            const isSelected = committee.slug === selectedSlug;
            return (
              <button
                key={committee.id}
                onClick={() => setSelectedSlug(committee.slug)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all duration-300 flex items-center justify-between group",
                  isSelected
                    ? "glass border-primary/40 bg-primary/[0.03] shadow-md translate-x-1"
                    : "glass-subtle hover:border-muted-foreground/30 border-transparent",
                )}
              >
                <div className="pr-4 min-w-0">
                  <h3
                    className={cn(
                      "font-bold tracking-tight text-sm transition-colors duration-200 truncate",
                      isSelected ? "text-primary" : "text-foreground",
                    )}
                  >
                    {committee.name}
                  </h3>
                  <p className={cn('text-xs', 'text-muted-foreground', 'line-clamp-1', 'mt-0.5')}>
                    {committee.shortDesc || "No summary provided"}
                  </p>
                </div>
                <LuChevronRight
                  className={cn(
                    "w-4 h-4 text-muted-foreground/60 transition-all duration-300 group-hover:translate-x-1 shrink-0",
                    isSelected && "text-primary transform translate-x-0.5",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT BLOCK: The Glass Inspector Display */}
      <div className={cn('col-span-12', 'lg:col-span-8', 'w-full', 'h-full', 'min-w-0')}>
        <AnimatePresence mode="wait">
          {currentSelection ? (
            <motion.div
              key={currentSelection.slug}
              initial={{ opacity: 0, scale: 0.99, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.99, y: -8 }}
              transition={{ duration: 0.2 }}
              className={cn('glass', 'glass-shine', 'rounded-3xl', 'p-5', 'sm:p-6', 'md:p-8', 'flex', 'flex-col', 'justify-between', 'min-h-[380px]', 'w-full')}
            >
              <div className="w-full min-w-0">
                <div className={cn('flex', 'flex-col', 'sm:flex-row', 'sm:items-center', 'justify-between', 'gap-4', 'border-b', 'border-border', 'pb-5', 'mb-6', 'w-full')}>
                  <div className={cn('flex', 'items-center', 'gap-3', 'min-w-0')}>
                    <div className={cn('p-2.5', 'rounded-xl', 'bg-foreground/5', 'text-foreground', 'shrink-0')}>
                      <LuLayers className={cn('w-5', 'h-5')} />
                    </div>
                    <h2 className={cn('text-lg', 'sm:text-xl', 'md:text-2xl', 'font-black', 'uppercase', 'tracking-tight', 'text-foreground', 'truncate')}>
                      {currentSelection.name}
                    </h2>
                  </div>
                  <div className={cn('glass-subtle', 'px-3', 'py-1.5', 'rounded-full', 'text-[10px]', 'sm:text-[11px]', 'font-mono', 'uppercase', 'tracking-wider', 'flex', 'items-center', 'gap-1.5', 'text-primary', 'self-start', 'sm:self-auto', 'shrink-0')}>
                    <LuUsers className={cn('w-3.5', 'h-3.5')} />
                    {currentSelection.memberCount} Active Seats
                  </div>
                </div>

                <div className="space-y-3 w-full min-w-0">
                  <h4 className={cn('text-[10px]', 'font-mono', 'uppercase', 'tracking-widest', 'text-muted-foreground')}>
                    Core Mandate & Functional Requirements
                  </h4>
                  <p className={cn('text-muted-foreground', 'text-xs', 'sm:text-sm', 'leading-relaxed', 'whitespace-pre-line', 'break-words', 'max-w-3xl')}>
                    {currentSelection.description}
                  </p>
                </div>
              </div>

              {/* Secure App Link Routing Interceptor */}
              <div className={cn('mt-8', 'sm:mt-12', 'pt-6', 'border-t', 'border-border', 'flex', 'flex-col', 'sm:flex-row', 'sm:items-center', 'sm:justify-between', 'gap-5', 'w-full')}>
                <span className={cn('text-xs', 'text-muted-foreground', 'max-w-sm', 'leading-normal')}>
                  Ready to declare alignment with this operational group? Review carefully before submission.
                </span>
                <button
                  onClick={() =>
                    router.push(`/apply?committee=${currentSelection.slug}`)
                  }
                  className={cn('bg-primary', 'hover:bg-primary/90', 'text-primary-foreground', 'font-bold', 'uppercase', 'tracking-wider', 'text-[11px]', 'sm:text-xs', 'px-5', 'py-3.5', 'rounded-xl', 'transition-all', 'duration-300', 'shadow-md', 'shadow-primary/10', 'select-none', 'w-full', 'sm:w-auto', 'text-center', 'shrink-0')}
                >
                  Initiate Track Entry Placement
                </button>
              </div>
            </motion.div>
          ) : (
            <div className={cn('glass', 'rounded-3xl', 'p-12', 'text-center', 'text-muted-foreground/60', 'text-xs', 'font-mono', 'uppercase', 'tracking-wider', 'flex', 'items-center', 'justify-center', 'min-h-[400px]', 'w-full')}>
              Select structural unit code from tracking tree to parse metadata view
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}