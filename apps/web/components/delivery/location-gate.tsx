"use client";

import { LocateFixed, MapPinOff, ShieldAlert } from "lucide-react";
import { useDeliveryLocation, type UseDeliveryLocation } from "@/components/delivery/use-delivery-location";

/**
 * Blocks the delivery workspace until GPS permission is granted.
 *
 * Location is compulsory for delivery partners: it is required to prove
 * arrival at the customer's door and to show the rider moving on the
 * customer's live map. Without it the rider simply cannot go on duty.
 */
export function LocationGate({
  children,
}: {
  children: (location: UseDeliveryLocation) => React.ReactNode;
}) {
  const location = useDeliveryLocation();
  const { permission, requestPermission } = location;

  if (permission === "checking") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (permission === "granted") {
    return <>{children(location)}</>;
  }

  if (permission === "unsupported") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center dark:bg-slate-950">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h1 className="text-xl font-black text-slate-900 dark:text-white">Location not supported</h1>
        <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
          This device or browser can&apos;t provide GPS location, which is required to accept deliveries.
          Please use a phone with location services.
        </p>
      </div>
    );
  }

  // prompt or denied
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur">
        {permission === "denied" ? (
          <MapPinOff className="h-10 w-10 text-white" />
        ) : (
          <LocateFixed className="h-10 w-10 text-white" />
        )}
      </div>
      <h1 className="text-2xl font-black text-white">
        {permission === "denied" ? "Location is blocked" : "Turn on your location"}
      </h1>
      <p className="max-w-sm text-sm text-white/80">
        {permission === "denied"
          ? "Delivery needs your live location to work — it's how we confirm you've arrived and let customers track you. Enable location for this site in your browser/app settings, then reload."
          : "Delivery needs your live location to work — it's how we confirm you've arrived at the customer's door and let them track you on the map in real time."}
      </p>
      {permission === "denied" ? (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 h-12 rounded-2xl bg-white px-6 font-black text-emerald-700"
        >
          I&apos;ve enabled it — Reload
        </button>
      ) : (
        <button
          type="button"
          onClick={requestPermission}
          className="mt-2 h-12 rounded-2xl bg-white px-6 font-black text-emerald-700"
        >
          Allow location access
        </button>
      )}
    </div>
  );
}
