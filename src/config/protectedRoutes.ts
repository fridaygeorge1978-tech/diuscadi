export type UserRole = "participant" | "moderator" | "admin" | "webmaster";

interface RouteConfig {
  path: string;
  authRequired: boolean;
  roles?: UserRole[];
  redirect?: string;
}

export const ROUTE_MANIFEST: RouteConfig[] = [
  { path: "/admin", authRequired: true, roles: ["admin", "webmaster"] },
  { path: "/admin/analytics", authRequired: true, roles: ["admin", "webmaster"] },
  { path: "/profile", authRequired: true },
  { path: "/settings", authRequired: true },
  { path: "/tickets", authRequired: true },
  { path: "/home", authRequired: true },
  { path: "/events", authRequired: true },
  { path: "/users", authRequired: true },
  { path: "/auth", authRequired: false, redirect: "/home" }, // Redirect if already logged in
];
