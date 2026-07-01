"use client";

import { Receipt, Printer } from "lucide-react";
import { motion } from "framer-motion";

type OrderBillItem = {
  name: string;
  quantity: number;
  price: number;
};

type OrderBillProps = {
  storeName: string;
  orderNumber: string;
  orderDate: string;
  items: OrderBillItem[];
  subtotal: number;
  deliveryFee: number;
  tipAmount: number;
  total: number;
  paymentMethod: string;
};

const paymentMethodLabels: Record<string, string> = {
  COD: "Cash on Delivery",
  UPI_ON_DELIVERY: "UPI on Delivery",
  WALLET: "Wallet",
  CARD: "Card",
};

export function OrderBill({
  storeName,
  orderNumber,
  orderDate,
  items,
  subtotal,
  deliveryFee,
  tipAmount,
  total,
  paymentMethod,
}: OrderBillProps) {
  const formattedDate = new Date(orderDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 240, damping: 24 }}
      className="rounded-2xl bg-white p-5 card-shadow dark:bg-neutral-900 print:shadow-none print:border print:border-neutral-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
          <p className="text-caption font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Order Bill
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-micro font-semibold text-neutral-600 press dark:bg-neutral-800 dark:text-neutral-300 print:hidden"
        >
          <Printer className="h-3.5 w-3.5" />
          Print Bill
        </button>
      </div>

      {/* Store & Order Info */}
      <div className="mb-4 border-b border-dashed border-neutral-200 pb-3 dark:border-neutral-700">
        <p className="text-body font-bold text-neutral-900 dark:text-white">
          {storeName}
        </p>
        <div className="mt-1 flex items-center justify-between text-caption text-neutral-500 dark:text-neutral-400">
          <span>#{orderNumber}</span>
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2 mb-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start justify-between gap-2"
          >
            <div className="flex-1 min-w-0">
              <p className="text-body text-neutral-800 dark:text-neutral-200 truncate">
                {item.name}
              </p>
              <p className="text-caption text-neutral-400 dark:text-neutral-500">
                {item.quantity} x {"\u20B9"}{item.price.toFixed(2)}
              </p>
            </div>
            <p className="text-body font-semibold text-neutral-900 dark:text-white whitespace-nowrap">
              {"\u20B9"}{(item.quantity * item.price).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-dashed border-neutral-200 pt-3 dark:border-neutral-700 space-y-2">
        <div className="flex justify-between text-caption text-neutral-500 dark:text-neutral-400">
          <span>Subtotal</span>
          <span>{"\u20B9"}{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-caption text-neutral-500 dark:text-neutral-400">
          <span>Delivery Fee</span>
          <span>{deliveryFee > 0 ? `\u20B9${deliveryFee.toFixed(2)}` : "Free"}</span>
        </div>
        {tipAmount > 0 && (
          <div className="flex justify-between text-caption text-neutral-500 dark:text-neutral-400">
            <span>Tip</span>
            <span>{"\u20B9"}{tipAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-neutral-200 pt-2 dark:border-neutral-700">
          <span className="text-body font-bold text-neutral-900 dark:text-white">
            Total
          </span>
          <span className="text-body font-bold text-neutral-900 dark:text-white">
            {"\u20B9"}{total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mt-3 flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800">
        <span className="text-caption text-neutral-500 dark:text-neutral-400">
          Payment
        </span>
        <span className="text-caption font-semibold text-neutral-700 dark:text-neutral-300">
          {paymentMethodLabels[paymentMethod] || paymentMethod}
        </span>
      </div>
    </motion.div>
  );
}
