import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLoyaltyConfig } from "@/lib/loyalty-config";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  const [account, transactions, config] = await Promise.all([prisma.loyaltyAccount.upsert({ where: { userId: session.user.id }, update: {}, create: { userId: session.user.id } }), prisma.loyaltyTransaction.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 50 }), getLoyaltyConfig()]);
  return NextResponse.json({ balance: account.balance, lifetimeEarned: account.lifetimeEarned, rupeeValue: account.balance * config.pointValueRupees, config, transactions });
}
