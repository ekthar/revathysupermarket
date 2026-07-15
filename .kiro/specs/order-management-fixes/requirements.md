# Requirements Document

## Introduction

This specification covers 17 order management bug fixes and improvements for the Revathy Supermarket platform. The fixes span the web admin/staff interface and the mobile customer/staff/delivery apps, addressing issues in order views, reporting, delivery estimates, substitution workflows, printing, status displays, address management, authentication, billing, and payment collection.

## Glossary

- **Order_Management_System**: The core subsystem handling order lifecycle from placement through delivery, including status transitions, item editing, and payment reconciliation.
- **Web_Admin_Panel**: The Next.js 15 web application served at `/admin/*` routes, used by staff, managers, and owners.
- **Mobile_Customer_App**: The React Native/Expo mobile application used by customers to place and track orders.
- **Mobile_Staff_App**: The React Native/Expo mobile application used by staff for order processing and packing.
- **Mobile_Delivery_App**: The React Native/Expo mobile application used by delivery partners for dispatch and delivery tasks.
- **Order_Detail_View**: The page or screen displaying full details for a single order including items, status, customer info, and payment.
- **Staff_Report**: The admin report showing which staff member processed and delivered each order.
- **Delivery_Time_Estimate**: The estimated delivery time displayed to customers, derived from dispatch data.
- **Order_Alarm**: The real-time alert notification shown to staff/delivery partners when a new order arrives.
- **Substitute_Window**: The modal or screen where staff select substitute items when the original product is unavailable.
- **Order_Sheet**: The printable or on-screen summary of order items with quantities used for packing.
- **Edit_Approval_Status**: The `editApprovalStatus` field on the Order model indicating whether customer approval is pending for item swaps.
- **Print_View**: The browser print layout for order details used by staff for packing and billing.
- **Billed_Status**: The visual indicator showing an order has been billed.
- **Packing_Status**: The visual indicator showing an order is currently being packed.
- **Update_Timestamp**: The "last updated" time displayed on customer-facing order views.
- **Old_Update_Control**: The UI control allowing staff to revert to a previous order state.
- **Address_Settings**: The section in customer account settings for managing saved delivery addresses.
- **OTP_Authentication**: The one-time password verification flow used for customer phone login.
- **Bill_Number**: The manually-entered or auto-generated invoice number associated with an order (`billNumber` field on Order).
- **Damage_Report**: The form where delivery partners report damaged items and associated reduction amounts.
- **Payment_Collection_Modal**: The modal shown when marking an order as payment received, allowing selection of payment method.

## Requirements

### Requirement 1: User-Wise Order Details View

**User Story:** As an admin/owner, I want to view order history filtered by a specific customer, so that I can review a customer's ordering patterns and resolve disputes.

#### Acceptance Criteria

1. WHEN an admin navigates to a customer's profile, THE Web_Admin_Panel SHALL display a list of all orders placed by that customer sorted by creation date in descending order.
2. WHEN an admin selects an order from the customer's order list, THE Web_Admin_Panel SHALL navigate to the Order_Detail_View for that specific order.
3. THE Web_Admin_Panel SHALL display the customer name, phone number, total order count, and total spend amount on the customer's order history view.

### Requirement 2: Staff-Wise Order Report

**User Story:** As an admin/owner, I want to see a report showing which staff member processed and which delivery partner delivered each order, so that I can track accountability.

#### Acceptance Criteria

1. WHEN an admin accesses the Staff_Report page, THE Web_Admin_Panel SHALL display a tabular report listing each order with the staff member who acknowledged/processed the order and the delivery partner who delivered the order.
2. THE Staff_Report SHALL include the order number, customer name, acknowledged-by staff name, delivery partner name, order status, and order creation timestamp for each entry.
3. WHERE a date range filter is applied, THE Web_Admin_Panel SHALL restrict the Staff_Report results to orders created within the selected date range.
4. IF an order has no acknowledged-by staff or no assigned delivery partner, THEN THE Web_Admin_Panel SHALL display a dash or "Unassigned" placeholder in the respective column.

### Requirement 3: Delivery Time Estimate Visibility

**User Story:** As a customer, I want to see the delivery time estimate only after my order is dispatched, so that I am not confused by an estimate before the order is on its way.

#### Acceptance Criteria

1. WHILE an order status is ORDER_RECEIVED, ACCEPTED, PACKING, or READY_FOR_DELIVERY, THE Mobile_Customer_App SHALL hide the Delivery_Time_Estimate from the order tracking screen.
2. WHILE an order status is ORDER_RECEIVED, ACCEPTED, PACKING, or READY_FOR_DELIVERY, THE Web_Admin_Panel SHALL hide the Delivery_Time_Estimate from the customer-facing order status page.
3. WHEN an order transitions to OUT_FOR_DELIVERY or ARRIVING status, THE Mobile_Customer_App SHALL display the Delivery_Time_Estimate on the order tracking screen.
4. WHEN an order transitions to OUT_FOR_DELIVERY or ARRIVING status, THE Web_Admin_Panel SHALL display the Delivery_Time_Estimate on the customer-facing order status page.

### Requirement 4: Remove Order Alarm "View Order" Button

**User Story:** As a staff member, I want the order alarm to dismiss without a "View Order" button, so that the alarm is simpler and less distracting.

#### Acceptance Criteria

1. WHEN a new order alarm is displayed, THE Order_Alarm component SHALL render only a dismiss/acknowledge action and SHALL NOT render a "View Order" button.
2. WHEN the alarm is dismissed, THE Order_Alarm component SHALL close the alert overlay without navigating to any order detail page.

### Requirement 5: Substitute Window Default Quantity

**User Story:** As a staff member, I want the substitute item quantity to default to 1 when the substitute window opens, so that I do not accidentally submit a zero-quantity substitute.

#### Acceptance Criteria

1. WHEN the Substitute_Window opens for an item, THE Substitute_Window SHALL set the substitute quantity input field to a default value of 1.
2. THE Substitute_Window SHALL allow the staff member to modify the quantity from the default value before confirming the substitution.

### Requirement 6: Order Sheet Unit Display

**User Story:** As a packing staff member, I want to see the product unit alongside the quantity on the order sheet, so that I know whether an item is measured in kg, pieces, liters, or another unit.

#### Acceptance Criteria

1. THE Order_Sheet SHALL display the product unit (from the Product `unit` field) adjacent to the quantity for each order item.
2. THE Order_Sheet SHALL format the display as "{quantity} {unit}" (e.g., "2 kg", "3 pcs", "1 ltr") for each line item.

### Requirement 7: Customer Awaiting Approval Status After Swap

**User Story:** As a staff member, I want the order to correctly show "Customer Awaiting Approval" status after I perform an item swap, so that the customer is properly notified and can accept or reject the change.

#### Acceptance Criteria

1. WHEN a staff member confirms an item substitution that requires customer approval, THE Order_Management_System SHALL set the order's `editApprovalStatus` to "PENDING" and the order status to AWAITING_CUSTOMER_APPROVAL.
2. WHEN the order status transitions to AWAITING_CUSTOMER_APPROVAL after a swap, THE Web_Admin_Panel SHALL display "Customer Awaiting Approval" as the current order status.
3. WHEN the order status transitions to AWAITING_CUSTOMER_APPROVAL after a swap, THE Mobile_Staff_App SHALL display "Customer Awaiting Approval" as the current order status.
4. WHEN the order status transitions to AWAITING_CUSTOMER_APPROVAL after a swap, THE Mobile_Customer_App SHALL display a notification prompting the customer to review and approve or reject the substitution.

### Requirement 8: Single Consolidated Print View

**User Story:** As a staff member, I want the print action to open a single consolidated view in one browser tab, so that I can print the full order in one step without multiple tabs or fragmented printouts.

#### Acceptance Criteria

1. WHEN a staff member clicks the print button on an Order_Detail_View, THE Web_Admin_Panel SHALL open a single new browser tab containing the complete Print_View.
2. THE Print_View SHALL consolidate all order information (items with quantities and units, customer details, delivery address, payment method, bill number, and order totals) into one continuous printable page.
3. THE Print_View SHALL NOT open multiple tabs or split the order content across separate pages or tabs.
4. WHEN the print tab is opened, THE Web_Admin_Panel SHALL automatically invoke the browser print dialog.

### Requirement 9: Billed and Packing Status Display Fix

**User Story:** As a staff member, I want the order list to correctly display "Billed" and "Packing" status badges, so that I can quickly identify order states.

#### Acceptance Criteria

1. WHILE an order has a non-null `billNumber` and a status of PACKING or later, THE Web_Admin_Panel SHALL display a "Billed" badge on the order card in the order list.
2. WHILE an order has a status of PACKING, THE Web_Admin_Panel SHALL display a "Packing" status badge on the order card in the order list.
3. THE Web_Admin_Panel SHALL render the Billed_Status and Packing_Status badges with distinct visual styling so they are easily distinguishable from each other.

### Requirement 10: Customer Order "Updated Last Time" Display

**User Story:** As a customer, I want to see when my order was last updated, so that I know the current freshness of the order information.

#### Acceptance Criteria

1. THE Mobile_Customer_App SHALL display the Update_Timestamp showing the date and time of the most recent status change or order modification on the order tracking screen.
2. THE Web_Admin_Panel SHALL display the Update_Timestamp on the customer-facing order status page showing when the order was last modified.
3. WHEN the order receives a new status event or edit, THE Order_Management_System SHALL update the order's `updatedAt` timestamp to reflect the modification time.

### Requirement 11: Disable Old Update Control When Cannot Revert

**User Story:** As a staff member, I want the "go back to previous status" control to be disabled when reverting is not possible, so that I do not attempt an invalid state transition.

#### Acceptance Criteria

1. WHILE an order is in the ORDER_RECEIVED status (the initial status), THE Web_Admin_Panel SHALL disable the Old_Update_Control button since no earlier status exists.
2. WHILE an order is in DELIVERED or CANCELLED status, THE Web_Admin_Panel SHALL disable the Old_Update_Control button since terminal statuses cannot be reverted.
3. IF a staff member attempts to click a disabled Old_Update_Control, THEN THE Web_Admin_Panel SHALL not perform any status change and SHALL keep the button visually disabled.

### Requirement 12: Address Edit and Default Address Deletion

**User Story:** As a customer, I want to edit my saved addresses and prevent deletion of my default address, so that I always have a valid delivery address available.

#### Acceptance Criteria

1. WHEN a customer navigates to Address_Settings, THE Mobile_Customer_App SHALL display an edit option for each saved address.
2. WHEN a customer selects edit on an address, THE Mobile_Customer_App SHALL open an editable form pre-populated with the existing address fields (label, customerName, phone, houseName, street, landmark, pincode).
3. WHILE an address is marked as the default address (`isDefault` = true), THE Mobile_Customer_App SHALL disable or hide the delete option for that address.
4. IF a customer attempts to delete their default address, THEN THE Mobile_Customer_App SHALL display an error message stating "Default address cannot be deleted. Set another address as default first."

### Requirement 13: Customer OTP Only — Staff OTP Fix

**User Story:** As a platform operator, I want OTP login to be restricted to customers only and staff login to use credentials, so that staff do not see "undefined" OTP errors.

#### Acceptance Criteria

1. WHEN a user attempts OTP-based login, THE OTP_Authentication system SHALL verify that the phone number belongs to a user with the CUSTOMER role before sending the OTP.
2. IF a phone number belongs to a user with STAFF, ADMIN, OWNER, MANAGER, PACKING_STAFF, or DELIVERY_PARTNER role, THEN THE OTP_Authentication system SHALL reject the OTP request and return a clear error message stating "OTP login is available for customers only. Please use staff login."
3. THE OTP_Authentication system SHALL NOT display "undefined" or blank error states when a staff member's phone is entered in the customer OTP flow.

### Requirement 14: Address Saving Validation and Notification

**User Story:** As a customer, I want mandatory field validation when saving an address and a confirmation notification when the address is updated, so that I know my address was saved correctly.

#### Acceptance Criteria

1. WHEN a customer submits the address form, THE Mobile_Customer_App SHALL validate that houseName, street, landmark, and pincode fields are non-empty before saving.
2. IF any mandatory address field is empty on submission, THEN THE Mobile_Customer_App SHALL display field-level error messages indicating which fields are required.
3. WHEN an address is saved or updated successfully, THE Mobile_Customer_App SHALL display a toast notification with the message "Address updated successfully."
4. THE Mobile_Customer_App SHALL NOT submit the address form to the server when mandatory field validation fails.

### Requirement 15: Bill Number Duplication Check

**User Story:** As a staff member, I want the system to check for duplicate bill numbers when I enter a manual bill number, so that no two orders share the same invoice number.

#### Acceptance Criteria

1. WHEN a staff member enters a manual bill number for an order, THE Order_Management_System SHALL check whether that bill number already exists on any other order in the database.
2. IF the entered bill number already exists on another order, THEN THE Order_Management_System SHALL reject the submission and display an error message stating "Bill number already in use. Please enter a unique bill number."
3. WHEN the bill number is unique, THE Order_Management_System SHALL save the bill number to the order's `billNumber` field.

### Requirement 16: Damage Amount Auto-Load in Report Issue

**User Story:** As a delivery partner, I want the damage/reduction amount to auto-populate based on the selected item's price, so that I do not have to manually calculate the amount.

#### Acceptance Criteria

1. WHEN a delivery partner selects an item in the Damage_Report form, THE Mobile_Delivery_App SHALL automatically populate the reduction amount field with the item's unit price multiplied by the reported quantity.
2. THE Damage_Report form SHALL allow the delivery partner to override the auto-populated reduction amount if the actual damage value differs.
3. WHEN the reported quantity changes, THE Damage_Report form SHALL recalculate and update the auto-populated reduction amount based on the new quantity multiplied by the item's unit price.

### Requirement 17: "Received Full" Payment Method Selection

**User Story:** As a staff member, I want to select UPI, Cash, or Card when marking an order as "received full" payment, so that the collection record accurately reflects how the customer paid.

#### Acceptance Criteria

1. WHEN a staff member clicks "Received Full" on an order's payment section, THE Payment_Collection_Modal SHALL display options for UPI, Cash, and Card as payment method choices.
2. THE Payment_Collection_Modal SHALL require the staff member to select exactly one payment method before confirming the payment receipt.
3. WHEN the staff member confirms the payment receipt with a selected method, THE Order_Management_System SHALL update the order's payment status to PAID and record the selected payment method in the delivery collection record.
4. IF no payment method is selected, THEN THE Payment_Collection_Modal SHALL disable the confirm button and display a prompt to select a payment method.
