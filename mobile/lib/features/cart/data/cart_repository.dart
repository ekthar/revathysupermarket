import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../../../core/network/api_client.dart';
import '../domain/cart_item_model.dart';

/// Abstract storage interface for cart persistence.
abstract class CartStorage {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
  Future<void> delete(String key);
}

/// Repository managing cart operations with local persistence.
///
/// Cart is stored locally and validated against the server before checkout.
class CartRepository {
  CartRepository({
    required CartStorage storage,
    ApiClient? apiClient,
  })  : _storage = storage,
        _apiClient = apiClient;

  final CartStorage _storage;
  final ApiClient? _apiClient;
  static const _cartKey = 'msm_cart_v1';

  List<CartItem> _items = [];
  bool _loaded = false;

  /// Returns current cart items.
  List<CartItem> get items => List.unmodifiable(_items);

  /// Returns total number of items in cart.
  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);

  /// Returns subtotal based on local prices.
  double get subtotal => _items.fold(
        0,
        (sum, item) =>
            sum + (item.discountPrice ?? item.price) * item.quantity,
      );

  /// Loads cart from local storage.
  Future<void> loadCart() async {
    if (_loaded) return;
    try {
      final raw = await _storage.read(_cartKey);
      if (raw != null) {
        final List<dynamic> decoded = json.decode(raw) as List<dynamic>;
        _items = decoded
            .map((e) => CartItem.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('CartRepository: Failed to load cart: $e');
      _items = [];
    }
    _loaded = true;
  }

  /// Adds a product to the cart or increments its quantity.
  Future<void> addItem(CartItem item) async {
    await loadCart();
    final index = _items.indexWhere((i) => i.productId == item.productId);
    if (index >= 0) {
      _items[index] = _items[index].copyWith(
        quantity: _items[index].quantity + item.quantity,
      );
    } else {
      _items.add(item);
    }
    await _persist();
  }

  /// Removes a product from the cart.
  Future<void> removeItem(String productId) async {
    await loadCart();
    _items.removeWhere((i) => i.productId == productId);
    await _persist();
  }

  /// Updates the quantity of a specific cart item.
  Future<void> updateQuantity(String productId, int quantity) async {
    await loadCart();
    if (quantity <= 0) {
      return removeItem(productId);
    }
    final index = _items.indexWhere((i) => i.productId == productId);
    if (index >= 0) {
      _items[index] = _items[index].copyWith(quantity: quantity);
      await _persist();
    }
  }

  /// Clears all items from the cart.
  Future<void> clearCart() async {
    _items = [];
    await _persist();
  }

  /// Validates the cart against server prices and stock.
  ///
  /// Returns updated cart items with current prices and availability.
  Future<CartValidationResult> validateCart() async {
    if (_apiClient == null) {
      return CartValidationResult(valid: true, items: _items);
    }

    await loadCart();
    if (_items.isEmpty) {
      return CartValidationResult(valid: true, items: []);
    }

    final payload = {
      'items': _items
          .map((i) => {'productId': i.productId, 'quantity': i.quantity})
          .toList(),
    };

    final response = await _apiClient.post<Map<String, dynamic>>(
      '/cart/validate',
      data: payload,
    );

    final data = response.data!;
    final serverItems = (data['items'] as List).cast<Map<String, dynamic>>();
    final valid = data['valid'] as bool;

    // Update local cart with server prices
    final updatedItems = <CartItem>[];
    for (final serverItem in serverItems) {
      final available = serverItem['available'] as bool;
      updatedItems.add(CartItem(
        productId: serverItem['productId'] as String,
        name: serverItem['name'] as String,
        price: (serverItem['originalPrice'] as num?)?.toDouble() ??
            (serverItem['currentPrice'] as num).toDouble(),
        discountPrice: serverItem['discountPrice'] != null
            ? (serverItem['discountPrice'] as num).toDouble()
            : null,
        quantity: serverItem['quantity'] as int,
        image: serverItem['image'] as String? ?? '',
        unit: serverItem['unit'] as String? ?? '',
        available: available,
        unavailableReason:
            available ? null : serverItem['reason'] as String?,
      ));
    }

    _items = updatedItems;
    await _persist();

    return CartValidationResult(
      valid: valid,
      items: updatedItems,
      subtotal: (data['subtotal'] as num?)?.toDouble(),
    );
  }

  Future<void> _persist() async {
    final encoded = json.encode(_items.map((i) => i.toJson()).toList());
    await _storage.write(_cartKey, encoded);
  }
}

/// Result of server-side cart validation.
class CartValidationResult {
  const CartValidationResult({
    required this.valid,
    required this.items,
    this.subtotal,
  });

  final bool valid;
  final List<CartItem> items;
  final double? subtotal;
}
