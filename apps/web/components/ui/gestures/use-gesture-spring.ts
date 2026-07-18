"use client";

import { useCallback, useRef } from "react";
import { useVelocityTracker, type Velocity } from "./use-velocity-tracker";
import { project, rubberband, nearestSnap, clamp } from "@/lib/gesture-math";

/**
 * useGestureSpring — the core Apple fluid interface pattern.
 *
 * 1. On pointer-down → enter "tracking" mode
 * 2. While tracking → element follows finger 1:1 (with rubber-band at edges)
 * 3. On pointer-up → compute velocity, project endpoint, pick snap target
 * 4. Animate to target via spring, passing release velocity
 * 5. If user touches during animation → interrupt, return to step 1
 *
 * This hook provides the logic; the caller is responsible for applying
 * the position to a DOM element (via ref.style.transform for 60fps).
 */

export interface GestureSpringConfig {
  /** Axis of movement: 'x' for horizontal, 'y' for vertical */
  axis: "x" | "y";
  /** Snap points in px (e.g., [0, -window.innerWidth] for page transitions) */
  snapPoints: number[];
  /** Min boundary for rubber-banding (px) */
  min?: number;
  /** Max boundary for rubber-banding (px) */
  max?: number;
  /** Container dimension for rubber-band scaling (px) */
  dimension?: number;
  /** Velocity threshold for commit (px/s). Below this, use position. */
  velocityThreshold?: number;
  /** Called when spring settles on a snap point */
  onSnap?: (snapIndex: number, snapValue: number) => void;
  /** Called every frame with current position (for applying transforms) */
  onUpdate?: (position: number) => void;
  /** Called when gesture starts */
  onStart?: () => void;
  /** Called when gesture ends (before spring) */
  onEnd?: (velocity: Velocity, projected: number, snap: number) => void;
}

export interface GestureSpringReturn {
  /** Call on pointer-down */
  handleStart: (position: number) => void;
  /** Call on pointer-move (raw pointer position, not delta) */
  handleMove: (position: number) => void;
  /** Call on pointer-up/cancel */
  handleEnd: () => void;
  /** Whether the gesture is currently being tracked */
  isTracking: () => boolean;
  /** Cancel any running animation */
  cancel: () => void;
}

export function useGestureSpring(config: GestureSpringConfig): GestureSpringReturn {
  const {
    axis,
    snapPoints,
    min = -Infinity,
    max = Infinity,
    dimension = 400,
    velocityThreshold = 300,
    onSnap,
    onUpdate,
    onStart,
    onEnd,
  } = config;

  const { track, getVelocity, reset: resetVelocity } = useVelocityTracker();
  const trackingRef = useRef(false);
  const startPosRef = useRef(0);
  const currentPosRef = useRef(0);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);

  // Spring animation state
  const springRef = useRef<{
    active: boolean;
    target: number;
    velocity: number;
    position: number;
  }>({ active: false, target: 0, velocity: 0, position: 0 });

  const cancelSpring = useCallback(() => {
    springRef.current.active = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  /**
   * Simple spring solver — critically damped (Apple default).
   * Runs in RAF for 60fps compositor-thread animation.
   */
  const runSpring = useCallback(
    (target: number, initialVelocity: number) => {
      const spring = springRef.current;
      spring.active = true;
      spring.target = target;
      spring.velocity = initialVelocity;
      spring.position = currentPosRef.current;

      // Spring constants (critically damped: damping ratio = 1.0)
      const stiffness = 300;
      const damping = 2 * Math.sqrt(stiffness); // critical damping
      const mass = 1;

      let lastTime = performance.now();

      const step = (now: number) => {
        if (!spring.active) return;

        const dt = Math.min((now - lastTime) / 1000, 0.064); // cap at ~16fps
        lastTime = now;

        const displacement = spring.position - spring.target;
        const springForce = -stiffness * displacement;
        const dampingForce = -damping * spring.velocity;
        const acceleration = (springForce + dampingForce) / mass;

        spring.velocity += acceleration * dt;
        spring.position += spring.velocity * dt;

        currentPosRef.current = spring.position;
        onUpdate?.(spring.position);

        // Settle check
        if (Math.abs(displacement) < 0.5 && Math.abs(spring.velocity) < 0.5) {
          spring.active = false;
          spring.position = spring.target;
          currentPosRef.current = spring.target;
          onUpdate?.(spring.target);
          // Find which snap index we landed on
          const snapIdx = snapPoints.indexOf(spring.target);
          if (snapIdx !== -1) onSnap?.(snapIdx, spring.target);
          return;
        }

        rafRef.current = requestAnimationFrame(step);
      };

      rafRef.current = requestAnimationFrame(step);
    },
    [snapPoints, onSnap, onUpdate]
  );

  const handleStart = useCallback(
    (position: number) => {
      // Interrupt any running spring
      cancelSpring();
      trackingRef.current = true;
      startPosRef.current = position;
      offsetRef.current = currentPosRef.current;
      resetVelocity();
      onStart?.();
    },
    [cancelSpring, resetVelocity, onStart]
  );

  const handleMove = useCallback(
    (position: number) => {
      if (!trackingRef.current) return;

      const axisPos = position;
      track(axisPos, 0); // track in 1D (we only need primary axis)

      const delta = axisPos - startPosRef.current;
      let newPos = offsetRef.current + delta;

      // Apply rubber-band at boundaries
      if (newPos > max) {
        newPos = max + rubberband(newPos - max, dimension);
      } else if (newPos < min) {
        newPos = min - rubberband(min - newPos, dimension);
      }

      currentPosRef.current = newPos;
      onUpdate?.(newPos);
    },
    [track, max, min, dimension, onUpdate]
  );

  const handleEnd = useCallback(() => {
    if (!trackingRef.current) return;
    trackingRef.current = false;

    const velocity = getVelocity();
    const v = axis === "x" ? velocity.x : velocity.y;

    // Project where the gesture is headed
    const projectedPos = currentPosRef.current + project(v);
    const clampedProjection = clamp(projectedPos, min, max);

    // Find nearest snap point from the projected position
    const snap = nearestSnap(clampedProjection, snapPoints);

    onEnd?.(velocity, projectedPos, snap);

    // Animate to snap with velocity handoff
    runSpring(snap, v);
  }, [getVelocity, axis, min, max, snapPoints, onEnd, runSpring]);

  const isTracking = useCallback(() => trackingRef.current, []);

  const cancel = useCallback(() => {
    trackingRef.current = false;
    cancelSpring();
  }, [cancelSpring]);

  return { handleStart, handleMove, handleEnd, isTracking, cancel };
}
