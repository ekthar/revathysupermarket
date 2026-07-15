"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { PaymentCollectionModal } from "@/components/admin/payment-collection-modal";

interface OrderPaymentSectionProps {
  orderId: string;
  paymentMethod: string;
  paymentStatus: string;
}

export function OrderPaymentSection({ orderId, paymentMethod, paymentStatus }: OrderPaymentSectionProps) {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState(paymentStatus);

  function handlePaymentSuccess() {
    setCurrentPaymentStatus("PAID");
  }

  return (
    <section className="rounded-2xl bg-card border border-border p-5">
      <h2 className="text-sm font-black text-foreground mb-3 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-primary" /> Payment
      </h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Method</span>
          <span className="font-semibold">{paymentMethod.replace(/_/g, " ")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className={`font-semibold ${currentPaymentStatus === "PAID" ? "text-green-600" : "text-yellow-600"}`}>
            {currentPaymentStatus}
          </span>
        </div>
      </div>

      {currentPaymentStatus !== "PAID" && (
        <button
          type="button"
          onClick={() => setPaymentModalOpen(true)}
          className="mt-4 w-full h-10 rounded-xl bg-green-600 text-sm font-bold text-white hover:bg-green-700 transition-colors"
        >
          Received Full
        </button>
      )}

      {paymentModalOpen && (
        <PaymentCollectionModal
          orderId={orderId}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </section>
  );
}
