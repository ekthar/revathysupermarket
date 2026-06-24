import 'api_client.dart';
import '../models/order.dart';

class OrdersRepository {
  OrdersRepository({required this.apiClient});

  final ApiClient apiClient;

  /// Fetches the list of orders for the authenticated user.
  Future<List<Order>> getOrders() async {
    final response = await apiClient.dio.get('/api/orders');
    final data = response.data;
    final List<dynamic> orders =
        data is List ? data : (data['orders'] as List<dynamic>? ?? []);
    return orders
        .map((json) => Order.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// Fetches a single order by its ID.
  Future<Order> getOrderById(String id) async {
    final response = await apiClient.dio.get('/api/orders/$id');
    return Order.fromJson(response.data as Map<String, dynamic>);
  }

  /// Submits a checkout request with the given data.
  Future<Order> checkout(Map<String, dynamic> checkoutData) async {
    final response = await apiClient.dio.post(
      '/api/orders',
      data: checkoutData,
    );
    return Order.fromJson(response.data as Map<String, dynamic>);
  }
}
