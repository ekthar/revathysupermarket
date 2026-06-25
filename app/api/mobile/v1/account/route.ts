import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
}).strict();

export async function GET(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch wallet balance
    const [credits, debits] = await Promise.all([
      prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: { userId: auth.userId, type: "credit" },
      }),
      prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: { userId: auth.userId, type: "debit" },
      }),
    ]);
    const walletBalance = Number(credits._sum.amount ?? 0) - Number(debits._sum.amount ?? 0);

    // Fetch loyalty balance
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { userId: auth.userId },
      select: { balance: true },
    });

    // Fetch addresses
    const addresses = await prisma.address.findMany({
      where: { userId: auth.userId },
      select: {
        id: true,
        label: true,
        houseName: true,
        street: true,
        landmark: true,
        pincode: true,
        latitude: true,
        longitude: true,
        isDefault: true,
      },
      orderBy: { isDefault: "desc" },
    });

    return NextResponse.json({
      user: {
        ...user,
        walletBalance,
        loyaltyPoints: loyaltyAccount?.balance ?? 0,
      },
      addresses: addresses.map((a) => ({
        ...a,
        latitude: a.latitude ? Number(a.latitude) : null,
        longitude: a.longitude ? Number(a.longitude) : null,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = authenticateMobileRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: auth.userId },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
