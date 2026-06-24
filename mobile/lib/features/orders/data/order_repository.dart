import '../../../core/network/api_client.dart';
import '../domain/order_model.dart';

/// Repository handling order data operations.
class OrderRepository {
  OrderRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  /// Fetches order history for the authenticated user.
  Future<OrderListResponse> getOrders({int page = 1, int limit = 20}) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/orders',
      queryParameters: {'page': page, 'limit': limit},
    );

    final data = response.data!;
    final items = (data['items'] as List)
        .map((e) => OrderSummary.fromJson(e as Map<String, dynamic>))
        .toList();

    return OrderListResponse(
      items: items,
      page: data['page'] as int,
      total: data['total'] as int,
      totalPages: data['totalPages'] as int,
    );
  }

  /// Fetches a single order detail.
  Future<OrderDetail> getOrderDetail(String orderId) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/orders/$orderId',
    );

    final data = response.data!;
    return OrderDetail.fromJson(data['order'] as Map<String, dynamic>);
  }

  /// Places a new order.
  Future<PlaceOrderResult> placeOrder(Map<String, dynamic> orderData) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/orders',
      data: orderData,
    );

    final data = response.data!;
    return PlaceOrderResult(
      orderId: data['orderId'] as String,
      orderNumber: data['orderNumber'] as String,
      total: (data['total'] as num).toDouble(),
    );
  }
}

/// Response wrapper for paginated order lists.
class OrderListResponse {
  const OrderListResponse({
    required this.items,
    required this.page,
    required this.total,
    required this.totalPages,
  });

  final List<OrderSummary> items;
  final int page;
  final int total;
  final int totalPages;
}

/// Result of placing an order.
class PlaceOrderResult {
  const PlaceOrderResult({
    required this.orderId,
    required this.orderNumber,
    required this.total,
  });

  final String orderId;
  final String orderNumber;
  final double total;
}
