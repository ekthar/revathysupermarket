import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../products/providers/products_provider.dart';
import '../data/cart_repository.dart';
import '../domain/cart_item_model.dart';

/// In-memory cart storage implementation for the provider.
class _InMemoryCartStorage implements CartStorage {
  final Map<String, String> _store = {};

  @override
  Future<String?> read(String key) async => _store[key];

  @override
  Future<void> write(String key, String value) async => _store[key] = value;

  @override
  Future<void> delete(String key) async => _store.remove(key);
}

/// Cart state holding current items, loading, and error states.
class CartState {
  const CartState({
    this.items = const [],
    this.isLoading = false,
    this.error,
    this.isValidating = false,
  });

  final List<CartItem> items;
  final bool isLoading;
  final String? error;
  final bool isValidating;

  /// Total number of unique products in the cart.
  int get itemCount => items.length;

  /// Total quantity of all items combined.
  int get totalQuantity => items.fold(0, (sum, item) => sum + item.quantity);

  /// Subtotal based on effective price (discount or regular).
  double get subtotal => items.fold(
        0,
        (sum, item) =>
            sum + (item.discountPrice ?? item.price) * item.quantity,
      );

  /// Total savings from discounted items.
  double get totalSavings => items.fold(
        0,
        (sum, item) {
          if (item.discountPrice != null && item.discountPrice! < item.price) {
            return sum +
                (item.price - item.discountPrice!) * item.quantity;
          }
          return sum;
        },
      );

  /// GST calculated at 5% on subtotal.
  double get gst => subtotal * 0.05;

  /// Delivery fee (free above 500).
  double get deliveryFee => subtotal >= 500 ? 0 : 30;

  /// Grand total including GST and delivery.
  double get total => subtotal + gst + deliveryFee;

  /// Whether the cart is empty.
  bool get isEmpty => items.isEmpty;

  CartState copyWith({
    List<CartItem>? items,
    bool? isLoading,
    String? error,
    bool? isValidating,
  }) {
    return CartState(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isValidating: isValidating ?? this.isValidating,
    );
  }
}

/// StateNotifier that manages cart operations with local persistence.
class CartNotifier extends StateNotifier<CartState> {
  CartNotifier({required this.repository}) : super(const CartState());

  final CartRepository repository;

  /// Loads cart from local storage.
  Future<void> loadCart() async {
    state = state.copyWith(isLoading: true);
    try {
      await repository.loadCart();
      state = CartState(items: repository.items);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Adds an item to the cart.
  Future<void> addItem(CartItem item) async {
    try {
      await repository.addItem(item);
      state = state.copyWith(items: List.from(repository.items));
    } catch (e) {
      state = state.copyWith(error: 'Failed to add item');
    }
  }

  /// Removes an item from the cart by product ID.
  Future<void> removeItem(String productId) async {
    try {
      await repository.removeItem(productId);
      state = state.copyWith(items: List.from(repository.items));
    } catch (e) {
      state = state.copyWith(error: 'Failed to remove item');
    }
  }

  /// Updates the quantity of a cart item.
  Future<void> updateQuantity(String productId, int quantity) async {
    try {
      await repository.updateQuantity(productId, quantity);
      state = state.copyWith(items: List.from(repository.items));
    } catch (e) {
      state = state.copyWith(error: 'Failed to update quantity');
    }
  }

  /// Clears all items from the cart.
  Future<void> clearCart() async {
    try {
      await repository.clearCart();
      state = const CartState();
    } catch (e) {
      state = state.copyWith(error: 'Failed to clear cart');
    }
  }

  /// Validates the cart against server prices and stock.
  Future<bool> validateCart() async {
    state = state.copyWith(isValidating: true);
    try {
      final result = await repository.validateCart();
      state = state.copyWith(
        items: result.items,
        isValidating: false,
      );
      return result.valid;
    } catch (e) {
      state = state.copyWith(
        isValidating: false,
        error: 'Validation failed',
      );
      return false;
    }
  }
}

/// Provider for CartRepository.
final cartRepositoryProvider = Provider<CartRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return CartRepository(
    storage: _InMemoryCartStorage(),
    apiClient: apiClient,
  );
});

/// Provider for the CartNotifier StateNotifier.
final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  final repository = ref.watch(cartRepositoryProvider);
  final notifier = CartNotifier(repository: repository);
  notifier.loadCart();
  return notifier;
});

/// Convenience provider for cart item count (for badge display).
final cartItemCountProvider = Provider<int>((ref) {
  return ref.watch(cartProvider).totalQuantity;
});
