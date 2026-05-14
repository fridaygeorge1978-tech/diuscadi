"use client";
// components/sections/homepage/HomeHeader.tsx

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  Settings,
  ChevronDown,
  Award,
  Zap,
  CheckCheck,
  X,
  Calendar,
  Clock,
  History,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvents } from "@/context/EventContext";
import { useUser } from "@/context/UserContext";
import type { EventSummary } from "@/context/EventContext";

// ── Event time bucket ──────────────────────────────────────────────────────────

function getEventBucket(
  eventDate: string,
  endDate: string | null,
): "now" | "upcoming" | "past" {
  const now = new Date();
  const start = new Date(eventDate);
  const end = endDate
    ? new Date(endDate)
    : new Date(start.getTime() + 4 * 60 * 60 * 1000);

  if (now >= start && now <= end) return "now";
  if (start > now) return "upcoming";
  return "past";
}

const BUCKET_CONFIG = {
  now: {
    label: "Happening Now",
    color: "text-emerald-600",
    dot: "bg-emerald-500",
    icon: Clock,
  },
  upcoming: {
    label: "Upcoming",
    color: "text-blue-600",
    dot: "bg-blue-500",
    icon: Calendar,
  },
  past: {
    label: "Past",
    color: "text-slate-400",
    dot: "bg-slate-300",
    icon: History,
  },
};

// ── Search result card ─────────────────────────────────────────────────────────

function SearchResultCard({
  event,
  onClose,
}: {
  event: EventSummary;
  onClose: () => void;
}) {
  const bucket = getEventBucket(event.eventDate, event.endDate);
  const cfg = BUCKET_CONFIG[bucket];
  const Icon = cfg.icon;

  return (
    <Link
      href={`/events/${event.slug}`}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        "hover:bg-muted/60 transition-colors rounded-xl group",
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl overflow-hidden bg-muted shrink-0",
          "border border-border",
        )}
      >
        {event.image ? (
          <Image
            src={event.image}
            alt={event.title}
            width={40}
            height={40}
            className="object-cover w-full h-full"
          />
        ) : (
          <div
            className={cn(
              "w-full h-full flex items-center justify-center",
              "text-muted-foreground text-[9px] font-black",
            )}
          >
            {event.category.charAt(0)}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[12px] font-black text-foreground truncate",
            "group-hover:text-primary transition-colors",
          )}
        >
          {event.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={cn(
              "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest",
              cfg.color,
            )}
          >
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                cfg.dot,
                bucket === "now" && "animate-pulse",
              )}
            />
            {cfg.label}
          </span>
          <span className="text-[9px] text-muted-foreground">·</span>
          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
            {event.category}
          </span>
        </div>
      </div>

      <span className="text-[9px] font-bold text-muted-foreground shrink-0">
        {new Date(event.eventDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </span>
    </Link>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface DropdownItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
}

const DropdownItem = ({ icon, label, value, color, bg }: DropdownItemProps) => (
  <div
    className={cn(
      "flex items-center justify-between px-3 py-2 rounded-lg",
      "hover:bg-muted transition-colors",
    )}
  >
    <div className="flex items-center gap-3">
      <div className={cn("p-1.5 rounded-md", bg, color)}>{icon}</div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
    <span className={cn("text-xs font-bold", color)}>{value || "—"}</span>
  </div>
);

// ── Main component — NO props, reads from context ──────────────────────────────

export const HomeHeader = () => {
  const router = useRouter();
  const { profile, isLoading: profileLoading } = useUser();
  const { feed, feedLoading, loadFeed } = useEvents();

  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [showNotifications, setShowNotif] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load event feed on mount for search
  useEffect(() => {
    loadFeed(1);
  }, [loadFeed]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Derived user values from context ──────────────────────────────────────

  const displayName = profile
    ? `${profile.fullName.firstname} ${profile.fullName.lastname}`
    : "Member";

  const initials = profile
    ? `${profile.fullName.firstname[0] ?? ""}${profile.fullName.lastname[0] ?? ""}`.toUpperCase()
    : "M";

  // Resolve avatar URL from CloudinaryImage or fall back to null
  const avatarUrl = profile?.hasAvatar
    ? (profile.avatar?.imageUrl ?? profile.avatar?.imageCloudName ?? null)
    : null;

  const eduStatus = profile
    ? profile.eduStatus.charAt(0).toUpperCase() +
      profile.eduStatus.slice(1).toLowerCase()
    : "";

  // First skill slug — displayed as "Core Skill"
  const coreSkill = profile?.skills?.[0] ?? "";

  // Committee label — e.g. "Media" or "General" if none
  const committee = profile?.committeeMembership?.committee ?? "General";

  // Points: eventsRegistered × 50 (same formula as home/page.tsx)
  const points = (profile?.analytics?.eventsRegistered ?? 0) * 50;

  // ── Search logic ────────────────────────────────────────────────────────────

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return feed
      .filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.overview.toLowerCase().includes(q) ||
          e.tags?.some((t) => t.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [searchQuery, feed]);

  const grouped = useMemo(() => {
    const groups: Record<"now" | "upcoming" | "past", EventSummary[]> = {
      now: [],
      upcoming: [],
      past: [],
    };
    searchResults.forEach((e) => {
      groups[getEventBucket(e.eventDate, e.endDate)].push(e);
    });
    return groups;
  }, [searchResults]);

  const showDropdown = searchFocused && searchQuery.length > 0;

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    inputRef.current?.focus();
  }, []);

  // ── Notifications ────────────────────────────────────────────────────────────
  // TODO: replace with real data from GET /api/notifications when built.
  const notifications: {
    id: number;
    title: string;
    desc: string;
    time: string;
    isNew: boolean;
  }[] = [];
  const hasUnread = notifications.some((n) => n.isNew);

  return (
    <header
      className={cn(
        "w-full bg-background border-b border-border sticky top-0 z-40",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* ── LEFT: Avatar + Greeting ── */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/profile"
              className="relative shrink-0 group transition-transform hover:scale-105"
            >
              <div
                className={cn(
                  "w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden",
                  "border border-border flex items-center justify-center bg-muted",
                )}
              >
                {profileLoading ? (
                  // Skeleton while profile loads
                  <div className="w-full h-full bg-muted animate-pulse" />
                ) : avatarUrl ? (
                  <Image
                    width={48}
                    height={48}
                    src={avatarUrl}
                    alt={displayName}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-muted-foreground font-bold text-sm">
                    {initials}
                  </span>
                )}
              </div>
              {/* Online indicator */}
              <div
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3",
                  "bg-emerald-500 border-2 border-background rounded-full",
                )}
              />
            </Link>

            <div className="truncate">
              {profileLoading ? (
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              ) : (
                <h1 className="text-base md:text-lg font-bold text-foreground truncate">
                  Hi, {displayName} 👋
                </h1>
              )}
              <p className="text-xs text-muted-foreground hidden md:block">
                Ready for your next step?
              </p>
            </div>
          </div>

          {/* ── MIDDLE: Search ── */}
          <div
            ref={searchRef}
            className="hidden sm:flex flex-1 max-w-md mx-4 relative"
          >
            <div
              className={cn(
                "flex items-center bg-muted border rounded-lg px-3 py-1.5 w-full transition-all",
                searchFocused
                  ? "border-primary/40 ring-2 ring-primary/10"
                  : "border-border",
              )}
            >
              {feedLoading ? (
                <Loader className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
              ) : (
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search your events…"
                className={cn(
                  "bg-transparent border-none outline-none text-sm ml-2 w-full",
                  "text-foreground placeholder:text-muted-foreground",
                )}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="ml-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search dropdown */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={cn(
                    "absolute top-full left-0 right-0 mt-2",
                    "bg-background border border-border shadow-2xl rounded-2xl overflow-hidden z-50",
                  )}
                >
                  {searchResults.length === 0 ? (
                    <div className="p-6 text-center">
                      <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                        No events matching &quot;{searchQuery}&quot;
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-1">
                        Try a different keyword or category
                      </p>
                    </div>
                  ) : (
                    <div className="p-2 max-h-80 overflow-y-auto">
                      {(["now", "upcoming", "past"] as const).map((bucket) => {
                        const events = grouped[bucket];
                        if (!events.length) return null;
                        const cfg = BUCKET_CONFIG[bucket];
                        const Icon = cfg.icon;
                        return (
                          <div key={bucket} className="mb-2">
                            <div className="flex items-center gap-2 px-4 py-1.5">
                              <Icon className={cn("w-3 h-3", cfg.color)} />
                              <span
                                className={cn(
                                  "text-[9px] font-black uppercase tracking-widest",
                                  cfg.color,
                                )}
                              >
                                {cfg.label}
                              </span>
                              <span className="text-[9px] text-muted-foreground font-bold ml-auto">
                                {events.length}
                              </span>
                            </div>
                            {events.map((e) => (
                              <SearchResultCard
                                key={e.id}
                                event={e}
                                onClose={() => {
                                  setSearchFocused(false);
                                  setSearchQuery("");
                                }}
                              />
                            ))}
                          </div>
                        );
                      })}
                      <div className="px-4 py-2 border-t border-border mt-1">
                        <Link
                          href={`/events?q=${encodeURIComponent(searchQuery)}`}
                          onClick={() => {
                            setSearchFocused(false);
                            setSearchQuery("");
                          }}
                          className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                        >
                          View all results for &quot;{searchQuery}&quot; →
                        </Link>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── RIGHT: Notifications + Settings ── */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotif(!showNotifications);
                  setSettingsOpen(false);
                }}
                className="relative p-2 hover:bg-muted rounded-lg transition-colors group cursor-pointer"
              >
                <Bell
                  className={cn(
                    "w-5 h-5 text-slate-600 group-hover:text-primary transition-colors",
                    showNotifications && "text-primary",
                  )}
                />
                {hasUnread && (
                  <span
                    className={cn(
                      "absolute top-2 right-2 w-2 h-2",
                      "bg-primary rounded-full border-2 border-background",
                    )}
                  />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-10"
                      onClick={() => setShowNotif(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                      className={cn(
                        "absolute right-0 mt-3 w-80",
                        "bg-background border border-border shadow-2xl rounded-2xl overflow-hidden z-20",
                      )}
                    >
                      <div
                        className={cn(
                          "p-4 border-b border-slate-50 flex justify-between",
                          "items-center bg-muted/50",
                        )}
                      >
                        <div>
                          <h3 className="font-bold text-foreground text-sm">
                            Notifications
                          </h3>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {hasUnread
                              ? `${notifications.filter((n) => n.isNew).length} unread`
                              : "You're all caught up"}
                          </p>
                        </div>
                        {hasUnread && (
                          <button className="flex items-center gap-1 text-[10px] font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded-md transition-colors cursor-pointer">
                            <CheckCheck className="w-3 h-3" /> Mark all
                          </button>
                        )}
                      </div>

                      <div className="p-8 text-center space-y-3">
                        <Bell className="w-10 h-10 text-slate-200 mx-auto" />
                        <div>
                          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                            No notifications yet
                          </p>
                          <p className="text-[9px] text-muted-foreground mt-1">
                            Activity updates will appear here
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Settings dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setSettingsOpen(!isSettingsOpen);
                  setShowNotif(false);
                }}
                className={cn(
                  "flex items-center gap-1 md:gap-2 pl-2 border-l border-border ml-1 transition-all cursor-pointer",
                  isSettingsOpen
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Settings
                  className={cn(
                    "w-5 h-5 transition-transform duration-500",
                    isSettingsOpen && "rotate-90",
                  )}
                />
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    isSettingsOpen && "rotate-180",
                  )}
                />
              </button>

              <AnimatePresence>
                {isSettingsOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-10"
                      onClick={() => setSettingsOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                      className={cn(
                        "absolute right-0 mt-3 w-72",
                        "bg-background border border-border shadow-xl rounded-2xl overflow-hidden p-2 z-20",
                      )}
                    >
                      {/* Points card */}
                      <div className="bg-orange-50 p-4 rounded-xl mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-8 h-8 bg-primary rounded-full flex items-center justify-center",
                              "text-background text-xs font-bold shadow-lg shadow-primary/20",
                            )}
                          >
                            P
                          </div>
                          <span className="text-sm font-bold text-orange-900">
                            Career Points
                          </span>
                        </div>
                        {profileLoading ? (
                          <div className="h-5 w-10 bg-orange-100 animate-pulse rounded" />
                        ) : (
                          <span className="text-lg font-black text-primary">
                            {points}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 py-2 border-t border-slate-50">
                        <DropdownItem
                          icon={<Award className="w-4 h-4" />}
                          label="Status"
                          value={eduStatus}
                          color="text-blue-600"
                          bg="bg-blue-50"
                        />
                        <DropdownItem
                          icon={<Zap className="w-4 h-4" />}
                          label="Core Skill"
                          value={coreSkill}
                          color="text-amber-600"
                          bg="bg-amber-50"
                        />
                        <DropdownItem
                          icon={<Award className="w-4 h-4" />}
                          label="Committee"
                          value={committee}
                          color="text-violet-600"
                          bg="bg-violet-50"
                        />
                      </div>

                      <div className="mt-2 pt-2 border-t border-border">
                        <button
                          onClick={() => {
                            setSettingsOpen(false);
                            router.push("/profile");
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 text-sm",
                            "text-slate-600 hover:bg-muted rounded-lg transition-colors cursor-pointer",
                          )}
                        >
                          <Settings className="w-4 h-4" /> Account Settings
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
