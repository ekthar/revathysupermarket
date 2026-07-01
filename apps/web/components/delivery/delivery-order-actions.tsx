"use client";

import { useState } from "react";
import {
  CheckCircle2, IndianRupee, MapPinCheck, Phone, UserX,
} from "lucide-react";
import { motion } from "framer-motion";
import { readApiResponse } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/toast-provider";
import { SlideToConfirm } from "@/components/delivery/slide-to-confirm";

type DeliveryOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  status: string;
  total: number;
  paymentMethod: string;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
  collection?: {
    expectedAmount: number;
    cashCollected: number;
    upiCollected: number;
    upiReference: string | null;
    status: string;
  } | null;
};

interface DeliveryOrderActionsProps {
  order: DeliveryOrder;
  loading: string | null;
  unavailableOrders: Map<string, number>;
  onPickup: (order: DeliveryOrder) => void;
  onMarkArrived: (order: DeliveryOrder) => void;
  onMarkUnavailable: (order: DeliveryOrder) => void;
  onReturnToStore: (order: DeliveryOrder) => void;
  onOpenDamage: (order: DeliveryOrder) => void;
  onOpenCollect: (order: DeliveryOrder) => void;
  onOpenComplete: (order: DeliveryOrder) => void;
}

export function DeliveryOrderActions({
  order,
  loading,
  unavailableOrders,
  onPickup,
  onMarkArrived,
  onMarkUnavailable,
  onReturnToStore,
  onOpenDamage,
  onOpenCollect,
  onOpenComplete,
}: DeliveryOrderActionsProps) {
  return (
    <div className="space-y-3 p-4">
      {/* Call Customer - always visible */}
      <a
        href={`tel:${order.phone}`}
        className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 font-bold text-slate-700 dark:border-slate-700 dark:text-slate-300"
      >
        <Phone className="h-4 w-4" />
        Call Customer
      </a>

      {/* Slide to Accept - READY_FOR_DELIVERY */}
      {order.status === "READY_FOR_DELIVERY" && (
        <SlideToConfirm
          label="Slide to Accept"
          disabled={loading === order.id}
          onConfirm={() => onPickup(order)}
        />
      )}

      {/* Mark Arrived (GPS-verified, must be within 100m) - OUT_FOR_DELIVERY */}
      {order.status === "OUT_FOR_DELIVERY" && (
        <button
          disabled={loading === order.id}
          onClick={() => onMarkArrived(order)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-black text-white disabled:opacity-40"
        >
          <MapPinCheck className="h-4 w-4" />
          {loading === order.id ? "Checking your location…" : "I've Arrived"}
        </button>
      )}

      {/* Report Issue + Collect Payment - ARRIVING */}
      {order.status === "ARRIVING" && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onOpenDamage(order)}
            className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-300"
          >
            Report Issue
          </button>
          <button
            onClick={() => onOpenCollect(order)}
            className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-sm font-bold text-white"
          >
            <IndianRupee className="h-4 w-4" />
            Collect Payment
          </button>
        </div>
      )}

      {/* Customer Unavailable - ARRIVING */}
      {order.status === "ARRIVING" && (
        <button
          disabled={loading === order.id}
          onClick={() => {
            if (
              window.confirm(
                "Mark this customer as unavailable? This starts a wait timer before you can return the order to the store."
              )
            ) {
              onMarkUnavailable(order);
            }
          }}
          className="flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-amber-500 font-bold text-amber-700 disabled:opacity-40 dark:border-amber-600 dark:text-amber-400"
        >
          <UserX className="h-4 w-4 shrink-0" />
          Customer Unavailable
        </button>
      )}

      {/* Customer Unavailable countdown + Return to Store */}
      {order.status === "CUSTOMER_UNAVAILABLE" && (() => {
        const waitUntil = unavailableOrders.get(order.id) ?? 0;
        const remaining = Math.max(0, Math.ceil((waitUntil - Date.now()) / 1000));
        const canReturn = remaining === 0;
        return (
          <div className="grid grid-cols-2 gap-2">
            <span className="flex h-12 items-center justify-center rounded-xl bg-amber-100 text-sm font-black text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              {canReturn ? "Timer expired" : `Wait ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
            </span>
            <button
              disabled={!canReturn || loading === order.id}
              onClick={() => onReturnToStore(order)}
              className="flex h-12 items-center justify-center rounded-xl bg-red-600 text-sm font-black text-white disabled:opacity-40"
            >
              Return to Store
            </button>
          </div>
        );
      })()}

      {/* Complete Delivery - ARRIVING + collection done */}
      {order.status === "ARRIVING" &&
        order.collection &&
        !["SHORT", "EXCESS"].includes(order.collection.status) && (
          <button
            onClick={() => onOpenComplete(order)}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 font-black text-white dark:bg-white dark:text-slate-900"
          >
            <CheckCircle2 className="h-5 w-5" />
            Complete Delivery
          </button>
        )}
    </div>
  );
}
