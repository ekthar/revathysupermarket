# Implementation Plan: Order Management Fixes

## Overview

This plan covers 19 discrete fixes and improvements across the Revathy Supermarket monorepo (Next.js 15 web app, React Native/Expo mobile apps). Implementation is organized by concern area, starting with shared utilities, then API/backend changes, followed by web UI fixes, and finally mobile UI fixes. All code uses TypeScript.

## Tasks

- [x] 1. Implement shared utility functions
  - [x] 1.1 Create order status helper utilities in `packages/shared`
    - Add `isDeliveryEtaVisible(status)` — returns true only for OUT_FOR_DELIVERY or ARRIVING
    - Add `canRevertStatus(status)` — returns false for ORDER_RECEIVED, DELIVERED, CANCELLED
    - Add `shouldShowBilledBadge(order)` — checks non-null billNumber and status PACKING or later
    - Add `shouldShowPackingBadge(order)` — checks status === PACKING
    - Add `formatQuantityWithUnit(qty, unit)` — returns "{qty} {unit}"
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.2, 9.1, 9.2, 11.1, 11.2_

  - [x] 1.2 Create address and payment validation utilities in `packages/shared`
    - Add `canDeleteAddress(address)` — returns false if `isDefault` is true
    - Add `validateAddressForm(data)` — validates houseName, street, landmark, pincode are non-empty
    - Add `isPaymentMethodValid(selected)` — returns true if exactly one method selected
    - Add `calculateDamageReduction(unitPrice, quantity)` — returns unitPrice × quantity
    - _Requirements: 12.3, 14.1, 14.2, 16.1, 16.3, 17.2_

  - [ ]* 1.3 Write property tests for shared utilities
    - **Property 5: Delivery ETA visibility is determined by dispatch status**
    - **Property 6: Order sheet unit formatting**
    - **Property 9: Billed badge shown if and only if billNumber exists and status is PACKING or later**
    - **Property 11: Status revert control disabled for non-revertible statuses**
    - **Property 12: Default address cannot be deleted**
    - **Property 14: Address form validation rejects incomplete submissions**
    - **Property 16: Damage reduction auto-calculation**
    - **Property 17: Payment method selection validation**
    - **Validates: Requirements 3, 6, 9, 11, 12, 14, 16, 17**

- [x] 2. Implement API/backend changes
  - [x] 2.1 Create customer order history API endpoint
    - New route at `apps/web/app/api/admin/customers/[id]/orders/route.ts`
    - Query orders by userId, sorted by createdAt descending
    - Include aggregates: total order count and total spend
    - _Requirements: 1.1, 1.3_

  - [x] 2.2 Create staff-wise order report API endpoint
    - New route at `apps/web/app/api/admin/reports/staff/route.ts`
    - Accept optional startDate/endDate query params for filtering
    - Join Order → acknowledgedBy User and deliveryPartner User
    - Return "Unassigned" placeholder for null relations
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.3 Fix OTP send handler to restrict to customer role
    - Modify `apps/web/app/api/auth/otp/send/route.ts`
    - Before creating OTP, verify phone belongs to CUSTOMER role or is unregistered
    - Reject non-customer roles with message: "OTP login is available for customers only. Please use staff login."
    - Ensure no "undefined" or blank error states
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 2.4 Implement delivery OTP auto-generation and expiry handling
    - Modify OTP generation for delivery verification to auto-generate (not require manual entry)
    - On OTP expiry, suppress display of expired OTP on admin and staff panels
    - Only show active delivery OTP to the customer for verification purposes
    - Add expiry check logic: if OTP is expired, return null/hidden for admin/staff API responses
    - _Requirements: 13 (updated — delivery OTP auto-generation, expiry visibility restriction)_

  - [x] 2.5 Create bill number uniqueness check endpoint
    - New or modified route at `apps/web/app/api/admin/orders/[id]/bill/route.ts`
    - Check if billNumber already exists on any other order
    - Reject duplicates with error: "Bill number already in use. Please enter a unique bill number."
    - Save billNumber on success
    - _Requirements: 15.1, 15.2, 15.3_

  - [x] 2.6 Implement substitution approval status update
    - Modify `apps/web/app/api/admin/orders/[id]/edit/route.ts`
    - On substitution requiring customer approval: set `editApprovalStatus` to PENDING and status to AWAITING_CUSTOMER_APPROVAL
    - Trigger customer notification for approval review
    - Ensure `updatedAt` is refreshed on every status change
    - _Requirements: 7.1, 7.2, 10.3_

  - [x] 2.7 Create payment received endpoint with method selection
    - New route at `apps/web/app/api/admin/orders/[id]/payment-received/route.ts`
    - Accept payment method (UPI, Cash, or Card) in request body
    - Update order paymentStatus to PAID
    - Record method in DeliveryCollection (cashCollected, upiCollected, etc.)
    - _Requirements: 17.3_

  - [ ]* 2.8 Write property tests for API business logic
    - **Property 13: OTP login restricted to customer role**
    - **Property 15: Bill number uniqueness enforcement**
    - **Property 7: Substitution requiring approval transitions order to pending state**
    - **Property 18: Payment confirmation records correct state**
    - **Validates: Requirements 7, 13, 15, 17**

- [x] 3. Checkpoint - Ensure shared utilities and API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement web admin UI fixes
  - [x] 4.1 Create customer order history page
    - New page at `apps/web/app/admin/customers/[id]/orders/page.tsx`
    - Server component fetching customer orders with aggregates
    - Display customer name, phone, order count, total spend in header
    - Render paginated order list sorted by date, each linking to order detail
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 4.2 Create staff-wise order report page
    - New page at `apps/web/app/admin/reports/staff/page.tsx`
    - Tabular display: order number, customer name, acknowledged-by, delivery partner, status, date
    - Client-side date range picker for filtering
    - Show "Unassigned" for null staff/delivery partner
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.3 Fix delivery ETA visibility on web customer-facing order page
    - Modify `apps/web/components/tracking/delivery-eta.tsx`
    - Conditionally render ETA using `isDeliveryEtaVisible(status)`
    - Hide ETA for pre-dispatch statuses, show only for OUT_FOR_DELIVERY/ARRIVING
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 4.4 Remove "View Order" button from order alarm component
    - Modify `apps/web/components/admin/new-order-alert.tsx`
    - Verify and ensure only dismiss/acknowledge actions exist — no "View Order" navigation button
    - Alarm dismissal should close overlay without navigation
    - _Requirements: 4.1, 4.2_

  - [x] 4.5 Fix substitute window default quantity
    - Modify substitute modal component (e.g., `apps/web/components/admin/substitute-modal.tsx`)
    - Initialize quantity state to 1 (not 0 or empty) when modal opens
    - Allow staff to modify quantity before confirming
    - _Requirements: 5.1, 5.2_

  - [x] 4.6 Add unit display to order sheet
    - Modify `apps/web/components/admin/order-sheet.tsx`
    - Use `formatQuantityWithUnit(qty, unit)` for each line item
    - Ensure Product `unit` field is included in the order item query
    - _Requirements: 6.1, 6.2_

  - [x] 4.7 Create single consolidated print view
    - New route at `apps/web/app/admin/orders/[id]/print/page.tsx`
    - Consolidate: order number, date, customer info, delivery address, items with qty/unit/price, totals, payment method, bill number, status
    - Open in single new tab, auto-invoke `window.print()` on load
    - Print button in order detail opens this route via `window.open`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 4.8 Fix Billed and Packing status badges in order list
    - Modify `apps/web/components/admin/orders/order-list.tsx`
    - Use `shouldShowBilledBadge(order)` and `shouldShowPackingBadge(order)`
    - Render "Billed" badge in green/teal, "Packing" badge in amber/orange with distinct styling
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 4.9 Display "Updated Last Time" on web customer order status page
    - Modify `apps/web/components/tracking/order-timeline.tsx`
    - Display `order.updatedAt` formatted as relative time (e.g., "Last updated: 5 minutes ago")
    - _Requirements: 10.1, 10.2_

  - [x] 4.10 Disable "Old Update" revert control for non-revertible statuses
    - Modify `apps/web/components/admin/order-status-form.tsx`
    - Use `canRevertStatus(status)` to disable the revert button
    - Render disabled visual state for ORDER_RECEIVED, DELIVERED, CANCELLED
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 4.11 Hide expired delivery OTP from admin and staff panels
    - Modify admin order detail view to check OTP expiry before displaying
    - If OTP is expired, do not render OTP value in admin/staff interfaces
    - Only the customer-facing view should show active OTP for delivery verification
    - _Requirements: 13 (updated — OTP expiry visibility)_

  - [x] 4.12 Create Payment Collection Modal with method selection
    - New component at `apps/web/components/admin/payment-collection-modal.tsx`
    - Display UPI, Cash, Card options when "Received Full" is clicked
    - Require exactly one method selected before enabling confirm button
    - On confirm, call payment-received API endpoint
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

  - [x] 4.13 Fix bill number input with duplication check
    - Modify bill number entry in order detail
    - On submit, call bill number API that checks uniqueness
    - Display error "Bill number already in use. Please enter a unique bill number." on duplicates
    - _Requirements: 15.1, 15.2, 15.3_

- [-] 5. Checkpoint - Ensure web admin fixes work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement mobile app fixes
  - [x] 6.1 Fix delivery ETA visibility in mobile customer app
    - Modify `apps/mobile-customer/src/components/OrderTracking.tsx`
    - Conditionally render ETA using `isDeliveryEtaVisible(status)` from shared package
    - Hide ETA for pre-dispatch statuses
    - _Requirements: 3.3, 3.4_

  - [x] 6.2 Display "Customer Awaiting Approval" status in mobile staff app
    - Modify order status display in mobile staff app
    - Map AWAITING_CUSTOMER_APPROVAL status to "Customer Awaiting Approval" label
    - _Requirements: 7.3_

  - [x] 6.3 Display approval notification in mobile customer app
    - When order transitions to AWAITING_CUSTOMER_APPROVAL, show notification to customer
    - Prompt customer to review and approve/reject substitution
    - _Requirements: 7.4_

  - [x] 6.4 Display "Updated Last Time" in mobile customer order tracking
    - Modify `apps/mobile-customer/app/(tabs)/orders/[id].tsx`
    - Show `updatedAt` formatted as relative time on order tracking screen
    - _Requirements: 10.1_

  - [x] 6.5 Implement address edit and default deletion prevention
    - Modify `apps/mobile-customer/app/(tabs)/account/addresses.tsx`
    - Add "Edit" button on each address card navigating to editable form pre-populated with existing data
    - Disable/hide delete button for addresses where `isDefault` is true
    - Show error: "Default address cannot be deleted. Set another address as default first."
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 6.6 Implement address form validation with toast notification
    - Add validation to address form: houseName, street, landmark, pincode must be non-empty
    - Show field-level error messages for empty required fields
    - Prevent form submission when validation fails
    - Show toast "Address updated successfully." on successful save
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [x] 6.7 Implement damage amount auto-calculation in delivery app
    - Modify `apps/mobile-delivery/app/(tabs)/orders/[id]/damage-report.tsx`
    - On item selection, auto-populate reduction = unitPrice × quantity
    - On quantity change, recalculate reduction amount
    - Allow manual override of the auto-populated amount
    - _Requirements: 16.1, 16.2, 16.3_

  - [x] 6.8 Fix delivery boy cash collection UI — button visibility layout fix
    - Modify the delivery app payment collection screen layout
    - Fix layout so that "Cash Collected" button at the bottom is NOT hidden/blocked by the cash/UPI input section
    - Ensure the button is always visible and accessible regardless of input section state
    - Use proper scroll view or fixed positioning so the button remains tappable
    - _Requirements: (New fix — delivery cash collection UI layout)_

  - [ ]* 6.9 Write unit tests for mobile address validation and damage calculation
    - Test address form validation edge cases (empty strings, whitespace-only)
    - Test damage reduction calculation with various quantities
    - Test `canDeleteAddress` for default and non-default addresses
    - **Validates: Requirements 12, 14, 16**

- [ ] 7. Integration and wiring
  - [-] 7.1 Wire customer order history page into admin navigation
    - Add link from customer list/profile to `/admin/customers/[id]/orders`
    - Ensure breadcrumbs and navigation work correctly
    - _Requirements: 1.1, 1.2_

  - [-] 7.2 Wire staff report page into admin reports navigation
    - Add navigation entry for Staff Report in admin reports section
    - _Requirements: 2.1_

  - [-] 7.3 Wire Payment Collection Modal into order detail payment section
    - Replace direct "Received Full" action with modal trigger
    - Connect modal confirmation to payment-received API endpoint
    - _Requirements: 17.1_

  - [~] 7.4 Wire delivery OTP auto-generation into order dispatch flow
    - When order is dispatched, auto-generate delivery OTP (not manual)
    - Store OTP with expiry timestamp
    - Customer sees OTP for delivery verification; admin/staff panels hide expired OTPs
    - _Requirements: 13 (updated — auto-generated delivery OTP)_

- [~] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Requirement 13 update: Delivery OTP is auto-generated (not manual entry), expired OTPs are hidden from admin/staff panels, and only customers see active OTP for delivery verification
- New fix: Delivery boy cash collection UI — "Cash Collected" button must not be hidden behind cash/UPI input section; layout fix ensures the button is always visible and tappable

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1", "2.2", "2.3", "2.4", "2.5", "2.7"] },
    { "id": 2, "tasks": ["2.6", "2.8"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.10", "4.11", "6.1", "6.2", "6.4", "6.7", "6.8"] },
    { "id": 4, "tasks": ["4.7", "4.8", "4.9", "4.12", "4.13", "6.3", "6.5", "6.6"] },
    { "id": 5, "tasks": ["6.9", "7.1", "7.2", "7.3", "7.4"] }
  ]
}
```
