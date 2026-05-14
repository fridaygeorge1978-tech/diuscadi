// lib/sendEmail.ts
//
// Dev:  logs to console only — no SMTP env vars required.
// Prod: sends real emails via nodemailer transporter.
//
// API routes import ONLY from here — never from MailTemplate.ts or mailer.ts directly.

import {
  verificationEmail,
  resetPasswordEmail,
  welcomeEmail,
  schoolVerificationEmail,
  eventRegistrationEmail,
  eventReminderEmail,
  applicationStatusEmail,
  membershipWelcomeEmail,
  type EventRegistrationEmailOptions,
  type EventReminderEmailOptions,
  type ApplicationStatusEmailOptions,
  type MembershipWelcomeEmailOptions,
} from "@/lib/MailTemplate";

const IS_DEV =
  process.env.NODE_ENV === "development" &&
  process.env.SEND_REAL_EMAILS !== "true";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Lazy-load mailer in production only.
// mailer.ts throws at module load if SMTP env vars are missing —
// dynamic import keeps dev completely isolated from it.
async function prodSend(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const { sendMail } = await import("@/utils/mailer");
  await sendMail(options);
}

// ─── 1. Verification email ────────────────────────────────────────────────────

export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  code: string;
  token: string;
}): Promise<void> {
  const verifyUrl = `${APP_URL}/auth/verify?token=${opts.token}&email=${encodeURIComponent(opts.to)}`;

  if (IS_DEV) {
    console.log(`[DEV EMAIL] Verification → ${opts.to}`);
    console.log(`  Name:       ${opts.name}`);
    console.log(`  OTP:        ${opts.code}`);
    console.log(`  Magic link: ${verifyUrl}`);
    return;
  }

  const { subject, html, text } = verificationEmail({
    name: opts.name,
    code: opts.code,
    verifyUrl,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 2. Password reset email ──────────────────────────────────────────────────

export async function sendResetPasswordEmail(opts: {
  to: string;
  name: string;
  code: string;
  token: string;
}): Promise<void> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${opts.token}&email=${encodeURIComponent(opts.to)}`;

  if (IS_DEV) {
    console.log(`[DEV EMAIL] Password reset → ${opts.to}`);
    console.log(`  Name:      ${opts.name}`);
    console.log(`  OTP:       ${opts.code}`);
    console.log(`  Reset URL: ${resetUrl}`);
    return;
  }

  const { subject, html, text } = resetPasswordEmail({
    name: opts.name,
    code: opts.code,
    resetUrl,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 3. Welcome email (sent after successful verification) ────────────────────

export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
  role: string;
}): Promise<void> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Welcome → ${opts.to}`);
    console.log(`  Name: ${opts.name}`);
    console.log(`  Role: ${opts.role}`);
    return;
  }

  const { subject, html, text } = welcomeEmail({
    name: opts.name,
    role: opts.role,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 4. School email verification ────────────────────────────────────────────

export async function sendSchoolVerificationEmail(opts: {
  to: string;
  name: string;
  code: string;
}): Promise<void> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] School email verification → ${opts.to}`);
    console.log(`  Name:  ${opts.name}`);
    console.log(`  OTP:   ${opts.code}`);
    return;
  }

  const { subject, html, text } = schoolVerificationEmail({
    name: opts.name,
    code: opts.code,
    schoolEmail: opts.to,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 5. Event registration confirmation ──────────────────────────────────────
//
// Called immediately after a successful event registration.
// Requires the registration's inviteCode and the ticket's DB ID for the URL.

export async function sendEventRegistrationEmail(
  opts: {
    to: string;
    ticketId: string; // MongoDB _id of the eventRegistration document
  } & Omit<EventRegistrationEmailOptions, "ticketUrl">,
): Promise<void> {
  const ticketUrl = `${APP_URL}/tickets/${opts.ticketId}`;

  if (IS_DEV) {
    console.log(`[DEV EMAIL] Event registration confirmation → ${opts.to}`);
    console.log(`  Event:       ${opts.eventTitle}`);
    console.log(`  Date:        ${opts.eventDate}`);
    console.log(`  Location:    ${opts.eventLocation}`);
    console.log(`  Ticket code: ${opts.ticketCode}`);
    console.log(`  Ticket URL:  ${ticketUrl}`);
    return;
  }

  const { subject, html, text } = eventRegistrationEmail({
    name: opts.name,
    eventTitle: opts.eventTitle,
    eventDate: opts.eventDate,
    eventLocation: opts.eventLocation,
    ticketCode: opts.ticketCode,
    ticketUrl,
    isFree: opts.isFree,
    ticketPrice: opts.ticketPrice,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 6. Event reminder ────────────────────────────────────────────────────────
//
// Intended to be called by a scheduled job (cron) ~24h before an event.
// Pass hoursUntil=24 for the standard reminder. The function itself does
// not schedule — the caller (cron route or job) is responsible for timing.

export async function sendEventReminderEmail(
  opts: {
    to: string;
    ticketId: string;
  } & Omit<EventReminderEmailOptions, "ticketUrl">,
): Promise<void> {
  const ticketUrl = `${APP_URL}/tickets/${opts.ticketId}`;

  if (IS_DEV) {
    console.log(`[DEV EMAIL] Event reminder → ${opts.to}`);
    console.log(`  Event:       ${opts.eventTitle}`);
    console.log(`  Hours until: ${opts.hoursUntil}`);
    console.log(`  Ticket code: ${opts.ticketCode}`);
    return;
  }

  const { subject, html, text } = eventReminderEmail({
    name: opts.name,
    eventTitle: opts.eventTitle,
    eventDate: opts.eventDate,
    eventLocation: opts.eventLocation,
    ticketCode: opts.ticketCode,
    ticketUrl,
    hoursUntil: opts.hoursUntil,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 7. Application status (approved or rejected) ────────────────────────────
//
// Generic — works for all 6 application types.
// Pass status: "approved" | "rejected" and an optional reviewNote.
// Pass ctaLabel + ctaUrl when there's a meaningful next action (e.g.
// "View Your Profile" after membership approval, "Browse Events" after skills).

export async function sendApplicationStatusEmail(
  opts: {
    to: string;
  } & ApplicationStatusEmailOptions,
): Promise<void> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Application ${opts.status} → ${opts.to}`);
    console.log(`  Type:   ${opts.applicationType}`);
    console.log(`  Status: ${opts.status}`);
    if (opts.reviewNote) console.log(`  Note:   ${opts.reviewNote}`);
    return;
  }

  const { subject, html, text } = applicationStatusEmail({
    name: opts.name,
    applicationType: opts.applicationType,
    status: opts.status,
    reviewNote: opts.reviewNote,
    ctaLabel: opts.ctaLabel,
    ctaUrl: opts.ctaUrl,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 8. Membership approved welcome ──────────────────────────────────────────
//
// Richer, celebratory email sent specifically when a membership application
// is approved — in addition to the generic application status email.
// The two can be sent in sequence from the approval route:
//   1. sendApplicationStatusEmail({ status: "approved", ... })
//   2. sendMembershipWelcomeEmail({ ... })

export async function sendMembershipWelcomeEmail(
  opts: {
    to: string;
  } & MembershipWelcomeEmailOptions,
): Promise<void> {
  const profileUrl = opts.profileUrl ?? `${APP_URL}/profile`;
  const eventsUrl = opts.eventsUrl ?? `${APP_URL}/events`;

  if (IS_DEV) {
    console.log(`[DEV EMAIL] Membership welcome → ${opts.to}`);
    console.log(`  Name:        ${opts.name}`);
    console.log(`  Profile URL: ${profileUrl}`);
    console.log(`  Events URL:  ${eventsUrl}`);
    return;
  }

  const { subject, html, text } = membershipWelcomeEmail({
    name: opts.name,
    profileUrl,
    eventsUrl,
  });
  await prodSend({ to: opts.to, subject, html, text });
}

// ─── 9. Contact form — internal notification ──────────────────────────────────

export async function sendContactEnquiryEmail(opts: {
  senderName: string;
  senderEmail: string;
  organisation?: string;
  enquiryType: string;
  subject: string;
  message: string;
}): Promise<void> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Contact enquiry → DIUSCADI inbox`);
    console.log(`  From:    ${opts.senderName} <${opts.senderEmail}>`);
    console.log(`  Type:    ${opts.enquiryType}`);
    console.log(`  Subject: ${opts.subject}`);
    console.log(`  Message: ${opts.message.slice(0, 80)}...`);
    return;
  }

  const { contactEnquiryEmail } = await import("@/lib/MailTemplate");
  const { subject, html, text } = contactEnquiryEmail(opts);
  await prodSend({
    to: process.env.CONTACT_INBOX_EMAIL ?? "info@diuscadi.org.ng",
    subject,
    html,
    text,
  });
}

// ─── 10. Contact form — auto-reply to sender ──────────────────────────────────

export async function sendContactAutoReplyEmail(opts: {
  to: string;
  senderName: string;
  enquiryType: string;
  subject: string;
  message: string;
}): Promise<void> {
  if (IS_DEV) {
    console.log(`[DEV EMAIL] Contact auto-reply → ${opts.to}`);
    console.log(`  Name:    ${opts.senderName}`);
    console.log(`  Subject: ${opts.subject}`);
    return;
  }

  const { contactAutoReplyEmail } = await import("@/lib/MailTemplate");
  const { subject, html, text } = contactAutoReplyEmail({
    senderName: opts.senderName,
    enquiryType: opts.enquiryType,
    subject: opts.subject,
    message: opts.message,
  });
  await prodSend({ to: opts.to, subject, html, text });
}