export const roleLabels: Record<string, string> = {
  CUSTOMER: "Customer",
  OWNER: "Owner",
  ADMIN: "Legacy Admin / Owner Access",
  MANAGER: "Manager",
  PACKING_STAFF: "Packing Staff",
  STAFF: "Staff",
  DELIVERY_PARTNER: "Delivery Partner",
  INVALID: "Signed out"
};

export const staffLoginRoles = new Set(["ADMIN", "OWNER", "MANAGER", "PACKING_STAFF", "STAFF"]);

export function roleLabel(role?: string | null) {
  return role ? roleLabels[role] ?? role.replaceAll("_", " ") : "Guest";
}

export function isCustomerRole(role?: string | null) {
  return role === "CUSTOMER";
}

export function isDeliveryPartnerRole(role?: string | null) {
  return role === "DELIVERY_PARTNER";
}

export function isStaffLoginRole(role?: string | null) {
  return staffLoginRoles.has(String(role ?? ""));
}

