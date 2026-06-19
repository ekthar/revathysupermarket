import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageSettings } from "@/lib/authz";

// PATCH /api/admin/promo-codes/[id] - Toggle active or update
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const promo = await prisma.promoCode.update({
    where: { id },
    data: body
  });

  return NextResponse.json({ promo });
}

// DELETE /api/admin/promo-codes/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.promoCode.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
