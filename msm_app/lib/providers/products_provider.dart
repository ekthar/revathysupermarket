import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/products_repository.dart';
import '../models/product.dart';
import 'auth_provider.dart';

final productsRepositoryProvider = Provider<ProductsRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ProductsRepository(apiClient: apiClient);
});

final productsProvider =
    StateNotifierProvider<ProductsNotifier, AsyncValue<List<Product>>>((ref) {
  return ProductsNotifier(ref);
});

class ProductsNotifier extends StateNotifier<AsyncValue<List<Product>>> {
  ProductsNotifier(this._ref) : super(const AsyncValue.loading());

  final Ref _ref;

  int _currentPage = 1;
  String? _category;
  String? _search;
  bool _hasMore = true;

  bool get hasMore => _hasMore;
  String? get currentCategory => _category;
  String? get currentSearch => _search;

  /// Fetches the first page of products with optional filters.
  Future<void> fetchProducts({String? category, String? search}) async {
    _category = category;
    _search = search;
    _currentPage = 1;
    _hasMore = true;

    state = const AsyncValue.loading();
    try {
      final repo = _ref.read(productsRepositoryProvider);
      final products = await repo.getProducts(
        category: category,
        search: search,
        page: 1,
      );
      _hasMore = products.length >= 20;
      state = AsyncValue.data(products);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  /// Fetches the next page and appends to existing results.
  Future<void> fetchNextPage() async {
    if (!_hasMore) return;
    final currentProducts = state.valueOrNull ?? [];

    try {
      _currentPage++;
      final repo = _ref.read(productsRepositoryProvider);
      final newProducts = await repo.getProducts(
        category: _category,
        search: _search,
        page: _currentPage,
      );
      _hasMore = newProducts.length >= 20;
      state = AsyncValue.data([...currentProducts, ...newProducts]);
    } catch (e, st) {
      _currentPage--;
      state = AsyncValue.error(e, st);
    }
  }
}

/// Provider for fetching a single product by ID.
final productByIdProvider =
    FutureProvider.family<Product, String>((ref, id) async {
  final repo = ref.watch(productsRepositoryProvider);
  return repo.getProductById(id);
});
