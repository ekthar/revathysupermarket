import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Wallet } from "lucide-react";
import { WalletClient } from "@/components/account/wallet-client";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/wallet");

  // Calculate balance
  const [creditAgg, debitAgg] = await Promise.all([
    prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { userId: session.user.id, type: "credit" }
    }),
    prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { userId: session.user.id, type: "debit" }
    })
  ]);

  const totalCredits = Number(creditAgg._sum.amount ?? 0);
  const totalDebits = Number(debitAgg._sum.amount ?? 0);
  const balance = totalCredits - totalDebits;

  // Get recent transactions
  const transactions = await prisma.walletTransaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      order: { select: { orderNumber: true } }
    }
  });

  return (
    <main className="max-w-lg mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/account"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-800 card-shadow press"
        >
          <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        </Link>
        <div>
          <h1 className="text-[18px] font-bold text-slate-900 dark:text-white">My Wallet</h1>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">Balance & transaction history</p>
        </div>
      </div>

      <WalletClient
        balance={balance}
        totalCredits={totalCredits}
        totalDebits={totalDebits}
        transactions={transactions.map((t) => ({
          id: t.id,
          amount: Number(t.amount),
          type: t.type,
          reason: t.reason,
          orderNumber: t.order?.orderNumber || null,
          createdAt: t.createdAt.toISOString()
        }))}
      />
    </main>
  );
}
