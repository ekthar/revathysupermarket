import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../products/providers/products_provider.dart';
import '../data/order_repository.dart';
import '../domain/order_model.dart';

/// Provider for the OrderRepository.
final orderRepositoryProvider = Provider<OrderRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return OrderRepository(apiClient: apiClient);
});

/// Provider for the paginated orders list.
///
/// Usage: `ref.watch(ordersProvider)` returns AsyncValue<OrderListResponse>
final ordersProvider =
    FutureProvider.autoDispose<OrderListResponse>((ref) async {
  final repo = ref.watch(orderRepositoryProvider);
  return repo.getOrders(page: 1, limit: 20);
});

/// Provider for paginated orders with page parameter.
///
/// Usage: `ref.watch(ordersPageProvider(2))`
final ordersPageProvider =
    FutureProvider.autoDispose.family<OrderListResponse, int>((ref, page) async {
  final repo = ref.watch(orderRepositoryProvider);
  return repo.getOrders(page: page, limit: 20);
});

/// Provider for a single order detail by ID.
///
/// Usage: `ref.watch(orderDetailProvider('order-id'))`
final orderDetailProvider =
    FutureProvider.autoDispose.family<OrderDetail, String>((ref, orderId) async {
  final repo = ref.watch(orderRepositoryProvider);
  return repo.getOrderDetail(orderId);
});

/// Provider for filtered orders by status.
///
/// Usage: `ref.watch(filteredOrdersProvider('DELIVERED'))`
final filteredOrdersProvider = FutureProvider.autoDispose
    .family<List<OrderSummary>, String?>((ref, status) async {
  final response = await ref.watch(ordersProvider.future);
  if (status == null || status == 'ALL') {
    return response.items;
  }
  return response.items.where((order) {
    switch (status) {
      case 'ACTIVE':
        return !['DELIVERED', 'CANCELLED'].contains(order.status);
      case 'DELIVERED':
        return order.status == 'DELIVERED';
      case 'CANCELLED':
        return order.status == 'CANCELLED';
      default:
        return true;
    }
  }).toList();
});
