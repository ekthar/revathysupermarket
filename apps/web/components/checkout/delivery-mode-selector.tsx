"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, Zap, Calendar } from "lucide-react";
import { motion } from "framer-motion";

type DeliverySlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  remaining: number;
  available: boolean;
};

interface DeliveryModeSelectorProps {
  deliveryMode: "ASAP" | "SCHEDULED";
  onModeChange: (mode: "ASAP" | "SCHEDULED") => void;
  deliverySlotId: string;
  onSlotChange: (slotId: string) => void;
  scheduledEnabled: boolean;
  instantEnabled: boolean;
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function formatSlotTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function groupSlotsByDate(slots: DeliverySlot[]): Map<string, DeliverySlot[]> {
  const grouped = new Map<string, DeliverySlot[]>();
  for (const slot of slots) {
    const dateKey = new Date(slot.startsAt).toDateString();
    const existing = grouped.get(dateKey) ?? [];
    existing.push(slot);
    grouped.set(dateKey, existing);
  }
  return grouped;
}

export function DeliveryModeSelector({
  deliveryMode,
  onModeChange,
  deliverySlotId,
  onSlotChange,
  scheduledEnabled,
  instantEnabled,
}: DeliveryModeSelectorProps) {
  const [slots, setSlots] = useState<DeliverySlot[]>([]);

  useEffect(() => {
    if (!scheduledEnabled) return;
    fetch("/api/delivery-slots", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { slots: [] }))
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => undefined);
  }, [scheduledEnabled]);

  const groupedSlots = useMemo(() => groupSlotsByDate(slots), [slots]);
  const dateKeys = useMemo(() => Array.from(groupedSlots.keys()), [groupedSlots]);
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Auto-select first date when slots load
  useEffect(() => {
    if (dateKeys.length > 0 && !selectedDate) {
      setSelectedDate(dateKeys[0]);
    }
  }, [dateKeys, selectedDate]);

  if (!scheduledEnabled && !instantEnabled) return null;

  const currentDateSlots = groupedSlots.get(selectedDate) ?? [];

  return (
    <section className="rounded-2xl border border-neutral-100 bg-white p-4 card-shadow dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-sm font-black text-neutral-900 dark:text-white">Delivery time</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {instantEnabled && (
          <motion.button
            type="button"
            onClick={() => onModeChange("ASAP")}
            whileTap={{ scale: 0.96 }}
            className={`relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-bold transition-colors ${
              deliveryMode === "ASAP"
                ? "bg-neutral-900 text-white shadow-md dark:bg-white dark:text-neutral-900"
                : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              <span>Express</span>
            </div>
            <span className={`text-[10px] font-semibold ${deliveryMode === "ASAP" ? "text-white/70 dark:text-neutral-900/60" : "text-neutral-500"}`}>
              ~25-40 min
            </span>
            {/* Recommended badge */}
            {deliveryMode !== "ASAP" && (
              <span className="absolute -top-1.5 right-2 rounded-full bg-secondary-500 px-1.5 py-0.5 text-[8px] font-bold text-white">
                Fastest
              </span>
            )}
          </motion.button>
        )}
        {scheduledEnabled && (
          <motion.button
            type="button"
            onClick={() => onModeChange("SCHEDULED")}
            whileTap={{ scale: 0.96 }}
            className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-bold transition-colors ${
              deliveryMode === "SCHEDULED"
                ? "bg-neutral-900 text-white shadow-md dark:bg-white dark:text-neutral-900"
                : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Schedule</span>
            </div>
            <span className={`text-[10px] font-semibold ${deliveryMode === "SCHEDULED" ? "text-white/70 dark:text-neutral-900/60" : "text-neutral-500"}`}>
              Pick a time
            </span>
          </motion.button>
        )}
      </div>

      {scheduledEnabled && deliveryMode === "SCHEDULED" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4"
        >
          {slots.length === 0 ? (
            <p className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-sm font-semibold text-amber-700 dark:text-amber-400">
              No scheduled slots are available. Choose ASAP.
            </p>
          ) : (
            <>
              {/* Date tabs */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {dateKeys.map((dateKey) => {
                  const isActive = selectedDate === dateKey;
                  const sampleSlot = groupedSlots.get(dateKey)?.[0];
                  const label = sampleSlot ? getDateLabel(sampleSlot.startsAt) : dateKey;
                  return (
                    <motion.button
                      key={dateKey}
                      type="button"
                      onClick={() => setSelectedDate(dateKey)}
                      whileTap={{ scale: 0.95 }}
                      className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                        isActive
                          ? "bg-black text-white"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}
                    >
                      {label}
                    </motion.button>
                  );
                })}
              </div>

              {/* Time slot cards */}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {currentDateSlots.map((slot, idx) => {
                  const isSelected = deliverySlotId === slot.id;
                  const capacityPercent = Math.max(0, Math.min(100, (slot.remaining / 10) * 100));
                  const isLow = slot.remaining <= 3;
                  const isFirstAvailable = slot.available && currentDateSlots.slice(0, idx).every(s => !s.available || s.id === slot.id);

                  return (
                    <motion.button
                      key={slot.id}
                      type="button"
                      onClick={() => slot.available && onSlotChange(slot.id)}
                      disabled={!slot.available}
                      whileTap={slot.available ? { scale: 0.96 } : undefined}
                      className={`relative flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? "border-neutral-900 bg-neutral-900/5 shadow-sm dark:border-white dark:bg-white/5"
                          : slot.available
                          ? "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                          : "border-neutral-100 bg-neutral-50 opacity-50 dark:border-neutral-800 dark:bg-neutral-850"
                      }`}
                    >
                      {/* Recommended badge on first available slot */}
                      {isFirstAvailable && !isSelected && (
                        <span className="absolute -top-1.5 left-3 rounded-full bg-secondary-500 px-1.5 py-0.5 text-[8px] font-bold text-white">
                          Recommended
                        </span>
                      )}
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-neutral-500" />
                          <span className="text-caption font-bold text-neutral-800 dark:text-neutral-200">
                            {formatSlotTime(slot.startsAt)} - {formatSlotTime(slot.endsAt)}
                          </span>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-5 w-5 rounded-full bg-black flex items-center justify-center"
                          >
                            <span className="text-white text-micro font-bold">&#10003;</span>
                          </motion.div>
                        )}
                      </div>

                      {/* Capacity indicator */}
                      <div className="mt-2 w-full">
                        <div className="flex items-center justify-between">
                          <span className={`text-micro font-semibold ${isLow ? "text-orange-600" : "text-neutral-500"}`}>
                            {slot.remaining} slot{slot.remaining !== 1 ? "s" : ""} left
                          </span>
                        </div>
                        <div className="mt-1 h-1 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${capacityPercent}%` }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className={`h-full rounded-full ${isLow ? "bg-orange-500" : "bg-secondary-500"}`}
                          />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>
      )}
    </section>
  );
}
