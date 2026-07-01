import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * POST /api/mobile/v1/admin/push
 * Send push notification broadcast. Creates Notification records for customers.
 */
export async function POST(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, body: notifBody, segment, data } = body;

  if (!title || !notifBody) {
    return NextResponse.json({ error: "Missing required fields: title, body" }, { status: 400 });
  }

  // Find target users based on segment
  const where: Record<string, unknown> = { role: "CUSTOMER", isActive: true };
  if (segment === "active") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    where.lastLoginAt = { gte: thirtyDaysAgo };
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  // Create notification records
  if (users.length > 0) {
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        title,
        body: notifBody,
        type: data?.type || "promotion",
        orderId: data?.orderId || null,
      })),
    });
  }

  return NextResponse.json({
    success: true,
    sent: users.length,
  });
}
