// lib/MailTemplate.ts
// ─── Email templates ──────────────────────────────────────────────────────────
//
// Plain HTML strings intentionally — no template engine dependency.
// The wrapper() helper provides the shared shell; each template fills in
// the content block. Inline styles are used because many email clients
// strip <style> blocks.

const APP_NAME = "DIUSCADI";
const PRIMARY_COLOR = "#0f172a"; // slate-900
const ACCENT_COLOR = "#facc15"; // primary yellow (match your Tailwind primary)

function wrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:${PRIMARY_COLOR};padding:32px 40px;text-align:center;">
              <div style="display:inline-block;background:${ACCENT_COLOR};border-radius:12px;padding:10px 14px;margin-bottom:16px;">
                <span style="font-size:20px;">⬡</span>
              </div>
              <div style="color:#ffffff;font-size:11px;font-weight:900;letter-spacing:0.25em;text-transform:uppercase;">
                ${APP_NAME} Ecosystem
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;font-weight:700;">
                This email was sent by ${APP_NAME}. If you didn't request this, ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ─── Shared blocks ────────────────────────────────────────────────────────────

function otpBlock(code: string): string {
  return `
    <div style="margin:28px 0;text-align:center;">
      <div style="display:inline-block;background:#f8fafc;border:2px solid #e2e8f0;border-radius:16px;padding:20px 32px;">
        <div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.25em;margin-bottom:8px;">
          Your Code
        </div>
        <div style="font-size:36px;font-weight:900;color:${PRIMARY_COLOR};letter-spacing:0.3em;">
          ${code}
        </div>
      </div>
      <p style="margin:12px 0 0;font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;">
        Expires in 15 minutes
      </p>
    </div>
  `;
}

function ctaButton(label: string, href: string): string {
  return `
    <div style="text-align:center;margin:28px 0;">
      <a href="${href}"
         style="display:inline-block;background:${PRIMARY_COLOR};color:#ffffff;text-decoration:none;
                font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;
                padding:14px 32px;border-radius:12px;">
        ${label}
      </a>
      <p style="margin:12px 0 0;font-size:9px;color:#94a3b8;">
        Or copy this link: <span style="color:${PRIMARY_COLOR};word-break:break-all;">${href}</span>
      </p>
    </div>
  `;
}

function infoBadge(label: string, value: string): string {
  return `
    <div style="margin:20px 0;background:#f8fafc;border-left:3px solid ${ACCENT_COLOR};border-radius:8px;padding:12px 16px;">
      <div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:4px;">
        ${label}
      </div>
      <div style="font-size:13px;font-weight:700;color:${PRIMARY_COLOR};word-break:break-all;">
        ${value}
      </div>
    </div>
  `;
}

/** Horizontal detail row — used in confirmation emails for event/ticket meta */
function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
        <span style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;">
          ${label}
        </span>
      </td>
      <td style="padding:10px 0 10px 16px;border-bottom:1px solid #f1f5f9;text-align:right;vertical-align:top;">
        <span style="font-size:12px;font-weight:700;color:${PRIMARY_COLOR};">
          ${value}
        </span>
      </td>
    </tr>
  `;
}

/** Accent banner — coloured callout strip used for status announcements */
function accentBanner(
  emoji: string,
  heading: string,
  sub: string,
  color: string,
  bgColor: string,
): string {
  return `
    <div style="background:${bgColor};border-radius:16px;padding:24px 28px;margin:24px 0;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">${emoji}</div>
      <div style="font-size:14px;font-weight:900;color:${color};text-transform:uppercase;letter-spacing:0.05em;">
        ${heading}
      </div>
      <div style="font-size:11px;font-weight:600;color:${color};opacity:0.8;margin-top:4px;">
        ${sub}
      </div>
    </div>
  `;
}

// ─── 1. Email Verification ────────────────────────────────────────────────────

interface VerificationEmailOptions {
  name: string;
  code: string;
  verifyUrl: string;
}

export function verificationEmail({
  name,
  code,
  verifyUrl,
}: VerificationEmailOptions) {
  const subject = `${APP_NAME} — Verify your account`;
  const html = wrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:${PRIMARY_COLOR};text-transform:uppercase;letter-spacing:-0.02em;">
      Verify Your Account
    </h1>
    <p style="margin:0 0 4px;font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;">
      Welcome, ${name}
    </p>
    <p style="margin:20px 0;font-size:13px;color:#475569;line-height:1.7;">
      Use the 6-digit code below <strong>or</strong> click the button to instantly
      verify your campus account. Use whichever arrives first in your workflow.
    </p>
    ${otpBlock(code)}
    <div style="text-align:center;margin:8px 0 20px;">
      <div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:16px;">
        — or verify instantly —
      </div>
    </div>
    ${ctaButton("Verify My Account", verifyUrl)}
  `);

  const text = `Hi ${name},\n\nYour DIUSCADI verification code is: ${code}\n\nOr click this link: ${verifyUrl}\n\nExpires in 15 minutes.`;

  return { subject, html, text };
}

// ─── 2. Password Reset ────────────────────────────────────────────────────────

interface ResetEmailOptions {
  name: string;
  code: string;
  resetUrl: string;
}

export function resetPasswordEmail({
  name,
  code,
  resetUrl,
}: ResetEmailOptions) {
  const subject = `${APP_NAME} — Reset your password`;
  const html = wrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:${PRIMARY_COLOR};text-transform:uppercase;letter-spacing:-0.02em;">
      Reset Your Password
    </h1>
    <p style="margin:0 0 4px;font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;">
      Hi, ${name}
    </p>
    <p style="margin:20px 0;font-size:13px;color:#475569;line-height:1.7;">
      We received a request to reset your password. Enter the 6-digit code on the
      reset page <strong>or</strong> click the button below to go directly to the
      new password step.
    </p>
    ${otpBlock(code)}
    <div style="text-align:center;margin:8px 0 20px;">
      <div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:16px;">
        — or reset instantly —
      </div>
    </div>
    ${ctaButton("Set New Password", resetUrl)}
    <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;text-align:center;">
      If you didn't request a password reset, you can safely ignore this email.
      Your password will not change.
    </p>
  `);

  const text = `Hi ${name},\n\nYour DIUSCADI password reset code is: ${code}\n\nOr click this link: ${resetUrl}\n\nExpires in 15 minutes.\n\nIf you didn't request this, ignore this email.`;

  return { subject, html, text };
}

// ─── 3. Welcome (post-verification) ──────────────────────────────────────────

interface WelcomeEmailOptions {
  name: string;
  role: string;
}

export function welcomeEmail({ name, role }: WelcomeEmailOptions) {
  const subject = `${APP_NAME} — Your account is ready`;
  const html = wrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:${PRIMARY_COLOR};text-transform:uppercase;letter-spacing:-0.02em;">
      You're In.
    </h1>
    <p style="margin:0 0 4px;font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;">
      Welcome to the ecosystem, ${name}
    </p>
    <p style="margin:20px 0;font-size:13px;color:#475569;line-height:1.7;">
      Your account has been verified and you're all set to access the
      <strong>DIUSCADI Ecosystem</strong> as a
      <strong>${role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}</strong>.
    </p>
    ${ctaButton("Go to Home", `${process.env.NEXT_PUBLIC_APP_URL}/home`)}
  `);

  const text = `Welcome to DIUSCADI, ${name}!\n\nYour account is verified. Sign in at: ${process.env.NEXT_PUBLIC_APP_URL}/auth`;

  return { subject, html, text };
}

// ─── 4. School Email Verification ────────────────────────────────────────────

interface SchoolVerificationEmailOptions {
  name: string;
  code: string;
  schoolEmail: string;
}

export function schoolVerificationEmail({
  name,
  code,
  schoolEmail,
}: SchoolVerificationEmailOptions) {
  const subject = `${APP_NAME} — Verify your institutional email`;
  const html = wrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:${PRIMARY_COLOR};text-transform:uppercase;letter-spacing:-0.02em;">
      Verify Your School Email
    </h1>
    <p style="margin:0 0 4px;font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;">
      Hi, ${name}
    </p>
    <p style="margin:20px 0;font-size:13px;color:#475569;line-height:1.7;">
      You requested to link the following institutional email address to your
      <strong>${APP_NAME}</strong> account. Enter the 6-digit code in the app
      to complete verification.
    </p>
    ${infoBadge("Institutional email being verified", schoolEmail)}
    ${otpBlock(code)}
    <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;text-align:center;">
      If you didn't make this request, someone may have entered your school email
      on their ${APP_NAME} account. You can safely ignore this email — no changes
      will be made without the code.
    </p>
  `);

  const text = `Hi ${name},\n\nYour ${APP_NAME} school email verification code is: ${code}\n\nThis code is to verify: ${schoolEmail}\n\nExpires in 15 minutes.\n\nIf you didn't request this, ignore this email.`;

  return { subject, html, text };
}

// ─── 5. Event Registration Confirmation ──────────────────────────────────────

export interface EventRegistrationEmailOptions {
  name: string;
  eventTitle: string;
  eventDate: string; // pre-formatted display string e.g. "Saturday, June 14 • 4:00 PM"
  eventLocation: string; // venue name or "Virtual" or "Online"
  ticketCode: string; // the inviteCode / ticket reference
  ticketUrl: string; // full URL to /tickets/[ticketId]
  isFree: boolean;
  ticketPrice?: string; // e.g. "₦5,000" — only used if !isFree
}

export function eventRegistrationEmail({
  name,
  eventTitle,
  eventDate,
  eventLocation,
  ticketCode,
  ticketUrl,
  isFree,
  ticketPrice,
}: EventRegistrationEmailOptions) {
  const subject = `${APP_NAME} — You're registered for ${eventTitle}`;
  const html = wrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:${PRIMARY_COLOR};text-transform:uppercase;letter-spacing:-0.02em;">
      Registration Confirmed
    </h1>
    <p style="margin:0 0 4px;font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;">
      You're all set, ${name}
    </p>
    <p style="margin:20px 0;font-size:13px;color:#475569;line-height:1.7;">
      Your spot at <strong>${eventTitle}</strong> has been confirmed.
      Keep this email — your ticket code is below and you'll need it to check in.
    </p>

    <!-- Ticket code block -->
    <div style="margin:28px 0;text-align:center;">
      <div style="display:inline-block;background:#f8fafc;border:2px solid #e2e8f0;border-radius:16px;padding:20px 32px;">
        <div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.25em;margin-bottom:8px;">
          Ticket Code
        </div>
        <div style="font-size:28px;font-weight:900;color:${PRIMARY_COLOR};letter-spacing:0.25em;font-family:monospace;">
          ${ticketCode}
        </div>
      </div>
    </div>

    <!-- Event details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      ${detailRow("Event", eventTitle)}
      ${detailRow("Date & Time", eventDate)}
      ${detailRow("Location", eventLocation)}
      ${detailRow("Ticket", isFree ? "Free Admission" : (ticketPrice ?? "Paid"))}
    </table>

    ${ctaButton("View My Ticket", ticketUrl)}

    <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;text-align:center;line-height:1.6;">
      You can also find your ticket at any time in <strong>My Tickets</strong> on the platform.
      Present the QR code on your ticket at the event entrance.
    </p>
  `);

  const text = `Hi ${name},\n\nYou're registered for ${eventTitle}!\n\nTicket Code: ${ticketCode}\nDate: ${eventDate}\nLocation: ${eventLocation}\n\nView your ticket: ${ticketUrl}`;

  return { subject, html, text };
}

// ─── 6. Event Reminder (24h before) ──────────────────────────────────────────

export interface EventReminderEmailOptions {
  name: string;
  eventTitle: string;
  eventDate: string; // e.g. "Saturday, June 14 • 4:00 PM"
  eventLocation: string;
  ticketCode: string;
  ticketUrl: string;
  hoursUntil: number; // typically 24
}

export function eventReminderEmail({
  name,
  eventTitle,
  eventDate,
  eventLocation,
  ticketCode,
  ticketUrl,
  hoursUntil,
}: EventReminderEmailOptions) {
  const subject = `${APP_NAME} — ${eventTitle} is ${hoursUntil === 24 ? "tomorrow" : `in ${hoursUntil} hours`}`;
  const html = wrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:${PRIMARY_COLOR};text-transform:uppercase;letter-spacing:-0.02em;">
      ${hoursUntil === 24 ? "It's Tomorrow!" : `${hoursUntil} Hours Away`}
    </h1>
    <p style="margin:0 0 4px;font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;">
      Hey ${name}, don't forget
    </p>
    <p style="margin:20px 0;font-size:13px;color:#475569;line-height:1.7;">
      Your event <strong>${eventTitle}</strong> is coming up
      ${hoursUntil === 24 ? "tomorrow" : `in ${hoursUntil} hours`}.
      Make sure you have your ticket ready for check-in.
    </p>

    ${accentBanner("⏰", eventTitle, eventDate, PRIMARY_COLOR, "#fefce8")}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      ${detailRow("When", eventDate)}
      ${detailRow("Where", eventLocation)}
      ${detailRow("Your Code", ticketCode)}
    </table>

    ${ctaButton("Open My Ticket", ticketUrl)}

    <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;text-align:center;">
      Open the ${APP_NAME} app and have your ticket QR code ready at the door.
    </p>
  `);

  const text = `Hi ${name},\n\n${eventTitle} is ${hoursUntil === 24 ? "tomorrow" : `in ${hoursUntil} hours`}!\n\nDate: ${eventDate}\nLocation: ${eventLocation}\nTicket code: ${ticketCode}\n\nView your ticket: ${ticketUrl}`;

  return { subject, html, text };
}

// ─── 7. Application Status (approved or rejected) ────────────────────────────

export interface ApplicationStatusEmailOptions {
  name: string;
  applicationType: string; // e.g. "Membership", "Committee", "Skills"
  status: "approved" | "rejected";
  reviewNote?: string; // optional admin note
  ctaLabel?: string; // e.g. "View Your Profile"
  ctaUrl?: string;
}

export function applicationStatusEmail({
  name,
  applicationType,
  status,
  reviewNote,
  ctaLabel,
  ctaUrl,
}: ApplicationStatusEmailOptions) {
  const isApproved = status === "approved";
  const subject = isApproved
    ? `${APP_NAME} — Your ${applicationType} application was approved`
    : `${APP_NAME} — Update on your ${applicationType} application`;

  const html = wrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:${PRIMARY_COLOR};text-transform:uppercase;letter-spacing:-0.02em;">
      Application ${isApproved ? "Approved" : "Not Approved"}
    </h1>
    <p style="margin:0 0 4px;font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;">
      Hi, ${name}
    </p>

    ${
      isApproved
        ? accentBanner(
            "✅",
            `${applicationType} Application Approved`,
            "Your application has been reviewed and accepted.",
            "#166534",
            "#f0fdf4",
          )
        : accentBanner(
            "📋",
            `${applicationType} Application`,
            "We've reviewed your application.",
            "#92400e",
            "#fffbeb",
          )
    }

    <p style="margin:20px 0;font-size:13px;color:#475569;line-height:1.7;">
      ${
        isApproved
          ? `We're pleased to let you know that your <strong>${applicationType}</strong> application has been <strong>approved</strong>. Your account has been updated accordingly.`
          : `Thank you for submitting your <strong>${applicationType}</strong> application. After review, we are unable to approve it at this time.`
      }
    </p>

    ${
      reviewNote
        ? `
      <div style="margin:20px 0;background:#f8fafc;border-left:3px solid ${isApproved ? "#22c55e" : ACCENT_COLOR};border-radius:8px;padding:16px;">
        <div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:8px;">
          Note from the review team
        </div>
        <div style="font-size:13px;color:#475569;line-height:1.7;">
          ${reviewNote}
        </div>
      </div>`
        : ""
    }

    ${
      !isApproved
        ? `<p style="margin:20px 0;font-size:12px;color:#94a3b8;line-height:1.7;">
            You are welcome to reapply in the future. If you have questions about this decision,
            please reach out to the platform administrators.
          </p>`
        : ""
    }

    ${ctaLabel && ctaUrl ? ctaButton(ctaLabel, ctaUrl) : ""}
  `);

  const text = isApproved
    ? `Hi ${name},\n\nGreat news! Your ${applicationType} application has been approved.\n\n${reviewNote ? `Note: ${reviewNote}\n\n` : ""}${ctaUrl ? `Continue here: ${ctaUrl}` : ""}`
    : `Hi ${name},\n\nThank you for applying for ${applicationType}. Unfortunately your application was not approved at this time.\n\n${reviewNote ? `Note: ${reviewNote}\n\n` : ""}You are welcome to reapply in the future.`;

  return { subject, html, text };
}

// ─── 8. Membership Approved Welcome ──────────────────────────────────────────
//
// Distinct from the generic application approval email — this one is richer,
// celebratory, and specific to membership. Sent in addition to (not instead of)
// the application status email when membership is approved.

export interface MembershipWelcomeEmailOptions {
  name: string;
  profileUrl: string;
  eventsUrl: string;
}

export function membershipWelcomeEmail({
  name,
  profileUrl,
  eventsUrl,
}: MembershipWelcomeEmailOptions) {
  const subject = `${APP_NAME} — Welcome to the community, ${name}!`;
  const html = wrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:${PRIMARY_COLOR};text-transform:uppercase;letter-spacing:-0.02em;">
      Welcome, Member.
    </h1>
    <p style="margin:0 0 4px;font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;">
      ${name} · DIUSCADI Community
    </p>

    ${accentBanner("🎉", "Membership Approved", "You are now an official member of the DIUSCADI community.", PRIMARY_COLOR, "#fefce8")}

    <p style="margin:20px 0;font-size:13px;color:#475569;line-height:1.7;">
      Your membership application has been reviewed and approved. You now have
      full access to all member features on the platform:
    </p>

    <!-- Benefits list -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      ${[
        ["🎫", "Register for exclusive member events"],
        ["🏛️", "Apply to join a committee"],
        ["💼", "Showcase verified skills on your profile"],
        ["📊", "Track your academic journey and CGPA"],
        ["🤝", "Connect with students across Nigerian universities"],
      ]
        .map(
          ([icon, text]) => `
        <tr>
          <td style="padding:8px 0;vertical-align:top;width:28px;">
            <span style="font-size:16px;">${icon}</span>
          </td>
          <td style="padding:8px 0 8px 8px;vertical-align:top;">
            <span style="font-size:12px;font-weight:600;color:#475569;">${text}</span>
          </td>
        </tr>`,
        )
        .join("")}
    </table>

    <p style="margin:24px 0 8px;font-size:13px;color:#475569;line-height:1.7;">
      Start by completing your profile and browsing upcoming events.
    </p>

    <!-- Two CTA buttons side by side (table-based for email compatibility) -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="padding-right:8px;">
          <a href="${profileUrl}"
             style="display:block;background:${PRIMARY_COLOR};color:#ffffff;text-decoration:none;
                    font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;
                    padding:14px 20px;border-radius:12px;text-align:center;">
            Complete Profile
          </a>
        </td>
        <td style="padding-left:8px;">
          <a href="${eventsUrl}"
             style="display:block;background:${ACCENT_COLOR};color:${PRIMARY_COLOR};text-decoration:none;
                    font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;
                    padding:14px 20px;border-radius:12px;text-align:center;">
            Browse Events
          </a>
        </td>
      </tr>
    </table>
  `);

  const text = `Welcome to DIUSCADI, ${name}!\n\nYour membership has been approved. You now have full access to all member features.\n\nComplete your profile: ${profileUrl}\nBrowse events: ${eventsUrl}`;

  return { subject, html, text };
}

// ─── 9. Newsletter Welcome ────────────────────────────────────────────────────

interface NewsletterWelcomeEmailOptions {
  email: string;
}

export function newsletterWelcomeEmail({ email }: NewsletterWelcomeEmailOptions) {
  const subject = `${APP_NAME} — You're on the list 🎉`;
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;

  const html = wrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:${PRIMARY_COLOR};text-transform:uppercase;letter-spacing:-0.02em;">
      You're In.
    </h1>
    <p style="margin:0 0 4px;font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;">
      Welcome to the DIUSCADI Community
    </p>

    ${accentBanner(
      "📬",
      "Subscription Confirmed",
      "You'll be first to hear about LASCADSS events and opportunities.",
      PRIMARY_COLOR,
      "#fefce8",
    )}

    <p style="margin:20px 0;font-size:13px;color:#475569;line-height:1.7;">
      You've joined over <strong>2,000+ Nigerian youths</strong> on the DIUSCADI
      mailing list. We'll notify you about:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      ${[
        ["🎓", "Upcoming LASCADSS seminar dates and registration windows"],
        ["🛠️", "New workshops, skill clinics, and bootcamps"],
        ["💼", "Career opportunities, internships, and mentorship programmes"],
        ["📣", "DIUSCADI community news and announcements"],
      ]
        .map(
          ([icon, text]) => `
        <tr>
          <td style="padding:8px 0;vertical-align:top;width:28px;">
            <span style="font-size:16px;">${icon}</span>
          </td>
          <td style="padding:8px 0 8px 8px;vertical-align:top;">
            <span style="font-size:12px;font-weight:600;color:#475569;">${text}</span>
          </td>
        </tr>`,
        )
        .join("")}
    </table>

    ${ctaButton("Browse Upcoming Events", `${process.env.NEXT_PUBLIC_APP_URL}/events`)}

    <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;text-align:center;line-height:1.6;">
      No spam, ever. We only send what matters.
      <a href="${unsubscribeUrl}" style="color:#94a3b8;">Unsubscribe at any time.</a>
    </p>
  `);

  const text = `Welcome to DIUSCADI!\n\nYou're now on our mailing list. We'll keep you updated on upcoming events, workshops, and career opportunities.\n\nBrowse events: ${process.env.NEXT_PUBLIC_APP_URL}/events\n\nTo unsubscribe: ${unsubscribeUrl}`;

  return { subject, html, text };
}

// ─── 10. Contact Form — Internal notification (to DIUSCADI inbox) ─────────────

export interface ContactEnquiryEmailOptions {
  senderName: string;
  senderEmail: string;
  organisation?: string;
  enquiryType: string;  // e.g. "General Enquiry", "Partnership"
  subject: string;
  message: string;
}

export function contactEnquiryEmail({
  senderName,
  senderEmail,
  organisation,
  enquiryType,
  subject,
  message,
}: ContactEnquiryEmailOptions) {
  const emailSubject = `[Contact] ${enquiryType} — ${subject}`;
  const html = wrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:${PRIMARY_COLOR};text-transform:uppercase;letter-spacing:-0.02em;">
      New Contact Enquiry
    </h1>
    <p style="margin:0 0 4px;font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;">
      Received via the DIUSCADI contact form
    </p>

    ${accentBanner("📩", enquiryType, subject, PRIMARY_COLOR, "#fefce8")}

    <!-- Sender details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      ${detailRow("From", senderName)}
      ${detailRow("Email", senderEmail)}
      ${organisation ? detailRow("Organisation", organisation) : ""}
      ${detailRow("Enquiry Type", enquiryType)}
      ${detailRow("Subject", subject)}
    </table>

    <!-- Message body -->
    <div style="margin:20px 0;background:#f8fafc;border-left:3px solid ${ACCENT_COLOR};border-radius:8px;padding:16px 20px;">
      <div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:10px;">
        Message
      </div>
      <div style="font-size:13px;color:#475569;line-height:1.8;white-space:pre-wrap;">
        ${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
      </div>
    </div>

    <!-- Quick reply button -->
    <div style="text-align:center;margin:28px 0;">
      <a href="mailto:${senderEmail}?subject=Re: ${encodeURIComponent(subject)}"
         style="display:inline-block;background:${PRIMARY_COLOR};color:#ffffff;text-decoration:none;
                font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;
                padding:14px 32px;border-radius:12px;">
        Reply to ${senderName}
      </a>
    </div>

    <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;text-align:center;line-height:1.6;">
      This message was submitted through the DIUSCADI website contact form.
    </p>
  `);

  const text = `New contact enquiry from ${senderName} (${senderEmail})\n\nType: ${enquiryType}\nSubject: ${subject}${organisation ? `\nOrganisation: ${organisation}` : ""}\n\nMessage:\n${message}`;

  return { subject: emailSubject, html, text };
}

// ─── 11. Contact Form — Auto-reply (to the sender) ────────────────────────────

export interface ContactAutoReplyEmailOptions {
  senderName: string;
  enquiryType: string;
  subject: string;
  message: string;
}

export function contactAutoReplyEmail({
  senderName,
  enquiryType,
  subject,
  message,
}: ContactAutoReplyEmailOptions) {
  const emailSubject = `${APP_NAME} — We've received your message`;
  const html = wrapper(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:${PRIMARY_COLOR};text-transform:uppercase;letter-spacing:-0.02em;">
      Message Received
    </h1>
    <p style="margin:0 0 4px;font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;">
      Thank you, ${senderName}
    </p>

    <p style="margin:20px 0;font-size:13px;color:#475569;line-height:1.7;">
      We've received your <strong>${enquiryType}</strong> enquiry and a member of
      our team will review it shortly. We typically respond within
      <strong>2 business days</strong>.
    </p>

    <!-- Echo of what they sent -->
    <div style="margin:20px 0;background:#f8fafc;border-left:3px solid ${ACCENT_COLOR};border-radius:8px;padding:16px 20px;">
      <div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:6px;">
        Your Message
      </div>
      <div style="font-size:11px;font-weight:700;color:${PRIMARY_COLOR};margin-bottom:8px;">
        ${subject}
      </div>
      <div style="font-size:12px;color:#64748b;line-height:1.7;white-space:pre-wrap;">
        ${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
      </div>
    </div>

    <p style="margin:20px 0;font-size:12px;color:#94a3b8;line-height:1.7;">
      In the meantime, you can reach us directly at
      <a href="mailto:info@diuscadi.org.ng" style="color:${PRIMARY_COLOR};font-weight:700;">
        info@diuscadi.org.ng
      </a>
      or connect with us on our social channels.
    </p>

    ${ctaButton("Visit Our Website", `${process.env.NEXT_PUBLIC_APP_URL ?? "https://diuscadi.org.ng"}`)}

    <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;text-align:center;line-height:1.6;">
      Please do not reply to this email — it is sent automatically.
      Use <a href="mailto:info@diuscadi.org.ng" style="color:#94a3b8;">info@diuscadi.org.ng</a> for direct correspondence.
    </p>
  `);

  const text = `Hi ${senderName},\n\nThank you for reaching out to DIUSCADI. We've received your ${enquiryType} enquiry and will respond within 2 business days.\n\nYour message:\n"${subject}"\n\n${message}\n\nFor urgent matters contact us at info@diuscadi.org.ng`;

  return { subject: emailSubject, html, text };
}