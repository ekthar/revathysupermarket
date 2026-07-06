// ============================================
// User & Auth Types
// ============================================

export type UserRole =
  | "CUSTOMER"
  | "ADMIN"
  | "STAFF"
  | "OWNER"
  | "MANAGER"
  | "PACKING_STAFF"
  | "DELIVERY_PARTNER";

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  image: string | null;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

// ============================================
// Product & Category Types
// ============================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  unit: string;
  isActive: boolean;
  isFeatured: boolean;
  gstRate: number | null;
  categoryId: string;
  category?: Category;
}

export interface Banner {
  id: string;
  title: string;
  image: string;
  link: string | null;
  isActive: boolean;
}

// ============================================
// Cart Types
// ============================================

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  discountPrice: number | null;
  quantity: number;
  unit: string;
  stock: number;
}

export interface CartValidationResult {
  valid: boolean;
  items: CartItem[];
  unavailableItems: string[];
  priceChanges: Array<{
    productId: string;
    oldPrice: number;
    newPrice: number;
  }>;
}

// ============================================
// Order Types
// ============================================

export type OrderStatus =
  | "ORDER_RECEIVED"
  | "AWAITING_CUSTOMER_APPROVAL"
  | "ACCEPTED"
  | "PACKING"
  | "READY_FOR_DELIVERY"
  | "OUT_FOR_DELIVERY"
  | "ARRIVING"
  | "CUSTOMER_UNAVAILABLE"
  | "RETURNED_TO_STORE"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentMethod = "COD" | "UPI_ON_DELIVERY" | "WALLET" | "CARD";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type DeliveryMode = "ASAP" | "SCHEDULED";

export interface OrderAddress {
  houseName: string;
  street: string;
  landmark: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
  deliveryPartnerName?: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryMode: DeliveryMode;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  notes: string | null;
  items: OrderItem[];
  address: OrderAddress;
  customerName: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: OrderStatusEvent[];
  deliveryPartner?: {
    name: string;
    phone: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface OrderStatusEvent {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

// ============================================
// Checkout Types
// ============================================

export interface CheckoutData {
  paymentMethod: PaymentMethod;
  deliveryMode: DeliveryMode;
  addressId: string;
  scheduledSlot?: string;
  promoCode?: string;
  loyaltyPoints?: number;
  notes?: string;
}

export interface DeliverySlot {
  time: string;
  label: string;
  available: boolean;
}

// ============================================
// Address Types
// ============================================

export interface Address {
  id: string;
  label: string;
  houseName: string;
  street: string;
  landmark: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

// ============================================
// Wallet & Loyalty Types
// ============================================

export interface WalletData {
  balance: number;
  transactions: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  reason: string;
  date: string;
}

export interface LoyaltyData {
  points: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  transactions: LoyaltyTransaction[];
}

export interface LoyaltyTransaction {
  id: string;
  points: number;
  type: "EARN" | "REDEEM" | "REVERSE" | "REFERRAL" | "ADJUSTMENT";
  reason: string;
  date: string;
}

// ============================================
// Notification Types
// ============================================

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: "order" | "delivery" | "promo" | "system";
  date: string;
  isRead: boolean;
}

// ============================================
// Delivery Partner Types
// ============================================

export interface DeliveryDashboardData {
  deliveriesToday: number;
  cashCollected: number;
  upiCollected: number;
  lifetimeTotal: number;
  activeOrders: DeliveryActiveOrder[];
}

export interface DeliveryActiveOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  address: string;
  status: OrderStatus;
  distance?: string;
}

export interface DeliveryAssignmentEvent {
  eventId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  address: string;
  timestamp: string;
}

export type CollectionStatus =
  | "PENDING_HANDOVER"
  | "UPI_AWAITING_VERIFICATION"
  | "SETTLED"
  | "SHORT"
  | "EXCESS";

export interface CollectionData {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: CollectionStatus;
}

// ============================================
// Support Types
// ============================================

export type SupportTicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_FOR_CUSTOMER"
  | "RESOLVED"
  | "CLOSED";

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: SupportTicketStatus;
  lastMessage?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// Settings Types
// ============================================

export interface UserSettings {
  orderUpdates: boolean;
  promotions: boolean;
  themeMode: "system" | "light" | "dark";
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// Staff Admin Types
// ============================================

export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  unprintedOrders: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  printedAt: string | null;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  lastSeenAt: string | null;
  isOnline: boolean;
}

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  acknowledgedAt: string | null;
  customerName: string;
  phone: string;
  address: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tip: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  statusEvents: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
  createdAt: string;
}

// ============================================
// Packing Types
// ============================================

export interface PackingOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  itemCount: number;
  total: number;
  status: string;
  createdAt: string;
  items?: PackingItem[];
}

export interface PackingItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  packed: boolean;
}

// ============================================
// Delivery Types (Staff App)
// ============================================

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  total: number;
  status: string;
  itemCount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  statusEvents?: Array<{
    status: string;
    timestamp: string;
  }>;
}

export interface DeliveryDashboard {
  orders: DeliveryOrder[];
  stats?: {
    deliveriesToday: number;
    cashCollected: number;
    upiCollected: number;
  };
}

export interface CollectionPayload {
  orderId: string;
  cashCollected: number;
  upiCollected: number;
  upiReference?: string;
}

export interface CompletionPayload {
  orderId: string;
  otp: string;
}

// ============================================
// Device Token Types
// ============================================

export interface DeviceRegistration {
  token: string;
  platform: string;
  installationId: string;
  role: "customer" | "admin" | "staff";
}

// ============================================
// Trackings Types
// ============================================

export interface TrackingData {
  orderId: string;
  status: string;
  estimatedArrival?: string;
  deliveryPartner?: {
    name: string;
    phone: string;
    latitude: number;
    longitude: number;
  };
  statusHistory: Array<{
    status: string;
    timestamp: string;
  }>;
}
