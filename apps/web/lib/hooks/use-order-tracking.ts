/**
 * USE ORDER TRACKING — Client-side hook for real-time order updates.
 *
 * Connects to the event-driven SSE gateway at /api/realtime/orders/{orderId}.
 * This endpoint reads from Redis Streams (NOT the database).
 *
 * Fallback chain:
 * 1. SSE to /api/realtime/orders/{id} (Redis-backed, no DB polling)
 * 2. REST polling to /api/orders/{id}/tracking (only if SSE completely fails)
 *
 * Features:
 * - Auto-reconnect with exponential backoff (1s → 16s max)
 * - Event deduplication via eventId
 * - Selective state updates (no full re-renders)
 * - Auto-disconnect on terminal status (DELIVERED/CANCELLED)
 * - Cleanup on unmount / page change
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================
// TYPES
// ============================================================

export type TrackingUpdate = {
  type: string;
  orderId: string;
  status?: string;
  deliveryPartnerLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    updatedAt?: string;
  } | null;
  eta?: number;
  riderName?: string;
  riderPhone?: string;
  timestamp?: number;
  /** For location events */
  location?: {
    latitude: number;
    longitude: number;
    heading?: number;
  };
  distanceMetres?: number | null;
};

export type ConnectionState = "connecting" | "connected" | "disconnected" | "polling";

type UseOrderTrackingOptions = {
  orderId: string;
  enabled?: boolean;
  onUpdate?: (update: TrackingUpdate) => void;
  /** REST polling interval in ms (last-resort fallback). Default 10000 */
  pollInterval?: number;
};

// ============================================================
// CONSTANTS
// ============================================================

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 16000;

// ============================================================
// HOOK
// ============================================================

export function useOrderTracking({
  orderId,
  enabled = true,
  onUpdate,
  pollInterval = 10000,
}: UseOrderTrackingOptions) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [latestUpdate, setLatestUpdate] = useState<TrackingUpdate | null>(null);

  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const onUpdateRef = useRef(onUpdate);
  const lastEventIdRef = useRef<string | null>(null);
  onUpdateRef.current = onUpdate;

  // ─── DEDUPLICATION ───
  const isDuplicate = useCallback((eventId?: string): boolean => {
    if (!eventId) return false;
    if (eventId === lastEventIdRef.current) return true;
    lastEventIdRef.current = eventId;
    return false;
  }, []);

  // ─── PROCESS UPDATE ───
  const processUpdate = useCallback(
    (update: TrackingUpdate) => {
      if (!mountedRef.current) return;

      // Normalize: map RIDER_LOCATION_UPDATED location field to deliveryPartnerLocation
      if (update.type === "RIDER_LOCATION_UPDATED" && update.location) {
        update.deliveryPartnerLocation = {
          latitude: update.location.latitude,
          longitude: update.location.longitude,
          heading: update.location.heading,
          updatedAt: new Date(update.timestamp || Date.now()).toISOString(),
        };
      }

      setLatestUpdate(update);
      onUpdateRef.current?.(update);
    },
    []
  );

  // ─── REST POLLING FALLBACK (last resort) ───
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    setConnectionState("polling");

    async function poll() {
      if (!mountedRef.current) return;
      try {
        const res = await fetch(`/api/orders/${orderId}/tracking`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        processUpdate({
          type: "POLL_UPDATE",
          orderId,
          status: data.status,
          deliveryPartnerLocation: data.deliveryPartnerLocation,
          timestamp: Date.now(),
        });
      } catch {
        // Ignore — will retry next interval
      }
    }

    poll();
    pollingRef.current = setInterval(poll, pollInterval);
  }, [orderId, pollInterval, processUpdate]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // ─── SSE CONNECTION TO EVENT GATEWAY ───
  const connectSSE = useCallback(() => {
    if (!mountedRef.current || !enabled) return;

    setConnectionState("connecting");
    let messageCount = 0;

    // Connect to the NEW event-driven SSE endpoint (Redis-backed, zero DB polling)
    const source = new EventSource(`/api/realtime/orders/${orderId}`);

    source.onopen = () => {
      if (!mountedRef.current) {
        source.close();
        return;
      }
      setConnectionState("connected");
      retryCountRef.current = 0;
      stopPolling();
    };

    source.onmessage = (event) => {
      if (!mountedRef.current) {
        source.close();
        return;
      }
      messageCount++;

      try {
        const parsed = JSON.parse(event.data) as TrackingUpdate & {
          _eventId?: string;
          terminal?: boolean;
        };

        // Skip connection confirmation events
        if (parsed.type === "CONNECTED") return;

        // Deduplicate
        if (isDuplicate(parsed._eventId)) return;

        // Process the event
        processUpdate({ ...parsed, orderId });

        // Auto-disconnect on terminal status
        if (parsed.terminal || (parsed.status && ["DELIVERED", "CANCELLED"].includes(parsed.status))) {
          source.close();
          setConnectionState("disconnected");
          return;
        }
      } catch {
        // Ignore parse errors
      }
    };

    source.onerror = () => {
      source.close();
      if (!mountedRef.current) return;

      setConnectionState("disconnected");

      // If closed after only the initial message (Vercel single-payload mode on old endpoint)
      // Fall to polling. But our new endpoint should maintain the connection.
      if (messageCount <= 1) {
        // Likely a Vercel function timeout or network issue
        // Try SSE again with backoff before falling to polling
        if (retryCountRef.current < 2) {
          const delay = BASE_DELAY_MS * Math.pow(2, retryCountRef.current);
          retryCountRef.current++;
          retryTimerRef.current = setTimeout(connectSSE, delay);
          return;
        }
        startPolling();
        return;
      }

      // SSE was working but dropped — reconnect with backoff
      if (retryCountRef.current < MAX_RETRIES) {
        const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCountRef.current), MAX_DELAY_MS);
        retryCountRef.current++;
        retryTimerRef.current = setTimeout(connectSSE, delay);
      } else {
        // Exhausted retries — fall back to REST polling
        startPolling();
      }
    };

    // Return cleanup for the effect
    return () => {
      source.close();
    };
  }, [orderId, enabled, processUpdate, isDuplicate, startPolling, stopPolling]);

  // ─── MAIN EFFECT ───
  useEffect(() => {
    mountedRef.current = true;

    if (!enabled || !orderId) {
      setConnectionState("disconnected");
      return;
    }

    // Connect to event-driven SSE gateway
    const closeSSE = connectSSE();

    return () => {
      mountedRef.current = false;
      closeSSE?.();
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      stopPolling();
    };
  }, [orderId, enabled, connectSSE, stopPolling]);

  // ─── MANUAL RECONNECT ───
  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    stopPolling();
    connectSSE();
  }, [connectSSE, stopPolling]);

  return {
    connectionState,
    latestUpdate,
    reconnect,
  };
}
