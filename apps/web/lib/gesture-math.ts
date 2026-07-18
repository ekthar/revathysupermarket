/**
 * Gesture Math Utilities — Apple's physics formulas for fluid interfaces.
 *
 * Based on Apple's "Designing Fluid Interfaces" (WWDC 2018) sample code.
 * These are the exact formulas Apple ships for momentum projection,
 * rubber-banding, and snap-point selection.
 */

/**
 * Project where a gesture will land given its release velocity.
 * Uses exponential decay (NOT v²/2a — that's textbook, not what Apple ships).
 *
 * @param velocity - Release velocity in px/s
 * @param decelerationRate - 0.998 for normal scroll feel, 0.99 for snappier
 * @returns Projected distance in px from current position
 */
export function project(velocity: number, decelerationRate = 0.998): number {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
}

/**
 * Rubber-band effect — progressive resistance past a boundary.
 * The further past the bound, the less the element follows.
 * Real things slow before they stop.
 *
 * @param overshoot - How far past the boundary (px)
 * @param dimension - The dimension of the container (for scaling)
 * @param constant - Resistance factor (0.55 is Apple's default)
 * @returns The rubber-banded position (always less than overshoot)
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  if (dimension === 0) return 0;
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * Find the nearest snap point from a projected endpoint.
 *
 * @param projected - The projected final position
 * @param snapPoints - Array of valid snap positions (sorted)
 * @returns The nearest snap point
 */
export function nearestSnap(projected: number, snapPoints: number[]): number {
  if (snapPoints.length === 0) return projected;
  let nearest = snapPoints[0];
  let minDist = Math.abs(projected - nearest);
  for (let i = 1; i < snapPoints.length; i++) {
    const dist = Math.abs(projected - snapPoints[i]);
    if (dist < minDist) {
      minDist = dist;
      nearest = snapPoints[i];
    }
  }
  return nearest;
}

/**
 * Normalize velocity for spring handoff.
 * Some spring APIs want relative velocity (0-1 range) rather than absolute px/s.
 *
 * @param velocity - Absolute velocity in px/s
 * @param distance - Remaining distance to target
 * @returns Normalized velocity (relative to remaining distance)
 */
export function normalizeVelocity(velocity: number, distance: number): number {
  if (distance === 0) return 0;
  return velocity / distance;
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation.
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Map a value from one range to another.
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}
