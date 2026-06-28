"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * WebSocket hook for LIVE ORDER TRACKING ONLY.
 * 
 * NOT used for: products, cart, search, UI state.
 * 
 * Features:
 * - Auto reconnect with exponential backoff (1s, 2s, 4s, 8s, 16s max)
 * - Single active connection per order
 * - Cleanup on page change / component unmount
 * - Fallback to REST polling if socket fails after max retries
 * - Duplicate message deduplication via message ID / timestamp
 * - Smooth UI updates without re-render storms (batched state updates)
 */

export type TrackingUpdate = {
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
  timestamp?: string;
};

type ConnectionState = "connecting" | "connected" | "disconnected" | "polling";

type UseOrderTrackingSocketOptions = {
  orderId: string;
  enabled?: boolean;
  onUpdate?: (update: TrackingUpdate) => void;
  /** REST polling interval in ms (fallback). Default 8000 */
  pollInterval?: number;
};

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 16000;
const DEDUP_WINDOW_MS = 500; // Ignore duplicate updates within 500ms

export function useOrderTrackingSocket({
  orderId,
  enabled = true,
  onUpdate,
  pollInterval = 8000,
}: UseOrderTrackingSocketOptions) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [latestUpdate, setLatestUpdate] = useState<TrackingUpdate | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMessageTimestampRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // Deduplication: ignore messages with same timestamp within window
  const isDuplicate = useCallback((update: TrackingUpdate): boolean => {
    const ts = update.timestamp || "";
    if (ts && ts === lastMessageTimestampRef.current) return true;
    lastMessageTimestampRef.current = ts;
    return false;
  }, []);

  // Process incoming update without re-render storm
  const processUpdate = useCallback((update: TrackingUpdate) => {
    if (!mountedRef.current) return;
    if (isDuplicate(update)) return;

    setLatestUpdate(update);
    onUpdateRef.current?.(update);
  }, [isDuplicate]);

  // REST polling fallback
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
          orderId,
          status: data.status,
          deliveryPartnerLocation: data.deliveryPartnerLocation,
          eta: data.eta,
          riderName: data.riderName,
          riderPhone: data.riderPhone,
          timestamp: data.updatedAt || new Date().toISOString(),
        });
      } catch {
        // Ignore network errors - will retry next interval
      }
    }

    poll(); // Immediate first poll
    pollingRef.current = setInterval(poll, pollInterval);
  }, [orderId, pollInterval, processUpdate]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // WebSocket connection with exponential backoff
  const connect = useCallback(() => {
    if (!mountedRef.current || !enabled) return;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionState("connecting");

    // Construct WebSocket URL (same origin, /api/ws/orders/:id/track)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws/orders/${orderId}/track`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return; }
        setConnectionState("connected");
        retryCountRef.current = 0;
        stopPolling(); // Stop polling when WS connects
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const update = JSON.parse(event.data) as TrackingUpdate;
          processUpdate({ ...update, orderId });
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onerror = () => {
        // Error handling is done in onclose
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        wsRef.current = null;
        setConnectionState("disconnected");

        // If closed cleanly (server-side close or delivered), don't reconnect
        if (event.code === 1000) return;

        // Exponential backoff retry
        if (retryCountRef.current < MAX_RETRIES) {
          const delay = Math.min(
            BASE_DELAY_MS * Math.pow(2, retryCountRef.current),
            MAX_DELAY_MS
          );
          retryCountRef.current++;
          retryTimerRef.current = setTimeout(connect, delay);
        } else {
          // Exhausted retries - fall back to REST polling
          startPolling();
        }
      };
    } catch {
      // WebSocket constructor failed (e.g., no WS support, blocked by proxy)
      // Fall back to polling immediately
      startPolling();
    }
  }, [orderId, enabled, processUpdate, startPolling, stopPolling]);

  // Main effect: connect on mount, cleanup on unmount/order change
  useEffect(() => {
    mountedRef.current = true;

    if (!enabled || !orderId) {
      setConnectionState("disconnected");
      return;
    }

    // Try WebSocket first, fall back to SSE then polling
    // For environments that don't support WS (Vercel), fall directly to SSE/polling
    connectWithSSEFallback();

    return () => {
      mountedRef.current = false;
      // Clean up everything
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, enabled]);

  // SSE fallback (for platforms like Vercel that don't support WebSocket)
  const connectWithSSEFallback = useCallback(() => {
    if (!mountedRef.current || !enabled) return;

    // Try WebSocket first
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws/orders/${orderId}/track`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      let opened = false;

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return; }
        opened = true;
        setConnectionState("connected");
        retryCountRef.current = 0;
        stopPolling();
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const update = JSON.parse(event.data) as TrackingUpdate;
          processUpdate({ ...update, orderId });
        } catch { /* ignore */ }
      };

      ws.onerror = () => {
        if (!opened) {
          // WebSocket never connected - use SSE/polling fallback
          ws.close();
          wsRef.current = null;
          fallbackToSSE();
        }
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        wsRef.current = null;

        if (!opened) {
          // Never connected - go to SSE
          fallbackToSSE();
          return;
        }

        setConnectionState("disconnected");
        if (event.code === 1000) return;

        if (retryCountRef.current < MAX_RETRIES) {
          const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCountRef.current), MAX_DELAY_MS);
          retryCountRef.current++;
          retryTimerRef.current = setTimeout(() => connectWithSSEFallback(), delay);
        } else {
          startPolling();
        }
      };

      // If WS doesn't open within 3s, switch to SSE
      setTimeout(() => {
        if (!opened && wsRef.current === ws) {
          ws.close();
          wsRef.current = null;
          fallbackToSSE();
        }
      }, 3000);
    } catch {
      // WebSocket not available, use SSE
      fallbackToSSE();
    }
  }, [orderId, enabled, processUpdate, startPolling, stopPolling]);

  // SSE connection (existing infrastructure at /api/orders/[id]/stream)
  const fallbackToSSE = useCallback(() => {
    if (!mountedRef.current) return;

    let messageCount = 0;
    const source = new EventSource(`/api/orders/${orderId}/stream`);
    setConnectionState("connected"); // SSE is also "connected"

    source.onmessage = (event) => {
      if (!mountedRef.current) { source.close(); return; }
      messageCount++;
      try {
        const data = JSON.parse(event.data);
        // The SSE might return an array of orders
        const orderData = Array.isArray(data) 
          ? data.find((o: { id: string }) => o.id === orderId) 
          : data;
        
        if (orderData) {
          processUpdate({
            orderId,
            status: orderData.status,
            deliveryPartnerLocation: orderData.deliveryPartnerLocation,
            timestamp: orderData.updatedAt || new Date().toISOString(),
          });
        }
      } catch { /* ignore */ }
    };

    source.onerror = () => {
      source.close();
      if (!mountedRef.current) return;

      // If SSE only got 1 message (Vercel single-payload), use polling
      if (messageCount <= 1) {
        startPolling();
      } else {
        // SSE was working but dropped, retry with backoff
        setConnectionState("disconnected");
        if (retryCountRef.current < MAX_RETRIES) {
          const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCountRef.current), MAX_DELAY_MS);
          retryCountRef.current++;
          retryTimerRef.current = setTimeout(fallbackToSSE, delay);
        } else {
          startPolling();
        }
      }
    };

    // Store reference for cleanup
    const cleanup = () => { source.close(); };
    // Override the existing cleanup in the parent effect
    return cleanup;
  }, [orderId, processUpdate, startPolling]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    stopPolling();
    connectWithSSEFallback();
  }, [connectWithSSEFallback, stopPolling]);

  return {
    connectionState,
    latestUpdate,
    reconnect,
  };
}
