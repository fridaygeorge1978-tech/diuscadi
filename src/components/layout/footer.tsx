"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import {
  LuMail,
  LuPhone,
  LuMapPin,
  LuFacebook,
  LuLinkedin,
  LuInstagram,
  LuYoutube,
} from "react-icons/lu";
import logo from "@/assets/img/logo.webp";

export default function Footer() {
  const { isAuthenticated, user } = useAuth();
  const role = user?.role ?? null;
  const pathname = usePathname();

  // Hide footer on admin pages and verify pages
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/verify"))
    return null;

  const homeHref = isAuthenticated ? "/home" : "/";

  // Quick links change based on auth state
  const quickLinks = isAuthenticated
    ? [
        { name: "Home", href: "/home" },
        { name: "Events", href: "/events" },
        { name: "My Tickets", href: "/tickets" },
        { name: "Profile", href: "/profile" },
        ...(role === "admin" || role === "webmaster" || role === "moderator"
          ? [{ name: "Admin Console", href: "/admin" }]
          : []),
      ]
    : [
        { name: "Home", href: "/" },
        { name: "About Us", href: "/about" },
        { name: "Events", href: "/events" },
        { name: "Register", href: "/auth" },
        { name: "Contact", href: "/contact" },
      ];

  return (
    <footer className={cn("bg-muted/40", "border-t")}>
      <div className={cn("container", "mx-auto", "px-6", "py-12")}>
        {/* Top Grid */}
        <div
          className={cn(
            "grid",
            "grid-cols-1",
            "md:grid-cols-2",
            "lg:grid-cols-4",
            "gap-10",
          )}
        >
          {/* Logo + Description */}
          <div>
            <Link href={homeHref} className="flex items-center gap-3 w-fit">
              <Image alt="" src={logo} className="w-7 h-7" />
              <h2 className={cn("text-xl", "font-bold", "text-primary")}>
                DIUSCADI
              </h2>
            </Link>
            <p
              className={cn(
                "mt-4",
                "text-sm",
                "text-muted-foreground",
                "leading-relaxed",
              )}
            >
              Shaping the Young for Future Career Success — through skills
              training, mentorship, and the annual LASCADSS seminar series.
            </p>
            {/* Socials */}
            <div className={cn("flex", "gap-4", "mt-6")}>
              {[
                { Icon: LuFacebook, href: "https://facebook.com/diuscadi" },
                {
                  Icon: LuLinkedin,
                  href: "https://linkedin.com/company/diuscadi",
                },
                { Icon: LuInstagram, href: "https://instagram.com/diuscadi" },
                { Icon: LuYoutube, href: "https://youtube.com/@diuscadi" },
              ].map(({ Icon, href }, i) => (
                <Link
                  key={i}
                  href={href}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Icon size={18} />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className={cn("font-semibold", "mb-4")}>Quick Links</h3>
            <div className={cn("space-y-3", "text-sm")}>
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Programs */}
          <div>
            <h3 className={cn("font-semibold", "mb-4")}>Programs</h3>
            <div className={cn("space-y-3", "text-sm")}>
              {[
                "Career Seminars",
                "Mentorship Programs",
                "Graduate Training",
                "Skill Development",
              ].map((p) => (
                <p key={p} className="text-muted-foreground">
                  {p}
                </p>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className={cn("font-semibold", "mb-4")}>Contact</h3>
            <div className={cn("space-y-4", "text-sm")}>
              {[
                {
                  Icon: LuMapPin,
                  text: "Dept. of IT, UNIZIK, Awka, Anambra State",
                },
                { Icon: LuMail, text: "info@diuscadi.org.ng" },
                { Icon: LuPhone, text: "+234-8035906416" },
              ].map(({ Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-3 text-muted-foreground"
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className={cn(
            "border-t",
            "mt-10",
            "pt-6",
            "text-center",
            "text-sm",
            "text-muted-foreground",
          )}
        >
          © {new Date().getFullYear()} DIUSCADI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
