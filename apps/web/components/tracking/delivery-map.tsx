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

function createRiderMarkerEl(etaMinutes?: number | null): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "delivery-rider-marker";
  el.style.width = "48px";
  el.style.height = "48px";
  el.style.cursor = "pointer";
  el.style.position = "relative";

  // ETA badge above the marker
  if (etaMinutes != null && etaMinutes > 0) {
    const badge = document.createElement("div");
    badge.className = "rider-eta-badge";
    badge.style.cssText =
      "position:absolute;top:-24px;left:50%;transform:translateX(-50%);background:#ffffff;color:#059669;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.15);z-index:10;";
    badge.textContent = `${etaMinutes} min`;
    el.appendChild(badge);
  }

  // Pulsing emerald ring
  const pulse = document.createElement("div");
  pulse.style.cssText =
    "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:56px;height:56px;border-radius:50%;border:3px solid #059669;animation:rider-pulse 2s ease-out infinite;pointer-events:none;z-index:0;";
  el.appendChild(pulse);

  // Rotation wrapper for heading
  const rotationWrapper = document.createElement("div");
  rotationWrapper.className = "rider-rotation-wrapper";
  rotationWrapper.style.width = "100%";
  rotationWrapper.style.height = "100%";
  rotationWrapper.style.transition = "transform 0.3s ease";
  rotationWrapper.style.position = "relative";
  rotationWrapper.style.zIndex = "1";
  rotationWrapper.innerHTML = `<svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="rider-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
      </filter>
    </defs>
    <circle cx="24" cy="24" r="22" fill="#059669" filter="url(#rider-shadow)"/>
    <circle cx="24" cy="24" r="20" fill="#047857"/>
    <path d="M24 12 L30 30 L24 26 L18 30 Z" fill="#ffffff" stroke="none"/>
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

  // Blue rounded-square with home icon
  el.innerHTML = `<svg viewBox="0 0 44 44" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="dest-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
      </filter>
    </defs>
    <rect x="4" y="4" width="36" height="36" rx="10" fill="#3B82F6" filter="url(#dest-shadow)"/>
    <path d="M22 13 L30 19 V29 H26 V23 H18 V29 H14 V19 Z" fill="#ffffff"/>
  </svg>`;

  // Blue pulse ring
  const pulse = document.createElement("div");
  pulse.style.cssText =
    "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:56px;height:56px;border-radius:50%;background:rgba(59,130,246,0.15);animation:map-pulse 2s ease-out infinite;pointer-events:none;z-index:-1;";
  el.appendChild(pulse);

  // "Your Home" label below
  const label = document.createElement("div");
  label.style.cssText =
    "position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);background:#ffffff;color:#3B82F6;font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.12);";
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
  el.style.width = "24px";
  el.style.height = "24px";
  el.style.cursor = "pointer";
  el.style.position = "relative";
  el.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#6B7280"/>
    <path d="M6 10 L8 7 H16 L18 10 Z M6 10 V17 H18 V10" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
    <rect x="10" y="13" width="4" height="4" fill="#ffffff" rx="0.5"/>
  </svg>`;

  // "Store" label below
  const label = document.createElement("div");
  label.style.cssText =
    "position:absolute;bottom:-16px;left:50%;transform:translateX(-50%);background:#ffffff;color:#6B7280;font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.1);";
  label.textContent = "Store";
  el.appendChild(label);

  return el;
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
  const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: [customerLocation.longitude, customerLocation.latitude],
      zoom: 14,
      attributionControl: false,
    });

    mapRef.current = map;

    // Add customer marker with navigation click handler
    const customerEl = createCustomerMarkerEl(
      customerLocation.latitude,
      customerLocation.longitude
    );
    customerMarkerRef.current = new maplibregl.Marker({ element: customerEl })
      .setLngLat([customerLocation.longitude, customerLocation.latitude])
      .addTo(map);

    // Add store marker
    const storeEl = createStoreMarkerEl();
    storeMarkerRef.current = new maplibregl.Marker({ element: storeEl })
      .setLngLat([storeLocation.longitude, storeLocation.latitude])
      .addTo(map);

    // Fit bounds to include customer and store
    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([customerLocation.longitude, customerLocation.latitude]);
    bounds.extend([storeLocation.longitude, storeLocation.latitude]);
    map.fitBounds(bounds, { padding: 60, maxZoom: 15 });

    // Add route line source after style loads
    map.on("load", () => {
      if (!map.getSource("route-line")) {
        map.addSource("route-line", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: [] },
          },
        });
        map.addLayer({
          id: "route-line-layer",
          type: "line",
          source: "route-line",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#059669",
            "line-width": 4,
            "line-opacity": 0.8,
          },
        });
      }
    });

    // Add keyframe animations
    const style = document.createElement("style");
    style.textContent = `
      @keyframes map-pulse {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
      }
      @keyframes rider-pulse {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; border-color: #059669; }
        100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; border-color: #059669; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
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
          "position:absolute;top:-24px;left:50%;transform:translateX(-50%);background:#ffffff;color:#059669;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.15);z-index:10;";
        badge.textContent = `${etaMinutesProp} min`;
        el.appendChild(badge);
      }
    } else {
      if (existingBadge) {
        existingBadge.remove();
      }
    }
  }, [etaMinutesProp]);

  // Animate delivery partner marker
  const animateRider = useCallback(
    (from: { lng: number; lat: number }, to: { lng: number; lat: number }, heading?: number) => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      const duration = 1000; // 1 second
      const startTime = performance.now();

      function step(now: number) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - t, 3);

        const lng = lerp(from.lng, to.lng, eased);
        const lat = lerp(from.lat, to.lat, eased);

        if (riderMarkerRef.current) {
          riderMarkerRef.current.setLngLat([lng, lat]);
        }

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          prevRiderPosRef.current = to;
          animFrameRef.current = null;
        }
      }

      // Rotate the inner wrapper element based on heading
      if (riderMarkerRef.current && heading !== undefined) {
        const el = riderMarkerRef.current.getElement();
        const rotationWrapper = el.querySelector(".rider-rotation-wrapper") as HTMLElement | null;
        if (rotationWrapper) {
          rotationWrapper.style.transform = `rotate(${heading}deg)`;
        }
      }

      animFrameRef.current = requestAnimationFrame(step);
    },
    []
  );

  // Update rider position with animation
  useEffect(() => {
    if (!mapRef.current) return;

    if (!deliveryPartnerLocation) {
      // Remove rider marker if no location
      if (riderMarkerRef.current) {
        riderMarkerRef.current.remove();
        riderMarkerRef.current = null;
        prevRiderPosRef.current = null;
      }
      // Remove route line
      if (mapRef.current.getSource("route-line")) {
        mapRef.current.removeLayer("route-line-layer");
        mapRef.current.removeSource("route-line");
      }
      setDistanceRemaining(null);
      return;
    }

    const newPos = {
      lng: deliveryPartnerLocation.longitude,
      lat: deliveryPartnerLocation.latitude,
    };

    // Calculate distance remaining
    const dist = haversineDistanceKm(deliveryPartnerLocation, customerLocation);
    setDistanceRemaining(dist);

    // Update route line from rider to customer
    const routeCoords: [number, number][] = [
      [newPos.lng, newPos.lat],
      [customerLocation.longitude, customerLocation.latitude],
    ];

    if (mapRef.current.getSource("route-line")) {
      (mapRef.current.getSource("route-line") as maplibregl.GeoJSONSource).setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: routeCoords },
      });
    } else if (mapRef.current.isStyleLoaded()) {
      mapRef.current.addSource("route-line", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: routeCoords },
        },
      });
      mapRef.current.addLayer({
        id: "route-line-layer",
        type: "line",
        source: "route-line",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#059669",
          "line-width": 4,
          "line-opacity": 0.8,
        },
      });
    }

    if (!riderMarkerRef.current) {
      // Create rider marker for the first time with ETA
      const riderEl = createRiderMarkerEl(etaMinutesProp);
      riderMarkerRef.current = new maplibregl.Marker({ element: riderEl })
        .setLngLat([newPos.lng, newPos.lat])
        .addTo(mapRef.current);
      prevRiderPosRef.current = newPos;

      // Refit bounds to include rider
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([customerLocation.longitude, customerLocation.latitude]);
      bounds.extend([storeLocation.longitude, storeLocation.latitude]);
      bounds.extend([newPos.lng, newPos.lat]);
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    } else {
      // Animate from previous to new position
      const from = prevRiderPosRef.current || newPos;
      animateRider(from, newPos, deliveryPartnerLocation.heading);

      // Use flyTo for smoother camera transitions
      mapRef.current.flyTo({
        center: [newPos.lng, newPos.lat],
        duration: 1000,
        essential: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryPartnerLocation]);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn({ duration: 200 });
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut({ duration: 200 });
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className ?? ""}`}>
      <div ref={containerRef} className="h-[320px] w-full" />
      {/* Distance remaining overlay */}
      {distanceRemaining !== null && (
        <div className="absolute top-3 left-3 rounded-xl bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm dark:bg-neutral-900/95">
          <p className="text-micro font-bold uppercase tracking-wide text-neutral-500">Distance</p>
          <p className="text-body font-black text-neutral-900 dark:text-white">
            {distanceRemaining < 1
              ? `${Math.round(distanceRemaining * 1000)} m`
              : `${distanceRemaining.toFixed(1)} km`}
          </p>
        </div>
      )}
      {/* Subtle gradient overlay at bottom for depth */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent rounded-b-2xl" />
      {/* Custom zoom controls */}
      <div className="absolute right-3 bottom-6 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleZoomIn}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg text-neutral-800 text-lg font-bold hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg text-neutral-800 text-lg font-bold hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
          aria-label="Zoom out"
        >
          -
        </button>
      </div>
    </div>
  );
}
