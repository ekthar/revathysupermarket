# FEAT-008: Real-time Order Tracking Enhancement

## Status: completed

## Description
Enhance the existing SSE-based order tracking with a more detailed 7-step timeline and enhanced rider info card with distance display.

## Steps
1. Create `components/tracking/order-timeline.tsx` - Visual step-by-step timeline component with 7 steps
2. Enhance `components/tracking/live-order-tracking.tsx` - Add rider ETA countdown, distance display, use new timeline
3. Add tests for the timeline step logic

## Acceptance Criteria
- Visual timeline with icons for each order status (received -> accepted -> packing -> ready -> out -> arriving -> delivered)
- Current step highlighted with animation
- ETA display: "Arriving in ~X minutes" based on distance and speed
- Rider info card when OUT_FOR_DELIVERY (name, phone with call button)
- Use existing `use-order-tracking.ts` hook data
- Lint passes
- Tests pass
