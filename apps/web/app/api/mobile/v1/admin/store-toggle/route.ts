import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/store-toggle
 * Returns current store open/closed status from Settings table (key='store_open').
 *
 * POST /api/mobile/v1/admin/store-toggle
 * Toggles the store open/closed state. Upserts the Setting record.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const setting = await prisma.setting.findUnique({
    where: { key: "store_open" },
  });

  return NextResponse.json({
    storeOpen: setting?.value === "true",
  });
}

export async function POST(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER", "STAFF"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get current value
  const current = await prisma.setting.findUnique({
    where: { key: "store_open" },
  });

  const currentValue = current?.value === "true";
  const newValue = !currentValue;

  // Upsert the setting
  await prisma.setting.upsert({
    where: { key: "store_open" },
    update: { value: String(newValue) },
    create: { key: "store_open", value: String(newValue) },
  });

  // Create audit log entry
  await prisma.auditLog.create({
    data: {
      actorId: auth.userId,
      actorRole: auth.role,
      action: "store_toggle",
      targetType: "Setting",
      targetId: "store_open",
      metadata: { from: String(currentValue), to: String(newValue) },
    },
  });

  return NextResponse.json({
    storeOpen: newValue,
  });
}
