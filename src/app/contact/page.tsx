"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  MapPin,
  Phone,
  Github,
  Twitter,
  Linkedin,
  Clock,
  Send,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Users,
  FileText,
  Briefcase,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "../../lib/utils";

/* ─── Schema ─────────────────────────────────────────────────────────────────── */

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  organisation: z.string().optional(),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  type: z.string(),
  message: z.string().min(10, "Message is too short"),
});

/* ─── Data ───────────────────────────────────────────────────────────────────── */

const contactInfo = [
  {
    icon: Mail,
    label: "General Enquiries",
    value: "info@diuscadi.org.ng",
    sub: "We respond within 2 business days",
  },
  {
    icon: Mail,
    label: "Founder (Direct)",
    value: "ik.umeh@unizik.edu.ng",
    sub: "Prof. Chief Ikechukwu I. Umeh",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+234-8035906416",
    sub: "Mon – Fri, 9 AM – 5 PM WAT",
  },
  {
    icon: MapPin,
    label: "Head Office",
    value:
      "c/o Dept of Information Technology, Nnamdi Azikiwe University, Awka",
    sub: "Anambra State, Nigeria",
  },
];

const enquiryTypes = [
  { value: "general", label: "General Enquiry", icon: MessageSquare },
  { value: "membership", label: "LASCADSS / Membership", icon: Users },
  { value: "research", label: "Research / Press", icon: FileText },
  { value: "partnership", label: "Partnership", icon: ArrowRight },
  { value: "sponsorship", label: "Sponsorship", icon: Briefcase },
];

const officeHours = [
  { day: "Monday – Friday", hours: "9:00 AM – 5:00 PM WAT" },
  { day: "Saturday", hours: "By appointment" },
  { day: "Sunday", hours: "Closed" },
];


/* ─── Page ───────────────────────────────────────────────────────────────────── */

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      organisation: "",
      subject: "",
      type: "general",
      message: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setServerError(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-16">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl space-y-4"
      >
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
          <span className="w-6 h-px bg-primary/60 rounded-full" />
          Contact Us
        </span>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.05]">
          Let&apos;s <span className="text-primary">Start</span> a Conversation
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Whether you&apos;re a researcher, journalist, policymaker, or
          prospective member — we&apos;d love to hear from you. Fill in the form
          or reach us directly through any of the channels below.
        </p>
      </motion.div>

      {/* ── Main Grid ── */}
      <div className="grid lg:grid-cols-5 gap-8 items-start">
        {/* ── Left: Info ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Contact details */}
          <div className="space-y-3">
            {contactInfo.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.07,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="glass rounded-2xl p-4 flex items-start gap-4 group hover:border-primary/30 transition-colors"
              >
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                  <item.icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">
                    {item.label}
                  </p>
                  <p className="font-bold text-sm break-words leading-snug">
                    {item.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.sub}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Office hours */}
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.32, duration: 0.5 }}
            className="glass rounded-2xl p-5 space-y-3"
          >
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Clock size={16} />
              Office Hours (WAT)
            </div>
            <div className="space-y-2">
              {officeHours.map((row, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{row.day}</span>
                  <span
                    className={cn(
                      "font-semibold",
                      row.hours === "Closed" && "text-destructive/70",
                    )}
                  >
                    {row.hours}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Socials */}
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex gap-3"
          >
            {[
              {
                Icon: Facebook,
                label: "Facebook",
                href: "https://facebook.com/diuscadi",
              },
              {
                Icon: Linkedin,
                label: "LinkedIn",
                href: "https://linkedin.com/company/diuscadi",
              },
              {
                Icon: Youtube,
                label: "YouTube",
                href: "https://youtube.com/@diuscadi",
              },
              {
                Icon: Instagram,
                label: "Instagram",
                href: "https://instagram.com/diuscadi",
              },
            ].map(({ Icon, label, href }, i) => (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="glass rounded-xl p-3 hover:text-primary hover:border-primary/30 transition-colors"
              >
                <Icon size={18} />
              </a>
            ))}
          </motion.div>

          {/* Map placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.46, duration: 0.5 }}
            className="glass rounded-3xl h-52 overflow-hidden relative"
          >
            {/* Stylised map grid pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <MapPin size={16} className="text-primary" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground">
                Nnamdi Azikiwe University, UNIZIK, Awka · Anambra, Nigeria
              </p>
              <a
                href="https://maps.google.com/?q=Nnamdi+Azikiwe+University+Awka+Anambra+Nigeria"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                Open in Google Maps →
              </a>
            </div>
          </motion.div>
        </div>

        {/* ── Right: Form ── */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-3 glass-heavy rounded-[2rem] border-t-4 border-t-primary overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {submitted ? (
              /* ── Success state ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="p-10 md:p-14 flex flex-col items-center text-center gap-5 min-h-[480px] justify-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-black">Message Sent!</h2>
                <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                  Thank you for reaching out. A member of our team will review
                  your message and respond within 2 business days.
                </p>
                <button
                  onClick={() => {
                    form.reset();
                    setSubmitted(false);
                  }}
                  className="mt-2 text-xs text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              /* ── Form ── */
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-7 md:p-10"
              >
                <div className="mb-7 space-y-1">
                  <h2 className="text-xl font-bold">Send us a message</h2>
                  <p className="text-xs text-muted-foreground">
                    All fields marked * are required.
                  </p>
                </div>

                {/* Enquiry type selector */}
                <div className="mb-6 space-y-2">
                  <p className="text-sm font-medium">Enquiry type *</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {enquiryTypes.map(({ value, label, icon: Icon }) => {
                      const active = form.watch("type") === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => form.setValue("type", value)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-2xl p-3 text-[11px] font-semibold border transition-all",
                            active
                              ? "bg-primary/10 border-primary/40 text-primary"
                              : "glass text-muted-foreground hover:text-foreground hover:border-border/80",
                          )}
                        >
                          <Icon size={16} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5"
                  >
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Amaka Obi"
                                className="glass"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="you@example.com"
                                className="glass"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="organisation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Organisation{" "}
                              <span className="text-muted-foreground font-normal">
                                (optional)
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your institution or company"
                                className="glass"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="How can we help?"
                                className="glass"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message *</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={5}
                              placeholder="Tell us more about your enquiry…"
                              className="glass resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {serverError && (
                      <p className="text-sm text-destructive text-center bg-destructive/10 rounded-xl px-4 py-3">
                        {serverError}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 font-bold text-base gap-2 rounded-2xl"
                    >
                      {submitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Send Message
                        </>
                      )}
                    </Button>

                    <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
                      By submitting this form you agree to our{" "}
                      <a
                        href="/privacy"
                        className="underline underline-offset-2 hover:text-foreground transition-colors"
                      >
                        Privacy Policy
                      </a>
                      . We never share your information with third parties.
                    </p>
                  </form>
                </Form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}
