"use client";

import { Smartphone, Wallet, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { springs, tapScale } from "@/lib/motion";
import { formatCurrency } from "@/lib/utils";

interface PaymentMethodSelectorProps {
  paymentMethod: "COD" | "UPI_ON_DELIVERY" | "WALLET" | "CARD";
  onMethodChange: (method: "COD" | "UPI_ON_DELIVERY" | "WALLET" | "CARD") => void;
  walletBalance: number;
  walletLoading: boolean;
  totalAmount: number;
  codEnabled?: boolean;
  upiOnDeliveryEnabled?: boolean;
  razorpayEnabled?: boolean;
}

export function PaymentMethodSelector({
  paymentMethod,
  onMethodChange,
  walletBalance,
  walletLoading,
  totalAmount,
  codEnabled = true,
  upiOnDeliveryEnabled = true,
  razorpayEnabled = false,
}: PaymentMethodSelectorProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.enter, delay: 0.1 }}
      className="rounded-lg bg-white p-5 shadow-elevation-3 dark:bg-neutral-900"
    >
      <h2 className="text-title font-black text-neutral-900 dark:text-white mb-4">Payment Method</h2>
      <div className="space-y-3">
        {codEnabled && (
          <PaymentMethodCard
            active={paymentMethod === "COD"}
            icon={<Wallet className="h-5 w-5" />}
            iconBg="bg-secondary-100 text-secondary-700"
            label="Cash on Delivery"
            description="Pay with cash when order arrives"
            onClick={() => onMethodChange("COD")}
          />
        )}
        {upiOnDeliveryEnabled && (
          <PaymentMethodCard
            active={paymentMethod === "UPI_ON_DELIVERY"}
            icon={<Smartphone className="h-5 w-5" />}
            iconBg="bg-blue-100 text-blue-700"
            label="UPI on Delivery"
            description="Pay via UPI/GPay to delivery partner"
            onClick={() => onMethodChange("UPI_ON_DELIVERY")}
          />
        )}
        {razorpayEnabled && (
          <PaymentMethodCard
            active={paymentMethod === "CARD"}
            icon={<Wallet className="h-5 w-5" />}
            iconBg="bg-purple-100 text-purple-700"
            label="Pay Online"
            description="Pay via UPI, Card, or Netbanking"
            onClick={() => onMethodChange("CARD")}
          />
        )}
        {walletLoading ? (
          <div className="flex items-center gap-3 rounded-2xl p-4 border-2 border-neutral-100 dark:border-neutral-800">
            <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="h-3 w-20 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
            </div>
          </div>
        ) : walletBalance > 0 ? (
          <PaymentMethodCard
            active={paymentMethod === "WALLET"}
            icon={<Wallet className="h-5 w-5" />}
            iconBg="bg-secondary-100 text-secondary-700"
            label={`Wallet Balance (${formatCurrency(walletBalance)})`}
            description={
              walletBalance >= totalAmount
                ? "Full amount covered"
                : `Remaining ${formatCurrency(totalAmount - walletBalance)} via COD`
            }
            onClick={() => onMethodChange("WALLET")}
          />
        ) : null}
      </div>
      {paymentMethod === "WALLET" && walletBalance < totalAmount && (
        <div className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
          <p className="text-caption font-semibold text-amber-700 dark:text-amber-300">
            Wallet covers {formatCurrency(Math.min(walletBalance, totalAmount))}. Remaining{" "}
            {formatCurrency(totalAmount - walletBalance)} will be collected as Cash on Delivery.
          </p>
        </div>
      )}
    </motion.section>
  );
}

function PaymentMethodCard({
  active,
  icon,
  iconBg,
  label,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={tapScale.primary}
      animate={active ? { borderColor: "rgba(5,5,5,1)" } : { borderColor: "rgba(241,245,249,1)" }}
      className={`w-full flex items-center gap-3 rounded-2xl p-4 text-left border-2 transition-colors ${
        active ? "bg-black/[0.03] dark:bg-white/5" : "hover:border-neutral-200 dark:hover:border-neutral-700"
      }`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body font-bold text-neutral-800 dark:text-white">{label}</p>
        <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</p>
      </div>
      <motion.div
        animate={
          active
            ? { scale: 1, backgroundColor: "#050505" }
            : { scale: 1, backgroundColor: "transparent" }
        }
        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
          active ? "border-black" : "border-neutral-300"
        }`}
      >
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={springs.snappy}
            >
              <Check className="h-3 w-3 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
}
