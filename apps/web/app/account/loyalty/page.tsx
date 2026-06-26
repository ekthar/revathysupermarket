import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LoyaltyClient } from "@/components/account/loyalty-client";
import { getLoyaltyConfig } from "@/lib/loyalty-config";

export const dynamic = "force-dynamic";

export default async function LoyaltyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/loyalty");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { referralCode: true } });
  const referralCode = user?.referralCode || `MSM${session.user.id.replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase()}`;
  const [account, transactions, invited, config] = await Promise.all([
    prisma.loyaltyAccount.upsert({ where: { userId: session.user.id }, update: {}, create: { userId: session.user.id } }),
    prisma.loyaltyTransaction.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.referral.count({ where: { referrerId: session.user.id } }),
    getLoyaltyConfig()
  ]);
  if (!user?.referralCode) await prisma.user.update({ where: { id: session.user.id }, data: { referralCode } });
  return <main className="mx-auto max-w-lg px-4 py-5"><h1 className="font-display text-3xl font-black">Rewards</h1><p className="mt-1 text-sm text-muted-foreground">Earn 1 point for every ₹{config.earnRupeesPerPoint} on delivered orders.</p><div className="mt-5"><LoyaltyClient balance={account.balance} lifetimeEarned={account.lifetimeEarned} referralCode={referralCode} invited={invited} pointValueRupees={config.pointValueRupees} referralRewardPoints={config.referralRewardPoints} transactions={transactions.map((entry) => ({ id: entry.id, points: entry.points, reason: entry.reason, createdAt: entry.createdAt.toISOString() }))} /></div></main>;
}
