"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuCalendar,
  LuMapPin,
  LuTicket,
  LuDownload,
  LuExternalLink,
  LuCalendarPlus,
  LuClock,
  LuHistory,
  LuLoader,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTickets, type Ticket } from "@/context/TicketContext";
import { EmptyState } from "@/components/sections/tickets/EmptyState";
import { useShare } from "@/hooks/useShare";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDisplayStatus(
  ticket: Ticket,
): "Upcoming" | "Used" | "Cancelled" | "Past" {
  if (ticket.status === "cancelled") return "Cancelled";
  if (ticket.checkedInAt) return "Used";
  // Check if event date has passed
  if (new Date(ticket.event.eventDate) < new Date()) return "Past";
  return "Upcoming";
}

function getLocationString(ticket: Ticket): string {
  if (ticket.event.format === "virtual") return "Online / Zoom";
  const loc = ticket.event.location;
  if (!loc) return ticket.event.format;
  return (
    [loc.venue, loc.city].filter(Boolean).join(", ") || ticket.event.format
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const FORMAT_LABEL: Record<string, string> = {
  physical: "Physical",
  virtual: "Virtual",
  hybrid: "Hybrid",
};

const STATUS_STYLES: Record<string, { pill: string; glow: boolean }> = {
  Upcoming: {
    pill: "bg-emerald-100 text-emerald-700 border-emerald-200",
    glow: true,
  },
  Used: { pill: "bg-blue-50 text-blue-600 border-blue-100", glow: false },
  Past: { pill: "bg-slate-100 text-slate-500 border-slate-200", glow: false },
  Cancelled: { pill: "bg-rose-100 text-rose-700 border-rose-200", glow: false },
};

// ── Filter tabs ───────────────────────────────────────────────────────────────

type FilterTab = "all" | "upcoming" | "past" | "cancelled";

const TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "cancelled", label: "Cancelled" },
];

function filterTickets(tickets: Ticket[], tab: FilterTab): Ticket[] {
  if (tab === "all") return tickets;
  if (tab === "upcoming")
    return tickets.filter((t) => getDisplayStatus(t) === "Upcoming");
  if (tab === "past")
    return tickets.filter((t) =>
      ["Past", "Used"].includes(getDisplayStatus(t)),
    );
  if (tab === "cancelled")
    return tickets.filter((t) => getDisplayStatus(t) === "Cancelled");
  return tickets;
}

// ── Ticket Card ───────────────────────────────────────────────────────────────

const TicketCard = ({ ticket }: { ticket: Ticket }) => {
  const router = useRouter();
  const { download, addToCalendar, downloading } = useShare();

  const displayStatus = getDisplayStatus(ticket);
  const location = getLocationString(ticket);
  const eventDate = fmtDate(ticket.event.eventDate);
  const ticketImage = ticket.event.image || "/images/events/default.jpg";
  const formatLabel = FORMAT_LABEL[ticket.event.format] ?? ticket.event.format;
  const statusStyle = STATUS_STYLES[displayStatus];
  const isPast = displayStatus === "Past" || displayStatus === "Used";
  const isCancelled = displayStatus === "Cancelled";

  const handleDownload = () => {
    download({
      type: "ticket",
      id: ticket.id,
      filename: `diuscadi-ticket-${ticket.id}.pdf`,
    });
  };

  const handleCalendar = () => {
    if (isPast || isCancelled) return;
    addToCalendar({
      title: ticket.event.title,
      startDate: ticket.event.eventDate,
      endDate: ticket.event.endDate ?? undefined,
      location,
      description: `DIUSCADI event — visit diuscadi.org.ng/events/${ticket.event.slug} for details`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{
        y: isPast || isCancelled ? 0 : -4,
        scale: isPast || isCancelled ? 1 : 1.005,
      }}
      className={cn(
        "group bg-background border-2 rounded-[2.5rem] overflow-hidden transition-all flex flex-col md:flex-row",
        isPast || isCancelled
          ? "border-border opacity-75"
          : "border-border hover:border-primary/30 hover:shadow-xl hover:shadow-slate-200/50",
      )}
    >
      {/* Image */}
      <div className="relative w-full md:w-52 h-40 md:h-auto overflow-hidden rounded-t-[2.5rem] md:rounded-l-[2.5rem] md:rounded-tr-none shrink-0">
        <Image
          src={ticketImage}
          alt={ticket.event.title}
          width={208}
          height={192}
          className={cn(
            "w-full h-full object-cover transition-transform duration-500",
            isPast || isCancelled ? "grayscale-[50%]" : "group-hover:scale-110",
          )}
        />
        {/* Past / cancelled overlay */}
        {(isPast || isCancelled) && (
          <div className="absolute inset-0 bg-foreground/20" />
        )}
        <div className="absolute top-4 left-4">
          <span
            className={cn(
              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border backdrop-blur-md bg-background/90 shadow-sm",
              statusStyle.pill,
            )}
          >
            {displayStatus}
          </span>
        </div>
        {/* Past ribbon */}
        {isPast && (
          <div className="absolute bottom-0 inset-x-0 py-1.5 bg-foreground/60 backdrop-blur-sm flex items-center justify-center gap-1.5">
            <LuHistory className="w-3 h-3 text-background/70" />
            <span className="text-[8px] font-black uppercase tracking-widest text-background/70">
              {displayStatus === "Used" ? "Attended" : "Event Ended"}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-6 md:p-8 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
            <LuTicket className="w-3 h-3" />
            {formatLabel} Access · {ticket.ticketType.name}
          </div>
          <h3
            className={cn(
              "text-xl font-black leading-tight transition-colors",
              isPast || isCancelled
                ? "text-muted-foreground"
                : "text-foreground group-hover:text-primary",
            )}
          >
            {ticket.event.title}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold">
            <LuCalendar className="w-4 h-4 text-slate-300" /> {eventDate}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold">
            <LuMapPin className="w-4 h-4 text-slate-300" />
            <span className="truncate">{location}</span>
          </div>
        </div>
        <p className="text-[10px] font-mono text-slate-300 uppercase tracking-widest">
          {ticket.inviteCode}
        </p>
      </div>

      {/* Actions */}
      {/* Actions */}
      <div
        className={cn(
          "w-full md:w-60 p-6 md:p-8 border-t md:border-t-0 md:border-l border-border flex flex-col justify-center gap-3",
          isPast || isCancelled ? "bg-muted/30" : "bg-muted/50",
        )}
      >
        <button
          onClick={() => router.push(`/tickets/${ticket.id}`)}
          className={cn(
            "w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer",
            isPast || isCancelled
              ? "bg-muted text-muted-foreground hover:bg-slate-200"
              : "bg-foreground text-background hover:bg-primary",
          )}
        >
          View Ticket <LuExternalLink className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-2 gap-2">
          {/* PDF — wired up, disabled only for cancelled */}
          <button
            onClick={handleDownload}
            disabled={isCancelled || downloading}
            className={cn(
              "py-3 bg-background border border-border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5",
              isCancelled
                ? "opacity-40 cursor-not-allowed"
                : downloading
                  ? "opacity-60 cursor-not-allowed text-primary"
                  : "text-slate-600 hover:border-slate-400 cursor-pointer",
            )}
          >
            {downloading ? (
              <LuLoader className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LuDownload className="w-3.5 h-3.5" />
            )}
            {downloading ? "…" : "PDF"}
          </button>

          {/* Calendar sync */}
          <button
            disabled={isPast || isCancelled}
            onClick={handleCalendar}
            title={
              isPast
                ? "Event has already passed"
                : isCancelled
                  ? "Ticket cancelled"
                  : "Add to calendar"
            }
            className={cn(
              "py-3 bg-background border border-border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5",
              isPast || isCancelled
                ? "opacity-40 cursor-not-allowed text-slate-400"
                : "text-slate-600 hover:border-slate-400 cursor-pointer",
            )}
          >
            <LuCalendarPlus className="w-3.5 h-3.5" />
            {isPast ? <LuClock className="w-3 h-3" /> : "Sync"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const { tickets, loadTickets, ticketsLoading } = useTickets();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const filtered = filterTickets(tickets, activeTab);

  if (ticketsLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-[2.5rem] bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full h-full mt-20">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-2 bg-muted p-1.5 rounded-2xl border border-border w-fit mb-8">
          {TABS.map((tab) => {
            const count = filterTickets(tickets, tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-md border border-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "text-[8px] font-black px-1.5 py-0.5 rounded-full",
                    activeTab === tab.id
                      ? "bg-primary text-background"
                      : "bg-border text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-6">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <EmptyState onClearFilters={() => setActiveTab("all")} />
          ) : (
            filtered.map((t) => <TicketCard key={t.id} ticket={t} />)
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
