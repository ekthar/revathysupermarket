// Store coordinates fallback (overridden by DB settings at runtime)
export const STORE_COORDINATES = {
  lat: Number(process.env.STORE_LAT ?? "8.644361"),
  lng: Number(process.env.STORE_LNG ?? "76.843472")
};

export const SITE = {
  name: process.env.NEXT_PUBLIC_STORE_NAME ?? "My Supermarket",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  phone: process.env.NEXT_PUBLIC_STORE_PHONE ?? "+91 98765 43210",
  whatsapp: process.env.NEXT_PUBLIC_STORE_WHATSAPP ?? "919876543210",
  address: process.env.NEXT_PUBLIC_STORE_ADDRESS ?? "Kerala, India",
  deliveryRadiusKm: Number(process.env.NEXT_PUBLIC_DELIVERY_RADIUS ?? "5")
};

export const orderStatuses = [
  "ORDER_RECEIVED",
  "AWAITING_CUSTOMER_APPROVAL",
  "ACCEPTED",
  "PACKING",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED"
] as const;

export const statusLabels: Record<(typeof orderStatuses)[number], string> = {
  ORDER_RECEIVED: "Order Received",
  AWAITING_CUSTOMER_APPROVAL: "Awaiting Customer Approval",
  ACCEPTED: "Accepted",
  PACKING: "Packing",
  READY_FOR_DELIVERY: "Ready For Delivery",
  OUT_FOR_DELIVERY: "Out For Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
};
