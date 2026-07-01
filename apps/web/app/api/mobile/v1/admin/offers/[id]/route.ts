import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

/**
 * PATCH /api/mobile/v1/admin/offers/[id]
 * Update offer.
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
    "title", "description", "discountType", "discountValue", "categoryId",
    "productId", "minQuantity", "maxDiscount", "isActive", "startsAt",
    "expiresAt", "image", "badge",
  ];

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === "startsAt" || field === "expiresAt") {
        data[field] = body[field] ? new Date(body[field]) : null;
      } else {
        data[field] = body[field];
      }
    }
  }

  const offer = await prisma.offer.update({
    where: { id },
    data,
  });

  return NextResponse.json({ offer });
}

/**
 * DELETE /api/mobile/v1/admin/offers/[id]
 * Remove offer.
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

  await prisma.offer.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
