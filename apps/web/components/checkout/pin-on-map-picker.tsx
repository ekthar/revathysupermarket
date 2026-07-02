"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed, MapPin, X } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Raster XYZ tile style (CartoDB Positron). Raster tiles are plain PNG image
 * requests with no glyph/sprite/vector-worker dependencies, so they stay
 * reliable under a locked-down CSP.
 *
 * We use CartoDB rather than raw OpenStreetMap tiles: OSM's tile usage policy
 * throttles/blocks bulk and commercial traffic (a common cause of "map won't
 * load" in production), whereas the Carto basemap CDN is built for embedding.
 * It's also the same basemap the live tracking map uses, so the app has one
 * consistent, minimal map look.
 */
const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
    }
  },
  layers: [{ id: "carto-tiles", type: "raster", source: "carto" }]
};

type LatLng = { latitude: number; longitude: number };

interface PinOnMapPickerProps {
  /** Starting map center — the current GPS/manual lat-lng if any, else a sensible default. */
  initial: LatLng;
  onClose: () => void;
  onConfirm: (location: LatLng) => void;
}

/**
 * Swiggy-style "pin your exact location" picker.
 *
 * A full-screen map with a fixed center pin — the user drags/pans the MAP
 * underneath a pin that stays visually anchored to the screen center (the
 * standard delivery-app UX, avoids a draggable-marker hit-testing problem on
 * small screens). "Use my current location" recenters via GPS. Confirming
 * returns the coordinates at screen center for the caller to reverse-geocode.
 */
export function PinOnMapPicker({ initial, onClose, onConfirm }: PinOnMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [center, setCenter] = useState<LatLng>(initial);
  const [locating, setLocating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [initial.longitude, initial.latitude],
      zoom: 17,
      attributionControl: false,
    });
    mapRef.current = map;

    const syncCenter = () => {
      const c = map.getCenter();
      setCenter({ latitude: c.lat, longitude: c.lng });
    };
    map.on("move", syncCenter);
    map.on("load", () => {
      syncCenter();
      setMapLoaded(true);
    });
    map.on("error", () => {
      setMapError(true);
    });

    return () => {
      map.off("move", syncCenter);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation || !mapRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapRef.current?.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 17,
          duration: 800,
        });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[95] flex flex-col bg-white dark:bg-neutral-950"
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
        <div ref={containerRef} className="absolute inset-0" />

        {/* Loading overlay */}
        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              <p className="text-xs font-bold text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}

        {/* Error state — only when the map never finished loading. A single
            transient tile error must not cover an otherwise-working map. */}
        {mapError && !mapLoaded && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
            <div className="flex flex-col items-center gap-2 px-6 text-center">
              <MapPin className="h-8 w-8 text-neutral-400" />
              <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400">
                Could not load map tiles
              </p>
              <p className="text-xs text-neutral-500">
                You can still confirm this location using coordinates below
              </p>
            </div>
          </div>
        )}

        {/* Fixed center pin (screen-anchored, not a real map marker) */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
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
          className="absolute bottom-24 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg dark:bg-neutral-900 disabled:opacity-50 press"
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
}
