# Spec 1 — Backend & Schema Additions: Design Document

## 1. Overview

This design adds new Prisma models, schema fields, and API routes to support feature flags, reporting, order rejection, and print tracking — all as additive changes with no breaking modifications to existing contracts.

---

## 2. Database Schema Changes

### 2.1 Migration: `20260701100000_spec1_backend_additions`

A single migration file handles all schema changes:

```sql
-- 1. Product model additions
ALTER TABLE "Product" ADD COLUMN "costPrice" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN "brand" TEXT;

-- 2. Order model addition
ALTER TABLE "Order" ADD COLUMN "printCount" INTEGER NOT NULL DEFAULT 0;

-- 3. DeviceToken model addition
ALTER TABLE "DeviceToken" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'customer';
CREATE INDEX "DeviceToken_role_idx" ON "DeviceToken"("role");

-- 4. FeatureFlag model
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- 5. Seed feature flags
INSERT INTO "FeatureFlag" ("id", "key", "enabled", "config", "createdAt", "updatedAt") VALUES
  ('ff_stock_value_visible', 'stock_value_visible', false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_forced_accept_delivery', 'forced_accept_delivery', false, '{"overrides":[]}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_ring_alert_rules', 'ring_alert_rules', true, '{"ringtone":"default","durationSeconds":30,"escalationAfterSeconds":60,"escalationTarget":"admin"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff_print_required_alert', 'print_required_alert', true, '{"thresholdMinutes":10}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

### 2.2 Updated Prisma Schema (additions only)

```prisma
// Product — add after existing fields:
costPrice     Decimal?    @db.Decimal(10, 2)
brand         String?

// Order — add after printedById:
printCount    Int         @default(0)

// DeviceToken — add after platform:
role          String      @default("customer")
// Add index: @@index([role])

// New model:
model FeatureFlag {
  id        String   @id @default(cuid())
  key       String   @unique
  enabled   Boolean  @default(false)
  config    Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2.3 Seed File Update

Add to `prisma/seed.ts` an idempotent upsert block for all four feature flags so fresh environments get seeded correctly (migration handles existing DBs).

---

## 3. API Route Designs

### 3.1 `GET /api/feature-flags` — Admin-only listing

**File:** `apps/web/app/api/feature-flags/route.ts`

```
Request: GET (no body)
Auth:    session.user.role in ["ADMIN", "OWNER"]
Response 200:
  { flags: [{ key, enabled, config }] }
Response 401/403: { error: string }
```

**Logic:** `prisma.featureFlag.findMany()` → map to response shape.

---

### 3.2 `PUT /api/feature-flags` — Admin-only update

**File:** `apps/web/app/api/feature-flags/route.ts`

```
Request: PUT { key: string, enabled?: boolean, config?: object }
Auth:    session.user.role in ["ADMIN", "OWNER"]
Response 200:
  { flag: { key, enabled, config } }
Response 404: { error: "Flag not found" }
Response 401/403: { error: string }
```

**Logic:**
1. Validate body with zod: `key` required, `enabled` optional boolean, `config` optional object
2. `prisma.featureFlag.findUnique({ where: { key } })` → 404 if not found
3. Build update payload (only fields provided)
4. `prisma.featureFlag.update({ where: { key }, data })`
5. Return updated flag

---

### 3.3 `POST /api/device-tokens` — Enhanced (backward-compatible)

**File:** `apps/web/app/api/device-tokens/route.ts` (modify existing)

**Change:** Add optional `role` to the zod schema:
```typescript
const registerSchema = z.object({
  token: z.string().min(10).max(500),
  platform: z.enum(["web", "android", "ios"]).default("web"),
  role: z.enum(["customer", "staff", "admin"]).default("customer"),
});
```

In the upsert, include `role` in both `create` and `update` blocks.

---

### 3.4 `POST /api/orders/[id]/reject` — Staff rejects assignment

**File:** `apps/web/app/api/orders/[id]/reject/route.ts`

```
Request: POST { reason?: string }
Auth:    session.user.role in ["STAFF", "DELIVERY_PARTNER"]
         AND session.user.id === order.deliveryPartnerId
Response 200:
  { ok: true, orderId, status: "READY_FOR_DELIVERY" }
Response 403: { error: "Not assigned to this order" }
Response 409: { error: "Order not in a rejectable status" }
```

**Logic:**
1. Auth check → 401
2. Fetch order by ID; verify `deliveryPartnerId === session.user.id`
3. Verify order status is `OUT_FOR_DELIVERY` or `READY_FOR_DELIVERY` (rejectable states) → 409 if not
4. Transaction:
   - Update order: `deliveryPartnerId = null`, `deliveryAssignedAt = null`, `deliveryAlertAckAt = null`, `status = READY_FOR_DELIVERY`
   - Create `OrderEvent` with status `READY_FOR_DELIVERY` and note `"Rejected by delivery partner: {reason}"`
   - Create `AuditLog` entry
5. After transaction: send high-priority FCM to all admin device tokens
   - Query: `prisma.deviceToken.findMany({ where: { role: "admin" } })`
   - For each token, send FCM with type `"order_rejected"`, orderId, orderNumber, reason
6. Return success

**FCM Payload to Admins:**
```json
{
  "type": "order_rejected",
  "eventId": "<generated-cuid>",
  "orderId": "<order.id>",
  "orderNumber": "<order.orderNumber>",
  "reason": "<rejection reason or 'No reason provided'>",
  "priority": "high",
  "deepLink": "msmsupermarket://admin/orders/<orderId>"
}
```

---

### 3.5 `POST /api/orders/[id]/print` — Print tracking

**File:** `apps/web/app/api/orders/[id]/print/route.ts`

```
Request: POST (no body required)
Auth:    session.user.role in ["ADMIN", "OWNER", "STAFF", "PACKING_STAFF"]
Response 200:
  { printCount: number, printedAt: string (ISO), isDuplicate: boolean }
Response 404: { error: "Order not found" }
```

**Logic:**
1. Auth check
2. Fetch order, 404 if not found
3. Atomic update:
   ```typescript
   prisma.order.update({
     where: { id },
     data: {
       printCount: { increment: 1 },
       printedAt: new Date(),
       printedById: session.user.id,
     }
   })
   ```
4. Return `{ printCount: updated.printCount, printedAt: updated.printedAt, isDuplicate: updated.printCount > 1 }`

---

### 3.6 `GET /api/reports/sales` — Sales report

**File:** `apps/web/app/api/reports/sales/route.ts`

```
Request: GET ?period=week|month|quarter
Auth:    session.user.role in ["ADMIN", "OWNER"]
Response 200:
  {
    totalOrders: number,
    totalRevenue: string (2dp),
    avgOrderValue: string (2dp),
    periodStart: string (ISO date),
    periodEnd: string (ISO date),
    dailyBreakdown: [{ date: string, orders: number, revenue: string }]
  }
Response 400: { error: "Invalid period" }
```

**Logic:**
1. Parse `period` → compute `periodStart` and `periodEnd`:
   - `week`: last 7 days from today
   - `month`: last 30 days from today
   - `quarter`: last 90 days from today
2. Query orders where `status = DELIVERED`, `paymentStatus = PAID`, `createdAt` within range
3. Aggregate: count, sum of `total`, average
4. Group by date for daily breakdown
5. Format all monetary values to 2 decimal places using `toFixed(2)`

---

### 3.7 `GET /api/reports/fast-moving-items` — Top products

**File:** `apps/web/app/api/reports/fast-moving-items/route.ts`

```
Request: GET (no query params)
Auth:    session.user.role in ["ADMIN", "OWNER"]
Response 200:
  {
    items: [{
      productId: string,
      name: string,
      category: string,
      totalQuantity: number,
      totalRevenue: string (2dp)
    }]
  }
```

**Logic:**
1. Query `OrderItem` joined with `Order` (status=DELIVERED) in last 30 days
2. Group by `productId`, sum `quantity` and `price * quantity`
3. Join Product for name, join Category for category name
4. Order by totalQuantity DESC, limit 20
5. Format revenue to 2dp

**SQL approach (raw query for performance):**
```sql
SELECT oi."productId", p."name", c."name" as category,
       SUM(oi."quantity") as "totalQuantity",
       SUM(oi."price" * oi."quantity") as "totalRevenue"
FROM "OrderItem" oi
JOIN "Order" o ON o."id" = oi."orderId"
JOIN "Product" p ON p."id" = oi."productId"
JOIN "Category" c ON c."id" = p."categoryId"
WHERE o."status" = 'DELIVERED'
  AND o."paymentStatus" = 'PAID'
  AND o."createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY oi."productId", p."name", c."name"
ORDER BY "totalQuantity" DESC
LIMIT 20;
```

---

### 3.8 `GET /api/reports/profit` — Profit report

**File:** `apps/web/app/api/reports/profit/route.ts`

```
Request: GET ?period=week|month|quarter
Auth:    session.user.role in ["ADMIN", "OWNER"]
Response 200:
  {
    totalRevenue: string (2dp),
    totalCost: string (2dp),
    grossProfit: string (2dp),
    profitMarginPercent: string (2dp),
    periodStart: string (ISO date),
    periodEnd: string (ISO date),
    warnings: [{ productId: string, name: string, reason: "missing_cost_price" }]
  }
```

**Logic:**
1. Date range from `period` (same as sales report)
2. Query all OrderItems from DELIVERED/PAID orders in range, joined with Product
3. Calculate:
   - `totalRevenue = SUM(orderItem.price * orderItem.quantity)`
   - `totalCost = SUM(product.costPrice * orderItem.quantity)` — only where costPrice is non-null
   - `grossProfit = totalRevenue - totalCost`
   - `profitMarginPercent = (grossProfit / totalRevenue) * 100` (handle division by zero → 0)
4. Collect products where `costPrice IS NULL` → populate `warnings[]`
5. All values pre-tax (base prices, no GST applied)
6. Format to 2 decimal places

---

## 4. Helper / Shared Utilities

### 4.1 Auth Guard Helper

Create `apps/web/lib/api-auth.ts`:
```typescript
export async function requireRole(roles: string[]): Promise<Session | Response> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roles.includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return session;
}
```

### 4.2 Date Period Helper

Create `apps/web/lib/report-utils.ts`:
```typescript
export function getDateRange(period: string): { start: Date; end: Date } | null {
  const end = new Date();
  const start = new Date();
  switch (period) {
    case "week": start.setDate(end.getDate() - 7); break;
    case "month": start.setDate(end.getDate() - 30); break;
    case "quarter": start.setDate(end.getDate() - 90); break;
    default: return null;
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
```

### 4.3 FCM Admin Notification Helper

Extend `apps/web/lib/fcm-admin.ts` with:
```typescript
export async function sendFcmToAdmins(payload: FcmPayload): Promise<boolean> {
  const adminDevices = await prisma.deviceToken.findMany({
    where: { role: "admin" },
    select: { token: true, id: true },
  });
  // Send to each, same stale-token cleanup logic
}
```

---

## 5. File Structure (New Files)

```
apps/web/
├── prisma/
│   ├── migrations/
│   │   └── 20260701100000_spec1_backend_additions/
│   │       └── migration.sql
│   └── seed.ts  (modified — add FeatureFlag upserts)
├── app/api/
│   ├── feature-flags/
│   │   └── route.ts          (GET + PUT)
│   ├── device-tokens/
│   │   └── route.ts          (modified — add role field)
│   ├── orders/[id]/
│   │   ├── reject/
│   │   │   └── route.ts      (POST)
│   │   └── print/
│   │       └── route.ts      (POST)
│   └── reports/
│       ├── sales/
│       │   └── route.ts      (GET)
│       ├── fast-moving-items/
│       │   └── route.ts      (GET)
│       └── profit/
│           └── route.ts      (GET)
├── lib/
│   ├── api-auth.ts            (new — auth guard helper)
│   ├── report-utils.ts        (new — date period helper)
│   └── fcm-admin.ts           (modified — add sendFcmToAdmins)
```

---

## 6. GST Display Removal (REQ-12)

This is a **UI-only** change that belongs to Spec 2 (web app fixes). No backend action needed in this spec. The schema keeps `gstRate` fields on Product and OrderItem untouched; invoice generation logic continues to use them.

---

## 7. Non-Breaking Contract Verification

| Route / Model | Change Type | Backward Compatible? |
|---------------|-------------|---------------------|
| `POST /api/device-tokens` | Add optional `role` field | Yes — field defaults to `"customer"` |
| `Product` model | Add nullable `costPrice`, `brand` | Yes — existing queries return null for new fields |
| `Order` model | Add `printCount` with default 0 | Yes — existing queries unaffected |
| `DeviceToken` model | Add `role` with default `"customer"` | Yes — existing rows auto-get default |
| All existing routes | No modification | Yes |
| New routes | Purely additive | Yes — no collision with existing paths |

---

## 8. Task Breakdown (Implementation Order)

| # | Task | Scope |
|---|------|-------|
| 1 | Create Prisma migration + update schema.prisma | Schema |
| 2 | Update seed.ts with FeatureFlag upserts | Seed |
| 3 | Create `lib/api-auth.ts` and `lib/report-utils.ts` helpers | Lib |
| 4 | Extend `lib/fcm-admin.ts` with `sendFcmToAdmins` | Lib |
| 5 | Modify `POST /api/device-tokens` to accept `role` | API |
| 6 | Create `GET/PUT /api/feature-flags` | API |
| 7 | Create `POST /api/orders/[id]/reject` | API |
| 8 | Create `POST /api/orders/[id]/print` | API |
| 9 | Create `GET /api/reports/sales` | API |
| 10 | Create `GET /api/reports/fast-moving-items` | API |
| 11 | Create `GET /api/reports/profit` | API |

Each task is small enough to test independently.
