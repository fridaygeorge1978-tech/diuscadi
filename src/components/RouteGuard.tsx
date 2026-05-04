"use client";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, AccountRole } from "@/context/AuthContext";
import { ROUTE_MANIFEST } from "@/config/protectedRoutes";
import { SessionSplash } from "./sessionSplash";
import { useHealthReporter } from "@/hooks/useHealthReporter";
import { LuConstruction } from "react-icons/lu";
import { cn } from "../lib/utils";

// ─── Role → post-login destination ───────────────────────────────────────────
const ROLE_HOME: Record<AccountRole, string> = {
  participant: "/home",
  moderator: "/home",
  admin: "/admin",
  webmaster: "/admin",
};

// Routes the guard itself redirects to — never block these or you get a loop
const GUARD_SYSTEM_ROUTES = ["/auth", "/unauthorized"];

// Fully public pages — no redirect even when unauthenticated
const OPEN_ROUTES = ["/about", "/contact", "/gallery"];

function isOpen(pathname: string) {
  return OPEN_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export const RouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, sessionStatus } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isDev = process.env.NODE_ENV === "development";

  // RUM — fires on every navigation for authenticated users, silently no-ops otherwise
  useHealthReporter();

  useEffect(() => {
    // Development: all routes unlocked
    if (isDev) return;

    // Session still resolving — don't make routing decisions yet
    if (sessionStatus === "pending") return;

    const isSystemRoute = GUARD_SYSTEM_ROUTES.some((r) =>
      pathname.startsWith(r),
    );

    // 1. Authenticated user on "/" or any "/auth/*" → send to their role home
    if (isAuthenticated && (pathname === "/" || pathname.startsWith("/auth"))) {
      router.replace(user ? ROLE_HOME[user.role] : "/home");
      return;
    }

    if (isSystemRoute) return;

    // 2. Open public routes — always let through regardless of auth
    if (isOpen(pathname)) return;

    // 3. Match manifest
    const routeRule = ROUTE_MANIFEST.find((route) =>
      pathname.startsWith(route.path),
    );

    if (!routeRule) return; // not in manifest — treat as public, allow through

    // 4. Auth required but not logged in → /auth
    if (routeRule.authRequired && !isAuthenticated) {
      const redirectParam = encodeURIComponent(pathname);
      router.replace(`/auth?redirect=${redirectParam}`);
      return;
    }

    // 5. Role-restricted — check user's AccountRole against allowed list
    if (routeRule.roles && routeRule.roles.length > 0 && user) {
      if (!routeRule.roles.includes(user.role)) {
        router.replace("/unauthorized");
      }
    }
  }, [pathname, isAuthenticated, sessionStatus, user, router, isDev]);

  return (
    <>
      {!isDev && <SessionSplash sessionStatus={sessionStatus} />}

      {children}

      {isDev && (
        <div
          className={cn(
            "fixed",
            "bottom-4",
            "right-4",
            "bg-amber-400",
            "text-foreground",
            "px-4",
            "py-2",
            "rounded-full",
            "flex",
            "items-center",
            "gap-2",
            "shadow-xl",
            "border-2",
            "border-foreground/20",
          )}
          style={{ zIndex: 9999 }}
        >
          <LuConstruction className={cn("w-4", "h-4", "animate-pulse")} />
          <span
            className={cn(
              "text-[10px]",
              "font-black",
              "uppercase",
              "tracking-widest",
            )}
          >
            Dev · Auth Bypassed
          </span>
        </div>
      )}
    </>
  );
};
