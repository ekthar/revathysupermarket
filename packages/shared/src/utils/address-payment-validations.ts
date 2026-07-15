import type { Address } from "../types";

// ============================================
// Payment Collection Method Types
// ============================================

export const COLLECTION_PAYMENT_METHODS = ["UPI", "Cash", "Card"] as const;
export type CollectionPaymentMethod =
  (typeof COLLECTION_PAYMENT_METHODS)[number];

// ============================================
// Address Form Validation
// ============================================

const REQUIRED_ADDRESS_FIELDS = [
  "houseName",
  "street",
  "landmark",
  "pincode",
] as const;

const FIELD_LABELS: Record<(typeof REQUIRED_ADDRESS_FIELDS)[number], string> = {
  houseName: "House name",
  street: "Street",
  landmark: "Landmark",
  pincode: "Pincode",
};

export type AddressFormData = {
  houseName: string;
  street: string;
  landmark: string;
  pincode: string;
};

export type AddressValidationErrors = Partial<
  Record<keyof AddressFormData, string>
>;

export interface AddressValidationResult {
  valid: boolean;
  errors: AddressValidationErrors;
}

/**
 * Validates that mandatory address fields (houseName, street, landmark, pincode)
 * are non-empty and not whitespace-only.
 *
 * Validates: Requirements 14.1, 14.2
 */
export function validateAddressForm(
  data: AddressFormData
): AddressValidationResult {
  const errors: AddressValidationErrors = {};

  for (const field of REQUIRED_ADDRESS_FIELDS) {
    if (!data[field] || data[field].trim() === "") {
      errors[field] = `${FIELD_LABELS[field]} is required`;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ============================================
// Address Deletion Prevention
// ============================================

/**
 * Determines if an address can be deleted.
 * Default addresses cannot be deleted — the user must first set another address as default.
 *
 * Validates: Requirements 12.3
 */
export function canDeleteAddress(address: Pick<Address, "isDefault">): boolean {
  return !address.isDefault;
}

// ============================================
// Payment Method Validation
// ============================================

/**
 * Validates that exactly one payment method is selected.
 * Returns true if a non-null method is provided.
 *
 * Validates: Requirements 17.2
 */
export function isPaymentMethodValid(
  selected: CollectionPaymentMethod | null
): boolean {
  return selected !== null;
}

// ============================================
// Damage Reduction Calculation
// ============================================

/**
 * Calculates the damage reduction amount as unitPrice × quantity.
 * Used in the delivery app damage report form to auto-populate the reduction field.
 *
 * Validates: Requirements 16.1, 16.3
 */
export function calculateDamageReduction(
  unitPrice: number,
  quantity: number
): number {
  return unitPrice * quantity;
}
