import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLoyaltyConfig } from "@/lib/loyalty-config";

/**
 * Cron job: expire loyalty points that haven't been used in `pointExpiryDays` days.
 * Call via Vercel Cron or an external scheduler. Secured with CRON_SECRET.
 *
 * Vercel cron config (vercel.json):
 *   { "path": "/api/cron/expire-points", "schedule": "0 2 * * *" }  (2 AM IST daily)
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await getLoyaltyConfig();

  // 0 means expiry is disabled
  if (!config.pointExpiryDays || config.pointExpiryDays <= 0) {
    return NextResponse.json({ skipped: true, reason: "Point expiry is disabled (0 days)" });
  }

  const cutoff = new Date(Date.now() - config.pointExpiryDays * 24 * 60 * 60 * 1000);

  // Find accounts with a positive balance whose last EARN or REFERRAL transaction
  // is older than the expiry window — i.e. points that have gone stale.
  const staleAccounts = await prisma.loyaltyAccount.findMany({
    where: { balance: { gt: 0 } },
    select: {
      userId: true,
      balance: true,
      user: {
        select: {
          loyaltyTransactions: {
            where: { type: { in: ["EARN", "REFERRAL", "ADJUSTMENT"] }, points: { gt: 0 } },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      },
    },
  });

  let expired = 0;
  for (const account of staleAccounts) {
    const lastEarn = account.user.loyaltyTransactions[0]?.createdAt;
    if (!lastEarn || lastEarn > cutoff) continue; // Still fresh

    // Expire the entire balance
    const pointsToExpire = account.balance;
    await prisma.$transaction([
      prisma.loyaltyAccount.update({
        where: { userId: account.userId },
        data: { balance: { decrement: pointsToExpire } },
      }),
      prisma.loyaltyTransaction.create({
        data: {
          userId: account.userId,
          type: "ADJUSTMENT",
          points: -pointsToExpire,
          reason: `Points expired after ${config.pointExpiryDays} days of inactivity`,
        },
      }),
    ]);
    expired++;
  }

  console.log(`[expire-points] Expired points for ${expired} accounts (cutoff: ${cutoff.toISOString()})`);
  return NextResponse.json({ ok: true, expired, cutoff: cutoff.toISOString() });
}
