import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireOrderStaff } from "@/lib/authz";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const unauthorized = requireOrderStaff(session);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();
  const billNumber = typeof body.billNumber === "string" ? body.billNumber.trim() : "";

  if (!billNumber) {
    return NextResponse.json({ error: "Bill number is required" }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { billNumber },
    select: { id: true, billNumber: true },
  });

  return NextResponse.json({ order });
}
