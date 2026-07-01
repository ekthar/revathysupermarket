import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v1/admin/feedback
 * Paginated order feedback with order number and user name.
 */
export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10)
  );
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
  );
  const skip = (page - 1) * limit;

  const [total, feedback] = await Promise.all([
    prisma.orderFeedback.count(),
    prisma.orderFeedback.findMany({
      include: {
        order: { select: { orderNumber: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    data: feedback.map((f) => ({
      id: f.id,
      orderId: f.orderId,
      orderNumber: f.order.orderNumber,
      userId: f.userId,
      userName: f.user.name,
      orderRating: f.orderRating,
      deliveryRating: f.deliveryRating,
      tags: f.tags,
      comment: f.comment,
      createdAt: f.createdAt.toISOString(),
    })),
    page,
    limit,
    total,
  });
}
