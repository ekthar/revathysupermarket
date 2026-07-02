"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed, MapPin, Navigation } from "lucide-react";

/** Reliable free tile style (Carto Positron) */
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

type LatLng = { latitude: number; longitude: number };

interface StoreLocationPickerProps {
  latitude: number;
  longitude: number;
  onChange: (location: LatLng) => void;
}

/**
 * Premium inline map picker for admin settings.
 * Uses MapLibre GL with Carto Positron tiles - same center-pin UX as the checkout picker,
 * but embedded in a card rather than full-screen.
 */
export function StoreLocationPicker({ latitude, longitude, onChange }: StoreLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [center, setCenter] = useState<LatLng>({ latitude, longitude });
  const [locating, setLocating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Store the onChange callback in a ref so the map event handler always has the latest version
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [longitude, latitude],
      zoom: 16,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    mapRef.current = map;

    const syncCenter = () => {
      const c = map.getCenter();
      const newCenter = { latitude: c.lat, longitude: c.lng };
      setCenter(newCenter);
    };

    const onMoveEnd = () => {
      const c = map.getCenter();
      onChangeRef.current({ latitude: c.lat, longitude: c.lng });
    };

    map.on("move", syncCenter);
    map.on("moveend", onMoveEnd);
    map.on("load", () => {
      syncCenter();
      setMapLoaded(true);
    });

    return () => {
      map.off("move", syncCenter);
      map.off("moveend", onMoveEnd);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation || !mapRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapRef.current?.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 17,
          duration: 1000,
        });
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, []);

  const recenterToStore = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [longitude, latitude],
      zoom: 16,
      duration: 800,
    });
  }, [latitude, longitude]);

  return (
    <div className="space-y-3">
      {/* Map Container */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-border/60 shadow-soft">
        {/* Map */}
        <div
          ref={containerRef}
          className="h-[340px] w-full sm:h-[380px]"
          style={{ minHeight: "300px" }}
        />

        {/* Loading overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              <p className="text-xs font-bold text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}

        {/* Fixed center pin (screen-anchored) */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-xl ring-4 ring-primary/20">
              <MapPin className="h-6 w-6 text-white" fill="white" />
            </div>
            <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-primary/50 blur-[2px]" />
          </div>
        </div>

        {/* Top-left badge */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm dark:bg-neutral-900/95">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
            Drag map to reposition
          </span>
        </div>

        {/* GPS button */}
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="absolute bottom-14 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 dark:bg-neutral-900"
          aria-label="Use current GPS location"
          title="Use current GPS location"
        >
          <LocateFixed className={`h-5 w-5 text-primary ${locating ? "animate-pulse" : ""}`} />
        </button>
      </div>

      {/* Coordinates display */}
      <div className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-primary" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Store coordinates
            </p>
            <p className="text-sm font-black text-neutral-800 dark:text-neutral-200 tabular-nums">
              {center.latitude.toFixed(6)}, {center.longitude.toFixed(6)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
        >
          <LocateFixed className={`h-3.5 w-3.5 ${locating ? "animate-pulse" : ""}`} />
          {locating ? "Locating..." : "Use GPS"}
        </button>
      </div>
    </div>
  );
}
