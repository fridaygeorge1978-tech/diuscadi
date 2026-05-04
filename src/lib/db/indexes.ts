// lib/db/indexes.ts
// Run once after deploy:
//   pnpm dotenv -e .env.local -- tsx lib/db/indexes.ts

import { getDb } from "../mongodb";

export async function createIndexes() {
  const db = await getDb();

  // ── vault ──────────────────────────────────────────────────────────────────
  await db.collection("vault").createIndexes([
    { key: { email: 1 }, unique: true, name: "vault_email_unique" },
    {
      key: { "phone.phoneNumber": 1 },
      unique: true,
      name: "vault_phone_unique",
    },
    {
      key: { emailVerificationCode: 1 },
      sparse: true,
      name: "vault_email_otp",
    },
    {
      key: { emailVerificationToken: 1 },
      sparse: true,
      name: "vault_email_token",
    },
    {
      key: { phoneVerificationCode: 1 },
      sparse: true,
      name: "vault_phone_otp",
    },
    { key: { resetPasswordCode: 1 }, sparse: true, name: "vault_reset_otp" },
    { key: { resetPasswordToken: 1 }, sparse: true, name: "vault_reset_token" },
  ]);
  console.log("✓ vault");

  // ── userData ───────────────────────────────────────────────────────────────
  await db.collection("userData").createIndexes([
    { key: { vaultId: 1 }, unique: true, name: "userData_vaultId" },
    {
      key: { signupInviteCode: 1 },
      unique: true,
      sparse: true,
      name: "userData_inviteCode",
    },
    {
      key: { "Institution.schoolEmail": 1 },
      unique: true,
      sparse: true,
      name: "userData_schoolEmail",
    },
    {
      key: { referredBy: 1 },
      sparse: true,
      name: "userData_referredBy",
    },
    { key: { membershipStatus: 1 }, name: "userData_membershipStatus" },
    {
      key: { "analytics.lastActiveAt": -1 },
      sparse: true,
      name: "userData_lastActive",
    },
  ]);
  console.log("✓ userData");

  // ── sessions ───────────────────────────────────────────────────────────────
  await db.collection("sessions").createIndexes([
    { key: { token: 1 }, unique: true, name: "sessions_token" },
    { key: { vaultId: 1 }, name: "sessions_vaultId" },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "sessions_ttl" },
  ]);
  console.log("✓ sessions");

  // ── applications ───────────────────────────────────────────────────────────
  await db.collection("applications").createIndexes([
    { key: { userId: 1 }, name: "applications_userId" },
    { key: { status: 1 }, name: "applications_status" },
    {
      key: { userId: 1, type: 1, value: 1, status: 1 },
      unique: true,
      partialFilterExpression: { status: "pending" },
      name: "applications_no_duplicate_pending",
    },
    {
      key: { userId: 1, type: 1, status: 1 },
      name: "applications_user_type_status",
    },
    { key: { status: 1, createdAt: 1 }, name: "applications_status_date" },
    { key: { vaultId: 1 }, name: "applications_vaultId" },
  ]);
  console.log("✓ applications");

  // ── events ─────────────────────────────────────────────────────────────────
  await db.collection("events").createIndexes([
    { key: { slug: 1 }, unique: true, name: "events_slug" },
    { key: { status: 1 }, name: "events_status" },
    { key: { eventDate: 1 }, name: "events_eventDate" },
    { key: { registrationDeadline: 1 }, name: "events_regDeadline" },
    { key: { targetEduStatus: 1 }, name: "events_targetEduStatus" },
    { key: { locationScope: 1 }, name: "events_locationScope" },
    { key: { requiredSkills: 1 }, name: "events_skills" },
    { key: { category: 1 }, name: "events_category" },
  ]);
  console.log("✓ events");

  // ── eventReviewsTypes ────────────────────────────────────────────────────────────
  await db.collection("eventReviews").createIndexes([
    // One review per user per event — enforced at DB level
    {
      key: { eventId: 1, userId: 1 },
      unique: true,
      name: "eventReviews_user_event_unique",
    },
    // Fetch all visible reviews for an event fast
    { key: { eventId: 1, isVisible: 1 }, name: "eventReviews_eventId_visible" },
    // Admin moderation queue — hidden reviews sorted by date
    { key: { isVisible: 1, createdAt: -1 }, name: "eventReviews_moderation" },
  ]);
  console.log("✓ eventReviews");

  // ── ticketTypes ────────────────────────────────────────────────────────────
  await db.collection("ticketTypes").createIndexes([
    { key: { eventId: 1 }, name: "ticketTypes_eventId" },
    { key: { eventId: 1, name: 1 }, name: "ticketTypes_eventId_name" },
  ]);
  console.log("✓ ticketTypes");

  // ── eventRegistrations ─────────────────────────────────────────────────────
  await db.collection("eventRegistrations").createIndexes([
    {
      key: { userId: 1, eventId: 1 },
      unique: true,
      name: "reg_user_event_unique",
    },
    { key: { inviteCode: 1 }, unique: true, name: "reg_inviteCode_unique" },
    { key: { eventId: 1 }, name: "reg_eventId" },
    { key: { userId: 1 }, name: "reg_userId" },
    { key: { status: 1 }, name: "reg_status" },
    { key: { referralCodeUsed: 1 }, sparse: true, name: "reg_referral" },
    // Supports the cron reminder query:
    // { eventId, status: { $in: [...] }, "reminders.sent24h": { $exists: false } }
    // sparse: true because most registrations won't have this field until
    // after their first reminder run — avoids indexing every null entry.
    {
      key: { eventId: 1, status: 1, "reminders.sent24h": 1 },
      sparse: true,
      name: "reg_eventId_status_reminder24h",
    },
  ]);
  console.log("✓ eventRegistrations");

  // ── invites ────────────────────────────────────────────────────────────────
  await db.collection("invites").createIndexes([
    { key: { code: 1 }, unique: true, name: "invites_code" },
    { key: { status: 1 }, name: "invites_status" },
    { key: { createdBy: 1 }, name: "invites_createdBy" },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "invites_ttl" },
  ]);
  console.log("✓ invites");

  // ── healthReports ──────────────────────────────────────────────────────────
  await db.collection("healthReports").createIndexes([
    { key: { reportedAt: -1 }, name: "health_reportedAt" },
    { key: { userId: 1, reportedAt: -1 }, name: "health_user" },
    { key: { "browser.name": 1, reportedAt: -1 }, name: "health_browser" },
    { key: { page: 1, reportedAt: -1 }, name: "health_page" },
    { key: { "jsErrors.0": 1 }, name: "health_jsErrors" },
    {
      key: { reportedAt: 1 },
      expireAfterSeconds: 90 * 24 * 60 * 60,
      name: "health_ttl",
    },
  ]);
  console.log("✓ healthReports");

  // ── files ──────────────────────────────────────────────────────────────────
  await db.collection("files").createIndexes([
    { key: { ownerType: 1, ownerId: 1, createdAt: -1 }, name: "files_owner" },
    { key: { uploadedBy: 1, createdAt: -1 }, name: "files_uploader" },
    { key: { processingStatus: 1, createdAt: 1 }, name: "files_processing" },
    { key: { category: 1, ownerType: 1 }, name: "files_category" },
    { key: { isPublic: 1, createdAt: -1 }, sparse: true, name: "files_public" },
  ]);
  console.log("✓ files");

  // ── referralLinks ───────────────────────────────────────────────────────────
  await db.collection("referralLinks").createIndexes([
    { key: { code: 1 }, unique: true, name: "referralLinks_code_unique" },
    {
      key: { ownerVaultId: 1, resourceType: 1, resourceId: 1 },
      name: "referralLinks_owner_resource",
    },
    { key: { parentCode: 1 }, sparse: true, name: "referralLinks_parentCode" },
    { key: { createdAt: -1 }, name: "referralLinks_createdAt" },
  ]);
  console.log("✓ referralLinks");

  // ── referralEvents ──────────────────────────────────────────────────────────
  await db.collection("referralEvents").createIndexes([
    { key: { code: 1 }, name: "referralEvents_code" },
    { key: { ownerVaultId: 1, createdAt: -1 }, name: "referralEvents_owner" },
    { key: { eventType: 1, createdAt: -1 }, name: "referralEvents_type_date" },
    {
      key: { resourceType: 1, resourceId: 1, createdAt: -1 },
      name: "referralEvents_resource",
    },
  ]);
  console.log("✓ referralEvents");

  // ── institutions ───────────────────────────────────────────────────────────
  await db.collection("institutions").createIndexes([
    {
      key: { name: "text", abbreviation: "text" },
      name: "institutions_text_search",
    },
    { key: { name: 1 }, name: "institutions_name" },
    {
      key: { abbreviation: 1 },
      unique: true,
      sparse: true,
      name: "institutions_abbreviation",
    },
    { key: { type: 1 }, name: "institutions_type" },
    { key: { state: 1 }, name: "institutions_state" },
    { key: { isActive: 1 }, name: "institutions_active" },
    {
      key: { gradingSystemConfirmed: 1 },
      name: "institutions_gradingConfirmed",
    },
  ]);
  console.log("✓ institutions");

  // ── faculties ──────────────────────────────────────────────────────────────
  await db.collection("faculties").createIndexes([
    { key: { name: 1 }, name: "faculties_name" },
    { key: { isActive: 1 }, name: "faculties_active" },
  ]);
  console.log("✓ faculties");

  // ── departments ────────────────────────────────────────────────────────────
  await db.collection("departments").createIndexes([
    { key: { name: 1 }, name: "departments_name" },
    { key: { isActive: 1 }, name: "departments_active" },
  ]);
  console.log("✓ departments");

  // ── curriculumSubmissions ──────────────────────────────────────────────────
  await db.collection("curriculumSubmissions").createIndexes([
    {
      key: {
        institutionId: 1,
        department: 1,
        level: 1,
        semester: 1,
        session: 1,
      },
      name: "curriculum_scope",
    },
    {
      key: {
        institutionId: 1,
        department: 1,
        level: 1,
        semester: 1,
        session: 1,
        submittedBy: 1,
      },
      unique: true,
      name: "curriculum_no_duplicate_submission",
    },
    { key: { submittedBy: 1 }, name: "curriculum_submittedBy" },
    { key: { status: 1, createdAt: 1 }, name: "curriculum_status_date" },
    { key: { "flags.flaggedBy": 1 }, name: "curriculum_flaggedBy" },
    {
      key: { institutionId: 1, status: 1 },
      name: "curriculum_institution_status",
    },
  ]);
  console.log("✓ curriculumSubmissions");

  // pageVisits
  await db.collection("pageVisits").createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }, // TTL — MongoDB deletes doc when expiresAt is reached
  );
  await db.collection("pageVisits").createIndex(
    { sessionKey: 1 },
    { unique: true }, // prevents duplicate visits within the 3hr window
  );
  await db.collection("pageVisits").createIndex({ hour: 1, dayOfWeek: 1 });
  await db.collection("predictionLogs").createIndex(
    { date: 1 },
    { unique: true }, // one log per day
  );
  await db.collection("predictionLogs").createIndex({ appliedAt: -1 });
  // landingPageConfig — sectionKey is the primary key, must be unique
  await db
    .collection("landingPageConfig")
    .createIndex(
      { sectionKey: 1 },
      { unique: true, name: "landingPageConfig_sectionKey" },
    );

  // newsletterSubscribers
  await db.collection("newsletterSubscribers").createIndexes([
    { key: { email: 1 }, unique: true, name: "newsletter_email_unique" },
    { key: { subscribedAt: -1 }, name: "newsletter_subscribedAt" },
    { key: { active: 1 }, name: "newsletter_active" },
  ]);
  console.log("✓ landingPageConfig + newsletterSubscribers");

  await db
    .collection("aboutPageConfig")
    .createIndex(
      { sectionKey: 1 },
      { unique: true, name: "aboutPageConfig_sectionKey" },
    );
  console.log("✓ aboutPageConfig");

  console.log("\n✅ All indexes created.");
}

if (require.main === module) {
  createIndexes()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
