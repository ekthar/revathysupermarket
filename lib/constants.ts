export const STORE_COORDINATES = {
  lat: 8.4004,
  lng: 77.0851
};

export const SITE = {
  name: "MSM Supermarket",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://msmsupermarket.in",
  phone: "+91 98765 43210",
  whatsapp: "919876543210",
  address: "Kerala, India",
  deliveryRadiusKm: 5
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
