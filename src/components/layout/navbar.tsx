"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuMenu,
  LuX,
  LuArrowLeft,
  LuLayoutDashboard,
  LuUser,
  LuTicket,
  LuCalendar,
  LuLogOut,
  LuChevronDown,
  LuShieldCheck,
  LuHouse,
  LuSettings,
  LuFileText,
  LuUsers,
  LuChartBar,
  LuMail,
  LuActivity,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import logo from "@/assets/img/logo.webp";

// ─── Mode types ───────────────────────────────────────────────────────────────

type NavMode = "main" | "console";

// ─── Link definitions ─────────────────────────────────────────────────────────

// Public (unauthenticated)
const PUBLIC_LINKS = [
  { name: "Home", href: "/" },
  { name: "Events", href: "/events" },
  { name: "About", href: "/about" },
  { name: "Gallery", href: "/gallery" },
  { name: "Contact", href: "/contact" },
];

// Main site — member (participant)
const MEMBER_LINKS = [
  { name: "Home", href: "/home" },
  { name: "Events", href: "/events" },
  { name: "Tickets", href: "/tickets" },
  { name: "Profile", href: "/profile" },
  { name: "Apply", href: "/profile/applications" },
  { name: "Landing Page", href: "/" },
  { name: "About", href: "/about" },
  { name: "Gallery", href: "/gallery" },
  { name: "Contact", href: "/contact" },
  { name: "Settings", href: "/settings" },
];

// Main site — moderator sees member links + applications shortcut
const MODERATOR_MAIN_LINKS = [
  ...MEMBER_LINKS,
  { name: "Applications", href: "/admin/applications" },
];

// Console — admin
const ADMIN_CONSOLE_LINKS = [
  { name: "Dashboard", href: "/admin" },
  { name: "Events", href: "/admin/events" },
  { name: "Users", href: "/admin/users" },
  { name: "Tickets", href: "/admin/tickets" },
  { name: "Invites", href: "/admin/invites" },
  { name: "Analytics", href: "/admin/analytics" },
  { name: "Applications", href: "/admin/applications" },
  { name: "Settings", href: "/admin/settings" },
];

// Console — webmaster sees everything admin sees + health
const WEBMASTER_CONSOLE_LINKS = [
  ...ADMIN_CONSOLE_LINKS,
  { name: "Health", href: "/admin/health" },
];

// ─── Link resolver ────────────────────────────────────────────────────────────

function resolveLinks(
  role: string | null,
  isAuthenticated: boolean,
  mode: NavMode,
) {
  if (!isAuthenticated) return PUBLIC_LINKS;

  if (mode === "console") {
    // Only admin/webmaster can reach console mode
    if (role === "webmaster") return WEBMASTER_CONSOLE_LINKS;
    if (role === "admin") return ADMIN_CONSOLE_LINKS;
    // Moderators shouldn't be in console mode, fall through to main
  }

  // Main site mode
  if (role === "moderator" || role === "admin" || role === "webmaster") {
    return MODERATOR_MAIN_LINKS;
  }
  return MEMBER_LINKS;
}

// ─── Link icons for dropdown ──────────────────────────────────────────────────

const LINK_ICONS: Record<string, React.ElementType> = {
  "/home": LuHouse,
  "/": LuHouse,
  "/events": LuCalendar,
  "/tickets": LuTicket,
  "/profile": LuUser,
  "/profile/applications": LuFileText,
  "/settings": LuSettings,
  "/admin": LuLayoutDashboard,
  "/admin/events": LuCalendar,
  "/admin/users": LuUsers,
  "/admin/tickets": LuTicket,
  "/admin/invites": LuMail,
  "/admin/analytics": LuChartBar,
  "/admin/applications": LuFileText,
  "/admin/settings": LuSettings,
  "/admin/health": LuActivity,
  "/about": LuUser,
  "/gallery": LuFileText,
  "/contact": LuMail,
};

// ─── Root pages where back button doesn't appear ─────────────────────────────

const ROOT_PAGES = new Set(["/", "/home", "/admin"]);

// ─── Breakpoint — links visible at each width tier ───────────────────────────
// We show up to N links in the center nav; the rest collapse into the dropdown.
// This is purely visual — all links are accessible via the dropdown regardless.

const VISIBLE_AT_LG = 6; // ≥1024px show up to 6
const VISIBLE_AT_MD = 4; // ≥768px show up to 4
// Below md: 0 (all in mobile sheet)

// ─── Component ────────────────────────────────────────────────────────────────

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const role = user?.role ?? null;

  // Derive mode from pathname — console mode = any /admin route
  const isAdminArea = pathname?.startsWith("/admin") ?? false;
  const mode: NavMode = isAdminArea ? "console" : "main";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openForPath, setOpenForPath] = useState(pathname);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // ✅ Synchronous render-time correction — React allows setState during render
  // when it's driven by a derived value change (not an effect). This resets
  // both menus whenever pathname changes without triggering a cascading effect.
  if (openForPath !== pathname) {
    setOpenForPath(pathname);
    if (mobileOpen) setMobileOpen(false);
    if (userMenuOpen) setUserMenuOpen(false);
  }

  const canSwitchMode = role === "admin" || role === "webmaster";
  const allLinks = resolveLinks(role, isAuthenticated, mode);
  const showBack = isAuthenticated && !ROOT_PAGES.has(pathname ?? "");

  // Scroll glass effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  // Hide on ticket verify page
  if (pathname?.startsWith("/verify/ticket")) return null;

  // Links shown inline in the desktop center nav (progressive collapse)
  // The rest overflow into the "More" dropdown / user menu
  // We use CSS to control visibility at each breakpoint via hidden/flex classes
  const inlineLinksLg = allLinks.slice(0, VISIBLE_AT_LG);
  const inlineLinksMd = allLinks.slice(0, VISIBLE_AT_MD);
  const overflowLinks = allLinks.slice(VISIBLE_AT_MD); // shown in dropdown on md
  const overflowLinksLg = allLinks.slice(VISIBLE_AT_LG); // shown in dropdown on lg+

  function isActive(href: string) {
    if (href === "/" || href === "/home") return pathname === href;
    return pathname?.startsWith(href) ?? false;
  }

  function handleLogout() {
    setMobileOpen(false);
    setUserMenuOpen(false);
    logout();
  }

  return (
    <header className="fixed top-0 left-0 w-full z-[100] flex justify-center px-4 py-4 transition-all duration-300">
      <div className="w-full max-w-7xl">
        {/* ── Glass pill ─────────────────────────────────────────────────── */}
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl border px-5 py-3 transition-all duration-300",
            scrolled
              ? "bg-background/95 border-border shadow-lg backdrop-blur-md"
              : "bg-background/60 border-background/10 backdrop-blur-sm shadow-md",
          )}
        >
          {/* ── Left: back or logo ─────────────────────────────────────── */}
          <div className="flex items-center gap-3 shrink-0">
            {showBack ? (
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
              >
                <LuArrowLeft className="w-4 h-4" />
                <span className="hidden sm:block">Back</span>
              </button>
            ) : (
              <Link
                href={
                  isAuthenticated
                    ? mode === "console"
                      ? "/admin"
                      : "/home"
                    : "/"
                }
              >
                <div className="flex items-center gap-2.5">
                  <Image
                    alt="DIUSCADI"
                    src={logo}
                    className="w-7 h-7"
                    priority
                  />
                  <span className="text-xl font-bold text-primary hidden sm:block">
                    DIUSCADI
                  </span>
                  {/* Mode badge */}
                  {isAuthenticated && (
                    <span
                      className={cn(
                        "hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                        mode === "console"
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "bg-muted text-muted-foreground border border-border",
                      )}
                    >
                      {mode === "console" ? "Console" : "Main Site"}
                    </span>
                  )}
                </div>
              </Link>
            )}
          </div>

          {/* ── Center: desktop nav links (progressive collapse) ───────── */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2 z-10">
            {/* md: show up to 4 links */}
            {inlineLinksMd.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors lg:hidden",
                  isActive(link.href)
                    ? "bg-primary/10 text-primary font-black"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {link.name}
              </Link>
            ))}

            {/* lg+: show up to 6 links */}
            {inlineLinksLg.map((link) => (
              <Link
                key={`lg-${link.href}`}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hidden lg:block",
                  isActive(link.href)
                    ? "bg-primary/10 text-primary font-black"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {link.name}
              </Link>
            ))}

            {/* Overflow "More" button — md only (when >4 links) */}
            {overflowLinks.length > 0 && (
              <OverflowMenu
                links={overflowLinks}
                isActive={isActive}
                className="lg:hidden"
              />
            )}

            {/* Overflow "More" button — lg+ (when >6 links) */}
            {overflowLinksLg.length > 0 && (
              <OverflowMenu
                links={overflowLinksLg}
                isActive={isActive}
                className="hidden lg:block"
              />
            )}
          </nav>

          {/* ── Right: actions ─────────────────────────────────────────── */}
          <div className="flex items-center gap-2 shrink-0">
            {isAuthenticated ? (
              <>
                {/* Console ↔ Main Site switch — admin/webmaster only */}
                {canSwitchMode &&
                  (mode === "console" ? (
                    <Link
                      href="/home"
                      className="hidden md:flex items-center gap-1.5 px-3 py-2 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:border-foreground hover:text-foreground transition-all"
                    >
                      ← Main Site
                    </Link>
                  ) : (
                    <Link
                      href="/admin"
                      className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all"
                    >
                      <LuShieldCheck className="w-3.5 h-3.5" />
                      Console
                    </Link>
                  ))}

                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border hover:border-foreground transition-all"
                    aria-label="User menu"
                    aria-expanded={userMenuOpen}
                  >
                    <LuUser className="w-4 h-4 text-muted-foreground" />
                    <LuChevronDown
                      className={cn(
                        "w-3 h-3 text-muted-foreground transition-transform duration-200",
                        userMenuOpen && "rotate-180",
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 28,
                        }}
                        className="absolute right-0 top-12 w-56 bg-background border border-border rounded-2xl shadow-2xl z-50 p-2 space-y-0.5"
                      >
                        {/* Identity header */}
                        <div className="px-3 py-2 mb-1">
                          <p className="text-[10px] font-black text-foreground uppercase tracking-widest truncate">
                            {user?.fullName
                              ? typeof user.fullName === "string"
                                ? user.fullName
                                : `${(user.fullName as { firstname?: string }).firstname ?? ""}`
                              : "My Account"}
                          </p>
                          <p className="text-[9px] text-muted-foreground mt-0.5 capitalize">
                            {role ?? "member"} ·{" "}
                            {mode === "console" ? "Console" : "Main Site"}
                          </p>
                        </div>

                        <div className="h-px bg-border mx-1" />

                        {/* Quick links — always shown */}
                        <UserMenuItem
                          icon={LuUser}
                          label="Profile"
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                        />
                        <UserMenuItem
                          icon={LuTicket}
                          label="My Tickets"
                          href="/tickets"
                          onClick={() => setUserMenuOpen(false)}
                        />
                        <UserMenuItem
                          icon={LuCalendar}
                          label="Events"
                          href="/events"
                          onClick={() => setUserMenuOpen(false)}
                        />
                        <UserMenuItem
                          icon={LuSettings}
                          label="Settings"
                          href="/settings"
                          onClick={() => setUserMenuOpen(false)}
                        />

                        {/* Console link — only admin/webmaster, only in main mode */}
                        {canSwitchMode && mode === "main" && (
                          <>
                            <div className="h-px bg-border mx-1 my-1" />
                            <UserMenuItem
                              icon={LuLayoutDashboard}
                              label="Admin Console"
                              href="/admin"
                              onClick={() => setUserMenuOpen(false)}
                              accent
                            />
                          </>
                        )}

                        {/* Main site link — only in console mode */}
                        {mode === "console" && (
                          <>
                            <div className="h-px bg-border mx-1 my-1" />
                            <UserMenuItem
                              icon={LuHouse}
                              label="Main Site"
                              href="/home"
                              onClick={() => setUserMenuOpen(false)}
                            />
                          </>
                        )}

                        <div className="h-px bg-border mx-1 my-1" />

                        {/* Sign out */}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 transition-colors group"
                        >
                          <LuLogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Sign Out
                          </span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile hamburger */}
                <button
                  className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors"
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label={mobileOpen ? "Close menu" : "Open menu"}
                >
                  {mobileOpen ? <LuX size={20} /> : <LuMenu size={20} />}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/auth?redirect=${encodeURIComponent(pathname ?? "/home")}`}
                  className="hidden md:flex items-center px-5 py-2.5 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all"
                >
                  Register
                </Link>
                <button
                  className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors"
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label={mobileOpen ? "Close menu" : "Open menu"}
                >
                  {mobileOpen ? <LuX size={20} /> : <LuMenu size={20} />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Mobile sheet ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className={cn(
                "md:hidden mt-3 rounded-2xl border border-border",
                "bg-background/98 backdrop-blur-md shadow-xl p-3 space-y-1",
              )}
            >
              {/* Mode badge */}
              {isAuthenticated && (
                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    {mode === "console" ? "🖥 Console Mode" : "🌐 Main Site"}
                  </span>
                  {canSwitchMode && (
                    <Link
                      href={mode === "console" ? "/home" : "/admin"}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                        mode === "console"
                          ? "border border-border text-muted-foreground hover:border-foreground"
                          : "bg-foreground text-background hover:bg-primary",
                      )}
                    >
                      {mode === "console" ? (
                        <>← Main Site</>
                      ) : (
                        <>
                          <LuShieldCheck className="w-3 h-3" /> Console
                        </>
                      )}
                    </Link>
                  )}
                </div>
              )}

              {/* All nav links */}
              {allLinks.map((link) => {
                const Icon = LINK_ICONS[link.href] ?? LuFileText;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors",
                      isActive(link.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {link.name}
                  </Link>
                );
              })}

              {/* Bottom actions */}
              <div className="h-px bg-border mx-2 my-2" />

              {!isAuthenticated ? (
                <Link
                  href={`/auth?redirect=${encodeURIComponent(pathname ?? "/home")}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center w-full py-3 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all"
                >
                  Register / Sign In
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors group"
                >
                  <LuLogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  Sign Out
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

// ─── Overflow "More" dropdown ─────────────────────────────────────────────────

function OverflowMenu({
  links,
  isActive,
  className,
}: {
  links: { name: string; href: string }[];
  isActive: (href: string) => boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const hasActiveLink = links.some((l) => isActive(l.href));

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
          hasActiveLink
            ? "text-primary font-black bg-primary/10"
            : "text-muted-foreground hover:text-foreground hover:bg-muted",
        )}
      >
        More
        <LuChevronDown
          className={cn(
            "w-3 h-3 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="absolute left-0 top-10 w-44 bg-background border border-border rounded-2xl shadow-2xl z-[999999] p-2 space-y-0.5"
          >
            {links.map((link) => {
              const Icon = LINK_ICONS[link.href] ?? LuFileText;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors",
                    isActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {link.name}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── User menu item ───────────────────────────────────────────────────────────

const UserMenuItem: React.FC<{
  icon: React.ElementType;
  label: string;
  href: string;
  onClick?: () => void;
  accent?: boolean;
}> = ({ icon: Icon, label, href, onClick, accent }) => (
  <Link
    href={href}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
      accent
        ? "text-primary hover:bg-primary/10"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    )}
  >
    <Icon className="w-4 h-4 shrink-0" />
    <span className="text-[10px] font-black uppercase tracking-widest">
      {label}
    </span>
  </Link>
);
