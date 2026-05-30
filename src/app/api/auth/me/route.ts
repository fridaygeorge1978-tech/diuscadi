/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/db/collections";
import { ObjectId } from "mongodb";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const db = await getDb();
  const vaultId = new ObjectId(req.auth.vaultId);

  const vault = await Collections.vault(db).findOne({
    _id: new ObjectId(req.auth.vaultId),
  });
  if (!vault) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userData = await Collections.userData(db).findOne({
    vaultId: new ObjectId(req.auth.vaultId),
  });

  // ── Auto-revert expired temporary assignments ──────────────────────────────
  // Fires on every session restore and every page load that calls /api/auth/me.
  // No cron required — the DB is the source of truth, this just cleans it up.
  if (userData?.temporaryAssignment) {
    const now = new Date();
    if (userData.temporaryAssignment.endsAt <= now) {
      await Collections.committees(db).updateOne(
        { slug: userData.temporaryAssignment.committee },
        { $inc: { memberCount: -1 } },
      );
      await Collections.userData(db).updateOne(
        { vaultId },
        { $unset: { temporaryAssignment: "" }, $set: { updatedAt: now } },
      );
      // Clear it locally so the response reflects the reverted state immediately
      delete userData.temporaryAssignment;
    }
  }

  // Strip sensitive fields before returning.
  // Prefixed with _ to suppress "assigned but never used" TS warnings —
  // they are intentionally excluded via rest spread, not actually used.
  const {
    passwordHash: _passwordHash,
    emailVerificationCode: _emailVerificationCode,
    emailVerificationExpires: _emailVerificationExpires,
    emailVerificationToken: _emailVerificationToken,
    emailVerificationTokenExpires: _emailVerificationTokenExpires,
    phoneVerificationCode: _phoneVerificationCode,
    phoneVerificationExpires: _phoneVerificationExpires,
    resetPasswordCode: _resetPasswordCode,
    resetPasswordExpires: _resetPasswordExpires,
    resetPasswordToken: _resetPasswordToken,
    resetPasswordTokenExpires: _resetPasswordTokenExpires,
    tokenVersion: _tokenVersion,
    verificationResendCount: _verificationResendCount,
    verificationResendLastAt: _verificationResendLastAt,
    ...safeVault
  } = vault;

  return NextResponse.json({ vault: safeVault, userData });
});
