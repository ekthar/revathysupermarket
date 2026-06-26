// ============================================
// Store Configuration
// ============================================

export const STORE_COORDINATES = {
  lat: 8.644361,
  lng: 76.843472,
};

export const STORE_INFO = {
  name: "MSM Supermarket",
  phone: "+91 98765 43210",
  whatsapp: "919876543210",
  address: "Kerala, India",
  deliveryRadiusKm: 5,
};

// ============================================
// Order Statuses
// ============================================

export const ORDER_STATUSES = [
  "ORDER_RECEIVED",
  "AWAITING_CUSTOMER_APPROVAL",
  "ACCEPTED",
  "PACKING",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "ARRIVING",
  "CUSTOMER_UNAVAILABLE",
  "RETURNED_TO_STORE",
  "DELIVERED",
  "CANCELLED",
] as const;

export const STATUS_LABELS: Record<(typeof ORDER_STATUSES)[number], string> = {
  ORDER_RECEIVED: "Order Received",
  AWAITING_CUSTOMER_APPROVAL: "Awaiting Customer Approval",
  ACCEPTED: "Accepted",
  PACKING: "Packing",
  READY_FOR_DELIVERY: "Ready For Delivery",
  OUT_FOR_DELIVERY: "Out For Delivery",
  ARRIVING: "Arriving",
  CUSTOMER_UNAVAILABLE: "Customer Unavailable",
  RETURNED_TO_STORE: "Returned To Store",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

// ============================================
// Cart & Pricing Constants
// ============================================

export const CART_CONSTANTS = {
  GST_RATE: 0.05,
  FREE_DELIVERY_THRESHOLD: 500,
  DEFAULT_DELIVERY_FEE: 30,
  MIN_ORDER_AMOUNT: 50,
};

// ============================================
// Loyalty Tiers
// ============================================

export const LOYALTY_TIERS = {
  Bronze: { minPoints: 0, maxPoints: 500 },
  Silver: { minPoints: 500, maxPoints: 1500 },
  Gold: { minPoints: 1500, maxPoints: 4000 },
  Platinum: { minPoints: 4000, maxPoints: Infinity },
};

export const LOYALTY_CONFIG = {
  earnRupeesPerPoint: 10,
  pointValueRupees: 0.25,
  maxRedemptionPercent: 20,
  referralRewardPoints: 100,
};

// ============================================
// Delivery Slots
// ============================================

export const DELIVERY_SLOTS = [
  { time: "9:00 - 11:00", label: "Morning" },
  { time: "11:00 - 1:00", label: "Late Morning" },
  { time: "2:00 - 4:00", label: "Afternoon" },
  { time: "4:00 - 6:00", label: "Evening" },
  { time: "6:00 - 8:00", label: "Late Evening" },
  { time: "8:00 - 10:00", label: "Night" },
];

// ============================================
// Payment Methods
// ============================================

export const PAYMENT_METHODS = [
  { id: "COD", label: "Cash on Delivery", icon: "cash" },
  { id: "UPI_ON_DELIVERY", label: "UPI Payment", icon: "qrcode" },
  { id: "CARD", label: "Credit/Debit Card", icon: "creditcard" },
  { id: "WALLET", label: "Wallet", icon: "wallet" },
] as const;

// ============================================
// GPS & Location
// ============================================

export const LOCATION_CONSTANTS = {
  TRACKING_THROTTLE_SECONDS: 5,
  DISTANCE_FILTER_METERS: 10,
  EARTH_RADIUS_KM: 6371,
};

// ============================================
// Notification Channels
// ============================================

export const NOTIFICATION_CHANNELS = {
  DELIVERY_ALERTS: "delivery_alerts",
  ORDER_UPDATES: "order_updates",
  PROMOTIONS: "promotions",
};

// ============================================
// Audio & Alarm
// ============================================

export const ALARM_CONSTANTS = {
  LOOP_INTERVAL_MS: 3000,
  AUTO_DISMISS_MS: 60000,
  RE_ALERT_INTERVAL_MS: 10000,
};

// ============================================
// Assignment Polling
// ============================================

export const POLLING_CONSTANTS = {
  ASSIGNMENT_POLL_INTERVAL_MS: 30000,
};
