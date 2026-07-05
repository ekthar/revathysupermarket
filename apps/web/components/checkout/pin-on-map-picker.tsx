"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LocateFixed, MapPin, X } from "lucide-react";
import { motion } from "framer-motion";
import { springs } from "@/lib/motion";

type LatLng = { latitude: number; longitude: number };

interface PinOnMapPickerProps {
  /** Starting map center — the current GPS/manual lat-lng if any, else a sensible default. */
  initial: LatLng;
  onClose: () => void;
  onConfirm: (location: LatLng) => void;
}

/**
 * Swiggy-style "pin your exact location" picker using Leaflet.
 *
 * A full-screen map with a fixed center pin — the user drags/pans the MAP
 * underneath a pin that stays visually anchored to the screen center.
 */
export function PinOnMapPicker({ initial, onClose, onConfirm }: PinOnMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [center, setCenter] = useState<LatLng>(initial);
  const [locating, setLocating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);

  // Gate portal rendering to avoid SSR/hydration mismatch (document.body
  // doesn't exist during SSR). Also lock body scroll while the picker is open.
  useEffect(() => {
    setPortalMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Initialize the map once the container and Leaflet are available.
  useEffect(() => {
    if (!portalMounted) return;

    let active = true;
    let map: any = null;
    let resizeObserver: ResizeObserver | null = null;
    let settleTimer: number | null = null;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      if (!active) return;
      if (!containerRef.current) return;

      // Initialize map
      map = L.map(containerRef.current, {
        center: [initial.latitude, initial.longitude],
        zoom: 17,
        zoomControl: false,
        attributionControl: false,
      });
      mapRef.current = map;

      // Add CartoDB Positron Light raster tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      const syncCenter = () => {
        try {
          const c = map.getCenter();
          setCenter({ latitude: c.lat, longitude: c.lng });
        } catch {}
      };

      map.on("moveend", syncCenter);
      
      syncCenter();
      setMapLoaded(true);

      // Handle container resizing
      resizeObserver = new ResizeObserver(() => {
        try { map?.invalidateSize(); } catch {}
      });
      resizeObserver.observe(containerRef.current);

      // Ensure map is properly sized after layout settles
      const frame = requestAnimationFrame(() => {
        try { map?.invalidateSize(); } catch {}
      });
      settleTimer = window.setTimeout(() => {
        try { map?.invalidateSize(); } catch {}
      }, 350);
    };

    initMap();

    return () => {
      active = false;
      if (settleTimer) window.clearTimeout(settleTimer);
      if (resizeObserver) resizeObserver.disconnect();
      if (map) {
        map.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portalMounted]);

  function useMyLocation() {
    if (!navigator.geolocation || !mapRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapRef.current?.flyTo(
          [position.coords.latitude, position.coords.longitude],
          17,
          { animate: true, duration: 0.8 }
        );
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  // Full-screen Leaflet map, deliberately excluded from the BottomSheet/Dialog
  // migration — Vaul's rounded-t-3xl/max-h-[85dvh] chrome would break Leaflet's
  // container sizing. Only the fade transition is aligned to the shared preset.
  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={springs.gentle}
      className="fixed inset-0 z-[95] flex flex-col bg-white dark:bg-neutral-950"
      role="dialog"
      aria-modal="true"
      aria-label="Pin your exact location on map"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <p className="text-title font-black text-neutral-900 dark:text-white">Pin your exact location</p>
          <p className="text-caption text-neutral-500">Move the map so the pin sits on your house</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close map picker"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 press"
        >
          <X className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
        </button>
      </div>

      {/* Map */}
      <div className="relative flex-1" style={{ minHeight: "300px" }}>
        <div ref={containerRef} className="absolute inset-0 z-0" />

        {/* Loading overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 z-[20] flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              <p className="text-xs font-bold text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}

        {/* Fixed center pin (screen-anchored, not a real map marker) */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[10] -translate-x-1/2 -translate-y-full">
          <div className="flex flex-col items-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black shadow-lg">
              <MapPin className="h-6 w-6 text-white" fill="white" />
            </div>
            <div className="mt-0.5 h-2 w-2 rounded-full bg-black/40 blur-[1px]" />
          </div>
        </div>

        {/* Use my location button */}
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="absolute bottom-24 right-4 z-[10] flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg dark:bg-neutral-900 disabled:opacity-50 press"
          aria-label="Use my current location"
        >
          <LocateFixed className={`h-5 w-5 text-primary ${locating ? "animate-pulse" : ""}`} />
        </button>
      </div>

      {/* Footer: coordinates + confirm */}
      <div className="border-t border-neutral-100 dark:border-neutral-800 p-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
        <p className="mb-3 text-center text-caption font-semibold text-neutral-500">
          {center.latitude.toFixed(5)}, {center.longitude.toFixed(5)}
        </p>
        <button
          type="button"
          onClick={() => onConfirm(center)}
          className="flex h-12 w-full items-center justify-center rounded-2xl bg-black font-black text-white press"
        >
          Confirm this location
        </button>
      </div>
    </motion.div>
  );

  return portalMounted
    ? createPortal(content, document.body)
    : null;
}
