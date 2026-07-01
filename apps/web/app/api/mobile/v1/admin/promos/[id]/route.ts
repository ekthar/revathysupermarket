import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * PATCH /api/mobile/v1/admin/promos/[id]
 * Update promo code.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const allowedFields = [
    "code", "description", "discountType", "discountValue", "minimumOrder",
    "maxDiscount", "usageLimit", "isActive", "startsAt", "expiresAt",
  ];

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === "startsAt" || field === "expiresAt") {
        data[field] = body[field] ? new Date(body[field]) : null;
      } else if (field === "code") {
        data[field] = body[field].toUpperCase();
      } else {
        data[field] = body[field];
      }
    }
  }

  const promo = await prisma.promoCode.update({
    where: { id },
    data,
  });

  return NextResponse.json({ promo });
}

/**
 * DELETE /api/mobile/v1/admin/promos/[id]
 * Remove promo code.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authenticateMobileRequest(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER", "MANAGER"].includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.promoCode.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
