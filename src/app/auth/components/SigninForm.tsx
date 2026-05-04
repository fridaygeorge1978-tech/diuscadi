"use client";
import React, { useState } from "react";
import { LuAtSign, LuLock, LuGithub, LuPhone, LuMail } from "react-icons/lu";
import { FcGoogle } from "react-icons/fc";
import { AuthInput } from "./AuthInput";
import Link from "next/link";
import { IconType } from "react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, SigninCredentials } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

// ─── Identifier detection (mirrors the server-side logic) ────────────────────
// Pure digits (with optional leading +) → phone. Everything else → email.
function detectIdentifierType(value: string): "email" | "phone" | "unknown" {
  if (!value) return "unknown";
  if (/^\+?\d+$/.test(value.trim())) return "phone";
  if (value.includes("@")) return "email";
  return "unknown";
}

interface SigninFormProps {
  redirectTo?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const SigninForm: React.FC<SigninFormProps> = ({ redirectTo }) => {
  const { signin, isLoading, error, clearError } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [localErr, setLocalErr] = useState<string | null>(null);

  const idType = detectIdentifierType(identifier);

  // Swap icon based on what the user is typing
  const IdentifierIcon =
    idType === "phone" ? LuPhone : idType === "email" ? LuMail : LuAtSign;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setLocalErr(null);
    setIdentifier(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);

    if (!identifier.trim()) {
      setLocalErr("Enter your email or phone number.");
      return;
    }
    if (!password) {
      setLocalErr("Password is required.");
      return;
    }

    const credentials: SigninCredentials = {
      identifier: identifier.trim(),
      password,
    };

    await signin(credentials, redirectTo);
  };

  const displayError = localErr ?? error?.message ?? null;

  return (
    <form className={cn("space-y-6", "w-full")} onSubmit={handleSubmit}>
      {/* ── Error banner ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {displayError && (
          <motion.div
            key="err"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={cn(
              "px-4",
              "py-3",
              "bg-red-50",
              "border",
              "border-red-100",
              "rounded-xl",
            )}
          >
            <p className={cn("text-[10px]", "font-bold", "text-red-500")}>
              {displayError}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fields ──────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Identifier — auto-detects email vs phone */}
        <div className="space-y-1.5">
          <AuthInput
            label="Email or Phone Number"
            icon={IdentifierIcon}
            type="text"
            value={identifier}
            onChange={handleChange}
            autoComplete="username"
            inputMode={idType === "phone" ? "tel" : "email"}
          />
          {/* Subtle hint that updates as user types */}
          <AnimatePresence mode="wait">
            {idType !== "unknown" && (
              <motion.p
                key={idType}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "text-[8px]",
                  "font-bold",
                  "text-muted-foreground",
                  "uppercase",
                  "tracking-widest",
                  "px-1",
                )}
              >
                {idType === "phone"
                  ? "📱 Signing in with phone number"
                  : "✉️ Signing in with email"}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <AuthInput
          label="Password"
          icon={LuLock}
          type="password"
          value={password}
          onChange={(e) => {
            clearError();
            setLocalErr(null);
            setPassword(e.target.value);
          }}
          autoComplete="current-password"
        />
      </div>

      {/* ── Remember me + Forgot password ───────────────────────────────── */}
      <div className={cn("flex", "items-center", "justify-between", "px-2")}>
        <label
          className={cn(
            "flex",
            "items-center",
            "gap-2",
            "cursor-pointer",
            "group",
          )}
        >
          <input
            type="checkbox"
            className={cn(
              "w-4",
              "h-4",
              "rounded",
              "border-border",
              "text-foreground",
              "focus:ring-0",
            )}
          />
          <span
            className={cn(
              "text-[10px]",
              "font-black",
              "text-muted-foreground",
              "uppercase",
              "tracking-widest",
              "group-hover:text-foreground",
              "transition-colors",
            )}
          >
            Remember Me
          </span>
        </label>
        <Link
          href="/auth/forgot-password"
          className={cn(
            "text-[10px]",
            "font-black",
            "text-muted-foreground",
            "uppercase",
            "tracking-widest",
            "hover:text-primary",
            "transition-colors",
          )}
        >
          Forgot Password?
        </Link>
      </div>

      {/* ── Submit ──────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          "w-full",
          "py-4",
          "bg-foreground",
          "text-background",
          "rounded-2xl",
          "text-[10px]",
          "font-black",
          "uppercase",
          "tracking-[0.2em]",
          "hover:bg-secondary",
          "hover:border-primary",
          "border",
          "border-transparent",
          "hover:text-foreground",
          "duration-700",
          "ease-in-out",
          "transition-all",
          "shadow-xl",
          "shadow-foreground/10",
          "disabled:opacity-60",
          "disabled:cursor-not-allowed",
          "flex",
          "items-center",
          "justify-center",
          "gap-2",
        )}
      >
        {isLoading ? (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              className={cn(
                "w-3.5",
                "h-3.5",
                "border-2",
                "border-background/30",
                "border-t-background",
                "rounded-full",
                "inline-block",
              )}
            />
            Signing In...
          </>
        ) : (
          "Secure Sign In"
        )}
      </button>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div className={cn("relative", "py-2")}>
        <div className={cn("absolute", "inset-0", "flex", "items-center")}>
          <span className={cn("w-full", "border-t", "border-border")} />
        </div>
        <div className={cn("relative", "flex", "justify-center")}>
          <span
            className={cn(
              "text-[8px]",
              "font-black",
              "uppercase",
              "tracking-[0.3em]",
              "text-slate-300",
              "bg-background",
              "px-4",
            )}
          >
            Or Continue With
          </span>
        </div>
      </div>

      {/* ── Social buttons (Coming Soon) ─────────────────────────────────── */}
      <div className={cn("grid", "grid-cols-2", "gap-4")}>
        <SocialButton icon={FcGoogle} label="Google" />
        <SocialButton icon={LuGithub} label="Github" />
      </div>
    </form>
  );
};

// ─── Social button ────────────────────────────────────────────────────────────
const SocialButton = ({
  icon: Icon,
  label,
}: {
  icon: IconType;
  label: string;
}) => (
  <div className={cn("relative", "group")}>
    <button
      type="button"
      disabled
      className={cn(
        "w-full",
        "flex",
        "items-center",
        "justify-center",
        "gap-3",
        "py-3",
        "border",
        "border-border",
        "rounded-xl",
        "bg-muted/50",
        "opacity-50",
        "cursor-not-allowed",
        "transition-opacity",
      )}
    >
      <Icon className={cn("w-4", "h-4")} />
      <span
        className={cn(
          "text-[9px]",
          "font-black",
          "text-slate-600",
          "uppercase",
          "tracking-widest",
        )}
      >
        {label}
      </span>
    </button>
    {/* Coming soon tooltip */}
    <div
      className={cn(
        "absolute",
        "-top-8",
        "left-1/2",
        "-translate-x-1/2",
        "opacity-0",
        "group-hover:opacity-100",
        "transition-opacity",
        "pointer-events-none",
      )}
    >
      <div
        className={cn(
          "bg-foreground",
          "text-background",
          "text-[8px]",
          "font-black",
          "uppercase",
          "tracking-widest",
          "px-2.5",
          "py-1.5",
          "rounded-lg",
          "whitespace-nowrap",
        )}
      >
        Coming Soon
        <div
          className={cn(
            "absolute",
            "top-full",
            "left-1/2",
            "-translate-x-1/2",
            "border-4",
            "border-transparent",
            "border-t-foreground",
          )}
        />
      </div>
    </div>
  </div>
);
