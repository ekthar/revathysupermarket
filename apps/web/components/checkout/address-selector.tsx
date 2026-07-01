"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, MapPinned, Navigation } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/components/toast-provider";
import { STORE_COORDINATES } from "@/lib/constants";
import { PinOnMapPicker } from "@/components/checkout/pin-on-map-picker";

type SavedAddress = {
  id: string;
  label: string;
  houseName: string;
  street: string;
  landmark: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
};

type LocationState = "idle" | "loading" | "success" | "denied";

interface AddressSelectorProps {
  form: {
    customerName: string;
    phone: string;
    houseName: string;
    street: string;
    landmark: string;
    pincode: string;
    notes: string;
    latitude: string;
    longitude: string;
  };
  onUpdate: (name: string, value: string) => void;
  onFormPatch: (patch: Record<string, string>) => void;
  savedAddresses: SavedAddress[];
  locationState: LocationState;
  onLocationStateChange: (state: LocationState) => void;
  locationOk: boolean;
  isOutsideRadius: boolean;
  distance: number | null;
  deliveryRadiusKm: number;
}

export function AddressSelector({
  form,
  onUpdate,
  onFormPatch,
  savedAddresses,
  locationState,
  onLocationStateChange,
  locationOk,
  isOutsideRadius,
  distance,
  deliveryRadiusKm,
}: AddressSelectorProps) {
  const { showToast } = useToast();
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [showPinPicker, setShowPinPicker] = useState(false);

  /** Reverse-geocodes and patches the form. Shared by GPS-detect and the pin-on-map picker. */
  async function applyPickedLocation(lat: number, lng: number, source: "GPS" | "pinned location" = "pinned location") {
    onUpdate("latitude", lat.toString());
    onUpdate("longitude", lng.toString());
    onLocationStateChange("success");
    try {
      const res = await fetch(`/api/geocode/reverse?latitude=${lat}&longitude=${lng}`);
      if (res.ok) {
        const geo = await res.json();
        const patch: Record<string, string> = { latitude: lat.toString(), longitude: lng.toString() };
        if (geo.street) patch.street = geo.street;
        if (geo.landmark) patch.landmark = geo.landmark;
        if (geo.pincode) patch.pincode = geo.pincode;
        if (geo.houseName) patch.houseName = geo.houseName;
        onFormPatch(patch);
        showToast(`Address auto-filled from ${source}`, "success");
      } else {
        showToast(`${source === "GPS" ? "GPS location" : "Location"} set — enter address manually`, "success");
      }
    } catch {
      showToast(`${source === "GPS" ? "GPS location" : "Location"} set — enter address manually`, "success");
    }
  }

  function applySavedAddress(addressId: string) {
    const address = savedAddresses.find((entry) => entry.id === addressId);
    if (!address) return;
    onFormPatch({
      houseName: address.houseName,
      street: address.street,
      landmark: address.landmark,
      pincode: address.pincode,
      latitude: address.latitude.toString(),
      longitude: address.longitude.toString(),
    });
    onLocationStateChange("success");
    showToast(`${address.label} address selected`, "success");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      onLocationStateChange("denied");
      showToast("Location is not available", "error");
      return;
    }
    onLocationStateChange("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        showToast("Location detected - fetching address...", "success");
        void applyPickedLocation(position.coords.latitude, position.coords.longitude, "GPS");
      },
      () => {
        onLocationStateChange("denied");
        showToast("Location permission needed", "error");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-lg bg-white p-5 shadow-elevation-3 dark:bg-neutral-900"
    >
      <h2 className="text-title font-black text-neutral-900 dark:text-white mb-4">Delivery Address</h2>

      {savedAddresses.length > 0 && (
        <div className="mb-4">
          <select
            defaultValue=""
            onChange={(event) => applySavedAddress(event.target.value)}
            className="h-11 w-full rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 text-sm font-semibold text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Choose saved address</option>
            {savedAddresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.label}
                {address.isDefault ? " (default)" : ""} - {address.houseName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Location detection */}
      <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-4 mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={locationOk ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${locationOk ? "bg-secondary-100 text-secondary-700" : "bg-black text-white"}`}
          >
            {locationOk ? <CheckCircle2 className="h-5 w-5" /> : <Navigation className="h-5 w-5" />}
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-body font-bold text-neutral-800 dark:text-white">
              {locationOk ? `${distance?.toFixed(1)} KM from store` : "GPS verification needed"}
            </p>
            <p className="text-caption text-neutral-500 mt-0.5">
              Delivery within {deliveryRadiusKm} KM only
            </p>
          </div>
          <motion.button
            type="button"
            onClick={useCurrentLocation}
            disabled={locationState === "loading"}
            whileTap={{ scale: 0.9 }}
            className="shrink-0 rounded-full bg-black px-3 py-2 text-caption font-bold text-white"
          >
            {locationState === "loading" ? "Finding..." : locationOk ? "Refresh" : "Detect"}
          </motion.button>
        </div>
        {isOutsideRadius && (
          <p className="mt-3 text-caption font-semibold text-red-600 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            Outside delivery radius ({distance?.toFixed(1)} KM)
          </p>
        )}
        {/* Swiggy-style precise pin drop — lets the user place the exact
            house/gate on a map instead of relying only on GPS accuracy. */}
        <button
          type="button"
          onClick={() => setShowPinPicker(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-2 text-caption font-bold text-neutral-700 dark:text-neutral-300 press"
        >
          <MapPinned className="h-3.5 w-3.5" />
          Pin exact location on map
        </button>
      </div>

      {/* Address fields */}
      <div className="grid gap-3 sm:grid-cols-2">
        <CheckoutField label="Customer name" value={form.customerName} onChange={(v) => onUpdate("customerName", v)} />
        <CheckoutField label="Phone number" type="tel" value={form.phone} onChange={(v) => onUpdate("phone", v)} />
        <CheckoutField label="House name / flat" value={form.houseName} onChange={(v) => onUpdate("houseName", v)} />
        <CheckoutField
          label="Pincode"
          inputMode="numeric"
          value={form.pincode}
          onChange={(v) => onUpdate("pincode", v.replace(/\D/g, "").slice(0, 6))}
        />
        <CheckoutField label="Street / area" value={form.street} onChange={(v) => onUpdate("street", v)} className="sm:col-span-2" />
        <CheckoutField label="Landmark" value={form.landmark} onChange={(v) => onUpdate("landmark", v)} className="sm:col-span-2" />
      </div>

      <AnimatePresence mode="wait">
        {form.pincode && /^\d{6}$/.test(form.pincode) && (
          <motion.p
            key="pincode-info"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3 rounded-xl px-3 py-2 text-caption font-semibold bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
          >
            {locationOk
              ? `\u2713 Within delivery range (${distance?.toFixed(1)} KM)`
              : "Tap Detect above to verify delivery eligibility"}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-3">
        <label className="block">
          <span className="text-caption font-bold text-neutral-600">Delivery notes</span>
          <textarea
            value={form.notes}
            onChange={(event) => onUpdate("notes", event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-3 text-body text-neutral-900 dark:text-white outline-none resize-none h-20 focus:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
            placeholder="Gate color, preferred time..."
          />
        </label>
      </div>

      {/* Manual coordinates */}
      <button
        type="button"
        onClick={() => setShowManualLocation((c) => !c)}
        className="mt-3 flex items-center gap-1 text-caption font-bold text-black"
      >
        Enter coordinates manually
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showManualLocation ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {showManualLocation && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <CheckoutField label="Latitude" value={form.latitude} onChange={(v) => onUpdate("latitude", v)} />
              <CheckoutField label="Longitude" value={form.longitude} onChange={(v) => onUpdate("longitude", v)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPinPicker && (
          <PinOnMapPicker
            initial={{
              latitude: Number(form.latitude) || STORE_COORDINATES.lat,
              longitude: Number(form.longitude) || STORE_COORDINATES.lng,
            }}
            onClose={() => setShowPinPicker(false)}
            onConfirm={(location) => {
              setShowPinPicker(false);
              void applyPickedLocation(location.latitude, location.longitude);
            }}
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function CheckoutField({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
}) {
  return (
    <label className={`min-w-0 ${className ?? ""}`}>
      <span className="text-caption font-bold text-neutral-600">{label}</span>
      <input
        required
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full h-11 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3.5 text-body text-neutral-900 dark:text-white outline-none focus:border-primary/40 focus:bg-white dark:focus:bg-neutral-700 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
      />
    </label>
  );
}
