import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../products/domain/product_model.dart';
import '../../products/providers/products_provider.dart';

// ========================================
// Wallet Providers
// ========================================

/// Wallet data model holding balance and transaction history.
class WalletData {
  const WalletData({
    this.balance = 0,
    this.transactions = const [],
  });

  final double balance;
  final List<WalletTransaction> transactions;
}

/// Single wallet transaction entry.
class WalletTransaction {
  const WalletTransaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.reason,
    required this.date,
  });

  final String id;
  final String type; // 'credit' or 'debit'
  final double amount;
  final String reason;
  final String date;

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    return WalletTransaction(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? 'credit',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      reason: json['reason'] as String? ?? '',
      date: json['date'] as String? ?? '',
    );
  }
}

/// Provider for wallet data (balance + transactions).
final walletProvider = FutureProvider.autoDispose<WalletData>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.get('/wallet');
    final data = response.data as Map<String, dynamic>;
    final transactions = (data['transactions'] as List?)
            ?.map((t) => WalletTransaction.fromJson(t as Map<String, dynamic>))
            .toList() ??
        [];
    return WalletData(
      balance: (data['balance'] as num?)?.toDouble() ?? 0,
      transactions: transactions,
    );
  } catch (_) {
    return const WalletData();
  }
});

// ========================================
// Loyalty Providers
// ========================================

/// Loyalty data model holding points, tier, and transaction history.
class LoyaltyData {
  const LoyaltyData({
    this.points = 0,
    this.tier = 'Bronze',
    this.transactions = const [],
  });

  final int points;
  final String tier;
  final List<LoyaltyTransaction> transactions;

  /// Progress towards next tier as a value between 0.0 and 1.0.
  double get tierProgress {
    switch (tier) {
      case 'Bronze':
        return points / 500;
      case 'Silver':
        return (points - 500) / 1000;
      case 'Gold':
        return (points - 1500) / 2500;
      case 'Platinum':
        return 1.0;
      default:
        return 0.0;
    }
  }

  int get nextTierPoints {
    switch (tier) {
      case 'Bronze':
        return 500;
      case 'Silver':
        return 1500;
      case 'Gold':
        return 4000;
      case 'Platinum':
        return points;
      default:
        return 500;
    }
  }
}

/// Single loyalty transaction entry.
class LoyaltyTransaction {
  const LoyaltyTransaction({
    required this.id,
    required this.points,
    required this.reason,
    required this.date,
  });

  final String id;
  final int points;
  final String reason;
  final String date;

  factory LoyaltyTransaction.fromJson(Map<String, dynamic> json) {
    return LoyaltyTransaction(
      id: json['id'] as String? ?? '',
      points: json['points'] as int? ?? 0,
      reason: json['reason'] as String? ?? '',
      date: json['date'] as String? ?? '',
    );
  }
}

/// Provider for loyalty data (points + tier + history).
final loyaltyProvider = FutureProvider.autoDispose<LoyaltyData>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.get('/loyalty');
    final data = response.data as Map<String, dynamic>;
    final transactions = (data['transactions'] as List?)
            ?.map(
                (t) => LoyaltyTransaction.fromJson(t as Map<String, dynamic>))
            .toList() ??
        [];
    return LoyaltyData(
      points: data['points'] as int? ?? 0,
      tier: data['tier'] as String? ?? 'Bronze',
      transactions: transactions,
    );
  } catch (_) {
    return const LoyaltyData();
  }
});

// ========================================
// Favorites Providers
// ========================================

/// Provider for user's favorite products list.
final favoritesProvider =
    FutureProvider.autoDispose<List<Product>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.get('/favorites');
    final data = response.data as Map<String, dynamic>;
    final items = (data['items'] as List?)
            ?.map((p) => Product.fromJson(p as Map<String, dynamic>))
            .toList() ??
        [];
    return items;
  } catch (_) {
    return [];
  }
});

// ========================================
// Addresses Providers
// ========================================

/// Address model for delivery locations.
class Address {
  const Address({
    required this.id,
    required this.label,
    required this.houseName,
    required this.street,
    this.landmark = '',
    required this.pincode,
    this.isDefault = false,
  });

  final String id;
  final String label; // Home, Work, Other
  final String houseName;
  final String street;
  final String landmark;
  final String pincode;
  final bool isDefault;

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id: json['id'] as String? ?? '',
      label: json['label'] as String? ?? 'Home',
      houseName: json['houseName'] as String? ?? '',
      street: json['street'] as String? ?? '',
      landmark: json['landmark'] as String? ?? '',
      pincode: json['pincode'] as String? ?? '',
      isDefault: json['isDefault'] as bool? ?? false,
    );
  }
}

/// Provider for user's saved addresses.
final addressesProvider =
    FutureProvider.autoDispose<List<Address>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.get('/addresses');
    final data = response.data as Map<String, dynamic>;
    final items = (data['items'] as List?)
            ?.map((a) => Address.fromJson(a as Map<String, dynamic>))
            .toList() ??
        [];
    return items;
  } catch (_) {
    return [];
  }
});

// ========================================
// Notifications Providers
// ========================================

/// Notification model for user alerts.
class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.date,
    this.isRead = false,
  });

  final String id;
  final String title;
  final String body;
  final String type; // 'order', 'delivery', 'promo', 'system'
  final String date;
  final bool isRead;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? '',
      type: json['type'] as String? ?? 'system',
      date: json['date'] as String? ?? '',
      isRead: json['read'] as bool? ?? false,
    );
  }
}

/// Provider for user's notifications.
final notificationsProvider =
    FutureProvider.autoDispose<List<AppNotification>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.get('/notifications');
    final data = response.data as Map<String, dynamic>;
    final items = (data['items'] as List?)
            ?.map((n) => AppNotification.fromJson(n as Map<String, dynamic>))
            .toList() ??
        [];
    return items;
  } catch (_) {
    return [];
  }
});

// ========================================
// Settings Providers
// ========================================

/// User preferences/settings data.
class SettingsData {
  const SettingsData({
    this.orderUpdates = true,
    this.promotions = true,
    this.themeMode = 'system',
  });

  final bool orderUpdates;
  final bool promotions;
  final String themeMode; // 'system', 'light', 'dark'

  SettingsData copyWith({
    bool? orderUpdates,
    bool? promotions,
    String? themeMode,
  }) {
    return SettingsData(
      orderUpdates: orderUpdates ?? this.orderUpdates,
      promotions: promotions ?? this.promotions,
      themeMode: themeMode ?? this.themeMode,
    );
  }
}

/// StateNotifier for managing user settings locally.
class SettingsNotifier extends StateNotifier<SettingsData> {
  SettingsNotifier() : super(const SettingsData());

  void toggleOrderUpdates(bool value) {
    state = state.copyWith(orderUpdates: value);
  }

  void togglePromotions(bool value) {
    state = state.copyWith(promotions: value);
  }

  void setThemeMode(String mode) {
    state = state.copyWith(themeMode: mode);
  }
}

/// Provider for settings preferences (local state).
final settingsProvider =
    StateNotifierProvider<SettingsNotifier, SettingsData>((ref) {
  return SettingsNotifier();
});

// ========================================
// Support Ticket Providers
// ========================================

/// Support ticket model.
class SupportTicket {
  const SupportTicket({
    required this.id,
    required this.ticketNumber,
    required this.subject,
    required this.status,
    this.lastMessage,
    required this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String ticketNumber;
  final String subject;
  final String status; // 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
  final String? lastMessage;
  final String createdAt;
  final String? updatedAt;

  factory SupportTicket.fromJson(Map<String, dynamic> json) {
    return SupportTicket(
      id: json['id'] as String? ?? '',
      ticketNumber: json['ticketNumber'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      status: json['status'] as String? ?? 'OPEN',
      lastMessage: json['lastMessage'] as String?,
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String?,
    );
  }
}

/// Provider for support tickets.
final supportTicketsProvider =
    FutureProvider.autoDispose<List<SupportTicket>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  try {
    final response = await apiClient.get('/support/tickets');
    final data = response.data as Map<String, dynamic>;
    final items = (data['items'] as List?)
            ?.map((t) => SupportTicket.fromJson(t as Map<String, dynamic>))
            .toList() ??
        [];
    return items;
  } catch (_) {
    return [];
  }
});
