"use client";

import { CreditCard } from "lucide-react";

interface OrderPaymentSectionProps {
  orderId: string;
  paymentMethod: string;
  paymentStatus: string;
}

export function OrderPaymentSection({ orderId, paymentMethod, paymentStatus }: OrderPaymentSectionProps) {
  void orderId;

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
          <span className={`font-semibold ${paymentStatus === "PAID" ? "text-green-600" : "text-yellow-600"}`}>
            {paymentStatus}
          </span>
        </div>
      </div>
    </section>
  );
}
