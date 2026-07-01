"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Navigation, X, AlertTriangle, Clock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { calculateDistanceKm } from "@/lib/distance";
import { SITE, STORE_COORDINATES } from "@/lib/constants";

const STORAGE_KEY = "msm-delivery-location";

export type DeliveryLocation = {
  lat: number;
  lng: number;
  address: string;
  area?: string;
  pincode?: string;
  eta?: string;
};

function estimateETA(distanceKm: number): string {
  if (distanceKm <= 1) return "10-15 min";
  if (distanceKm <= 2) return "15-20 min";
  if (distanceKm <= 3.5) return "20-25 min";
  if (distanceKm <= 5) return "25-35 min";
  return "35-45 min";
}

export function getSavedLocation(): DeliveryLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DeliveryLocation;
  } catch {
    return null;
  }
}

export function saveLocation(location: DeliveryLocation) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
}

export function LocationPrompt({ forceOpen = false, onClose }: { forceOpen?: boolean; onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outsideRadius, setOutsideRadius] = useState(false);
  const [pincode, setPincode] = useState("");
  const [resolvedLocation, setResolvedLocation] = useState<DeliveryLocation | null>(null);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      return;
    }
    const saved = getSavedLocation();
    if (!saved) {
      setOpen(true);
    }
  }, [forceOpen]);

  const handleClose = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    if (resolvedLocation) {
      saveLocation(resolvedLocation);
      setOpen(false);
      onClose?.();
      // Trigger a storage event so header can react
      window.dispatchEvent(new Event("location-updated"));
    }
  }, [resolvedLocation, onClose]);

  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setError(null);
    setOutsideRadius(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const distance = calculateDistanceKm({ lat, lng }, STORE_COORDINATES);
        const withinRadius = distance <= SITE.deliveryRadiusKm;
        const eta = estimateETA(distance);

        const location: DeliveryLocation = {
          lat,
          lng,
          address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          area: withinRadius ? "Near Store" : "Outside Delivery Area",
          eta,
        };

        setResolvedLocation(location);
        setOutsideRadius(!withinRadius);
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? "Location access denied. Please enter your pincode instead."
            : "Unable to get your location. Please enter your pincode."
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  const handlePincodeSubmit = useCallback(() => {
    if (pincode.length < 6) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    setError(null);
    setOutsideRadius(false);

    // For pincode we estimate based on known local pincodes
    // Trivandrum area pincodes: 695xxx
    const isLocalPincode = pincode.startsWith("695");
    const estimatedDistance = isLocalPincode ? 2.5 : 10;
    const withinRadius = estimatedDistance <= SITE.deliveryRadiusKm;
    const eta = estimateETA(estimatedDistance);

    const location: DeliveryLocation = {
      lat: STORE_COORDINATES.lat,
      lng: STORE_COORDINATES.lng,
      address: `Pincode ${pincode}`,
      area: isLocalPincode ? "Trivandrum" : pincode,
      pincode,
      eta,
    };

    setResolvedLocation(location);
    setOutsideRadius(!withinRadius);
  }, [pincode]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget && getSavedLocation()) handleClose();
        }}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-t-3xl md:rounded-3xl p-6 relative max-h-[85vh] overflow-y-auto"
        >
          {/* Close button (only if location already saved) */}
          {getSavedLocation() && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-neutral-500" />
            </button>
          )}

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black text-neutral-900 dark:text-white">Set Delivery Location</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">We deliver within {SITE.deliveryRadiusKm} km</p>
            </div>
          </div>

          {/* Geolocation Button */}
          <button
            onClick={handleGeolocation}
            disabled={loading}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-60"
          >
            <Navigation className="h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="text-sm font-bold text-neutral-900 dark:text-white">
                {loading ? "Detecting location..." : "Use current location"}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Using GPS for accurate delivery</p>
            </div>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
            <span className="text-xs font-semibold text-neutral-400">OR</span>
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
          </div>

          {/* Pincode Input */}
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit pincode"
              className="flex-1 h-12 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 text-sm font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              onClick={handlePincodeSubmit}
              className="h-12 px-5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-sm hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
            >
              Check
            </button>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30"
            >
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-xs font-medium text-red-700 dark:text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Outside Radius Warning */}
          {outsideRadius && resolvedLocation && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30"
            >
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                We don&apos;t deliver to this area yet. You can still browse products.
              </p>
            </motion.div>
          )}

          {/* Resolved Location */}
          {resolvedLocation && !outsideRadius && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-3 p-4 rounded-xl bg-secondary-50 dark:bg-secondary-950/30 border border-secondary-100 dark:border-secondary-900/30"
            >
              <MapPin className="h-5 w-5 text-secondary-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                  {resolvedLocation.area || resolvedLocation.address}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3 text-secondary-600" />
                  <p className="text-xs font-semibold text-secondary-600">Delivery in {resolvedLocation.eta}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Confirm Button */}
          {resolvedLocation && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleConfirm}
              className="w-full mt-5 h-12 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
            >
              {outsideRadius ? "Continue Browsing" : "Confirm Location"}
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
