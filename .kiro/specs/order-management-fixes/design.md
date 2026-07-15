# Technical Design Document

## Introduction

This design document covers the architecture and implementation of 17 order management bug fixes and improvements across the Revathy Supermarket platform. The fixes span the web admin panel (Next.js 15), mobile customer app, mobile staff app, and mobile delivery app (React Native/Expo). All changes operate within the existing monorepo architecture using Prisma/PostgreSQL for data, Next.js API routes for backend logic, and React Native screens for mobile interfaces.

## Architecture Overview

The order management fixes are distributed across four layers:

1. **Data Layer** — Prisma schema and database queries (no schema migrations required; all fields already exist)
2. **API Layer** — Next.js API routes and server actions for business logic
3. **Web UI Layer** — React components in the Next.js admin panel and customer-facing pages
4. **Mobile UI Layer** — React Native/Expo screens for customer, staff, and delivery apps

```
┌────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
├──────────────┬──────────────┬───────────────┬──────────────┤
│  Web Admin   │  Web Customer│ Mobile Customer│Mobile Delivery│
│  (Next.js)   │  (Next.js)   │ (Expo)        │ (Expo)       │
└──────┬───────┴──────┬───────┴───────┬───────┴──────┬───────┘
       │              │               │              │
       ▼              ▼               ▼              ▼
┌────────────────────────────────────────────────────────────┐
│              API Layer (Next.js API Routes)                  │
│  /api/admin/orders/*  |  /api/orders/*  |  /api/mobile/*    │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│           Business Logic (lib/ utilities)                    │
│  order-checkout.ts | otp.ts | billing.ts | validations.ts   │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│              Data Layer (Prisma + PostgreSQL)                │
│  Order | OrderItem | OrderEvent | User | Address | ...      │
└────────────────────────────────────────────────────────────┘
```

## Components

### 1. Customer Order History (Requirement 1)

**Location:** `apps/web/app/admin/customers/[id]/orders/page.tsx` (new route)

**Component:** `CustomerOrderHistory`

A new admin page at `/admin/customers/[id]/orders` displaying a paginated list of orders for a specific customer, sorted by `createdAt` descending. Includes a header showing customer summary (name, phone, total orders, total spend).

**Data Flow:**
- Server component fetches customer with aggregated order data via Prisma
- Renders order list with links to `/admin/orders/[orderId]`

```typescript
// Query: Get customer order history
async function getCustomerOrders(customerId: string) {
  const [customer, orders, aggregates] = await Promise.all([
    prisma.user.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, phone: true }
    }),
    prisma.order.findMany({
      where: { userId: customerId },
      orderBy: { createdAt: 'desc' },
      include: { items: true }
    }),
    prisma.order.aggregate({
      where: { userId: customerId },
      _count: true,
      _sum: { total: true }
    })
  ]);
  return { customer, orders, aggregates };
}
```

### 2. Staff-Wise Order Report (Requirement 2)

**Location:** `apps/web/app/admin/reports/staff/page.tsx` (new route)

**Component:** `StaffOrderReport`

A new admin report page at `/admin/reports/staff` showing a filterable table of orders with acknowledged-by and delivery partner columns.

**Data Flow:**
- Server component accepts `startDate` and `endDate` query params
- Prisma query joins Order → acknowledgedBy User and deliveryPartner User
- Client component provides date range picker for filtering

```typescript
// Query: Staff report with date range filtering
async function getStaffReport(startDate?: Date, endDate?: Date) {
  const where: Prisma.OrderWhereInput = {};
  if (startDate && endDate) {
    where.createdAt = { gte: startDate, lte: endDate };
  }
  return prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      orderNumber: true,
      customerName: true,
      status: true,
      createdAt: true,
      acknowledgedBy: { select: { name: true } },
      deliveryPartner: { select: { name: true } }
    }
  });
}
```

### 3. Delivery Time Estimate Visibility (Requirement 3)

**Location:** 
- `apps/web/components/tracking/delivery-eta.tsx` (existing, modify)
- `apps/mobile-customer/src/components/OrderTracking.tsx` (modify)

**Logic:** A shared utility function determines ETA visibility based on order status.

```typescript
// Shared utility: Should delivery ETA be visible?
const DISPATCH_STATUSES: OrderStatus[] = ['OUT_FOR_DELIVERY', 'ARRIVING'];

export function isDeliveryEtaVisible(status: OrderStatus): boolean {
  return DISPATCH_STATUSES.includes(status);
}
```

Both the web `DeliveryEta` component and mobile `OrderTracking` screen conditionally render the ETA based on this function.

### 4. Order Alarm Simplification (Requirement 4)

**Location:** `apps/web/components/admin/new-order-alert.tsx` (existing, modify)

**Change:** Remove the "View Order" button from the alarm overlay. The existing component already has an "Accept Order" button (acknowledge) and a dismiss (X) button. We only need to ensure no "View Order" navigation button is present. Based on the current code, the component already does not have a "View Order" button — it has "Accept Order" and dismiss. Verify and lock this behavior.

### 5. Substitute Window Default Quantity (Requirement 5)

**Location:** `apps/web/components/admin/substitute-modal.tsx` or equivalent substitute window component

**Change:** Initialize the quantity state to `1` instead of `0` or empty when the modal opens.

```typescript
// In SubstituteModal component
const [quantity, setQuantity] = useState(1); // Default to 1
```

### 6. Order Sheet Unit Display (Requirement 6)

**Location:** `apps/web/components/admin/order-sheet.tsx` or print view component

**Logic:** A formatting function combines quantity and unit for display.

```typescript
// Utility: Format order item quantity with unit
export function formatQuantityWithUnit(quantity: number, unit: string): string {
  return `${quantity} ${unit}`;
}
```

The order sheet renders each item row using this formatter, pulling the `unit` from the joined Product record.

### 7. Customer Awaiting Approval After Swap (Requirement 7)

**Location:** `apps/web/app/api/admin/orders/[id]/edit/route.ts` (or equivalent edit endpoint)

**Logic:** When a substitution requires customer approval, the API sets both fields atomically.

```typescript
// In substitution API handler
async function confirmSubstitution(orderId: string, editLog: OrderEditLog) {
  if (editLog.requiresCustomerApproval) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        editApprovalStatus: 'PENDING',
        status: 'AWAITING_CUSTOMER_APPROVAL',
        updatedAt: new Date()
      }
    });
    // Send notification to customer
    await sendApprovalNotification(orderId);
  }
}
```

The web admin and mobile staff apps read the status from the API response and display the correct label using the existing `statusLabels` map.

### 8. Single Consolidated Print View (Requirement 8)

**Location:** `apps/web/app/admin/orders/[id]/print/page.tsx` (new route)

**Component:** `OrderPrintView`

A dedicated print page that consolidates all order information into a single printable page. The print button in the order detail view opens this route in a new tab and triggers `window.print()` on load.

```typescript
// Print button handler
function handlePrint(orderId: string) {
  window.open(`/admin/orders/${orderId}/print`, '_blank');
}

// In the print page component
useEffect(() => {
  window.print();
}, []);
```

**Print View Contents:**
- Order number and creation date
- Customer name, phone, delivery address
- Items table with name, quantity, unit, price
- Subtotal, discount, delivery fee, total
- Payment method and bill number
- Order status

### 9. Billed and Packing Status Badges (Requirement 9)

**Location:** `apps/web/components/admin/orders/order-list.tsx` (existing, modify)

**Logic:** Badge visibility functions determine which badges to show.

```typescript
// Badge visibility logic
const BILLED_ELIGIBLE_STATUSES: OrderStatus[] = [
  'PACKING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY',
  'ARRIVING', 'DELIVERED'
];

export function shouldShowBilledBadge(order: { billNumber: string | null; status: OrderStatus }): boolean {
  return order.billNumber !== null && BILLED_ELIGIBLE_STATUSES.includes(order.status);
}

export function shouldShowPackingBadge(order: { status: OrderStatus }): boolean {
  return order.status === 'PACKING';
}
```

Badges use distinct styles: "Billed" in green/teal, "Packing" in amber/orange.

### 10. Customer Order "Updated Last Time" (Requirement 10)

**Location:**
- `apps/web/components/tracking/order-timeline.tsx` (modify)
- `apps/mobile-customer/app/(tabs)/orders/[id].tsx` (modify)

**Logic:** Display `order.updatedAt` formatted as a relative or absolute timestamp. The `updatedAt` field is already auto-managed by Prisma's `@updatedAt` directive, which updates on every record modification.

```typescript
// Display format
function formatLastUpdated(updatedAt: Date): string {
  return `Last updated: ${formatDistanceToNow(updatedAt, { addSuffix: true })}`;
}
```

### 11. Disable Old Update Control (Requirement 11)

**Location:** `apps/web/components/admin/order-status-form.tsx` (existing, modify)

**Logic:** A utility function determines whether the revert button should be enabled.

```typescript
// Utility: Can this order status be reverted?
const NON_REVERTIBLE_STATUSES: OrderStatus[] = [
  'ORDER_RECEIVED',  // Initial status — nothing to revert to
  'DELIVERED',       // Terminal status
  'CANCELLED'        // Terminal status
];

export function canRevertStatus(status: OrderStatus): boolean {
  return !NON_REVERTIBLE_STATUSES.includes(status);
}
```

The revert button is rendered with `disabled={!canRevertStatus(order.status)}`.

### 12. Address Edit and Default Deletion Prevention (Requirement 12)

**Location:** `apps/mobile-customer/app/(tabs)/account/addresses.tsx` (modify)

**Logic:**
- Each address card shows an "Edit" button that navigates to an edit form pre-populated with existing data
- The delete button is conditionally rendered/disabled based on `isDefault`

```typescript
// Utility: Can this address be deleted?
export function canDeleteAddress(address: { isDefault: boolean }): boolean {
  return !address.isDefault;
}
```

**Error Message:** "Default address cannot be deleted. Set another address as default first."

### 13. OTP Restricted to Customer Role (Requirement 13)

**Location:** `apps/web/app/api/auth/otp/send/route.ts` (modify)

**Logic:** Before creating an OTP token, verify the phone belongs to a CUSTOMER role user or is unregistered.

```typescript
// In OTP send handler
async function handleOtpRequest(phone: string) {
  const normalizedPhone = normalizeIndianPhone(phone);
  const user = await prisma.user.findUnique({
    where: { phone: normalizedPhone },
    select: { role: true }
  });

  if (user && user.role !== 'CUSTOMER') {
    return {
      error: 'OTP login is available for customers only. Please use staff login.'
    };
  }

  // Proceed with OTP creation
  return createOtpToken(normalizedPhone);
}
```

### 14. Address Saving Validation (Requirement 14)

**Location:** `apps/mobile-customer/src/lib/validations.ts` (new or modify)

**Logic:** A validation function checks mandatory address fields.

```typescript
// Address form validation
const REQUIRED_ADDRESS_FIELDS = ['houseName', 'street', 'landmark', 'pincode'] as const;

type AddressFormData = {
  houseName: string;
  street: string;
  landmark: string;
  pincode: string;
  [key: string]: string;
};

type ValidationErrors = Partial<Record<keyof AddressFormData, string>>;

export function validateAddressForm(data: AddressFormData): { valid: boolean; errors: ValidationErrors } {
  const errors: ValidationErrors = {};

  for (const field of REQUIRED_ADDRESS_FIELDS) {
    if (!data[field] || data[field].trim() === '') {
      errors[field] = `${fieldLabels[field]} is required`;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
```

The form component calls `validateAddressForm` before submitting. On success, a toast "Address updated successfully." is shown.

### 15. Bill Number Duplication Check (Requirement 15)

**Location:** `apps/web/app/api/admin/orders/[id]/bill/route.ts` (new or modify existing billing endpoint)

**Logic:** Before saving a bill number, check uniqueness.

```typescript
// Bill number uniqueness check
export async function checkBillNumberUnique(billNumber: string, excludeOrderId?: string): Promise<boolean> {
  const existing = await prisma.order.findFirst({
    where: {
      billNumber,
      ...(excludeOrderId ? { id: { not: excludeOrderId } } : {})
    },
    select: { id: true }
  });
  return existing === null;
}
```

If not unique, return error: "Bill number already in use. Please enter a unique bill number."

### 16. Damage Amount Auto-Calculation (Requirement 16)

**Location:** `apps/mobile-delivery/app/(tabs)/orders/[id]/damage-report.tsx` (modify)

**Logic:** A pure calculation function computes the reduction amount.

```typescript
// Damage reduction calculation
export function calculateDamageReduction(unitPrice: number, quantity: number): number {
  return unitPrice * quantity;
}
```

The form auto-populates the reduction amount when an item is selected or quantity changes. The field remains editable for manual override.

### 17. Payment Method Selection (Requirement 17)

**Location:** `apps/web/components/admin/payment-collection-modal.tsx` (new component)

**Component:** `PaymentCollectionModal`

A modal displayed when staff clicks "Received Full" that requires selecting exactly one payment method before confirmation.

```typescript
// Payment method options
const PAYMENT_METHODS = ['UPI', 'Cash', 'Card'] as const;
type CollectionPaymentMethod = typeof PAYMENT_METHODS[number];

// Validation: exactly one method selected
export function isPaymentMethodValid(selected: CollectionPaymentMethod | null): boolean {
  return selected !== null;
}
```

On confirmation, the API updates:
- `paymentStatus` → `PAID`
- Records the method in `DeliveryCollection` (mapping UPI→`upiCollected`, Cash→`cashCollected`, Card via gateway)

## Data Models

No new Prisma schema changes are required. All fixes operate on existing fields:

| Field | Model | Usage |
|-------|-------|-------|
| `userId` | Order | Filter orders by customer (Req 1) |
| `acknowledgedById` | Order | Staff report (Req 2) |
| `deliveryPartnerId` | Order | Staff report (Req 2) |
| `estimatedDeliveryAt` | Order | ETA visibility (Req 3) |
| `status` | Order | Status-based logic (Req 3, 7, 9, 11) |
| `editApprovalStatus` | Order | Approval state (Req 7) |
| `billNumber` | Order | Billed badge, uniqueness (Req 9, 15) |
| `updatedAt` | Order | Last updated display (Req 10) |
| `isDefault` | Address | Deletion prevention (Req 12) |
| `role` | User | OTP restriction (Req 13) |
| `unit` | Product | Order sheet display (Req 6) |
| `paymentStatus` | Order | Payment collection (Req 17) |

## Interfaces

### New API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/customers/[id]/orders` | Customer order history with aggregates |
| GET | `/api/admin/reports/staff` | Staff-wise order report with date filter |
| POST | `/api/admin/orders/[id]/bill` | Set bill number with uniqueness check |
| GET | `/api/admin/orders/[id]/print` | Print view data |
| POST | `/api/admin/orders/[id]/payment-received` | Record payment with method |

### Modified API Endpoints

| Method | Path | Change |
|--------|------|--------|
| POST | `/api/auth/otp/send` | Add role check before OTP creation |
| PATCH | `/api/admin/orders/[id]` | Ensure `updatedAt` is set on status change |
| POST | `/api/admin/orders/[id]/edit` | Set approval status on substitution |

### Shared Utility Functions

| Function | Module | Purpose |
|----------|--------|---------|
| `isDeliveryEtaVisible(status)` | `packages/shared` | ETA visibility logic |
| `formatQuantityWithUnit(qty, unit)` | `packages/shared` | Order sheet formatting |
| `canRevertStatus(status)` | `packages/shared` | Revert button enablement |
| `canDeleteAddress(address)` | `packages/shared` | Default address protection |
| `validateAddressForm(data)` | `packages/shared` | Address validation |
| `checkBillNumberUnique(billNumber)` | `apps/web/lib` | Bill uniqueness (server-only) |
| `calculateDamageReduction(price, qty)` | `packages/shared` | Damage auto-calc |
| `shouldShowBilledBadge(order)` | `packages/shared` | Badge visibility |
| `isPaymentMethodValid(selected)` | `packages/shared` | Payment validation |

## Error Handling

| Scenario | Error Response | User-Facing Message |
|----------|---------------|---------------------|
| Staff attempts OTP login | 400 + error string | "OTP login is available for customers only. Please use staff login." |
| Duplicate bill number | 409 + error string | "Bill number already in use. Please enter a unique bill number." |
| Delete default address | 400 + error string | "Default address cannot be deleted. Set another address as default first." |
| Empty address fields | Client-side validation | Field-level: "{field} is required" |
| Invalid status revert | Button disabled | No action (UI prevention) |
| No payment method selected | Button disabled | "Please select a payment method" |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Customer order list is sorted by creation date descending

For any customer with N orders in the database, the customer order history query SHALL return those orders sorted such that for all consecutive pairs (order[i], order[i+1]), order[i].createdAt >= order[i+1].createdAt.

**Validates: Requirements 1.1**

### Property 2: Customer order aggregates are correct

For any customer with a set of orders, the displayed total order count SHALL equal the number of orders, and the displayed total spend SHALL equal the sum of all order `total` values.

**Validates: Requirements 1.3**

### Property 3: Staff report maps orders to correct staff and delivery partners

For any order in the staff report, the acknowledged-by column SHALL display the name of the User referenced by `acknowledgedById`, and the delivery partner column SHALL display the name of the User referenced by `deliveryPartnerId` (or "Unassigned" if null).

**Validates: Requirements 2.1, 2.2, 2.4**

### Property 4: Staff report date range filtering is complete and sound

For any date range [startDate, endDate] and set of orders, the filtered report SHALL contain exactly those orders where startDate <= createdAt <= endDate, and SHALL exclude all orders outside that range.

**Validates: Requirements 2.3**

### Property 5: Delivery ETA visibility is determined by dispatch status

For any order status, the delivery ETA SHALL be visible if and only if the status is OUT_FOR_DELIVERY or ARRIVING. For all other statuses (ORDER_RECEIVED, ACCEPTED, PACKING, READY_FOR_DELIVERY, AWAITING_CUSTOMER_APPROVAL, CUSTOMER_UNAVAILABLE, RETURNED_TO_STORE, DELIVERED, CANCELLED), the ETA SHALL be hidden.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 6: Order sheet unit formatting

For any order item with quantity Q and unit U, the formatted display string SHALL equal "{Q} {U}" (e.g., "2 kg", "3 pcs").

**Validates: Requirements 6.1, 6.2**

### Property 7: Substitution requiring approval transitions order to pending state

For any order and any item substitution where `requiresCustomerApproval` is true, after confirmation the order's `editApprovalStatus` SHALL be "PENDING" and `status` SHALL be "AWAITING_CUSTOMER_APPROVAL".

**Validates: Requirements 7.1**

### Property 8: Print view contains all required order sections

For any order, the print view rendering SHALL contain the order number, customer name, delivery address, all item names with quantities and units, payment method, bill number (if set), and order total.

**Validates: Requirements 8.2**

### Property 9: Billed badge shown if and only if billNumber exists and status is PACKING or later

For any order, the "Billed" badge SHALL be displayed if and only if billNumber is non-null AND the order status is one of PACKING, READY_FOR_DELIVERY, OUT_FOR_DELIVERY, ARRIVING, or DELIVERED.

**Validates: Requirements 9.1**

### Property 10: Order updatedAt is refreshed on every state change

For any order, when a status transition or edit operation is performed, the resulting `updatedAt` timestamp SHALL be greater than or equal to the timestamp before the operation.

**Validates: Requirements 10.3**

### Property 11: Status revert control disabled for non-revertible statuses

For any order status, the revert control SHALL be disabled if and only if the status is ORDER_RECEIVED (no previous state), DELIVERED, or CANCELLED (terminal states).

**Validates: Requirements 11.1, 11.2**

### Property 12: Default address cannot be deleted

For any address where `isDefault` is true, the delete operation SHALL be rejected and the address SHALL remain in the database unchanged.

**Validates: Requirements 12.3**

### Property 13: OTP login restricted to customer role

For any user with a role other than CUSTOMER (i.e., STAFF, ADMIN, OWNER, MANAGER, PACKING_STAFF, or DELIVERY_PARTNER), the OTP send request SHALL be rejected with a non-empty, non-undefined error message.

**Validates: Requirements 13.1, 13.2, 13.3**

### Property 14: Address form validation rejects incomplete submissions

For any address form submission where at least one of houseName, street, landmark, or pincode is empty or whitespace-only, the validation SHALL fail, return error messages for each invalid field, and no server request SHALL be made.

**Validates: Requirements 14.1, 14.2, 14.4**

### Property 15: Bill number uniqueness enforcement

For any bill number B and set of existing orders, if any order already has billNumber = B, then attempting to assign B to a different order SHALL be rejected. If no other order has billNumber = B, the assignment SHALL succeed.

**Validates: Requirements 15.1, 15.2, 15.3**

### Property 16: Damage reduction auto-calculation

For any order item with unit price P and reported damage quantity Q, the auto-populated reduction amount SHALL equal P × Q. When Q changes to Q', the reduction SHALL update to P × Q'.

**Validates: Requirements 16.1, 16.3**

### Property 17: Payment method selection validation

For any state of the payment collection modal, the confirm action SHALL be enabled if and only if exactly one payment method (UPI, Cash, or Card) is selected.

**Validates: Requirements 17.2**

### Property 18: Payment confirmation records correct state

For any valid payment confirmation with a selected method M, the resulting order SHALL have paymentStatus = PAID and the delivery collection record SHALL reflect the selected method M.

**Validates: Requirements 17.3**
