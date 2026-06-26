import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ code: z.string().trim().min(6).max(20).transform((value) => value.toUpperCase()) });

function createCode(userId: string) {
  return `MSM${userId.replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase()}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { referralCode: true } });
  const referralCode = user?.referralCode || createCode(session.user.id);
  if (!user?.referralCode) await prisma.user.update({ where: { id: session.user.id }, data: { referralCode } });
  const [invited, referral] = await Promise.all([
    prisma.referral.count({ where: { referrerId: session.user.id } }),
    prisma.referral.findUnique({ where: { referredUserId: session.user.id }, select: { status: true } })
  ]);
  return NextResponse.json({ referralCode, invited, appliedStatus: referral?.status ?? null });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid referral code.", code: "INVALID_REFERRAL" }, { status: 400 });
  const referrer = await prisma.user.findUnique({ where: { referralCode: parsed.data.code }, select: { id: true } });
  if (!referrer || referrer.id === session.user.id) return NextResponse.json({ error: "That referral code cannot be used.", code: "INVALID_REFERRAL" }, { status: 400 });
  const hasOrders = await prisma.order.count({ where: { userId: session.user.id } });
  if (hasOrders > 0) return NextResponse.json({ error: "Referral codes are only available before your first order.", code: "REFERRAL_TOO_LATE" }, { status: 409 });
  await prisma.referral.create({ data: { referrerId: referrer.id, referredUserId: session.user.id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
