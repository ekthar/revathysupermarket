"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, MapPin, CreditCard, Loader2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/toast-provider";
import { springs, tapScale } from "@/lib/motion";

type EligibilityData = {
  eligible: boolean;
  address?: {
    id: string;
    label: string;
    houseName: string;
    street: string;
    pincode: string;
    latitude: number;
    longitude: number;
  };
  paymentMethod?: string;
};

export function ExpressCheckout() {
  const { items, subtotal, clearCart } = useCart();
  const { showToast } = useToast();
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    fetch("/api/cart/express-eligible")
      .then((res) => (res.ok ? res.json() : { eligible: false }))
      .then((data: EligibilityData) => setEligibility(data))
      .catch(() => setEligibility({ eligible: false }))
      .finally(() => setLoading(false));
  }, []);

  async function handleExpressOrder() {
    if (!eligibility?.eligible || !eligibility.address) return;
    setPlacing(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: "",
          phone: "",
          houseName: eligibility.address.houseName,
          street: eligibility.address.street,
          landmark: "",
          pincode: eligibility.address.pincode,
          notes: "",
          paymentMethod: eligibility.paymentMethod || "COD",
          latitude: eligibility.address.latitude,
          longitude: eligibility.address.longitude,
          items: items.map((item) => ({
            productId: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.discountPrice ?? item.price,
          })),
          deliveryMode: "ASAP",
          expressCheckout: true,
        }),
      });

      if (res.ok) {
        clearCart();
        showToast("Order placed successfully!", "success");
        window.location.href = "/dashboard";
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Could not place order", "error");
      }
    } catch {
      showToast("Could not place order", "error");
    } finally {
      setPlacing(false);
    }
  }

  if (loading || !eligibility?.eligible) return null;

  const address = eligibility.address;
  const paymentLabel =
    eligibility.paymentMethod === "UPI_ON_DELIVERY"
      ? "UPI on Delivery"
      : eligibility.paymentMethod === "WALLET"
        ? "Wallet"
        : "Cash on Delivery";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={springs.enter}
        className="rounded-2xl bg-gradient-to-r from-primary/5 to-secondary-50 dark:from-primary/10 dark:to-secondary-900/20 border border-primary/20 p-4 mb-3"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-body font-bold text-neutral-900 dark:text-white">Quick Order</h3>
        </div>

        {/* Compact info */}
        <div className="space-y-1.5 mb-3">
          {address && (
            <div className="flex items-center gap-2 text-caption text-neutral-600 dark:text-neutral-400">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {address.label || address.houseName}, {address.street}, {address.pincode}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-caption text-neutral-600 dark:text-neutral-400">
            <CreditCard className="h-3.5 w-3.5 shrink-0" />
            <span>{paymentLabel}</span>
          </div>
        </div>

        {/* One-tap button */}
        <motion.button
          type="button"
          onClick={handleExpressOrder}
          disabled={placing}
          whileTap={tapScale.primary}
          className="w-full h-11 rounded-xl bg-primary text-white text-body font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
        >
          {placing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Placing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Quick Order - {formatCurrency(subtotal)}
            </>
          )}
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
