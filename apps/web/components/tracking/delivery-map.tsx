"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type LatLng = { latitude: number; longitude: number };

interface DeliveryMapProps {
  deliveryPartnerLocation: (LatLng & { heading?: number }) | null;
  customerLocation: LatLng;
  storeLocation: LatLng;
  className?: string;
  etaMinutes?: number | null;
}

// ─── Neon "cyberspace" palette ───
const NEON_CYAN = "#22d3ee";
const NEON_MAGENTA = "#f472b6";
const NEON_AMBER = "#fbbf24";

function haversineDistanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Fetches a road-snapped route between two points via our OSRM proxy. Falls back to null on failure (caller draws a straight line instead). */
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

function createRiderMarkerEl(etaMinutes?: number | null): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "delivery-rider-marker";
  el.style.width = "52px";
  el.style.height = "52px";
  el.style.cursor = "pointer";
  el.style.position = "relative";

  // ETA badge above the marker — neon cyan pill
  if (etaMinutes != null && etaMinutes > 0) {
    const badge = document.createElement("div");
    badge.className = "rider-eta-badge";
    badge.style.cssText =
      `position:absolute;top:-26px;left:50%;transform:translateX(-50%);background:#0b1220;color:${NEON_CYAN};font-size:11px;font-weight:800;padding:2px 9px;border-radius:10px;white-space:nowrap;border:1px solid ${NEON_CYAN}66;box-shadow:0 0 10px ${NEON_CYAN}88;z-index:10;`;
    badge.textContent = `${etaMinutes} min`;
    el.appendChild(badge);
  }

  // Outer neon glow ring (pulsing)
  const pulse = document.createElement("div");
  pulse.style.cssText =
    `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:60px;height:60px;border-radius:50%;border:2px solid ${NEON_CYAN};box-shadow:0 0 16px ${NEON_CYAN}, 0 0 32px ${NEON_CYAN}55;animation:rider-pulse 1.8s ease-out infinite;pointer-events:none;z-index:0;`;
  el.appendChild(pulse);

  // Rotation wrapper for heading — scooter glyph on a glowing disc
  const rotationWrapper = document.createElement("div");
  rotationWrapper.className = "rider-rotation-wrapper";
  rotationWrapper.style.width = "100%";
  rotationWrapper.style.height = "100%";
  rotationWrapper.style.transition = "transform 0.3s ease";
  rotationWrapper.style.position = "relative";
  rotationWrapper.style.zIndex = "1";
  rotationWrapper.innerHTML = `<svg viewBox="0 0 52 52" width="52" height="52" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="rider-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="2.5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <circle cx="26" cy="26" r="22" fill="#0b1220" stroke="${NEON_CYAN}" stroke-width="2" filter="url(#rider-glow)"/>
    <g fill="none" stroke="${NEON_CYAN}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#rider-glow)">
      <!-- scooter body -->
      <circle cx="18" cy="34" r="4" fill="#0b1220"/>
      <circle cx="34" cy="34" r="4" fill="#0b1220"/>
      <path d="M18 34 H26 L30 22 H36"/>
      <path d="M26 34 L30 26"/>
      <path d="M34 22 H38 M36 18 L38 22"/>
      <path d="M14 26 H20 L22 22"/>
    </g>
  </svg>`;
  el.appendChild(rotationWrapper);
  return el;
}

function createCustomerMarkerEl(lat: number, lng: number): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "delivery-customer-marker";
  el.style.width = "44px";
  el.style.height = "44px";
  el.style.cursor = "pointer";
  el.style.position = "relative";

  // Neon magenta rounded-square with home icon
  el.innerHTML = `<svg viewBox="0 0 44 44" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="dest-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="2.2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect x="4" y="4" width="36" height="36" rx="10" fill="#0b1220" stroke="${NEON_MAGENTA}" stroke-width="2" filter="url(#dest-glow)"/>
    <path d="M22 13 L30 19 V29 H26 V23 H18 V29 H14 V19 Z" fill="${NEON_MAGENTA}"/>
  </svg>`;

  // Magenta pulse ring
  const pulse = document.createElement("div");
  pulse.style.cssText =
    `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:56px;height:56px;border-radius:50%;background:${NEON_MAGENTA}22;box-shadow:0 0 18px ${NEON_MAGENTA}66;animation:map-pulse 2s ease-out infinite;pointer-events:none;z-index:-1;`;
  el.appendChild(pulse);

  // "Your Home" label below
  const label = document.createElement("div");
  label.style.cssText =
    `position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);background:#0b1220;color:${NEON_MAGENTA};font-size:10px;font-weight:800;padding:2px 7px;border-radius:6px;white-space:nowrap;border:1px solid ${NEON_MAGENTA}55;box-shadow:0 0 8px ${NEON_MAGENTA}55;`;
  label.textContent = "Your Home";
  el.appendChild(label);

  // Click handler opens Google Maps navigation
  el.addEventListener("click", () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
      "_blank"
    );
  });

  return el;
}

function createStoreMarkerEl(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "delivery-store-marker";
  el.style.width = "26px";
  el.style.height = "26px";
  el.style.cursor = "pointer";
  el.style.position = "relative";
  el.innerHTML = `<svg viewBox="0 0 26 26" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="store-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="1.6" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <circle cx="13" cy="13" r="11" fill="#0b1220" stroke="${NEON_AMBER}" stroke-width="1.75" filter="url(#store-glow)"/>
    <path d="M7 11 L9 8 H17 L19 11 Z M7 11 V18 H19 V11" fill="none" stroke="${NEON_AMBER}" stroke-width="1.5" stroke-linejoin="round"/>
    <rect x="11" y="14" width="4" height="4" fill="${NEON_AMBER}" rx="0.5"/>
  </svg>`;

  // "Store" label below
  const label = document.createElement("div");
  label.style.cssText =
    `position:absolute;bottom:-16px;left:50%;transform:translateX(-50%);background:#0b1220;color:${NEON_AMBER};font-size:9px;font-weight:800;padding:1px 5px;border-radius:4px;white-space:nowrap;border:1px solid ${NEON_AMBER}55;`;
  label.textContent = "Store";
  el.appendChild(label);

  return el;
}

const EMPTY_ROUTE: GeoJSON.Feature<GeoJSON.LineString> = {
  type: "Feature",
  properties: {},
  geometry: { type: "LineString", coordinates: [] },
};

/** Adds the two-layer neon glow route (wide blurred underlay + thin bright core) if not already present. */
function ensureRouteLayers(map: maplibregl.Map) {
  if (!map.getSource("route-line")) {
    map.addSource("route-line", { type: "geojson", data: EMPTY_ROUTE });
  }
  if (!map.getLayer("route-line-glow")) {
    map.addLayer({
      id: "route-line-glow",
      type: "line",
      source: "route-line",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": NEON_CYAN, "line-width": 12, "line-opacity": 0.25, "line-blur": 6 },
    });
  }
  if (!map.getLayer("route-line-core")) {
    map.addLayer({
      id: "route-line-core",
      type: "line",
      source: "route-line",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": NEON_CYAN, "line-width": 3.5, "line-opacity": 0.95 },
    });
  }
}

function removeRouteLayers(map: maplibregl.Map) {
  if (map.getLayer("route-line-core")) map.removeLayer("route-line-core");
  if (map.getLayer("route-line-glow")) map.removeLayer("route-line-glow");
  if (map.getSource("route-line")) map.removeSource("route-line");
}

export function DeliveryMap({
  deliveryPartnerLocation,
  customerLocation,
  storeLocation,
  className,
  etaMinutes: etaMinutesProp,
}: DeliveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const riderMarkerRef = useRef<maplibregl.Marker | null>(null);
  const customerMarkerRef = useRef<maplibregl.Marker | null>(null);
  const storeMarkerRef = useRef<maplibregl.Marker | null>(null);
  const prevRiderPosRef = useRef<{ lng: number; lat: number } | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const routeAbortRef = useRef<AbortController | null>(null);
  const lastRoutedAtRef = useRef<{ lng: number; lat: number } | null>(null);
  const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);

  // Initialize map — dark "cyberspace" base style
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/dark",
      center: [customerLocation.longitude, customerLocation.latitude],
      zoom: 14,
      attributionControl: false,
    });

    mapRef.current = map;

    const customerEl = createCustomerMarkerEl(customerLocation.latitude, customerLocation.longitude);
    customerMarkerRef.current = new maplibregl.Marker({ element: customerEl })
      .setLngLat([customerLocation.longitude, customerLocation.latitude])
      .addTo(map);

    const storeEl = createStoreMarkerEl();
    storeMarkerRef.current = new maplibregl.Marker({ element: storeEl })
      .setLngLat([storeLocation.longitude, storeLocation.latitude])
      .addTo(map);

    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([customerLocation.longitude, customerLocation.latitude]);
    bounds.extend([storeLocation.longitude, storeLocation.latitude]);
    map.fitBounds(bounds, { padding: 60, maxZoom: 15 });

    map.on("load", () => ensureRouteLayers(map));

    const style = document.createElement("style");
    style.textContent = `
      @keyframes map-pulse {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
      }
      @keyframes rider-pulse {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1.7); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      routeAbortRef.current?.abort();
      map.remove();
      mapRef.current = null;
      riderMarkerRef.current = null;
      customerMarkerRef.current = null;
      storeMarkerRef.current = null;
      style.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update ETA badge on rider marker when etaMinutes changes
  useEffect(() => {
    if (!riderMarkerRef.current) return;
    const el = riderMarkerRef.current.getElement();
    const existingBadge = el.querySelector(".rider-eta-badge") as HTMLElement | null;

    if (etaMinutesProp != null && etaMinutesProp > 0) {
      if (existingBadge) {
        existingBadge.textContent = `${etaMinutesProp} min`;
      } else {
        const badge = document.createElement("div");
        badge.className = "rider-eta-badge";
        badge.style.cssText =
          `position:absolute;top:-26px;left:50%;transform:translateX(-50%);background:#0b1220;color:${NEON_CYAN};font-size:11px;font-weight:800;padding:2px 9px;border-radius:10px;white-space:nowrap;border:1px solid ${NEON_CYAN}66;box-shadow:0 0 10px ${NEON_CYAN}88;z-index:10;`;
        badge.textContent = `${etaMinutesProp} min`;
        el.appendChild(badge);
      }
    } else if (existingBadge) {
      existingBadge.remove();
    }
  }, [etaMinutesProp]);

  // Animate delivery partner marker
  const animateRider = useCallback(
    (from: { lng: number; lat: number }, to: { lng: number; lat: number }, heading?: number) => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      const duration = 1000;
      const startTime = performance.now();

      function step(now: number) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        const lng = lerp(from.lng, to.lng, eased);
        const lat = lerp(from.lat, to.lat, eased);

        if (riderMarkerRef.current) riderMarkerRef.current.setLngLat([lng, lat]);

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          prevRiderPosRef.current = to;
          animFrameRef.current = null;
        }
      }

      if (riderMarkerRef.current && heading !== undefined) {
        const el = riderMarkerRef.current.getElement();
        const rotationWrapper = el.querySelector(".rider-rotation-wrapper") as HTMLElement | null;
        if (rotationWrapper) rotationWrapper.style.transform = `rotate(${heading}deg)`;
      }

      animFrameRef.current = requestAnimationFrame(step);
    },
    []
  );

  // Update rider position, route line (road-snapped), and camera
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!deliveryPartnerLocation) {
      if (riderMarkerRef.current) {
        riderMarkerRef.current.remove();
        riderMarkerRef.current = null;
        prevRiderPosRef.current = null;
      }
      lastRoutedAtRef.current = null;
      if (map.getSource("route-line")) {
        (map.getSource("route-line") as maplibregl.GeoJSONSource).setData(EMPTY_ROUTE);
      }
      setDistanceRemaining(null);
      return;
    }

    const newPos = { lng: deliveryPartnerLocation.longitude, lat: deliveryPartnerLocation.latitude };
    const dist = haversineDistanceKm(deliveryPartnerLocation, customerLocation);
    setDistanceRemaining(dist);

    // Road-snapped route: only re-fetch when the rider has moved a
    // meaningful distance (~40m) since the last successful fetch, so a
    // steady stream of GPS ticks doesn't hammer the routing API.
    const shouldRefetchRoute =
      !lastRoutedAtRef.current ||
      haversineDistanceKm(
        { latitude: lastRoutedAtRef.current.lat, longitude: lastRoutedAtRef.current.lng },
        deliveryPartnerLocation
      ) > 0.04;

    if (shouldRefetchRoute && map.isStyleLoaded()) {
      routeAbortRef.current?.abort();
      const controller = new AbortController();
      routeAbortRef.current = controller;
      lastRoutedAtRef.current = newPos;

      fetchRoadRoute(deliveryPartnerLocation, customerLocation, controller.signal).then((coords) => {
        if (controller.signal.aborted || !mapRef.current) return;
        ensureRouteLayers(mapRef.current);
        const routeCoords = coords ?? [
          [newPos.lng, newPos.lat],
          [customerLocation.longitude, customerLocation.latitude],
        ];
        const source = mapRef.current.getSource("route-line") as maplibregl.GeoJSONSource | undefined;
        source?.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: routeCoords } });
      });
    }

    if (!riderMarkerRef.current) {
      const riderEl = createRiderMarkerEl(etaMinutesProp);
      riderMarkerRef.current = new maplibregl.Marker({ element: riderEl }).setLngLat([newPos.lng, newPos.lat]).addTo(map);
      prevRiderPosRef.current = newPos;

      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([customerLocation.longitude, customerLocation.latitude]);
      bounds.extend([storeLocation.longitude, storeLocation.latitude]);
      bounds.extend([newPos.lng, newPos.lat]);
      map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    } else {
      const from = prevRiderPosRef.current || newPos;
      animateRider(from, newPos, deliveryPartnerLocation.heading);
      map.flyTo({ center: [newPos.lng, newPos.lat], duration: 1000, essential: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryPartnerLocation]);

  const handleZoomIn = () => mapRef.current?.zoomIn({ duration: 200 });
  const handleZoomOut = () => mapRef.current?.zoomOut({ duration: 200 });

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-cyan-500/20 ${className ?? ""}`}>
      <div ref={containerRef} className="h-[320px] w-full bg-[#0b1220]" />
      {/* Distance remaining overlay — neon HUD chip */}
      {distanceRemaining !== null && (
        <div className="absolute top-3 left-3 rounded-xl border border-cyan-400/30 bg-[#0b1220]/90 px-3 py-1.5 shadow-[0_0_16px_rgba(34,211,238,0.35)] backdrop-blur-sm">
          <p className="text-micro font-bold uppercase tracking-wide text-cyan-300/70">Distance</p>
          <p className="text-body font-black text-cyan-300">
            {distanceRemaining < 1 ? `${Math.round(distanceRemaining * 1000)} m` : `${distanceRemaining.toFixed(1)} km`}
          </p>
        </div>
      )}
      {/* Subtle vignette for depth on the dark map */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.35)_100%)]" />
      {/* Custom zoom controls — neon HUD buttons */}
      <div className="absolute right-3 bottom-6 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleZoomIn}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-[#0b1220]/90 text-lg font-bold text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)] backdrop-blur-sm hover:bg-[#0b1220] active:scale-95 transition"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-[#0b1220]/90 text-lg font-bold text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)] backdrop-blur-sm hover:bg-[#0b1220] active:scale-95 transition"
          aria-label="Zoom out"
        >
          -
        </button>
      </div>
    </div>
  );
}
