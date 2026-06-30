import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManageSettings } from "@/lib/authz";
import { getLoyaltyConfig } from "@/lib/loyalty-config";
import { writeAuditLog } from "@/lib/audit";

const schema = z.object({ earnRupeesPerPoint: z.coerce.number().min(1).max(1000), pointValueRupees: z.coerce.number().min(0.01).max(10), maxRedemptionPercent: z.coerce.number().min(1).max(100), referralRewardPoints: z.coerce.number().int().min(0).max(10000), pointExpiryDays: z.coerce.number().int().min(0).max(3650) });
const adjustmentSchema = z.object({ identifier: z.string().trim().min(3).max(120), points: z.coerce.number().int().min(-10000).max(10000).refine((value) => value !== 0), reason: z.string().trim().min(4).max(200) });
export async function GET() { const session = await auth(); if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 }); return NextResponse.json({ config: await getLoyaltyConfig() }); }
export async function PATCH(request: Request) { const session = await auth(); if (!canManageSettings(session?.user?.role)) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 }); const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Check loyalty settings.", code: "INVALID_LOYALTY_SETTINGS" }, { status: 400 }); const entries = [["loyaltyEarnRupeesPerPoint", parsed.data.earnRupeesPerPoint], ["loyaltyPointValueRupees", parsed.data.pointValueRupees], ["loyaltyMaxRedemptionPercent", parsed.data.maxRedemptionPercent], ["loyaltyReferralRewardPoints", parsed.data.referralRewardPoints], ["loyaltyPointExpiryDays", parsed.data.pointExpiryDays]] as const; await prisma.$transaction(entries.map(([key, value]) => prisma.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } }))); return NextResponse.json({ config: parsed.data }); }

export async function POST(request: Request) {
  const session = await auth(); if (!session?.user?.id || !canManageSettings(session.user.role)) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const parsed = adjustmentSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Check the customer, points, and reason.", code: "INVALID_ADJUSTMENT" }, { status: 400 });
  const user = await prisma.user.findFirst({ where: { role: "CUSTOMER", OR: [{ id: parsed.data.identifier }, { email: parsed.data.identifier.toLowerCase() }, { phone: parsed.data.identifier.replace(/\D/g, "") }] }, select: { id: true, name: true } });
  if (!user) return NextResponse.json({ error: "Customer not found.", code: "CUSTOMER_NOT_FOUND" }, { status: 404 });
  const account = await prisma.loyaltyAccount.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
  if (parsed.data.points < 0 && account.balance < Math.abs(parsed.data.points)) return NextResponse.json({ error: "Adjustment exceeds the customer balance.", code: "INSUFFICIENT_POINTS" }, { status: 409 });
  await prisma.$transaction([prisma.loyaltyAccount.update({ where: { userId: user.id }, data: { balance: { increment: parsed.data.points }, lifetimeEarned: parsed.data.points > 0 ? { increment: parsed.data.points } : undefined } }), prisma.loyaltyTransaction.create({ data: { userId: user.id, type: "ADJUSTMENT", points: parsed.data.points, reason: parsed.data.reason } })]);
  await writeAuditLog({ actorId: session.user.id, actorRole: session.user.role, action: "loyalty_adjusted", targetType: "User", targetId: user.id, metadata: { points: parsed.data.points, reason: parsed.data.reason } });
  return NextResponse.json({ ok: true, customer: user.name, balance: account.balance + parsed.data.points });
}
