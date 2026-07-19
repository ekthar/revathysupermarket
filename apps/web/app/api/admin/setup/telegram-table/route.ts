/**
 * Self-healing endpoint: Creates TelegramLink table if it doesn't exist.
 * Admin-only. Safe to call multiple times.
 * 
 * Usage: POST /api/admin/setup/telegram-table
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
    // Try to create the table using raw SQL (idempotent)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TelegramLink" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "phone" TEXT NOT NULL,
        "chatId" TEXT NOT NULL,
        "username" TEXT,
        "firstName" TEXT,
        "isVerified" BOOLEAN NOT NULL DEFAULT false,
        "userId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TelegramLink_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create unique index on phone
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "TelegramLink_phone_key" ON "TelegramLink"("phone");
    `);

    // Create index on chatId
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "TelegramLink_chatId_idx" ON "TelegramLink"("chatId");
    `);

    // Create index on userId
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "TelegramLink_userId_idx" ON "TelegramLink"("userId");
    `);

    return NextResponse.json({ success: true, message: "TelegramLink table is ready" });
  } catch (error) {
    console.error("[setup/telegram-table] Error:", error);
    return NextResponse.json({ 
      error: "Failed to create table",
      detail: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
