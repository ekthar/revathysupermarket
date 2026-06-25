import '../../../core/network/api_client.dart';
import '../domain/product_model.dart' as models;
import '../domain/product_model.dart' show Category, Product;

/// Repository handling product and category data operations.
class ProductRepository {
  ProductRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  /// Fetches products with optional filtering and pagination.
  Future<ProductListResponse> getProducts({
    String? category,
    String? search,
    bool? featured,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
    };
    if (category != null) queryParams['category'] = category;
    if (search != null) queryParams['search'] = search;
    if (featured == true) queryParams['featured'] = 'true';

    final response = await _apiClient.get<Map<String, dynamic>>(
      '/products',
      queryParameters: queryParams,
    );

    final data = response.data!;
    final items = (data['items'] as List)
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .toList();

    return ProductListResponse(
      items: items,
      page: data['page'] as int,
      limit: data['limit'] as int,
      total: data['total'] as int,
      totalPages: data['totalPages'] as int,
    );
  }

  /// Fetches all active categories.
  Future<List<Category>> getCategories() async {
    final response = await _apiClient.get<Map<String, dynamic>>('/categories');
    final data = response.data!;
    return (data['items'] as List)
        .map((e) => Category.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Fetches active banners for the home screen.
  Future<List<models.Banner>> getBanners() async {
    final response = await _apiClient.get<Map<String, dynamic>>('/banners');
    final data = response.data!;
    return (data['items'] as List)
        .map((e) => models.Banner.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

/// Response wrapper for paginated product lists.
class ProductListResponse {
  const ProductListResponse({
    required this.items,
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  final List<Product> items;
  final int page;
  final int limit;
  final int total;
  final int totalPages;
}
