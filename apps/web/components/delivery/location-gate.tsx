"use client";

import { useEffect, useState } from "react";
import { Bike, LocateFixed, MapPinOff, ShieldAlert, Volume2, VolumeX } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useDeliveryLocation, type UseDeliveryLocation } from "@/components/delivery/use-delivery-location";

const SOUND_ENABLED_KEY = "delivery-alert-sound-enabled";
const AUDIO_UNLOCKED_KEY = "delivery-audio-unlocked";

export function LocationGate({
  children,
}: {
  children: (location: UseDeliveryLocation) => React.ReactNode;
}) {
  const location = useDeliveryLocation();
  const { permission, requestPermission } = location;
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    setSoundOn(localStorage.getItem(SOUND_ENABLED_KEY) === "true");
  }, []);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem(SOUND_ENABLED_KEY, String(next));
    localStorage.setItem(AUDIO_UNLOCKED_KEY, String(next));
  }

  if (permission === "checking") {
    return (
      <div className="flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15"
          >
            <Bike className="h-8 w-8 text-white" />
          </motion.div>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/20">
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              className="stay-light h-full w-1/2 rounded-full bg-white"
            />
          </div>
        </div>
      </div>
    );
  }

  if (permission === "granted") {
    return (
      <>
        {children(location)}
        {/* Alarm toggle button pinned to bottom-right */}
        <button
          type="button"
          onClick={toggleSound}
          className="fixed bottom-24 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-xl transition-all active:scale-90"
          style={{
            backgroundColor: soundOn ? "#059669" : "#1e293b",
          }}
        >
          {soundOn ? <Volume2 className="h-5 w-5 text-white" /> : <VolumeX className="h-5 w-5 text-white" />}
        </button>
      </>
    );
  }

  if (permission === "unsupported") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden bg-slate-50 px-6 text-center dark:bg-slate-950">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"
        >
          <ShieldAlert className="h-10 w-10 text-red-500" />
        </motion.div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Location not supported</h1>
        <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          This device or browser can&apos;t provide GPS location, which is required to accept deliveries.
        </p>
        <p className="max-w-xs text-sm text-slate-400 dark:text-slate-500">
          Please use a phone with location services.
        </p>
      </div>
    );
  }

  const isDenied = permission === "denied";

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 px-6 text-center">
      {/* Animated background circles */}
      <motion.div
        animate={{ scale: [1, 1.8, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5"
      />
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
        className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/5"
      />

      {/* Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative"
      >
        <motion.div
          animate={isDenied ? {} : { y: [-4, 4, -4] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-white/15 backdrop-blur-sm"
        >
          {isDenied ? (
            <MapPinOff className="h-12 w-12 text-white" />
          ) : (
            <Bike className="h-12 w-12 text-white" />
          )}
        </motion.div>
        {!isDenied && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: 1 }}
            className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400"
          >
            <LocateFixed className="h-4 w-4 text-white" />
          </motion.div>
        )}
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 25 }}
        className="relative mt-8"
      >
        <h1 className="text-3xl font-black text-white">
          {isDenied ? "Location is blocked" : "Ready to ride?"}
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-white/80">
          {isDenied
            ? "Delivery needs your live location. Enable location for this site in your browser settings, then reload."
            : "Enable your GPS so customers can track you and we can verify when you've arrived."}
        </p>
      </motion.div>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative mt-8 w-full max-w-sm space-y-3"
      >
        {isDenied ? (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="stay-light flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-lg font-black text-emerald-700 shadow-xl active:scale-[0.97] transition-transform"
          >
            <LocateFixed className="h-5 w-5" />
            I&apos;ve enabled it — Reload
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              requestPermission();
              if (navigator.vibrate) navigator.vibrate(30);
            }}
            className="stay-light flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-lg font-black text-emerald-700 shadow-xl active:scale-[0.97] transition-transform"
          >
            <LocateFixed className="h-5 w-5" />
            Enable my location
          </button>
        )}

        {/* Sound toggle */}
        <button
          type="button"
          onClick={() => {
            toggleSound();
            if (navigator.vibrate) navigator.vibrate(20);
          }}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 text-sm font-bold text-white/90 backdrop-blur-sm active:scale-[0.97] transition-transform"
        >
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          {soundOn ? "Sound alerts enabled" : "Enable sound alerts"}
        </button>

        {!isDenied && (
          <p className="text-xs text-white/50 pt-1">
            Location is required. Sound alerts are optional.
          </p>
        )}
      </motion.div>
    </div>
  );
}
