import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/animated_fade_in.dart';
import '../../../core/widgets/shimmer_widget.dart';
import '../domain/product_model.dart';
import '../providers/products_provider.dart';
import 'widgets/product_card.dart';

/// Sort options for the category product listing.
enum ProductSort { relevance, priceLow, priceHigh, newest }

/// Premium category screen with grid of products filtered by category,
/// sort/filter chips, shimmer loading, and animated product cards.
class CategoryScreen extends ConsumerStatefulWidget {
  const CategoryScreen({
    super.key,
    this.categoryName = 'All Categories',
    this.categorySlug,
    this.onProductTap,
  });

  final String categoryName;

  /// Optional category slug for filtering. If null, shows all products.
  final String? categorySlug;
  final void Function(Product)? onProductTap;

  @override
  ConsumerState<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends ConsumerState<CategoryScreen> {
  ProductSort _currentSort = ProductSort.relevance;

  Future<void> _onRefresh() async {
    if (widget.categorySlug != null) {
      ref.invalidate(productsByCategoryProvider(widget.categorySlug!));
    } else {
      ref.invalidate(featuredProductsProvider);
    }
    await Future.delayed(const Duration(milliseconds: 300));
  }

  List<Product> _sortProducts(List<Product> products) {
    final sorted = List<Product>.from(products);
    switch (_currentSort) {
      case ProductSort.priceLow:
        sorted.sort((a, b) =>
            (a.discountPrice ?? a.price).compareTo(b.discountPrice ?? b.price));
        break;
      case ProductSort.priceHigh:
        sorted.sort((a, b) =>
            (b.discountPrice ?? b.price).compareTo(a.discountPrice ?? a.price));
        break;
      case ProductSort.newest:
        // Reverse order as proxy for "newest"
        return sorted.reversed.toList();
      case ProductSort.relevance:
        // Default order from API
        break;
    }
    return sorted;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Use category provider if slug provided, otherwise fetch all products
    final productsAsync = widget.categorySlug != null
        ? ref.watch(productsByCategoryProvider(widget.categorySlug!))
        : ref.watch(featuredProductsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.categoryName,
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: Column(
        children: [
          // Sort/filter chips
          _SortChips(
            currentSort: _currentSort,
            onSortChanged: (sort) {
              setState(() => _currentSort = sort);
            },
          ),
          // Product grid
          Expanded(
            child: productsAsync.when(
              data: (products) {
                if (products.isEmpty) {
                  return _EmptyState(categoryName: widget.categoryName);
                }
                final sorted = _sortProducts(products);
                return RefreshIndicator(
                  onRefresh: _onRefresh,
                  child: GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.68,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: sorted.length,
                    itemBuilder: (context, index) {
                      final product = sorted[index];
                      return AnimatedFadeIn(
                        index: index,
                        child: ProductCard(
                          product: product,
                          onTap: () => widget.onProductTap?.call(product),
                          onAddToCart: () {
                            // Add to cart - will be wired in cart feature
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('${product.name} added to cart'),
                                duration: const Duration(seconds: 1),
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                            );
                          },
                        ),
                      );
                    },
                  ),
                );
              },
              loading: () => _buildLoadingGrid(),
              error: (error, _) => _ErrorState(
                message: 'Failed to load products',
                onRetry: _onRefresh,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingGrid() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.68,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: 6,
      itemBuilder: (_, __) => const ProductCardShimmer(),
    );
  }
}

// =============================================================================
// Sort Chips
// =============================================================================

class _SortChips extends StatelessWidget {
  const _SortChips({
    required this.currentSort,
    required this.onSortChanged,
  });

  final ProductSort currentSort;
  final void Function(ProductSort) onSortChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          _buildChip(
            context,
            'Relevance',
            ProductSort.relevance,
            Icons.auto_awesome,
          ),
          const SizedBox(width: 8),
          _buildChip(
            context,
            'Price: Low',
            ProductSort.priceLow,
            Icons.arrow_downward,
          ),
          const SizedBox(width: 8),
          _buildChip(
            context,
            'Price: High',
            ProductSort.priceHigh,
            Icons.arrow_upward,
          ),
          const SizedBox(width: 8),
          _buildChip(
            context,
            'Newest',
            ProductSort.newest,
            Icons.new_releases_outlined,
          ),
        ],
      ),
    );
  }

  Widget _buildChip(
    BuildContext context,
    String label,
    ProductSort sort,
    IconData icon,
  ) {
    final theme = Theme.of(context);
    final isSelected = currentSort == sort;

    return FilterChip(
      label: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          color: isSelected
              ? theme.colorScheme.onPrimary
              : theme.colorScheme.onSurfaceVariant,
        ),
      ),
      avatar: Icon(
        icon,
        size: 14,
        color: isSelected
            ? theme.colorScheme.onPrimary
            : theme.colorScheme.onSurfaceVariant,
      ),
      selected: isSelected,
      onSelected: (_) => onSortChanged(sort),
      backgroundColor: theme.colorScheme.surfaceContainerHighest,
      selectedColor: theme.colorScheme.primary,
      showCheckmark: false,
      padding: const EdgeInsets.symmetric(horizontal: 4),
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      visualDensity: VisualDensity.compact,
    );
  }
}

// =============================================================================
// Empty State
// =============================================================================

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.categoryName});

  final String categoryName;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.inventory_2_outlined,
                size: 40,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'No products found',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'No products available in $categoryName right now.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// =============================================================================
// Error State
// =============================================================================

class _ErrorState extends StatelessWidget {
  const _ErrorState({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 48,
              color: theme.colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: theme.textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            FilledButton.tonalIcon(
              onPressed: () => onRetry(),
              icon: const Icon(Icons.refresh),
              label: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }
}
