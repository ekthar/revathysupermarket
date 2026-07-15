"use client";

import { useState } from "react";
import { X, CreditCard, Banknote, Smartphone } from "lucide-react";
import { isPaymentMethodValid, COLLECTION_PAYMENT_METHODS } from "@msm/shared";
import type { CollectionPaymentMethod } from "@msm/shared";
import { readApiResponse } from "@/lib/client-api";
import { useToast } from "@/components/toast-provider";

interface PaymentCollectionModalProps {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const METHOD_CONFIG: Record<
  CollectionPaymentMethod,
  { label: string; icon: typeof CreditCard; color: string }
> = {
  UPI: {
    label: "UPI",
    icon: Smartphone,
    color: "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-400",
  },
  Cash: {
    label: "Cash",
    icon: Banknote,
    color: "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300 dark:border-green-400",
  },
  Card: {
    label: "Card",
    icon: CreditCard,
    color: "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-400",
  },
};

export function PaymentCollectionModal({
  orderId,
  onClose,
  onSuccess,
}: PaymentCollectionModalProps) {
  const [selected, setSelected] = useState<CollectionPaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const isValid = isPaymentMethodValid(selected);

  async function handleConfirm() {
    if (!isValid || !selected) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/payment-received`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: selected }),
      });

      const data = await readApiResponse<{ success?: boolean; error?: string }>(response);

      if (!response.ok || data.error) {
        showToast(data.error || "Failed to record payment.", "error");
        return;
      }

      showToast("Payment recorded successfully.", "success");
      onSuccess();
      onClose();
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-premium">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Payment Method</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Select how the customer paid
        </p>

        {/* Payment method options */}
        <div className="mt-5 flex flex-col gap-3">
          {COLLECTION_PAYMENT_METHODS.map((method) => {
            const config = METHOD_CONFIG[method];
            const Icon = config.icon;
            const isSelected = selected === method;

            return (
              <button
                key={method}
                type="button"
                onClick={() => setSelected(method)}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                  isSelected
                    ? config.color
                    : "border-border bg-background hover:border-muted-foreground/30"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">{config.label}</span>
                {isSelected && (
                  <span className="ml-auto text-xs font-bold uppercase tracking-wider">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Hint when no method selected */}
        {!isValid && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Please select a payment method
          </p>
        )}

        {/* Actions */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background text-sm font-bold hover:bg-muted disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid || loading}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? "Saving..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
