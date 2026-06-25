"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type LatLng = { latitude: number; longitude: number };

interface DeliveryMapProps {
  deliveryPartnerLocation: (LatLng & { heading?: number }) | null;
  customerLocation: LatLng;
  storeLocation: LatLng;
  className?: string;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function createRiderMarkerEl(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "delivery-rider-marker";
  el.style.width = "40px";
  el.style.height = "40px";
  el.style.cursor = "pointer";
  el.innerHTML = `<svg viewBox="0 0 40 40" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" fill="#4caf50" stroke="#ffffff" stroke-width="3"/>
    <path d="M20 10 L26 26 L20 22 L14 26 Z" fill="#ffffff" stroke="none"/>
  </svg>`;
  return el;
}

function createCustomerMarkerEl(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "delivery-customer-marker";
  el.style.width = "32px";
  el.style.height = "40px";
  el.style.cursor = "pointer";
  el.innerHTML = `<svg viewBox="0 0 32 40" width="32" height="40" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C8 0 2 6 2 13.5C2 24 16 40 16 40S30 24 30 13.5C30 6 24 0 16 0Z" fill="#1976d2"/>
    <circle cx="16" cy="13.5" r="6" fill="#ffffff"/>
  </svg>`;
  // Add pulse animation
  const pulse = document.createElement("div");
  pulse.style.cssText =
    "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:48px;height:48px;border-radius:50%;background:rgba(25,118,210,0.2);animation:map-pulse 2s ease-out infinite;pointer-events:none;z-index:-1;";
  el.style.position = "relative";
  el.appendChild(pulse);
  return el;
}

function createStoreMarkerEl(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "delivery-store-marker";
  el.style.width = "32px";
  el.style.height = "32px";
  el.style.cursor = "pointer";
  el.innerHTML = `<svg viewBox="0 0 32 32" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="14" width="24" height="16" rx="2" fill="#ff9800" stroke="#ffffff" stroke-width="2"/>
    <polygon points="2,14 16,4 30,14" fill="#ff9800" stroke="#ffffff" stroke-width="2"/>
    <rect x="13" y="20" width="6" height="10" fill="#ffffff" rx="1"/>
  </svg>`;
  return el;
}

export function DeliveryMap({
  deliveryPartnerLocation,
  customerLocation,
  storeLocation,
  className,
}: DeliveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const riderMarkerRef = useRef<maplibregl.Marker | null>(null);
  const customerMarkerRef = useRef<maplibregl.Marker | null>(null);
  const storeMarkerRef = useRef<maplibregl.Marker | null>(null);
  const prevRiderPosRef = useRef<{ lng: number; lat: number } | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "/map-style.json",
      center: [customerLocation.longitude, customerLocation.latitude],
      zoom: 14,
      attributionControl: false,
    });

    mapRef.current = map;

    // Add customer marker
    const customerEl = createCustomerMarkerEl();
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

    // Add pulse keyframe animation style
    const style = document.createElement("style");
    style.textContent = `
      @keyframes map-pulse {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
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

      // Rotate the marker element based on heading
      if (riderMarkerRef.current && heading !== undefined) {
        const el = riderMarkerRef.current.getElement();
        el.style.transform = `${el.style.transform.replace(/rotate\([^)]*\)/, "")} rotate(${heading}deg)`;
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
      return;
    }

    const newPos = {
      lng: deliveryPartnerLocation.longitude,
      lat: deliveryPartnerLocation.latitude,
    };

    if (!riderMarkerRef.current) {
      // Create rider marker for the first time
      const riderEl = createRiderMarkerEl();
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

      // Pan to keep rider in view
      mapRef.current.panTo([newPos.lng, newPos.lat], { duration: 1000 });
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
      <div ref={containerRef} className="h-[280px] w-full" />
      {/* Custom zoom controls */}
      <div className="absolute right-3 bottom-3 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleZoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md text-neutral-700 text-lg font-bold hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md text-neutral-700 text-lg font-bold hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
          aria-label="Zoom out"
        >
          -
        </button>
      </div>
    </div>
  );
}
