// app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  sendContactEnquiryEmail,
  sendContactAutoReplyEmail,
} from "@/lib/sendEmail";

// ─── Validation ───────────────────────────────────────────────────────────────

const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(254),
  organisation: z.string().max(200).optional(),
  subject: z.string().min(5).max(200),
  type: z.enum([
    "general",
    "membership",
    "research",
    "partnership",
    "sponsorship",
  ]),
  message: z.string().min(10).max(5000),
});

// ─── Enquiry type → human label ───────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  general: "General Enquiry",
  membership: "LASCADSS / Membership",
  research: "Research / Press",
  partnership: "Partnership",
  sponsorship: "Sponsorship",
};

// ─── Simple IP-based rate limit ───────────────────────────────────────────────
// In-memory map: ip → { count, windowStart }
// Resets per Vercel cold start — good enough for a contact form.
// Replace with Redis if you need persistence across instances.

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT = 3; // max submissions
const WINDOW_MS = 60 * 60 * 1000; // per 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT) return true;

  entry.count += 1;
  return false;
}

// ─── POST /api/contact ────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Rate limit by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }

  // Parse + validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const { name, email, organisation, subject, type, message } = parsed.data;
  const enquiryType = TYPE_LABELS[type] ?? "General Enquiry";

  // Fire both emails — don't let one failure block the other
  const [internalResult, autoReplyResult] = await Promise.allSettled([
    sendContactEnquiryEmail({
      senderName: name,
      senderEmail: email,
      organisation,
      enquiryType,
      subject,
      message,
    }),
    sendContactAutoReplyEmail({
      to: email,
      senderName: name,
      enquiryType,
      subject,
      message,
    }),
  ]);

  // Log any failures server-side but don't expose details to client
  if (internalResult.status === "rejected") {
    console.error("[Contact] Internal email failed:", internalResult.reason);
  }
  if (autoReplyResult.status === "rejected") {
    console.error("[Contact] Auto-reply email failed:", autoReplyResult.reason);
  }

  // If both failed, return 500
  if (
    internalResult.status === "rejected" &&
    autoReplyResult.status === "rejected"
  ) {
    return NextResponse.json(
      {
        error: "Failed to send message. Please try again or email us directly.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
