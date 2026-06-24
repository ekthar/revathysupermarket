import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/cart_item.dart';
import '../models/product.dart';

const _kCartKey = 'cart_items';

final cartProvider = StateNotifierProvider<CartNotifier, List<CartItem>>((ref) {
  return CartNotifier();
});

class CartNotifier extends StateNotifier<List<CartItem>> {
  CartNotifier() : super([]);

  /// Loads cart items from SharedPreferences.
  Future<void> loadCart() async {
    final prefs = await SharedPreferences.getInstance();
    final cartJson = prefs.getString(_kCartKey);
    if (cartJson != null) {
      try {
        final List<dynamic> decoded = jsonDecode(cartJson) as List<dynamic>;
        state = decoded
            .map((item) => CartItem.fromJson(item as Map<String, dynamic>))
            .toList();
      } catch (_) {
        state = [];
      }
    }
  }

  /// Persists the current cart state to SharedPreferences.
  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    final cartJson = jsonEncode(state.map((item) => item.toJson()).toList());
    await prefs.setString(_kCartKey, cartJson);
  }

  /// Adds a product to the cart. If it already exists, increments the quantity.
  Future<void> addItem(Product product, {int quantity = 1}) async {
    final existingIndex =
        state.indexWhere((item) => item.product.id == product.id);
    if (existingIndex >= 0) {
      final existing = state[existingIndex];
      final updated = existing.copyWith(quantity: existing.quantity + quantity);
      state = [
        ...state.sublist(0, existingIndex),
        updated,
        ...state.sublist(existingIndex + 1),
      ];
    } else {
      state = [...state, CartItem(product: product, quantity: quantity)];
    }
    await _persist();
  }

  /// Removes a product from the cart entirely.
  Future<void> removeItem(String productId) async {
    state = state.where((item) => item.product.id != productId).toList();
    await _persist();
  }

  /// Updates the quantity of a cart item. Removes if quantity <= 0.
  Future<void> updateQuantity(String productId, int quantity) async {
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }
    final existingIndex =
        state.indexWhere((item) => item.product.id == productId);
    if (existingIndex >= 0) {
      final updated = state[existingIndex].copyWith(quantity: quantity);
      state = [
        ...state.sublist(0, existingIndex),
        updated,
        ...state.sublist(existingIndex + 1),
      ];
      await _persist();
    }
  }

  /// Clears all items from the cart.
  Future<void> clearCart() async {
    state = [];
    await _persist();
  }

  /// Returns the total price of all items in the cart.
  double get totalPrice {
    return state.fold(0.0, (sum, item) {
      final price = item.product.discountPrice ?? item.product.price;
      return sum + (price * item.quantity);
    });
  }

  /// Returns the total number of items in the cart.
  int get totalItems {
    return state.fold(0, (sum, item) => sum + item.quantity);
  }
}
