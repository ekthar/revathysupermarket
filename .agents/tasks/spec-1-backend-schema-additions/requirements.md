# Spec 1 — Backend & Schema Additions (Prisma + API Routes)

## Requirements (EARS Notation)

---

### 1. Schema Additions — Product Model

| ID | Requirement |
|----|-------------|
| REQ-1.1 | The system shall add a `costPrice` field of type `Decimal(10,2)` to the `Product` model, representing the purchase cost pre-tax. The field shall be nullable to preserve backward compatibility with existing products. |
| REQ-1.2 | The system shall add a `brand` field of type `String` (nullable) to the `Product` model. |
| REQ-1.3 | When existing products do not have `costPrice` or `brand` populated, the system shall default both to `null` without affecting any existing queries or API responses. |

---

### 2. Schema Additions — Order Model

| ID | Requirement |
|----|-------------|
| REQ-2.1 | The system shall add a `printCount` field of type `Int` with a default of `0` to the `Order` model, tracking how many times the invoice has been printed. *(Note: `printedAt` already exists in the schema.)* |
| REQ-2.2 | When an order is created, `printCount` shall default to `0` and `printedAt` shall remain `null` until a print action is performed. |

---

### 3. Schema Addition — FeatureFlag Model

| ID | Requirement |
|----|-------------|
| REQ-3.1 | The system shall introduce a new `FeatureFlag` model with fields: `id` (cuid, PK), `key` (String, unique), `enabled` (Boolean), `config` (Json, nullable), `createdAt` (DateTime), `updatedAt` (DateTime). |
| REQ-3.2 | The system shall seed the following feature flags on migration: |
| | • `stock_value_visible` — enabled: `false`, config: `null` |
| | • `forced_accept_delivery` — enabled: `false`, config: `{ "overrides": [] }` (array of `{ userId, enabled }` for per-staff override) |
| | • `ring_alert_rules` — enabled: `true`, config: `{ "ringtone": "default", "durationSeconds": 30, "escalationAfterSeconds": 60, "escalationTarget": "admin" }` |
| | • `print_required_alert` — enabled: `true`, config: `{ "thresholdMinutes": 10 }` |
| REQ-3.3 | The `config` JSON field shall allow arbitrary JSON to accommodate future flags without schema migration. |

---

### 4. Schema Addition — DeviceToken Model Enhancement

| ID | Requirement |
|----|-------------|
| REQ-4.1 | The system shall add a `role` field of type `String` (values: `"staff"`, `"admin"`, `"customer"`) to the existing `DeviceToken` model, defaulting to `"customer"` to preserve backward compatibility with existing records. |
| REQ-4.2 | The `role` field shall be indexed to enable efficient filtering when sending role-targeted push notifications. |

---

### 5. API Route — Feature Flags (Admin-Only)

| ID | Requirement |
|----|-------------|
| REQ-5.1 | **Where** the user is authenticated with role `ADMIN` or `OWNER`, the system shall provide `GET /api/feature-flags` returning all feature flags as an array of `{ key, enabled, config }`. |
| REQ-5.2 | **Where** the user is authenticated with role `ADMIN` or `OWNER`, the system shall provide `PUT /api/feature-flags` accepting a body of `{ key: string, enabled?: boolean, config?: object }` and updating the matching flag. |
| REQ-5.3 | **Where** the user is not authenticated or lacks admin/owner role, the system shall return HTTP 401 or 403 respectively. |
| REQ-5.4 | **Where** the flag key does not exist, `PUT` shall return HTTP 404 with an error message. |

---

### 6. API Route — Device Token Registration

| ID | Requirement |
|----|-------------|
| REQ-6.1 | The existing `POST /api/device-tokens` route shall be extended to accept an optional `role` field (default `"customer"`), which is persisted in the new `role` column. |
| REQ-6.2 | The existing request/response contract shall remain backward compatible — requests without `role` shall function identically to current behavior. |

---

### 7. API Route — Order Reject

| ID | Requirement |
|----|-------------|
| REQ-7.1 | The system shall provide `POST /api/orders/[id]/reject` accepting `{ reason?: string }`. |
| REQ-7.2 | **Where** the authenticated user is a `STAFF` or `DELIVERY_PARTNER` currently assigned to the order, the system shall unassign the delivery partner, set status back to `READY_FOR_DELIVERY`, and log an `OrderEvent`. |
| REQ-7.3 | **When** an order is rejected, the system shall send a high-priority FCM push notification to ALL device tokens with `role = "admin"`, containing the order number, reject reason, and a deep link. |
| REQ-7.4 | **Where** the user is not the assigned delivery partner or the order is not in an assignable status, the system shall return HTTP 403 or 409 respectively. |

---

### 8. API Route — Order Print

| ID | Requirement |
|----|-------------|
| REQ-8.1 | The system shall provide `POST /api/orders/[id]/print` for authenticated `ADMIN`, `OWNER`, `STAFF`, or `PACKING_STAFF` users. |
| REQ-8.2 | **When** the print endpoint is called, the system shall atomically increment `printCount` by 1 and set `printedAt` to the current UTC timestamp (overwriting any prior value). |
| REQ-8.3 | The response shall include `{ printCount, printedAt, isDuplicate }` where `isDuplicate` is `true` if `printCount > 1` after the increment. |

---

### 9. API Route — Sales Report

| ID | Requirement |
|----|-------------|
| REQ-9.1 | The system shall provide `GET /api/reports/sales?period=week|month|quarter` for authenticated `ADMIN` or `OWNER` users. |
| REQ-9.2 | The response shall include: `totalOrders`, `totalRevenue` (Decimal, 2dp), `avgOrderValue` (Decimal, 2dp), `periodStart`, `periodEnd`, and a `dailyBreakdown` array with `{ date, orders, revenue }`. |
| REQ-9.3 | **Where** `period` is not one of `week`, `month`, or `quarter`, the system shall return HTTP 400 with a descriptive error. |
| REQ-9.4 | Only orders with status `DELIVERED` and `paymentStatus = PAID` shall be counted in revenue calculations. |

---

### 10. API Route — Fast-Moving Items Report

| ID | Requirement |
|----|-------------|
| REQ-10.1 | The system shall provide `GET /api/reports/fast-moving-items` for authenticated `ADMIN` or `OWNER` users. |
| REQ-10.2 | The response shall return the top 20 products by total quantity sold in the last 30 days, each including `productId`, `name`, `totalQuantity`, `totalRevenue` (2dp), and `category`. |
| REQ-10.3 | Only items from `DELIVERED` orders shall be included. |

---

### 11. API Route — Profit Report

| ID | Requirement |
|----|-------------|
| REQ-11.1 | The system shall provide `GET /api/reports/profit?period=week|month|quarter` for authenticated `ADMIN` or `OWNER` users. |
| REQ-11.2 | The response shall include: `totalRevenue` (2dp), `totalCost` (2dp), `grossProfit` (2dp, = revenue − cost), `profitMarginPercent` (2dp), `periodStart`, `periodEnd`. |
| REQ-11.3 | Revenue is sum of `OrderItem.price * OrderItem.quantity` for DELIVERED/PAID orders. Cost is sum of `Product.costPrice * OrderItem.quantity` for the same items. |
| REQ-11.4 | **Where** a product's `costPrice` is `null`, that item's cost contribution shall be treated as `0` and a `warnings` array in the response shall list products with missing cost data. |
| REQ-11.5 | All profit calculations shall be pre-tax (using base prices, not applying GST). All monetary values formatted to exactly 2 decimal places. |

---

### 12. GST Number Display Removal

| ID | Requirement |
|----|-------------|
| REQ-12.1 | The system shall remove GST number rendering from any admin/staff dashboard display components. |
| REQ-12.2 | The GST number shall remain stored in the database and shall continue to appear on generated invoices/receipts where it currently does. |
| REQ-12.3 | No database column or API field shall be removed — this is a UI-only removal on the dashboard. |

---

## Assumptions & Notes

1. The existing `printedAt` field in the Order model will be reused (not duplicated). Only `printCount` is new.
2. The existing `DeviceToken` model is enhanced in-place rather than creating a separate model, since it already stores tokens for all platforms.
3. Per-staff override for `forced_accept_delivery` is stored in the flag's `config.overrides` array as `[{ "userId": "...", "enabled": true/false }]`.
4. Report endpoints use the `period` query parameter to determine date ranges relative to the current UTC date.
5. REQ-12 (GST display removal) is included here for completeness but the actual UI change applies to web components (Spec 2). The schema/API aspect is: **no backend change needed** — only confirming the field is preserved.

---

## Existing Contracts Preserved (Non-Breaking)

| Existing Feature | Impact |
|------------------|--------|
| `POST /api/device-tokens` | Extended with optional `role` field; existing callers without `role` continue working |
| `Product` model | Two nullable fields added; existing queries unaffected |
| `Order` model | One new Int field with default; existing queries unaffected |
| `DeviceToken` model | One new field with default; existing records auto-get `"customer"` role |
| All existing API routes | No modifications to request/response shapes |
