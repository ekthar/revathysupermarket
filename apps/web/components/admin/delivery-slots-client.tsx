"use client";

import { useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { formatIstDateTimeLocal } from "@/lib/ist-datetime";

type Slot = {
  id: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  bookedCount: number;
  isActive: boolean;
};

type EditState = {
  startsAt: string;
  endsAt: string;
  capacity: string;
};

// Delivery slot times are entered/edited as IST wall-clock time. Formatting via the
// browser's local timezone getters would shift the value whenever the admin's device
// isn't set to IST (and interacts badly with the server, which parses bare
// datetime-local strings as IST regardless of its own runtime timezone).
function toDateTimeInput(value: string) {
  return formatIstDateTimeLocal(new Date(value));
}

function sortSlots(slots: Slot[]) {
  return [...slots].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function DeliverySlotsClient({ initialSlots }: { initialSlots: Slot[] }) {
  const { showToast } = useToast();
  const [slots, setSlots] = useState(sortSlots(initialSlots));
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("10");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState>({ startsAt: "", endsAt: "", capacity: "10" });

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/admin/delivery-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startsAt, endsAt, capacity }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) return showToast(data.error ?? "Slot could not be created", "error");
    setSlots((current) => sortSlots([...current, data.slot]));
    setStartsAt("");
    setEndsAt("");
    showToast("Delivery slot created", "success");
  }

  async function updateSlot(slot: Slot, updates: Partial<EditState> & { isActive?: boolean }) {
    setUpdatingId(slot.id);
    const response = await fetch("/api/admin/delivery-slots", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: slot.id, ...updates }),
    });
    const data = await response.json().catch(() => ({}));
    setUpdatingId(null);
    if (!response.ok) {
      showToast(data.error ?? "Slot update failed", "error");
      return false;
    }
    setSlots((current) => sortSlots(current.map((entry) => (entry.id === slot.id ? data.slot : entry))));
    return true;
  }

  async function toggle(slot: Slot) {
    const ok = await updateSlot(slot, { isActive: !slot.isActive });
    if (ok) showToast(!slot.isActive ? "Delivery slot activated" : "Delivery slot paused", "success");
  }

  function startEdit(slot: Slot) {
    setEditingId(slot.id);
    setEdit({
      startsAt: toDateTimeInput(slot.startsAt),
      endsAt: toDateTimeInput(slot.endsAt),
      capacity: String(slot.capacity),
    });
  }

  async function saveEdit(slot: Slot) {
    const ok = await updateSlot(slot, edit);
    if (!ok) return;
    setEditingId(null);
    showToast("Delivery slot updated", "success");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="grid gap-3 rounded-3xl border border-border bg-card p-4 sm:grid-cols-3">
        <label className="text-sm font-bold">
          Starts
          <input required type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-1 h-11 w-full rounded-2xl border border-border bg-background px-3" />
        </label>
        <label className="text-sm font-bold">
          Ends
          <input required type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="mt-1 h-11 w-full rounded-2xl border border-border bg-background px-3" />
        </label>
        <label className="text-sm font-bold">
          Capacity
          <input required type="number" min="1" max="500" value={capacity} onChange={(event) => setCapacity(event.target.value)} className="mt-1 h-11 w-full rounded-2xl border border-border bg-background px-3" />
        </label>
        <button disabled={saving} className="h-11 rounded-2xl bg-primary text-sm font-black text-white disabled:opacity-50 sm:col-span-3">
          {saving ? "Creating..." : "Create delivery slot"}
        </button>
      </form>

      <div className="grid gap-3">
        {slots.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border p-8 text-center text-muted-foreground">No upcoming slots.</p>
        ) : (
          slots.map((slot) => {
            const isEditing = editingId === slot.id;
            const isUpdating = updatingId === slot.id;
            return (
              <article key={slot.id} className="rounded-2xl border border-border bg-card p-4">
                {isEditing ? (
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px_auto] sm:items-end">
                    <label className="text-sm font-bold">
                      Starts
                      <input type="datetime-local" value={edit.startsAt} onChange={(event) => setEdit((current) => ({ ...current, startsAt: event.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3" />
                    </label>
                    <label className="text-sm font-bold">
                      Ends
                      <input type="datetime-local" value={edit.endsAt} onChange={(event) => setEdit((current) => ({ ...current, endsAt: event.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3" />
                    </label>
                    <label className="text-sm font-bold">
                      Capacity
                      <input type="number" min={slot.bookedCount} max="500" value={edit.capacity} onChange={(event) => setEdit((current) => ({ ...current, capacity: event.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3" />
                    </label>
                    <div className="flex gap-2">
                      <button type="button" disabled={isUpdating} onClick={() => saveEdit(slot)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white disabled:opacity-50" aria-label="Save slot">
                        <Save className="h-4 w-4" />
                      </button>
                      <button type="button" disabled={isUpdating} onClick={() => setEditingId(null)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground disabled:opacity-50" aria-label="Cancel edit">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black">{new Date(slot.startsAt).toLocaleString("en-IN")}</p>
                      <p className="text-sm text-muted-foreground">
                        Until {new Date(slot.endsAt).toLocaleTimeString("en-IN")} - {slot.bookedCount}/{slot.capacity} booked
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => startEdit(slot)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground" aria-label="Edit slot">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" disabled={isUpdating} onClick={() => toggle(slot)} className={`h-10 rounded-xl px-3 text-xs font-black disabled:opacity-50 ${slot.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {slot.isActive ? "Active" : "Paused"}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
