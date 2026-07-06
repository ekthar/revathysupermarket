import { LOCATION_CONSTANTS, CART_CONSTANTS, LOYALTY_TIERS } from "../constants";

// ============================================
// Haversine Distance Calculation
// ============================================

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function calculateDistanceKm(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const dLat = toRadians(point1.lat - point2.lat);
  const dLng = toRadians(point1.lng - point2.lng);
  const lat1 = toRadians(point2.lat);
  const lat2 = toRadians(point1.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return (
    2 * LOCATION_CONSTANTS.EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

export function isWithinDeliveryRadius(
  customer: { lat: number; lng: number },
  store: { lat: number; lng: number },
  radiusKm: number
): boolean {
  return calculateDistanceKm(customer, store) <= radiusKm;
}

// ============================================
// Cart Calculations
// ============================================

export function calculateCartTotals(items: Array<{ price: number; discountPrice: number | null; quantity: number }>) {
  const subtotal = items.reduce(
    (sum, item) => sum + (item.discountPrice ?? item.price) * item.quantity,
    0
  );

  const savings = items.reduce((sum, item) => {
    if (item.discountPrice != null && item.discountPrice < item.price) {
      return sum + (item.price - item.discountPrice) * item.quantity;
    }
    return sum;
  }, 0);

  const gst = subtotal * CART_CONSTANTS.GST_RATE;
  const deliveryFee =
    subtotal >= CART_CONSTANTS.FREE_DELIVERY_THRESHOLD
      ? 0
      : CART_CONSTANTS.DEFAULT_DELIVERY_FEE;
  const total = subtotal + gst + deliveryFee;

  return { subtotal, savings, gst, deliveryFee, total };
}

// ============================================
// Loyalty Calculations
// ============================================

export function getLoyaltyTier(points: number): keyof typeof LOYALTY_TIERS {
  if (points >= LOYALTY_TIERS.Platinum.minPoints) return "Platinum";
  if (points >= LOYALTY_TIERS.Gold.minPoints) return "Gold";
  if (points >= LOYALTY_TIERS.Silver.minPoints) return "Silver";
  return "Bronze";
}

export function getLoyaltyTierProgress(points: number): number {
  const tier = getLoyaltyTier(points);
  const config = LOYALTY_TIERS[tier];
  if (tier === "Platinum") return 1.0;
  const range = config.maxPoints - config.minPoints;
  return (points - config.minPoints) / range;
}

export function getNextTierPoints(points: number): number {
  const tier = getLoyaltyTier(points);
  if (tier === "Platinum") return points;
  return LOYALTY_TIERS[tier].maxPoints;
}

// ============================================
// Formatting Utilities
// ============================================

export function formatCurrency(amount: number): string {
  return `\u20B9${amount.toFixed(0)}`;
}

export function formatCurrencyDecimal(amount: number): string {
  return `\u20B9${amount.toFixed(2)}`;
}

export function formatOrderStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ============================================
// Delivery Fee Calculation
// ============================================

export function calculateDeliveryFee(
  distanceKm: number,
  baseFee: number,
  freeThreshold: number,
  subtotal: number,
  perKmRate: number = 5
): number {
  if (subtotal >= freeThreshold) return 0;
  return Math.max(baseFee, distanceKm * perKmRate);
}

// ============================================
// GST Calculation
// ============================================

export function calculateGst(
  subtotal: number,
  gstRatePercent: number,
  taxableTotal: number = subtotal
): number {
  return taxableTotal * (gstRatePercent / 100);
}

// ============================================
// Loyalty Points Calculation
// ============================================

export function calculateLoyaltyDiscount(
  points: number,
  pointValueRupees: number,
  maxRedemptionPercent: number,
  subtotal: number
): number {
  const maxDiscount = subtotal * (maxRedemptionPercent / 100);
  const pointsValue = points * pointValueRupees;
  return Math.min(pointsValue, maxDiscount);
}

export function calculateEarnedPoints(
  orderAmount: number,
  earnRupeesPerPoint: number
): number {
  return Math.floor(orderAmount / earnRupeesPerPoint);
}

// ============================================
// Time Helpers
// ============================================

export function timeAgo(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

// ============================================
// Validation Helpers
// ============================================

export function isValidOtp(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

export function isValidPinCode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode);
}

export function isInDeliveryRadius(
  distanceKm: number,
  maxRadiusKm: number
): boolean {
  return distanceKm <= maxRadiusKm;
}
