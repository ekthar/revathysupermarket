import { auth } from "@/auth";
import { canManageSettings } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { RewardsTableClient } from "@/components/admin/rewards-table-client";
import { LoyaltySettingsClient } from "@/components/admin/loyalty-settings-client";
import { getLoyaltyConfig } from "@/lib/loyalty-config";

export const dynamic = "force-dynamic";

export default async function AdminRewardsPage() {
  const session = await auth();
  if (!canManageSettings(session?.user?.role)) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-soft">
        <h2 className="font-display text-3xl font-black">Rewards</h2>
        <p className="mt-2 text-sm text-muted-foreground">Owner access is required.</p>
      </div>
    );
  }

  const [accounts, totalCustomers, totalPointsIssued, loyaltyConfig] = await Promise.all([
    prisma.loyaltyAccount.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
            orders: { select: { id: true }, where: { status: "DELIVERED" } },
          },
        },
      },
      orderBy: { balance: "desc" },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.loyaltyTransaction.aggregate({
      _sum: { points: true },
      where: { type: "EARN" },
    }),
    getLoyaltyConfig(),
  ]);

  const rewards = accounts.map((account) => ({
    id: account.id,
    userId: account.user.id,
    name: account.user.name || "—",
    email: account.user.email || "—",
    phone: account.user.phone || "—",
    balance: account.balance,
    lifetimeEarned: account.lifetimeEarned,
    deliveredOrders: account.user.orders.length,
    joinedAt: account.user.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  }));

  return (
    <div>
      <div className="rounded-xl bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Loyalty Program</p>
        <h2 className="mt-2 font-display text-4xl font-black leading-tight">Rewards Points</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          View all customer rewards balances, lifetime points, and order history.
        </p>
      </div>

      {/* Stats cards */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-bold uppercase text-muted-foreground">Total Customers</p>
          <p className="mt-1 font-display text-2xl font-black">{totalCustomers}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-bold uppercase text-muted-foreground">Accounts with Points</p>
          <p className="mt-1 font-display text-2xl font-black">{accounts.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-bold uppercase text-muted-foreground">Total Points Issued</p>
          <p className="mt-1 font-display text-2xl font-black">{totalPointsIssued._sum.points ?? 0}</p>
        </div>
      </div>

      {/* Loyalty Settings - Points Configuration */}
      <LoyaltySettingsClient initialConfig={loyaltyConfig} />

      <RewardsTableClient rewards={rewards} />
    </div>
  );
}
