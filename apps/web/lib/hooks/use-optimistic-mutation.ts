"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Generic optimistic mutation hook.
 * 
 * Pattern:
 * 1. Apply optimistic update immediately (UI responds in <16ms)
 * 2. Fire async mutation in background
 * 3. On failure, rollback to previous state
 * 4. No loading spinners - UI stays interactive throughout
 * 
 * Used for: cart add/remove/quantity, coupon apply/remove, favorites toggle
 */
type OptimisticMutationOptions<TState, TInput> = {
  /** Apply the optimistic update. Return the rollback value. */
  onMutate: (input: TInput) => TState;
  /** The actual async operation */
  mutationFn: (input: TInput) => Promise<unknown>;
  /** Rollback on failure */
  onRollback: (previousState: TState) => void;
  /** Optional success callback */
  onSuccess?: (input: TInput, result: unknown) => void;
  /** Optional error callback */
  onError?: (error: unknown, input: TInput) => void;
  /** Debounce time in ms to batch rapid operations (e.g., quantity +/- taps) */
  debounceMs?: number;
};

export function useOptimisticMutation<TState, TInput>({
  onMutate,
  mutationFn,
  onRollback,
  onSuccess,
  onError,
  debounceMs = 0,
}: OptimisticMutationOptions<TState, TInput>) {
  const [isPending, setIsPending] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingInputRef = useRef<TInput | null>(null);
  const rollbackStateRef = useRef<TState | null>(null);

  const mutate = useCallback((input: TInput) => {
    // Step 1: Apply optimistic update IMMEDIATELY
    const previousState = onMutate(input);

    if (debounceMs > 0) {
      // For debounced mutations (e.g., rapid quantity changes):
      // Keep the first rollback state, batch the input
      if (!rollbackStateRef.current) {
        rollbackStateRef.current = previousState;
      }
      pendingInputRef.current = input;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        const finalInput = pendingInputRef.current!;
        const savedRollback = rollbackStateRef.current!;
        pendingInputRef.current = null;
        rollbackStateRef.current = null;

        setIsPending(true);
        try {
          const result = await mutationFn(finalInput);
          onSuccess?.(finalInput, result);
        } catch (error) {
          // Step 3: Rollback on failure
          onRollback(savedRollback);
          onError?.(error, finalInput);
        } finally {
          setIsPending(false);
        }
      }, debounceMs);
    } else {
      // Non-debounced: fire immediately
      setIsPending(true);
      mutationFn(input)
        .then((result) => {
          onSuccess?.(input, result);
        })
        .catch((error) => {
          // Step 3: Rollback on failure
          onRollback(previousState);
          onError?.(error, input);
        })
        .finally(() => {
          setIsPending(false);
        });
    }
  }, [onMutate, mutationFn, onRollback, onSuccess, onError, debounceMs]);

  return { mutate, isPending };
}

/**
 * Specialized hook for cart quantity updates with batched server sync.
 * Optimistic locally, syncs to server in background (if server cart exists).
 * For this PWA, cart is localStorage-only so mutations are purely local.
 * This hook exists to establish the pattern for future server-synced carts.
 */
export function useOptimisticCartAction() {
  const inflightRef = useRef<Set<string>>(new Set());

  const execute = useCallback(async (
    productId: string,
    optimisticFn: () => void,
    serverFn?: () => Promise<void>,
    rollbackFn?: () => void
  ) => {
    // Prevent duplicate inflight mutations for same product
    if (inflightRef.current.has(productId)) return;

    // Step 1: Apply optimistic update
    optimisticFn();

    // If no server sync needed (localStorage-only cart), we're done
    if (!serverFn) return;

    inflightRef.current.add(productId);
    try {
      await serverFn();
    } catch {
      // Rollback on failure
      rollbackFn?.();
    } finally {
      inflightRef.current.delete(productId);
    }
  }, []);

  return execute;
}
