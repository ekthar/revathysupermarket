/**
 * GDPR Account Deletion Endpoint
 * ═══════════════════════════════
 *
 * Allows authenticated users to request full account deletion.
 * Anonymizes personal data, retains order records for legal compliance.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Don't allow staff/admin to self-delete via this endpoint
    if (user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Staff accounts must be deactivated by an admin" },
        { status: 403 }
      );
    }

    // Perform anonymization in a transaction
    await prisma.$transaction([
      // Anonymize user data (keep record for order history integrity)
      prisma.user.update({
        where: { id: userId },
        data: {
          name: "Deleted User",
          email: `deleted_${userId}@deleted.local`,
          phone: null,
          passwordHash: null,
          image: null,
          isActive: false,
          // Clear all tokens
          authVersion: { increment: 1 },
        },
      }),

      // Delete sensitive related data
      prisma.address.deleteMany({ where: { userId } }),
      prisma.pushSubscription.deleteMany({ where: { userId } }),
      prisma.favorite.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.account.deleteMany({ where: { userId } }),
      prisma.otpToken.deleteMany({ where: { userId } }),
      prisma.passwordResetToken.deleteMany({ where: { userId } }),

      // Anonymize notifications
      prisma.notification.deleteMany({ where: { userId } }),

      // Delete user settings
      prisma.userSettings.deleteMany({ where: { userId } }),

      // Create audit log entry
      prisma.auditLog.create({
        data: {
          actorId: userId,
          actorRole: "CUSTOMER",
          action: "account_deleted",
          targetType: "User",
          targetId: userId,
          metadata: { method: "self_service_gdpr" },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Account has been deleted. All personal data has been removed.",
    });
  } catch (error) {
    console.error("Account deletion failed:", error);
    return NextResponse.json(
      { error: "Account deletion failed. Please contact support." },
      { status: 500 }
    );
  }
}
