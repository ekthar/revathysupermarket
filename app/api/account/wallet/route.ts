import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/account/wallet - Get wallet balance + transaction history
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "20")));
  const offset = (page - 1) * limit;

  // Get all transactions for balance calculation (credit - debit)
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

  // Get paginated transaction history
  const [transactions, totalCount] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        order: {
          select: { orderNumber: true }
        }
      }
    }),
    prisma.walletTransaction.count({ where: { userId: session.user.id } })
  ]);

  return NextResponse.json({
    balance,
    totalCredits,
    totalDebits,
    transactions: transactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      type: t.type,
      reason: t.reason,
      orderNumber: t.order?.orderNumber || null,
      createdAt: t.createdAt.toISOString()
    })),
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  });
}
