"use client";

import { useState } from "react";
import { CheckCircle2, Edit3, Home, MapPin, Plus, Save, Trash2, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/toast-provider";

type Address = {
  id: string;
  label: string;
  customerName: string;
  phone: string;
  houseName: string;
  street: string;
  landmark: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
};

const EMPTY_FORM = { label: "Home", customerName: "", phone: "", houseName: "", street: "", landmark: "", pincode: "", latitude: 0, longitude: 0 };

export function AddressesPageClient({ addresses: initial }: { addresses: Address[] }) {
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function startEdit(addr: Address) {
    setEditingId(addr.id);
    setForm({ label: addr.label, customerName: addr.customerName, phone: addr.phone, houseName: addr.houseName, street: addr.street, landmark: addr.landmark, pincode: addr.pincode, latitude: addr.latitude, longitude: addr.longitude });
    setShowAdd(false);
  }

  function cancelEdit() { setEditingId(null); setForm(EMPTY_FORM); }

  async function saveEdit(id: string) {
    if (!form.houseName || !form.street || !form.pincode) { showToast("Fill all required fields", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || "Failed to update", "error"); return; }
      setAddresses((cur) => cur.map((a) => a.id === id ? { ...a, ...form } : a));
      setEditingId(null);
      showToast("Address updated", "success");
    } catch { showToast("Network error", "error"); }
    finally { setSaving(false); }
  }

  async function addAddress() {
    if (!form.houseName || !form.street || !form.landmark || !form.pincode) { showToast("Fill all required fields", "error"); return; }
    if (!/^\d{6}$/.test(form.pincode)) { showToast("Pincode must be 6 digits", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, isDefault: addresses.length === 0 }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed to add", "error"); return; }
      setAddresses((cur) => [...cur, { ...data.address, customerName: form.customerName, phone: form.phone }]);
      setShowAdd(false);
      setForm(EMPTY_FORM);
      showToast("Address added", "success");
    } catch { showToast("Network error", "error"); }
    finally { setSaving(false); }
  }

  async function makeDefault(id: string) {
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) { showToast("Failed to update", "error"); return; }
      setAddresses((cur) => cur.map((a) => ({ ...a, isDefault: a.id === id })));
      showToast("Default address updated", "success");
    } catch { showToast("Network error", "error"); }
  }

  async function deleteAddress(id: string) {
    const addr = addresses.find((a) => a.id === id);
    if (addr?.isDefault) { showToast("Cannot delete primary address. Set another as default first.", "error"); return; }
    if (!confirm("Delete this address?")) return;
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json().catch(() => ({})); showToast(d.error || "Failed to delete", "error"); return; }
      setAddresses((cur) => cur.filter((a) => a.id !== id));
      showToast("Address deleted", "success");
    } catch { showToast("Network error", "error"); }
  }

  function updateField(key: keyof typeof form, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const AddressForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="grid grid-cols-2 gap-3">
        <FormInput label="Label" value={form.label} onChange={(v) => updateField("label", v)} placeholder="Home, Office..." />
        <FormInput label="Pincode *" value={form.pincode} onChange={(v) => updateField("pincode", v)} placeholder="695001" />
      </div>
      <FormInput label="House / Flat *" value={form.houseName} onChange={(v) => updateField("houseName", v)} placeholder="House name or flat no" />
      <FormInput label="Street / Area *" value={form.street} onChange={(v) => updateField("street", v)} placeholder="Street or area name" />
      <FormInput label="Landmark *" value={form.landmark} onChange={(v) => updateField("landmark", v)} placeholder="Near temple, school..." />
      <div className="grid grid-cols-2 gap-3">
        <FormInput label="Name" value={form.customerName} onChange={(v) => updateField("customerName", v)} placeholder="Recipient name" />
        <FormInput label="Phone" value={form.phone} onChange={(v) => updateField("phone", v)} placeholder="Phone number" />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onSubmit} disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white disabled:opacity-50">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {submitLabel}
        </button>
        <button type="button" onClick={() => { cancelEdit(); setShowAdd(false); }} className="rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-bold text-neutral-600 dark:border-neutral-600 dark:text-neutral-300">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Add new button */}
      {!showAdd && !editingId && (
        <button type="button" onClick={() => { setShowAdd(true); setForm(EMPTY_FORM); }} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 py-4 text-sm font-semibold text-neutral-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors dark:border-neutral-600 dark:hover:border-emerald-500">
          <Plus className="h-4 w-4" />
          Add New Address
        </button>
      )}

      {/* Add form */}
      {showAdd && <AddressForm onSubmit={addAddress} submitLabel="Add Address" />}

      {/* Address list */}
      <AnimatePresence>
        {addresses.map((addr) => (
          <motion.div key={addr.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40 }}>
            {editingId === addr.id ? (
              <AddressForm onSubmit={() => saveEdit(addr.id)} submitLabel="Save Changes" />
            ) : (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Primary
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed pl-6">
                  {addr.houseName}, {addr.street}, {addr.landmark} — {addr.pincode}
                </p>
                {(addr.customerName || addr.phone) && (
                  <p className="mt-1 text-[11px] text-neutral-400 pl-6">{addr.customerName} {addr.phone && `· ${addr.phone}`}</p>
                )}
                <div className="mt-3 flex items-center gap-2 pl-6">
                  <button type="button" onClick={() => startEdit(addr)} className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-[11px] font-bold text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600">
                    <Edit3 className="h-3 w-3" /> Edit
                  </button>
                  {!addr.isDefault && (
                    <>
                      <button type="button" onClick={() => makeDefault(addr.id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400">
                        Set Default
                      </button>
                      <button type="button" onClick={() => deleteAddress(addr.id)} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {addresses.length === 0 && !showAdd && (
        <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-8 text-center">
          <MapPin className="h-8 w-8 text-neutral-300 mx-auto" />
          <p className="mt-3 text-sm font-medium text-neutral-500">No addresses yet</p>
          <p className="mt-1 text-xs text-neutral-400">Add your first delivery address above</p>
        </div>
      )}
    </div>
  );
}

function FormInput({ label, value, onChange, placeholder }: { label: string; value: string | number; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-1">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white" />
    </div>
  );
}
