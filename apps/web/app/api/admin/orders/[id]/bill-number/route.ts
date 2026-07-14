import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireOrderStaff } from "@/lib/authz";

/**
 * Checks whether a bill number is already in use by another order.
 * Excludes the current order (by id) from the uniqueness check.
 */
async function checkBillNumberUnique(billNumber: string, excludeOrderId: string): Promise<boolean> {
  const existing = await prisma.order.findFirst({
    where: {
      billNumber,
      id: { not: excludeOrderId },
    },
    select: { id: true },
  });
  return existing === null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const unauthorized = requireOrderStaff(session);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();
  const billNumber = typeof body.billNumber === "string" ? body.billNumber.trim() : "";

  if (!billNumber) {
    return NextResponse.json({ error: "Bill number is required." }, { status: 400 });
  }

  // Check if billNumber already exists on any other order
  const isUnique = await checkBillNumberUnique(billNumber, id);
  if (!isUnique) {
    return NextResponse.json(
      { error: "Bill number already in use. Please enter a unique bill number." },
      { status: 409 }
    );
  }

  const order = await prisma.order.update({
    where: { id },
    data: { billNumber },
    select: { id: true, billNumber: true },
  });

  return NextResponse.json({ order });
}
