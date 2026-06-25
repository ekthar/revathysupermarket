"use client";

import { useState, useEffect } from "react";

type DeliverySlot = { id: string; startsAt: string; endsAt: string; remaining: number; available: boolean };

interface DeliveryModeSelectorProps {
  deliveryMode: "ASAP" | "SCHEDULED";
  onModeChange: (mode: "ASAP" | "SCHEDULED") => void;
  deliverySlotId: string;
  onSlotChange: (slotId: string) => void;
  slotsEnabled: boolean;
}

export function DeliveryModeSelector({
  deliveryMode,
  onModeChange,
  deliverySlotId,
  onSlotChange,
  slotsEnabled,
}: DeliveryModeSelectorProps) {
  const [slots, setSlots] = useState<DeliverySlot[]>([]);

  useEffect(() => {
    if (!slotsEnabled) return;
    fetch("/api/delivery-slots")
      .then((res) => (res.ok ? res.json() : { slots: [] }))
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => undefined);
  }, [slotsEnabled]);

  if (!slotsEnabled) return null;

  return (
    <section className="rounded-2xl border border-neutral-100 bg-white p-4 card-shadow dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-sm font-black text-neutral-900 dark:text-white">Delivery time</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onModeChange("ASAP")}
          className={`h-11 rounded-xl text-sm font-bold ${deliveryMode === "ASAP" ? "bg-black text-white" : "bg-neutral-100 dark:bg-neutral-800"}`}
        >
          ASAP
        </button>
        <button
          type="button"
          onClick={() => onModeChange("SCHEDULED")}
          className={`h-11 rounded-xl text-sm font-bold ${deliveryMode === "SCHEDULED" ? "bg-black text-white" : "bg-neutral-100 dark:bg-neutral-800"}`}
        >
          Choose slot
        </button>
      </div>
      {deliveryMode === "SCHEDULED" && (
        <div className="mt-3 grid gap-2">
          {slots.length === 0 ? (
            <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-700">
              No scheduled slots are available. Choose ASAP.
            </p>
          ) : (
            slots.map((slot) => (
              <label
                key={slot.id}
                className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3 text-sm font-semibold"
              >
                <input
                  type="radio"
                  name="delivery-slot"
                  value={slot.id}
                  checked={deliverySlotId === slot.id}
                  disabled={!slot.available}
                  onChange={() => onSlotChange(slot.id)}
                />
                <span>
                  {new Date(slot.startsAt).toLocaleString("en-IN", {
                    weekday: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(slot.endsAt).toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">{slot.remaining} left</span>
              </label>
            ))
          )}
        </div>
      )}
    </section>
  );
}
