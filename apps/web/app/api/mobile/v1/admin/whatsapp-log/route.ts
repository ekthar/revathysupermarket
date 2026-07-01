import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/whatsapp-log
 * Paginated WhatsApp message log. Optional filter by status.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;

  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [total, logs] = await Promise.all([
    prisma.whatsAppLog.count({ where }),
    prisma.whatsAppLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    data: logs.map((log) => ({
      id: log.id,
      phone: log.phone,
      orderId: log.orderId,
      template: log.template,
      messageId: log.messageId,
      status: log.status,
      error: log.error,
      statusAt: log.statusAt?.toISOString() ?? null,
      createdAt: log.createdAt.toISOString(),
    })),
    page,
    limit,
    total,
  });
}
