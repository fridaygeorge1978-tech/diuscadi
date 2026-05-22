// PATCH  /api/admin/events/[id] — admin + webmaster, update any event field
// DELETE /api/admin/events/[id] — admin + webmaster, cancel or hard-delete event
//   Body for DELETE: { action: "cancel" | "delete" }
//   "cancel" sets status to "cancelled" (safe, preserves registrations)
//   "delete" hard-deletes event + all ticketTypes + all registrations

import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

const ALLOWED_ROLES = ["admin", "webmaster"];
type Context = {
  params?: Promise<Record<string, string>> | Record<string, string>;
};

// ── PATCH ─────────────────────────────────────────────────────────────────────
export const PATCH = withAuth(
  async (req: AuthenticatedRequest, context?: Context) => {
    try {
      if (!ALLOWED_ROLES.includes(req.auth.role)) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 },
        );
      }

      const params = context?.params
        ? await Promise.resolve(context.params)
        : {};
      const id = params.id as string;
      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid event ID" },
          { status: 400 },
        );
      }

      const body = await req.json();
      const ALLOWED_FIELDS = [
        "title",
        "slug",
        "description",
        "overview",
        "shortDescription",
        "category",
        "format",
        "location",
        "locationScope", // ← add
        "image",
        "eventDate",
        "endDate",
        "registrationDeadline",
        "duration", // ← add
        "capacity",
        "targetEduStatus",
        "requiredSkills",
        "learningOutcomes",
        "tags",
        "level", // ← add
        "instructor", // ← add
        "status",
        "speakers",
        "sponsors",
        "schedule",
        "faqs", // ← add
      ];
      const DATE_FIELDS = ["eventDate", "endDate", "registrationDeadline"];

      const updates: Record<string, unknown> = {};
      for (const field of ALLOWED_FIELDS) {
        if (body[field] !== undefined) {
          updates[field] = DATE_FIELDS.includes(field)
            ? new Date(body[field])
            : body[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json(
          { error: "No valid fields to update" },
          { status: 400 },
        );
      }

      // Slug uniqueness check if slug is being updated
      if (updates.slug) {
        const slugExists = await (await getDb()).collection("events").findOne({
          slug: updates.slug,
          _id: { $ne: new ObjectId(id) },
        });
        if (slugExists) {
          return NextResponse.json(
            { error: "Slug already taken by another event" },
            { status: 409 },
          );
        }
      }

      updates.updatedAt = new Date();
      const db = await getDb();

      const result = await Collections.events(db).findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updates },
        { returnDocument: "after" },
      );

      if (!result)
        return NextResponse.json({ error: "Event not found" }, { status: 404 });

      return NextResponse.json({
        message: "Event updated successfully",
        eventId: id,
        slug: result.slug,
        status: result.status,
        updatedAt: result.updatedAt.toISOString(),
      });
    } catch (err) {
      console.error("[PATCH /api/admin/events/[id]]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);

// ── DELETE ────────────────────────────────────────────────────────────────────
export const DELETE = withAuth(
  async (req: AuthenticatedRequest, context?: Context) => {
    try {
      if (!ALLOWED_ROLES.includes(req.auth.role)) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 },
        );
      }

      const params = context?.params
        ? await Promise.resolve(context.params)
        : {};
      const id = params.id as string;
      if (!id || !ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid event ID" },
          { status: 400 },
        );
      }

      const { action } = await req.json().catch(() => ({ action: "cancel" }));
      if (!["cancel", "delete"].includes(action)) {
        return NextResponse.json(
          { error: "action must be 'cancel' or 'delete'" },
          { status: 400 },
        );
      }

      const db = await getDb();
      const oid = new ObjectId(id);

      const event = await Collections.events(db).findOne({ _id: oid });
      if (!event)
        return NextResponse.json({ error: "Event not found" }, { status: 404 });

      if (action === "cancel") {
        await Collections.events(db).updateOne(
          { _id: oid },
          { $set: { status: "cancelled", updatedAt: new Date() } },
        );
        return NextResponse.json({
          message: "Event cancelled successfully",
          eventId: id,
        });
      }

      // Hard delete — remove event + ticketTypes + registrations
      await Promise.all([
        Collections.events(db).deleteOne({ _id: oid }),
        Collections.ticketTypes(db).deleteMany({ eventId: oid }),
        Collections.eventRegistrations(db).deleteMany({ eventId: oid }),
      ]);

      return NextResponse.json({
        message: "Event and all associated data deleted permanently",
        eventId: id,
      });
    } catch (err) {
      console.error("[DELETE /api/admin/events/[id]]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
);
