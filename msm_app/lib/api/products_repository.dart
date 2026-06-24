import 'api_client.dart';
import '../models/product.dart';

class ProductsRepository {
  ProductsRepository({required this.apiClient});

  final ApiClient apiClient;

  /// Fetches paginated product list with optional category and search filters.
  Future<List<Product>> getProducts({
    String? category,
    String? search,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (category != null) 'category': category,
      if (search != null) 'search': search,
    };

    final response = await apiClient.dio.get(
      '/api/products',
      queryParameters: queryParams,
    );

    final data = response.data;
    final List<dynamic> products =
        data is List ? data : (data['products'] as List<dynamic>? ?? []);
    return products
        .map((json) => Product.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// Fetches a single product by its ID.
  Future<Product> getProductById(String id) async {
    final response = await apiClient.dio.get('/api/products/$id');
    return Product.fromJson(response.data as Map<String, dynamic>);
  }
}
