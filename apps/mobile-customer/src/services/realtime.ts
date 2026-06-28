/**
 * WebSocket Real-Time Service
 *
 * Provides real-time order tracking via WebSocket with:
 * - Exponential backoff reconnection
 * - Automatic fallback to REST polling when WebSocket fails
 * - AppState-aware connection management
 * - Duplicate connection prevention
 * - Clean teardown on disconnect
 *
 * Protocol:
 *   Client → Server: { type: "JOIN_ORDER", orderId }
 *   Server → Client: { type: "ORDER_UPDATE", orderId, status, riderLat, riderLng, eta, timestamp }
 */

import { AppState, type AppStateStatus } from "react-native";
import { API_BASE_URL } from "../config/api";

// ============================================
// Types
// ============================================

export interface OrderUpdateMessage {
  type: "ORDER_UPDATE";
  orderId: string;
  status: string;
  riderLat: number | null;
  riderLng: number | null;
  eta: number | null;
  timestamp: string;
}

export type ConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected" | "polling";

export type OnMessageCallback = (message: OrderUpdateMessage) => void;
export type OnStateChangeCallback = (state: ConnectionState) => void;

// ============================================
// Configuration
// ============================================

const CONFIG = {
  /** Initial reconnect delay in ms */
  BASE_RECONNECT_DELAY: 1000,
  /** Maximum reconnect delay in ms */
  MAX_RECONNECT_DELAY: 30000,
  /** Maximum reconnect attempts before permanent fallback to polling */
  MAX_RECONNECT_ATTEMPTS: 5,
  /** Polling interval for fallback (ms) */
  POLL_INTERVAL: 6000,
  /** WebSocket retry interval after falling back to polling (ms) */
  WS_RETRY_INTERVAL: 15000,
  /** Throttle interval for rapid updates (ms) — prevents jitter */
  UPDATE_THROTTLE: 300,
} as const;

// ============================================
// WebSocket URL derivation
// ============================================

function getWebSocketUrl(): string {
  // Convert HTTP(S) API URL to WS(S)
  const base = API_BASE_URL.replace(/\/api\/?$/, "");
  const wsUrl = base.replace(/^http/, "ws");
  return `${wsUrl}/realtime`;
}

// ============================================
// RealtimeTrackingService
// ============================================

export class RealtimeTrackingService {
  private ws: WebSocket | null = null;
  private orderId: string | null = null;
  private onMessage: OnMessageCallback | null = null;
  private onStateChange: OnStateChangeCallback | null = null;

  private state: ConnectionState = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private wsRetryTimer: ReturnType<typeof setInterval> | null = null;
  private appStateSubscription: { remove: () => void } | null = null;
  private lastUpdateTimestamp = 0;
  private isDestroyed = false;

  // REST fallback fetch function (injected)
  private fetchTrackingREST: ((orderId: string) => Promise<OrderUpdateMessage | null>) | null = null;

  // ============================
  // Public API
  // ============================

  /**
   * Connect to real-time tracking for an order.
   * If WebSocket fails, automatically falls back to REST polling.
   */
  connect(
    orderId: string,
    onMessage: OnMessageCallback,
    onStateChange?: OnStateChangeCallback,
    fetchFallback?: (orderId: string) => Promise<OrderUpdateMessage | null>
  ): void {
    // Prevent duplicate connections
    if (this.orderId === orderId && this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    // Clean up any existing connection
    this.cleanup();

    this.orderId = orderId;
    this.onMessage = onMessage;
    this.onStateChange = onStateChange || null;
    this.fetchTrackingREST = fetchFallback || null;
    this.isDestroyed = false;
    this.reconnectAttempts = 0;

    // Listen for app state changes
    this.appStateSubscription = AppState.addEventListener("change", this.handleAppState);

    // Attempt WebSocket connection
    this.connectWebSocket();
  }

  /**
   * Disconnect and clean up all resources.
   * Call this on screen unmount.
   */
  disconnect(): void {
    this.isDestroyed = true;
    this.cleanup();
  }

  /**
   * Get current connection state.
   */
  getState(): ConnectionState {
    return this.state;
  }

  // ============================
  // WebSocket Connection
  // ============================

  private connectWebSocket(): void {
    if (this.isDestroyed || !this.orderId) return;

    this.setState("connecting");

    try {
      const url = getWebSocketUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        if (this.isDestroyed) {
          this.ws?.close();
          return;
        }

        this.reconnectAttempts = 0;
        this.setState("connected");

        // Stop polling fallback if it was active
        this.stopPolling();
        this.stopWsRetry();

        // Join the order channel
        this.ws?.send(JSON.stringify({
          type: "JOIN_ORDER",
          orderId: this.orderId,
        }));
      };

      this.ws.onmessage = (event) => {
        if (this.isDestroyed) return;

        try {
          const data = JSON.parse(event.data) as OrderUpdateMessage;

          if (data.type === "ORDER_UPDATE" && data.orderId === this.orderId) {
            // Throttle rapid updates to prevent UI jitter
            const now = Date.now();
            if (now - this.lastUpdateTimestamp < CONFIG.UPDATE_THROTTLE) {
              return;
            }
            this.lastUpdateTimestamp = now;

            this.onMessage?.(data);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      this.ws.onerror = () => {
        // onerror is always followed by onclose, so handle reconnect there
      };

      this.ws.onclose = () => {
        if (this.isDestroyed) return;
        this.ws = null;
        this.handleDisconnect();
      };
    } catch {
      // WebSocket constructor can throw if URL is invalid
      this.ws = null;
      this.handleDisconnect();
    }
  }

  // ============================
  // Reconnection with Exponential Backoff
  // ============================

  private handleDisconnect(): void {
    if (this.isDestroyed) return;

    this.reconnectAttempts++;

    if (this.reconnectAttempts <= CONFIG.MAX_RECONNECT_ATTEMPTS) {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s (capped at 30s)
      const delay = Math.min(
        CONFIG.BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1),
        CONFIG.MAX_RECONNECT_DELAY
      );

      this.setState("reconnecting");

      this.reconnectTimer = setTimeout(() => {
        if (!this.isDestroyed) {
          this.connectWebSocket();
        }
      }, delay);
    } else {
      // Exhausted retries — fall back to polling permanently
      this.startPollingFallback();
    }
  }

  // ============================
  // Polling Fallback
  // ============================

  private startPollingFallback(): void {
    if (this.isDestroyed || !this.orderId) return;

    this.setState("polling");

    // Start REST polling
    this.poll(); // Immediate first poll
    this.pollTimer = setInterval(() => this.poll(), CONFIG.POLL_INTERVAL);

    // Periodically retry WebSocket in background
    this.wsRetryTimer = setInterval(() => {
      if (!this.isDestroyed) {
        this.reconnectAttempts = 0; // Reset for retry
        this.connectWebSocket();
      }
    }, CONFIG.WS_RETRY_INTERVAL);
  }

  private async poll(): Promise<void> {
    if (this.isDestroyed || !this.orderId || !this.fetchTrackingREST) return;

    try {
      const data = await this.fetchTrackingREST(this.orderId);
      if (data && !this.isDestroyed) {
        // Throttle
        const now = Date.now();
        if (now - this.lastUpdateTimestamp >= CONFIG.UPDATE_THROTTLE) {
          this.lastUpdateTimestamp = now;
          this.onMessage?.(data);
        }
      }
    } catch {
      // Silently fail — will retry next interval
    }
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private stopWsRetry(): void {
    if (this.wsRetryTimer) {
      clearInterval(this.wsRetryTimer);
      this.wsRetryTimer = null;
    }
  }

  // ============================
  // App State Management
  // ============================

  private handleAppState = (nextState: AppStateStatus): void => {
    if (this.isDestroyed) return;

    if (nextState === "active") {
      // App came to foreground — reconnect if needed
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.reconnectAttempts = 0;
        this.connectWebSocket();
      }
    } else if (nextState === "background") {
      // App went to background — close socket to save battery
      this.ws?.close();
      this.ws = null;
      this.stopPolling();
      this.stopWsRetry();
      this.clearReconnectTimer();
    }
  };

  // ============================
  // State Management
  // ============================

  private setState(state: ConnectionState): void {
    if (this.state === state) return;
    this.state = state;
    this.onStateChange?.(state);
  }

  // ============================
  // Cleanup
  // ============================

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private cleanup(): void {
    this.clearReconnectTimer();
    this.stopPolling();
    this.stopWsRetry();

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    this.orderId = null;
    this.onMessage = null;
    this.onStateChange = null;
    this.fetchTrackingREST = null;
    this.setState("disconnected");
  }
}

// ============================================
// Singleton instance for app-wide use
// ============================================

let instance: RealtimeTrackingService | null = null;

export function getRealtimeService(): RealtimeTrackingService {
  if (!instance) {
    instance = new RealtimeTrackingService();
  }
  return instance;
}
