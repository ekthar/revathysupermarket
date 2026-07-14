"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { springs, tapScale } from "@/lib/motion";
import { haptic } from "@/lib/haptics";
import { useToast } from "@/components/toast-provider";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: { color?: string };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    confirm_close?: boolean;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: RazorpayErrorResponse) => void) => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayErrorResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
  };
}

interface RazorpayButtonProps {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  onSuccess: () => void;
  onFailure: (error: string) => void;
}

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve();
      return;
    }

    const existing = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay script"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay script"));
    document.head.appendChild(script);
  });
}

export function RazorpayButton({
  orderId,
  customerName,
  customerPhone,
  customerEmail,
  onSuccess,
  onFailure,
}: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { showToast } = useToast();
  const abortRef = useRef(false);

  // Preload Razorpay script on mount
  useEffect(() => {
    abortRef.current = false;
    loadRazorpayScript()
      .then(() => {
        if (!abortRef.current) setScriptLoaded(true);
      })
      .catch(() => {
        // Non-critical: script will be loaded on button click if needed
      });
    return () => {
      abortRef.current = true;
    };
  }, []);

  const handlePayment = useCallback(async () => {
    if (loading) return;
    haptic("medium");
    setLoading(true);

    try {
      // Ensure script is loaded
      if (!scriptLoaded) {
        await loadRazorpayScript();
        setScriptLoaded(true);
      }

      // Create Razorpay order via our backend
      const createRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}));
        throw new Error(data.error || "Could not initiate payment");
      }

      const {
        razorpayOrderId,
        razorpayKeyId,
        amount,
        currency,
      } = await createRes.json();

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: razorpayKeyId,
        amount,
        currency,
        name: "Revathy Supermarket",
        description: "Order Payment",
        order_id: razorpayOrderId,
        handler: async (response: RazorpayResponse) => {
          // Payment succeeded on Razorpay side; verify with our backend
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId,
              }),
            });

            if (verifyRes.ok) {
              haptic("heavy");
              showToast("Payment successful!", "success");
              onSuccess();
            } else {
              const data = await verifyRes.json().catch(() => ({}));
              onFailure(data.error || "Payment verification failed");
            }
          } catch {
            onFailure("Payment verification failed. Please contact support.");
          }
          setLoading(false);
        },
        prefill: {
          name: customerName,
          contact: customerPhone,
          email: customerEmail,
        },
        theme: { color: "#050505" },
        modal: {
          ondismiss: () => {
            setLoading(false);
            showToast("Payment cancelled", "error");
          },
          escape: true,
          confirm_close: true,
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp: RazorpayErrorResponse) => {
        setLoading(false);
        onFailure(resp.error?.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (error) {
      setLoading(false);
      const message = error instanceof Error ? error.message : "Payment could not be initiated";
      onFailure(message);
    }
  }, [
    loading,
    scriptLoaded,
    orderId,
    customerName,
    customerPhone,
    customerEmail,
    onSuccess,
    onFailure,
    showToast,
  ]);

  return (
    <motion.button
      type="button"
      onClick={handlePayment}
      disabled={loading}
      whileTap={tapScale.primary}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.enter}
      className="w-full h-14 rounded-2xl bg-black text-white text-sm font-bold transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:opacity-40"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Processing...
        </span>
      ) : (
        "Pay Online Now"
      )}
    </motion.button>
  );
}
