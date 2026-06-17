export const permissionsMatrix = {
  OWNER: ["settings", "staff", "products", "orders", "returns", "refunds", "audit"],
  ADMIN: ["settings", "staff", "products", "orders", "returns", "refunds", "audit"],
  MANAGER: ["products", "orders", "customers", "returns", "audit"],
  STAFF: ["orders", "products"],
  PACKING_STAFF: ["packing_orders", "item_unavailable"],
  DELIVERY_PARTNER: ["own_assigned_orders", "pickup", "deliver", "location_update"],
  CUSTOMER: ["own_orders", "own_profile", "own_returns"]
} as const;

