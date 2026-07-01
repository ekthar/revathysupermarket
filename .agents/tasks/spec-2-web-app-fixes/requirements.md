# Spec 2 — Web App Fixes & Feature-Flag Wiring

## Requirements (EARS Notation)

---

### 1. ETA Conditional Rendering

| ID | Requirement |
|----|-------------|
| REQ-1.1 | Where the order status is before rider acceptance (ORDER_RECEIVED, AWAITING_CUSTOMER_APPROVAL, ACCEPTED, PACKING, READY_FOR_DELIVERY), the system shall NOT render any ETA/estimated delivery time to the customer. |
| REQ-1.2 | When the order status transitions to OUT_FOR_DELIVERY or ARRIVING (indicating rider has accepted and is en route), the system shall render the ETA countdown. |
| REQ-1.3 | The live-order-tracking component's `calculateEta` function shall return `null` for any status prior to OUT_FOR_DELIVERY, suppressing the "Arriving in X min" display. |

---

### 2. Collect-Payment Screen — Human-Language Balance Wording

| ID | Requirement |
|----|-------------|
| REQ-2.1 | When the total collected (cash + UPI) exceeds the amount due, the system shall display: "Give ₹X change to customer" (where X = collected − due). |
| REQ-2.2 | When the amount due exceeds the total collected, the system shall display: "Collect ₹X more from customer" (where X = due − collected). |
| REQ-2.3 | The system shall never display raw subtraction, negative numbers, or mathematical notation to the delivery partner. |
| REQ-2.4 | When collected equals due exactly, the system shall display: "Amount matches — no change needed". |

---

### 3. Swipe-to-Deliver Cross-Browser Fix

| ID | Requirement |
|----|-------------|
| REQ-3.1 | The swipe-to-deliver gesture (SlideToConfirm component) shall function identically on Android Chrome/webview and iOS Safari/webview. |
| REQ-3.2 | The CompletionDialog's current `<input type="range">` slide-to-deliver shall be replaced with the existing SlideToConfirm pointer-event-based component to ensure consistent cross-browser behavior. |
| REQ-3.3 | The SlideToConfirm component shall include `touch-action: none` on the thumb element to prevent Android Chrome scroll interference. |

---

### 4. Substitute/Swap-Item Approval Fix

| ID | Requirement |
|----|-------------|
| REQ-4.1 | Where a substitute item is proposed for an order, the system shall request customer approval EVERY time the price delta exceeds AUTO_APPROVE_DELTA, regardless of whether the order has previously had a substitution approved or rejected. |
| REQ-4.2 | The approval endpoint shall process ALL pending edit logs (not just the first), ensuring repeat substitutions each trigger their own approval cycle. |
| REQ-4.3 | The bug where `editApprovalStatus` being already set to a non-null value causes subsequent substitutions to skip the approval prompt shall be fixed by resetting it correctly on each new edit that requires approval. |

---

### 5. Thermal Printer Integration (Placeholder — Awaiting Confirmation)

| ID | Requirement |
|----|-------------|
| REQ-5.1 | The system shall display a "Print Invoice" button on the admin/staff order detail view for orders with status beyond ORDER_RECEIVED. |
| REQ-5.2 | When the print button is clicked, the system shall call POST /api/orders/[id]/print (from Spec 1). |
| REQ-5.3 | The first print shall display "ORIGINAL" and subsequent prints shall display "DUPLICATE" clearly on the printed output. |
| REQ-5.4 | After a successful print, the order card in the admin/staff order list shall show a colored "Printed" chip/badge. |
| REQ-5.5 | Where an order remains unprinted past the `print_required_alert` threshold (from the feature flag config.thresholdMinutes), the admin dashboard shall show a high-visibility alert. |
| REQ-5.6 | **BLOCKED:** Exact printer model/connection type (USB, Bluetooth, or network) is needed before implementing driver logic. A browser-based `window.print()` fallback with thermal-receipt-sized CSS shall be used until confirmed. |

---

### 6. Monetary Value Formatting

| ID | Requirement |
|----|-------------|
| REQ-6.1 | All monetary values displayed on the admin dashboard and report screens shall be formatted to exactly 2 decimal places. |
| REQ-6.2 | The `formatCurrency` utility shall ensure consistent 2dp formatting across all usages. |

---

### 7. Stock Value Feature-Flag Gating

| ID | Requirement |
|----|-------------|
| REQ-7.1 | Where the `stock_value_visible` feature flag is disabled, the admin dashboard shall NOT render the "Inventory Value" metric card. |
| REQ-7.2 | Where the flag is enabled, the metric shall render as currently implemented. |
| REQ-7.3 | The flag state shall be fetched server-side at render time via `prisma.featureFlag.findUnique({ where: { key: "stock_value_visible" } })`. |

---

### 8. Map Replacement with mapcn

| ID | Requirement |
|----|-------------|
| REQ-8.1 | **BLOCKED:** The mapcn library (https://www.mapcn.dev) is MapLibre GL-based. The current implementation already uses maplibre-gl directly with OpenFreeMap tiles. Replacing the custom DeliveryMap with mapcn components requires evaluating whether mapcn supports: animated markers, custom marker elements, programmatic fly-to, and bounds fitting. |
| REQ-8.2 | If mapcn supports these features: replace DeliveryMap with mapcn React components, keeping the animated rider marker, customer destination marker, and store marker functionality intact. |
| REQ-8.3 | If mapcn does NOT support animated markers or custom SVG markers: retain the current maplibre-gl implementation (it's already MapLibre-based and functionally correct) and document why mapcn was not adopted. |

---

### 9. Admin Settings Page — Feature Flag Management

| ID | Requirement |
|----|-------------|
| REQ-9.1 | The system shall provide an admin settings page at `/admin/settings` accessible to ADMIN and OWNER roles. |
| REQ-9.2 | The page shall list all feature flags with toggle switches for: stock_value_visible, forced_accept_delivery, ring_alert_rules, print_required_alert. |
| REQ-9.3 | For `forced_accept_delivery`, the settings page shall provide a per-staff override UI: list all DELIVERY_PARTNER users and allow toggling forced-accept for each individually. |
| REQ-9.4 | For `ring_alert_rules`, the settings page shall allow editing: ringtone name, durationSeconds, escalationAfterSeconds, escalationTarget. |
| REQ-9.5 | For `print_required_alert`, the settings page shall allow editing: thresholdMinutes. |
| REQ-9.6 | All changes shall be persisted via PUT /api/feature-flags. |

---

### 10. GST Number Display Removal

| ID | Requirement |
|----|-------------|
| REQ-10.1 | The admin dashboard shall remove the "GST Today" and "GST Collected" metric cards/labels from the dashboard display. |
| REQ-10.2 | The GST calculation logic in the server component (`app/admin/page.tsx`) may remain for invoice generation purposes but shall not pass GST display values to the client component. |
| REQ-10.3 | The "Month Summary" section shall remove the GST Collected column. |

---

## Assumptions & Notes

1. **Thermal printer** (REQ-5.6): Using `window.print()` with thermal-receipt CSS as a fallback until printer model is confirmed.
2. **mapcn** (REQ-8): Current implementation already uses MapLibre GL. Will evaluate mapcn compatibility before switching.
3. **Substitute fix** (REQ-4): The bug is in `app/api/admin/orders/[id]/edit/route.ts` where the order's `editApprovalStatus` field may cause the status check to short-circuit on repeat edits.
4. **SlideToConfirm** already uses pointer events which work cross-browser. The fix is in `CompletionDialog` which uses a basic `<input type="range">` instead of the proper component.
