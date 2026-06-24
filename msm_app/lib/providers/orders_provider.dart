import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/orders_repository.dart';
import '../models/order.dart';
import 'auth_provider.dart';

final ordersRepositoryProvider = Provider<OrdersRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return OrdersRepository(apiClient: apiClient);
});

final ordersProvider =
    StateNotifierProvider<OrdersNotifier, AsyncValue<List<Order>>>((ref) {
  return OrdersNotifier(ref);
});

class OrdersNotifier extends StateNotifier<AsyncValue<List<Order>>> {
  OrdersNotifier(this._ref) : super(const AsyncValue.loading());

  final Ref _ref;

  /// Fetches the user's order history.
  Future<void> fetchOrders() async {
    state = const AsyncValue.loading();
    try {
      final repo = _ref.read(ordersRepositoryProvider);
      final orders = await repo.getOrders();
      state = AsyncValue.data(orders);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  /// Refreshes the order list.
  Future<void> refresh() async {
    await fetchOrders();
  }
}

/// Provider for fetching a single order by ID.
final orderByIdProvider =
    FutureProvider.family<Order, String>((ref, id) async {
  final repo = ref.watch(ordersRepositoryProvider);
  return repo.getOrderById(id);
});
