export const STORE_COORDINATES = {
  lat: 8.4004,
  lng: 77.0851
};

export const SITE = {
  name: "Revathy Supermarket",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://revathysupermarket.in",
  phone: "+91 98765 43210",
  whatsapp: "919876543210",
  address: "Neyyattinkara, Kerala, India",
  deliveryRadiusKm: 5
};

export const orderStatuses = [
  "ORDER_RECEIVED",
  "ACCEPTED",
  "PACKING",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED"
] as const;

export const statusLabels: Record<(typeof orderStatuses)[number], string> = {
  ORDER_RECEIVED: "Order Received",
  ACCEPTED: "Accepted",
  PACKING: "Packing",
  READY_FOR_DELIVERY: "Ready For Delivery",
  OUT_FOR_DELIVERY: "Out For Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
};
