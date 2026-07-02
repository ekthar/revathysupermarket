"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { calculateDistanceKm } from "@/lib/distance";

type LatLng = { latitude: number; longitude: number };

interface DeliveryMapProps {
  deliveryPartnerLocation: (LatLng & { heading?: number }) | null;
  customerLocation: LatLng;
  storeLocation: LatLng;
  className?: string;
  etaMinutes?: number | null;
}

// ─── Brand-aligned palette ───
const BRAND_GREEN = "#22C55E";
const BRAND_BLACK = "#050505";
const BRAND_LIME = "#A7D129";
const BRAND_GREEN_MUTED = "#16a34a";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Fetches a road-snapped route between two points via our OSRM proxy. Falls back to null on failure. */
async function fetchRoadRoute(
  from: LatLng,
  to: LatLng,
  signal?: AbortSignal
): Promise<[number, number][] | null> {
  try {
    const params = new URLSearchParams({
      fromLat: String(from.latitude),
      fromLng: String(from.longitude),
      toLat: String(to.latitude),
      toLng: String(to.longitude),
    });
    const res = await fetch(`/api/route/road?${params}`, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.coordinates) ? data.coordinates : null;
  } catch {
    return null;
  }
}

export function DeliveryMap({
  deliveryPartnerLocation,
  customerLocation,
  storeLocation,
  className,
  etaMinutes: etaMinutesProp,
}: DeliveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const storeMarkerRef = useRef<any>(null);
  const routeLineCoreRef = useRef<any>(null);
  const routeLineGlowRef = useRef<any>(null);
  
  const prevRiderPosRef = useRef<{ lng: number; lat: number } | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const routeAbortRef = useRef<AbortController | null>(null);
  const lastRoutedAtRef = useRef<{ lng: number; lat: number } | null>(null);
  const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Helper to create the customer marker HTML
  const createCustomerMarkerHtml = useCallback(() => {
    return `<div class="delivery-customer-marker" style="width: 44px; height: 44px; position: relative;">
      <svg viewBox="0 0 44 44" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="dest-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <rect x="4" y="4" width="36" height="36" rx="10" fill="${BRAND_BLACK}" stroke="${BRAND_BLACK}" stroke-width="2" filter="url(#dest-glow)"/>
        <path d="M22 13 L30 19 V29 H26 V23 H18 V29 H14 V19 Z" fill="white"/>
      </svg>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:56px;height:56px;border-radius:50%;background:${BRAND_BLACK}15;box-shadow:0 0 12px ${BRAND_BLACK}22;animation:map-pulse 2s ease-out infinite;pointer-events:none;z-index:-1;"></div>
      <div style="position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);background:white;color:${BRAND_BLACK};font-size:10px;font-weight:800;padding:2px 7px;border-radius:6px;white-space:nowrap;border:1px solid #e5e7eb;box-shadow:0 2px 6px rgba(0,0,0,0.08);">Your Home</div>
    </div>`;
  }, []);

  // Helper to create the store marker HTML
  const createStoreMarkerHtml = useCallback(() => {
    return `<div class="delivery-store-marker" style="width: 26px; height: 26px; position: relative;">
      <svg viewBox="0 0 26 26" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="store-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx="13" cy="13" r="11" fill="white" stroke="${BRAND_LIME}" stroke-width="2" filter="url(#store-glow)"/>
        <path d="M7 11 L9 8 H17 L19 11 Z M7 11 V18 H19 V11" fill="none" stroke="${BRAND_GREEN_MUTED}" stroke-width="1.5" stroke-linejoin="round"/>
        <rect x="11" y="14" width="4" height="4" fill="${BRAND_GREEN_MUTED}" rx="0.5"/>
      </svg>
      <div style="position:absolute;bottom:-16px;left:50%;transform:translateX(-50%);background:white;color:${BRAND_GREEN_MUTED};font-size:9px;font-weight:800;padding:1px 5px;border-radius:4px;white-space:nowrap;border:1px solid #e5e7eb;box-shadow:0 1px 4px rgba(0,0,0,0.06);">Store</div>
    </div>`;
  }, []);

  // Helper to create rider marker HTML content
  const createRiderMarkerHtml = useCallback((eta: number | null, heading: number = 0) => {
    const etaBadgeHtml = eta != null && eta > 0
      ? `<div class="rider-eta-badge" style="position:absolute;top:-26px;left:50%;transform:translateX(-50%);background:white;color:${BRAND_GREEN_MUTED};font-size:11px;font-weight:800;padding:2px 9px;border-radius:10px;white-space:nowrap;border:1px solid ${BRAND_GREEN}44;box-shadow:0 2px 8px rgba(34,197,94,0.2);z-index:10;">${eta} min</div>`
      : "";

    return `<div class="delivery-rider-marker" style="width: 52px; height: 52px; position: relative; cursor: pointer;">
      ${etaBadgeHtml}
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:60px;height:60px;border-radius:50%;border:2px solid ${BRAND_GREEN};box-shadow:0 0 12px ${BRAND_GREEN}66;animation:rider-pulse 1.8s ease-out infinite;pointer-events:none;z-index:0;"></div>
      <div class="rider-rotation-wrapper" style="width: 100%; height: 100%; transition: transform 0.3s ease; position: relative; z-index: 1; transform: rotate(${heading}deg);">
        <svg viewBox="0 0 52 52" width="52" height="52" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="rider-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <circle cx="26" cy="26" r="22" fill="white" stroke="${BRAND_GREEN}" stroke-width="2.5" filter="url(#rider-glow)"/>
          <g fill="none" stroke="${BRAND_GREEN_MUTED}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="34" r="4" fill="white"/>
            <circle cx="34" cy="34" r="4" fill="white"/>
            <path d="M18 34 H26 L30 22 H36"/>
            <path d="M26 34 L30 26"/>
            <path d="M34 22 H38 M36 18 L38 22"/>
            <path d="M14 26 H20 L22 22"/>
          </g>
        </svg>
      </div>
    </div>`;
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (!containerRef.current) return;

    let active = true;
    let map: any = null;

    const init = async () => {
      const L = (await import("leaflet")).default;
      if (!active) return;
      LRef.current = L;

      // Create Leaflet map instance
      map = L.map(containerRef.current!, {
        center: [customerLocation.latitude, customerLocation.longitude],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });
      mapRef.current = map;

      // Add CartoDB Positron Light raster basemap tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      // Create customer marker
      const customerIcon = L.divIcon({
        html: createCustomerMarkerHtml(),
        className: "",
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      customerMarkerRef.current = L.marker(
        [customerLocation.latitude, customerLocation.longitude],
        { icon: customerIcon }
      ).addTo(map);

      // Click to open directions on customer marker
      customerMarkerRef.current.on("click", () => {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${customerLocation.latitude},${customerLocation.longitude}&travelmode=driving`,
          "_blank"
        );
      });

      // Create store marker
      const storeIcon = L.divIcon({
        html: createStoreMarkerHtml(),
        className: "",
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      storeMarkerRef.current = L.marker(
        [storeLocation.latitude, storeLocation.longitude],
        { icon: storeIcon }
      ).addTo(map);

      // Fit bounds initially
      const bounds = L.latLngBounds([
        [customerLocation.latitude, customerLocation.longitude],
        [storeLocation.latitude, storeLocation.longitude],
      ]);
      map.fitBounds(bounds, { padding: [60, 60] });

      setIsReady(true);
    };

    init();

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      routeAbortRef.current?.abort();
      if (map) {
        map.remove();
        mapRef.current = null;
        riderMarkerRef.current = null;
        customerMarkerRef.current = null;
        storeMarkerRef.current = null;
        routeLineCoreRef.current = null;
        routeLineGlowRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update ETA badge on rider marker when etaMinutesProp changes
  useEffect(() => {
    if (!riderMarkerRef.current || !LRef.current) return;
    const L = LRef.current;
    const heading = deliveryPartnerLocation?.heading ?? 0;
    
    const riderIcon = L.divIcon({
      html: createRiderMarkerHtml(etaMinutesProp ?? null, heading),
      className: "",
      iconSize: [52, 52],
      iconAnchor: [26, 26],
    });
    riderMarkerRef.current.setIcon(riderIcon);
  }, [etaMinutesProp, deliveryPartnerLocation?.heading, createRiderMarkerHtml]);

  // Animate rider position changes smoothly
  const animateRider = useCallback(
    (from: { lng: number; lat: number }, to: { lng: number; lat: number }, heading?: number) => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (!LRef.current) return;
      const L = LRef.current;

      const duration = 1000;
      const startTime = performance.now();

      function step(now: number) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        const lng = lerp(from.lng, to.lng, eased);
        const lat = lerp(from.lat, to.lat, eased);

        if (riderMarkerRef.current) {
          riderMarkerRef.current.setLatLng([lat, lng]);
        }

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          prevRiderPosRef.current = to;
          animFrameRef.current = null;
        }
      }

      if (riderMarkerRef.current) {
        const riderIcon = L.divIcon({
          html: createRiderMarkerHtml(etaMinutesProp ?? null, heading ?? 0),
          className: "",
          iconSize: [52, 52],
          iconAnchor: [26, 26],
        });
        riderMarkerRef.current.setIcon(riderIcon);
      }

      animFrameRef.current = requestAnimationFrame(step);
    },
    [etaMinutesProp, createRiderMarkerHtml]
  );

  // Update rider position, route polyline, and camera bounds
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !isReady) return;

    if (!deliveryPartnerLocation) {
      if (riderMarkerRef.current) {
        riderMarkerRef.current.remove();
        riderMarkerRef.current = null;
        prevRiderPosRef.current = null;
      }
      lastRoutedAtRef.current = null;
      
      // Remove route lines if exist
      if (routeLineCoreRef.current) {
        routeLineCoreRef.current.remove();
        routeLineCoreRef.current = null;
      }
      if (routeLineGlowRef.current) {
        routeLineGlowRef.current.remove();
        routeLineGlowRef.current = null;
      }
      setDistanceRemaining(null);
      return;
    }

    const newPos = { lng: deliveryPartnerLocation.longitude, lat: deliveryPartnerLocation.latitude };
    const dist = calculateDistanceKm(
      { lat: deliveryPartnerLocation.latitude, lng: deliveryPartnerLocation.longitude },
      { lat: customerLocation.latitude, lng: customerLocation.longitude }
    );
    setDistanceRemaining(dist);

    const shouldRefetchRoute =
      !lastRoutedAtRef.current ||
      calculateDistanceKm(
        { lat: lastRoutedAtRef.current.lat, lng: lastRoutedAtRef.current.lng },
        { lat: deliveryPartnerLocation.latitude, lng: deliveryPartnerLocation.longitude }
      ) > 0.04;

    if (shouldRefetchRoute) {
      routeAbortRef.current?.abort();
      const controller = new AbortController();
      routeAbortRef.current = controller;
      lastRoutedAtRef.current = newPos;

      fetchRoadRoute(deliveryPartnerLocation, customerLocation, controller.signal).then((coords) => {
        if (controller.signal.aborted || !mapRef.current) return;

        // OSRM coordinates are [lng, lat], convert to [lat, lng] for Leaflet
        const routeCoords: [number, number][] = coords
          ? coords.map(([lng, lat]) => [lat, lng])
          : [
              [newPos.lat, newPos.lng],
              [customerLocation.latitude, customerLocation.longitude],
            ];

        // Draw neon glow underlay polyline
        if (!routeLineGlowRef.current) {
          routeLineGlowRef.current = L.polyline(routeCoords, {
            color: BRAND_GREEN,
            weight: 10,
            opacity: 0.15,
          }).addTo(mapRef.current);
        } else {
          routeLineGlowRef.current.setLatLngs(routeCoords);
        }

        // Draw bright core polyline
        if (!routeLineCoreRef.current) {
          routeLineCoreRef.current = L.polyline(routeCoords, {
            color: BRAND_GREEN,
            weight: 3.5,
            opacity: 0.9,
          }).addTo(mapRef.current);
        } else {
          routeLineCoreRef.current.setLatLngs(routeCoords);
        }
      });
    }

    if (!riderMarkerRef.current) {
      const riderIcon = L.divIcon({
        html: createRiderMarkerHtml(etaMinutesProp ?? null, deliveryPartnerLocation.heading ?? 0),
        className: "",
        iconSize: [52, 52],
        iconAnchor: [26, 26],
      });
      riderMarkerRef.current = L.marker([newPos.lat, newPos.lng], { icon: riderIcon }).addTo(map);
      prevRiderPosRef.current = newPos;

      const bounds = L.latLngBounds([
        [customerLocation.latitude, customerLocation.longitude],
        [storeLocation.latitude, storeLocation.longitude],
        [newPos.lat, newPos.lng],
      ]);
      map.fitBounds(bounds, { padding: [60, 60] });
    } else {
      const from = prevRiderPosRef.current || newPos;
      animateRider(from, newPos, deliveryPartnerLocation.heading);
      map.panTo([newPos.lat, newPos.lng]);
    }
  }, [deliveryPartnerLocation, isReady, customerLocation, storeLocation, createRiderMarkerHtml, animateRider, etaMinutesProp]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-soft ${className ?? ""}`}>
      <div ref={containerRef} className="h-[320px] w-full bg-neutral-100 dark:bg-neutral-900 relative z-0" />
      {/* Distance remaining overlay — clean minimal chip */}
      {distanceRemaining !== null && (
        <div className="absolute top-3 left-3 z-[400] rounded-xl border border-neutral-200 bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-sm dark:bg-neutral-900/95 dark:border-neutral-800">
          <p className="text-micro font-bold uppercase tracking-wide text-neutral-400">Distance</p>
          <p className="text-body font-black text-neutral-900 dark:text-white">
            {distanceRemaining < 1 ? `${Math.round(distanceRemaining * 1000)} m` : `${distanceRemaining.toFixed(1)} km`}
          </p>
        </div>
      )}
      {/* Subtle vignette for depth */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_center,transparent_65%,rgba(0,0,0,0.06)_100%)] z-[400]" />
      {/* Custom zoom controls — minimal brand buttons */}
      <div className="absolute right-3 bottom-6 flex flex-col gap-1.5 z-[400]">
        <button
          type="button"
          onClick={handleZoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white/95 text-base font-bold text-neutral-700 shadow-sm backdrop-blur-sm hover:bg-white active:scale-95 transition dark:bg-neutral-900/95 dark:border-neutral-800 dark:text-neutral-300"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white/95 text-base font-bold text-neutral-700 shadow-sm backdrop-blur-sm hover:bg-white active:scale-95 transition dark:bg-neutral-900/95 dark:border-neutral-800 dark:text-neutral-300"
          aria-label="Zoom out"
        >
          -
        </button>
      </div>
    </div>
  );
}
