import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/environment.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/auth_interceptor.dart';
import '../../auth/data/token_storage.dart';
import '../data/product_repository.dart';
import '../domain/product_model.dart' as models;
import '../domain/product_model.dart' show Category, Product;

/// Provider for the ApiClient instance used by product-related providers.
///
/// Creates an ApiClient with dev config. In a production setup, this would
/// be wired to the real token storage and refresh logic via a shared provider.
final apiClientProvider = Provider<ApiClient>((ref) {
  const config = EnvironmentConfig.dev;
  final tokenStorage = TokenStorage();

  // Create a base Dio for the auth interceptor retry mechanism
  final retryDio = Dio(BaseOptions(
    baseUrl: config.baseUrl,
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  final authInterceptor = AuthInterceptor(
    tokenStorage: tokenStorage,
    onRefreshToken: () async => false,
    onForceLogout: () {},
    dio: retryDio,
  );

  return ApiClient(config: config, authInterceptor: authInterceptor);
});

/// Provider for the ProductRepository.
final productRepositoryProvider = Provider<ProductRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ProductRepository(apiClient: apiClient);
});

/// Provider for featured products on the home screen.
final featuredProductsProvider =
    FutureProvider.autoDispose<List<Product>>((ref) async {
  final repo = ref.watch(productRepositoryProvider);
  final response = await repo.getProducts(featured: true, limit: 10);
  return response.items;
});

/// Provider for all categories.
final categoriesProvider =
    FutureProvider.autoDispose<List<Category>>((ref) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.getCategories();
});

/// Provider for banners on the home screen.
final bannersProvider =
    FutureProvider.autoDispose<List<models.Banner>>((ref) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.getBanners();
});

/// Provider for a single product by ID.
///
/// Usage: `ref.watch(productByIdProvider('product-id'))`
final productByIdProvider =
    FutureProvider.autoDispose.family<Product?, String>((ref, id) async {
  final repo = ref.watch(productRepositoryProvider);
  // In a real implementation, the API would support GET /products/:id.
  // For now, we fetch products and find by id from the response.
  final response = await repo.getProducts(limit: 100);
  try {
    return response.items.firstWhere((p) => p.id == id);
  } catch (_) {
    return null;
  }
});

/// Provider for products filtered by category slug.
///
/// Usage: `ref.watch(productsByCategoryProvider('vegetables'))`
final productsByCategoryProvider = FutureProvider.autoDispose
    .family<List<Product>, String>((ref, categorySlug) async {
  final repo = ref.watch(productRepositoryProvider);
  final response = await repo.getProducts(category: categorySlug, limit: 50);
  return response.items;
});
