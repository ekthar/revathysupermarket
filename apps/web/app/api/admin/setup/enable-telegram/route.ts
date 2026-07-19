/**
 * Enable Telegram notifications feature flag.
 * Admin-only. Safe to call multiple times.
 *
 * Usage: POST /api/admin/setup/enable-telegram
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Ensure the feature flag exists and is enabled
    const flag = await prisma.featureFlag.upsert({
      where: { key: "telegram_enabled" },
      update: { enabled: true },
      create: {
        id: "ff_telegram_enabled",
        key: "telegram_enabled",
        enabled: true,
        config: { fallbackOrder: ["telegram", "whatsapp", "sms"] },
      },
      select: { key: true, enabled: true },
    });

    return NextResponse.json({
      success: true,
      message: "Telegram notifications enabled",
      flag,
    });
  } catch (error) {
    console.error("[setup/enable-telegram] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to enable telegram flag",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
