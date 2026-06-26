"use client";

import { ArrowDownLeft, ArrowUpRight, IndianRupee, Receipt, ShoppingBag, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  reason: string;
  orderNumber: string | null;
  createdAt: string;
}

interface WalletClientProps {
  balance: number;
  totalCredits: number;
  totalDebits: number;
  transactions: Transaction[];
}

export function WalletClient({ balance, totalCredits, totalDebits, transactions }: WalletClientProps) {
  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-primary to-secondary-600 p-5 text-white shadow-lg shadow-primary/20"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center">
            <Wallet className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-body font-medium text-white/80">Available Balance</span>
        </div>
        <p className="text-display font-bold tracking-tight">{formatCurrency(balance)}</p>
        <p className="text-caption text-white/60 mt-1">Use wallet balance during checkout</p>

        {/* Credits / Debits summary */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/15">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-white/15 flex items-center justify-center">
              <ArrowDownLeft className="h-3.5 w-3.5 text-secondary-200" />
            </div>
            <div>
              <p className="text-micro text-white/60">Total In</p>
              <p className="text-body font-bold">{formatCurrency(totalCredits)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-white/15 flex items-center justify-center">
              <ArrowUpRight className="h-3.5 w-3.5 text-red-200" />
            </div>
            <div>
              <p className="text-micro text-white/60">Total Out</p>
              <p className="text-body font-bold">{formatCurrency(totalDebits)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* How it works */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 card-shadow p-4">
        <p className="text-caption font-semibold text-neutral-400 uppercase tracking-wide mb-3">How it works</p>
        <div className="space-y-2.5">
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-secondary-50 dark:bg-secondary-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <Receipt className="h-3.5 w-3.5 text-secondary-600" />
            </div>
            <div>
              <p className="text-caption font-semibold text-neutral-800 dark:text-white">Refunds credited here</p>
              <p className="text-caption text-neutral-400">Return refunds are added as wallet credit</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0 mt-0.5">
              <ShoppingBag className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div>
              <p className="text-caption font-semibold text-neutral-800 dark:text-white">Pay with balance</p>
              <p className="text-caption text-neutral-400">Use wallet balance at checkout to pay for orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-2xl bg-white dark:bg-neutral-900 card-shadow overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-caption font-semibold text-neutral-400 uppercase tracking-wide">
          Transaction History
        </p>

        {transactions.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
              <IndianRupee className="h-5 w-5 text-neutral-300 dark:text-neutral-600" />
            </div>
            <p className="text-body font-medium text-neutral-500 dark:text-neutral-400">No transactions yet</p>
            <p className="text-caption text-neutral-400 mt-1">Refund credits will show up here</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
            {transactions.map((txn, index) => (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-3 px-4 py-3.5"
              >
                {/* Icon */}
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                  txn.type === "credit"
                    ? "bg-secondary-50 dark:bg-secondary-900/30"
                    : "bg-red-50 dark:bg-red-950/30"
                }`}>
                  {txn.type === "credit" ? (
                    <ArrowDownLeft className="h-4 w-4 text-secondary-600" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-neutral-800 dark:text-white truncate">
                    {txn.reason}
                  </p>
                  <p className="text-micro text-neutral-400 mt-0.5">
                    {txn.orderNumber ? `Order #${txn.orderNumber}` : ""}
                    {txn.orderNumber ? " · " : ""}
                    {new Date(txn.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}
                  </p>
                </div>

                {/* Amount */}
                <span className={`text-body font-bold shrink-0 ${
                  txn.type === "credit"
                    ? "text-secondary-600 dark:text-secondary-400"
                    : "text-red-500 dark:text-red-400"
                }`}>
                  {txn.type === "credit" ? "+" : "-"}{formatCurrency(txn.amount)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
