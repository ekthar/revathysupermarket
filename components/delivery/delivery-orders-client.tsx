"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, MapPin, Navigation, Package, Phone, Truck, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { readApiResponse } from "@/lib/client-api";
import { statusLabels } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";

type DeliveryOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  status: keyof typeof statusLabels;
  total: number;
  items: Array<{ id: string; name: string; quantity: number }>;
};

export function DeliveryOrdersClient({ orders }: { orders: DeliveryOrder[] }) {
  const [localOrders, setLocalOrders] = useState(orders);
  const [otpModal, setOtpModal] = useState<DeliveryOrder | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<{ orderId: string; reason: string } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition((position) => {
      fetch("/api/delivery/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude })
      }).catch(() => null);
    }, undefined, { enableHighAccuracy: true, maximumAge: 10000 });
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  async function markPickedUp(order: DeliveryOrder) {
    setActionLoading(order.id);
    const response = await fetch(`/api/delivery/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "picked_up" })
    });
    const data = await readApiResponse<{ error?: string }>(response);
    setActionLoading(null);
    if (!response.ok) {
      window.alert(data.error ?? "Update failed.");
      return;
    }
    setLocalOrders((current) => current.map((entry) => entry.id === order.id ? { ...entry, status: "OUT_FOR_DELIVERY" } : entry));
  }

  async function markDelivered(order: DeliveryOrder, otp: string) {
    setActionLoading(order.id);
    const response = await fetch(`/api/delivery/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delivered", otp })
    });
    const data = await readApiResponse<{ error?: string }>(response);
    setActionLoading(null);
    if (!response.ok) {
      return data.error ?? "Invalid OTP. Please try again.";
    }
    setLocalOrders((current) => current.map((entry) => entry.id === order.id ? { ...entry, status: "DELIVERED" } : entry));
    setOtpModal(null);
    return null;
  }

  function openMaps(address: string) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank");
  }

  async function requestCancellation(order: DeliveryOrder, reason: string) {
    setActionLoading(order.id);
    const response = await fetch(`/api/delivery/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request_cancel", reason })
    });
    const data = await readApiResponse<{ error?: string }>(response);
    setActionLoading(null);
    setCancelReason(null);
    if (!response.ok) {
      window.alert(data.error ?? "Cancellation request failed.");
      return;
    }
    window.alert("Cancellation request sent to admin. They will review and update the order.");
  }

  return (
    <>
      {/* OTP Modal */}
      <AnimatePresence>
        {otpModal && (
          <OtpVerificationModal
            order={otpModal}
            onClose={() => setOtpModal(null)}
            onSubmit={(otp) => markDelivered(otpModal, otp)}
          />
        )}
      </AnimatePresence>

      <div className="mt-4 space-y-3">
        {localOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <Package className="h-12 w-12 mx-auto text-slate-300" />
            <p className="mt-3 text-[14px] font-bold text-slate-700">No assigned orders</p>
            <p className="mt-1 text-[12px] text-slate-500">New deliveries will appear here.</p>
          </div>
        ) : localOrders.map((order) => (
          <article key={order.id} className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] font-bold text-slate-900">#{order.orderNumber}</h2>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    order.status === "OUT_FOR_DELIVERY" ? "bg-blue-100 text-blue-700" :
                    order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                    "bg-primary/10 text-primary"
                  )}>
                    {statusLabels[order.status]}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-slate-600">{order.customerName}</p>
              </div>
              <p className="text-[15px] font-bold text-slate-900">{formatCurrency(order.total)}</p>
            </div>

            {/* Address */}
            <div className="px-4 pb-3">
              <button
                onClick={() => openMaps(order.address)}
                className="w-full flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-left press"
              >
                <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span className="text-[12px] text-slate-700 flex-1">{order.address}</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </button>
            </div>

            {/* Items - compact */}
            <div className="px-4 pb-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Items ({order.items.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {order.items.map((item) => (
                  <span key={item.id} className="text-[11px] bg-slate-100 rounded-lg px-2 py-1 text-slate-700">
                    {item.name} <span className="text-slate-400">x{item.quantity}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 grid grid-cols-3 gap-2">
              <a
                href={`tel:${order.phone}`}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-700 press"
              >
                <Phone className="h-3.5 w-3.5" />
                Call
              </a>

              {order.status === "READY_FOR_DELIVERY" && (
                <button
                  onClick={() => markPickedUp(order)}
                  disabled={actionLoading === order.id}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary text-[11px] font-bold text-white press disabled:opacity-50 col-span-2"
                >
                  <Truck className="h-3.5 w-3.5" />
                  {actionLoading === order.id ? "Updating..." : "Mark Picked Up"}
                </button>
              )}

              {order.status === "OUT_FOR_DELIVERY" && (
                <button
                  onClick={() => setOtpModal(order)}
                  disabled={actionLoading === order.id}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-[11px] font-bold text-white press disabled:opacity-50 col-span-2"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark Delivered
                </button>
              )}

              {order.status === "DELIVERED" && (
                <span className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-green-100 text-[11px] font-bold text-green-700 col-span-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Delivered
                </span>
              )}
            </div>

            {/* Location indicator */}
            <div className="px-4 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                <Navigation className="h-3 w-3 text-primary" />
                GPS location active
              </span>
              {/* Cancel request */}
              {order.status !== "DELIVERED" && (
                <button
                  onClick={() => setCancelReason({ orderId: order.id, reason: "" })}
                  className="text-[10px] font-semibold text-red-500 hover:text-red-700 transition-colors"
                >
                  Request Cancel
                </button>
              )}
            </div>

            {/* Cancel reason input (if this order's cancel is being requested) */}
            {cancelReason?.orderId === order.id && (
              <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                <p className="text-[11px] font-bold text-slate-700 mb-2">Reason for cancellation:</p>
                <input
                  type="text"
                  value={cancelReason.reason}
                  onChange={(e) => setCancelReason({ orderId: order.id, reason: e.target.value })}
                  placeholder="Customer not available, wrong address, etc."
                  className="w-full h-9 rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-red-300"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => requestCancellation(order, cancelReason.reason)}
                    disabled={!cancelReason.reason.trim() || actionLoading === order.id}
                    className="flex-1 h-9 rounded-lg bg-red-600 text-[11px] font-bold text-white disabled:opacity-40"
                  >
                    Send Request
                  </button>
                  <button
                    onClick={() => setCancelReason(null)}
                    className="h-9 px-3 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </>
  );
}

// ============ OTP VERIFICATION MODAL ============

function OtpVerificationModal({
  order,
  onClose,
  onSubmit
}: {
  order: DeliveryOrder;
  onClose: () => void;
  onSubmit: (otp: string) => Promise<string | null>;
}) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Auto-focus first input on mount
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);

  function handleDigitChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError("");

    // Auto-advance to next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleSubmit();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      setDigits(pasted.split(""));
      inputRefs.current[3]?.focus();
    }
  }

  async function handleSubmit() {
    const otp = digits.join("");
    if (otp.length < 4) {
      setError("Enter all 4 digits");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setLoading(true);
    const errorMsg = await onSubmit(otp);
    setLoading(false);

    if (errorMsg) {
      setError(errorMsg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setDigits(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    } else {
      setSuccess(true);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
      >
        {success ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center"
            >
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </motion.div>
            <p className="mt-4 text-[16px] font-bold text-slate-900">Delivery Confirmed!</p>
            <p className="mt-1 text-[13px] text-slate-500">Order #{order.orderNumber} marked as delivered.</p>
          </motion.div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[16px] font-bold text-slate-900">Enter Delivery OTP</p>
                <p className="text-[12px] text-slate-500 mt-0.5">Order #{order.orderNumber} • {order.customerName}</p>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center press">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            {/* OTP Input boxes */}
            <motion.div
              animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex justify-center gap-3 mb-4"
              onPaste={handlePaste}
            >
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={cn(
                    "w-14 h-16 text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-all",
                    error ? "border-red-300 bg-red-50" :
                    digit ? "border-primary bg-primary/5" :
                    "border-slate-200 bg-slate-50 focus:border-primary focus:bg-white"
                  )}
                />
              ))}
            </motion.div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-[12px] font-semibold text-red-600 mb-3"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Helper text */}
            <p className="text-center text-[11px] text-slate-400 mb-5">
              Ask the customer for their 4-digit delivery OTP
            </p>

            {/* Submit button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={loading || digits.join("").length < 4}
              className="w-full h-12 rounded-2xl bg-slate-900 text-white text-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Delivery
                </>
              )}
            </motion.button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
