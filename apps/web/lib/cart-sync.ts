"use client";

/**
 * CartSyncQueue — Background cart synchronization for cross-device persistence.
 *
 * Design principles:
 * 1. NEVER block the UI — all cart operations are instant (optimistic)
 * 2. Sync happens silently in the background
 * 3. Failed syncs retry with exponential backoff (max 3 attempts)
 * 4. Debounces mutations to batch multiple rapid changes (1.5s window)
 * 5. Only syncs when the user is authenticated (anonymous carts stay local-only)
 *
 * Architecture:
 * - Cart Provider handles UI state (instant, optimistic)
 * - This queue records mutations and syncs them to /api/cart/sync
 * - On conflict: server state wins (reconciled on next hydration)
 * - On offline: mutations queue until connectivity returns
 *
 * Usage:
 *   cartSyncQueue.push({ type: "add", productId: "...", quantity: 1 });
 *   cartSyncQueue.push({ type: "remove", productId: "..." });
 *   cartSyncQueue.push({ type: "update", productId: "...", quantity: 3 });
 *   cartSyncQueue.push({ type: "clear" });
 */

type CartMutation =
  | { type: "add"; productId: string; quantity: number }
  | { type: "remove"; productId: string }
  | { type: "update"; productId: string; quantity: number }
  | { type: "clear" };

type SyncStatus = "idle" | "syncing" | "pending" | "error";

type SyncListener = (status: SyncStatus) => void;

const SYNC_DEBOUNCE_MS = 1500;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;
const QUEUE_STORAGE_KEY = "msm-cart-sync-queue";

class CartSyncQueue {
  private queue: CartMutation[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;
  private _status: SyncStatus = "idle";
  private listeners = new Set<SyncListener>();
  private _authenticated = false;

  constructor() {
    // Restore pending mutations from localStorage (survived page reload)
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
        if (saved) {
          this.queue = JSON.parse(saved);
          if (this.queue.length > 0) {
            this.setStatus("pending");
            this.scheduleSync();
          }
        }
      } catch {
        localStorage.removeItem(QUEUE_STORAGE_KEY);
      }

      // Sync on connectivity restored
      window.addEventListener("online", () => {
        if (this.queue.length > 0) this.scheduleSync();
      });
    }
  }

  /** Set whether the user is authenticated (only sync when logged in) */
  setAuthenticated(authenticated: boolean) {
    this._authenticated = authenticated;
    if (authenticated && this.queue.length > 0) {
      this.scheduleSync();
    }
  }

  /** Push a mutation to the queue */
  push(mutation: CartMutation) {
    // Optimize: collapse redundant mutations for same product
    if (mutation.type === "clear") {
      this.queue = [mutation];
    } else if (mutation.type === "remove") {
      // Remove any pending add/update for this product
      this.queue = this.queue.filter(
        (m) => m.type === "clear" || !("productId" in m) || m.productId !== mutation.productId
      );
      this.queue.push(mutation);
    } else if (mutation.type === "update") {
      // Replace existing update for same product
      const idx = this.queue.findIndex(
        (m) => "productId" in m && m.productId === mutation.productId && m.type === "update"
      );
      if (idx >= 0) {
        this.queue[idx] = mutation;
      } else {
        this.queue.push(mutation);
      }
    } else {
      this.queue.push(mutation);
    }

    this.persist();
    this.setStatus("pending");
    this.scheduleSync();
  }

  /** Subscribe to sync status changes */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this._status); // Emit current status immediately
    return () => { this.listeners.delete(listener); };
  }

  /** Get current sync status */
  get status(): SyncStatus {
    return this._status;
  }

  /** Get number of pending mutations */
  get pendingCount(): number {
    return this.queue.length;
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private setStatus(status: SyncStatus) {
    if (this._status === status) return;
    this._status = status;
    this.listeners.forEach((l) => l(status));
  }

  private persist() {
    try {
      if (this.queue.length > 0) {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
      } else {
        localStorage.removeItem(QUEUE_STORAGE_KEY);
      }
    } catch {
      // Storage full or unavailable — queue stays in memory only
    }
  }

  private scheduleSync() {
    if (!this._authenticated) return;
    if (!navigator.onLine) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), SYNC_DEBOUNCE_MS);
  }

  private async flush() {
    if (this.queue.length === 0) {
      this.setStatus("idle");
      return;
    }
    if (!navigator.onLine || !this._authenticated) {
      this.setStatus("pending");
      return;
    }

    this.setStatus("syncing");
    const batch = [...this.queue];

    try {
      const res = await fetch("/api/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mutations: batch }),
      });

      if (res.ok) {
        // Remove synced mutations from queue
        this.queue = this.queue.slice(batch.length);
        this.persist();
        this.retryCount = 0;
        this.setStatus(this.queue.length > 0 ? "pending" : "idle");

        // If more mutations accumulated during sync, schedule another flush
        if (this.queue.length > 0) this.scheduleSync();
      } else if (res.status === 401) {
        // Not authenticated — stop trying
        this._authenticated = false;
        this.setStatus("pending");
      } else {
        throw new Error(`Sync failed: ${res.status}`);
      }
    } catch {
      this.retryCount++;
      if (this.retryCount >= MAX_RETRIES) {
        this.setStatus("error");
        // Give up for now; will retry on next push or online event
        this.retryCount = 0;
      } else {
        this.setStatus("pending");
        // Exponential backoff: 1s, 2s, 4s
        const delay = RETRY_BASE_MS * Math.pow(2, this.retryCount - 1);
        setTimeout(() => this.flush(), delay);
      }
    }
  }
}

// Singleton instance
export const cartSyncQueue = new CartSyncQueue();
