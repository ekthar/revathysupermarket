import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/animated_fade_in.dart';
import '../../../core/widgets/shimmer_widget.dart';
import '../domain/product_model.dart' show Category, Product;
import '../domain/product_model.dart' as models;
import '../providers/products_provider.dart';
import 'widgets/product_card.dart';

/// Premium home screen with animated banner carousel, category chips,
/// and featured products grid with shimmer loading states.
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({
    super.key,
    this.onCategoryTap,
    this.onProductTap,
    this.onCartTap,
    this.onSearchTap,
  });

  final void Function(Category)? onCategoryTap;
  final void Function(Product)? onProductTap;
  final VoidCallback? onCartTap;
  final VoidCallback? onSearchTap;

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  Future<void> _onRefresh() async {
    // Invalidate all providers to trigger refetch
    ref.invalidate(bannersProvider);
    ref.invalidate(categoriesProvider);
    ref.invalidate(featuredProductsProvider);
    // Wait a moment for the refetch to start
    await Future.delayed(const Duration(milliseconds: 300));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final bannersAsync = ref.watch(bannersProvider);
    final categoriesAsync = ref.watch(categoriesProvider);
    final featuredAsync = ref.watch(featuredProductsProvider);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _onRefresh,
        color: theme.colorScheme.primary,
        child: CustomScrollView(
          slivers: [
            // Custom app bar with search
            _buildSliverAppBar(theme, isDark),

            // Banner carousel section
            SliverToBoxAdapter(
              child: bannersAsync.when(
                data: (banners) => banners.isEmpty
                    ? const SizedBox.shrink()
                    : _BannerCarousel(banners: banners),
                loading: () => const _BannerShimmer(),
                error: (_, __) => _ErrorRetrySection(
                  message: 'Failed to load banners',
                  onRetry: () => ref.invalidate(bannersProvider),
                ),
              ),
            ),

            // Categories section
            SliverToBoxAdapter(
              child: categoriesAsync.when(
                data: (categories) => categories.isEmpty
                    ? const SizedBox.shrink()
                    : _CategoriesSection(
                        categories: categories,
                        onCategoryTap: widget.onCategoryTap,
                        onSeeAll: () {
                          // Navigate to categories tab
                        },
                      ),
                loading: () => const _CategoriesShimmer(),
                error: (_, __) => _ErrorRetrySection(
                  message: 'Failed to load categories',
                  onRetry: () => ref.invalidate(categoriesProvider),
                ),
              ),
            ),

            // Featured products header
            SliverToBoxAdapter(
              child: _SectionHeader(
                title: 'Featured Products',
                onSeeAll: () {},
              ),
            ),

            // Featured products grid
            featuredAsync.when(
              data: (products) => products.isEmpty
                  ? SliverToBoxAdapter(
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Text(
                            'No featured products',
                            style: theme.textTheme.bodyLarge,
                          ),
                        ),
                      ),
                    )
                  : _FeaturedProductsGrid(
                      products: products,
                      onProductTap: widget.onProductTap,
                    ),
              loading: () => const _ProductGridShimmer(),
              error: (_, __) => SliverToBoxAdapter(
                child: _ErrorRetrySection(
                  message: 'Failed to load products',
                  onRetry: () => ref.invalidate(featuredProductsProvider),
                ),
              ),
            ),

            // Bottom padding
            const SliverToBoxAdapter(
              child: SizedBox(height: 100),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSliverAppBar(ThemeData theme, bool isDark) {
    return SliverAppBar(
      floating: true,
      snap: true,
      elevation: 0,
      backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
      surfaceTintColor: Colors.transparent,
      expandedHeight: 120,
      flexibleSpace: FlexibleSpaceBar(
        background: Padding(
          padding: const EdgeInsets.only(top: 50, left: 16, right: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.storefront_rounded,
                    color: theme.colorScheme.primary,
                    size: 28,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'MSM Supermarket',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ),
                  IconButton(
                    key: const Key('cart_button'),
                    icon: const Icon(Icons.shopping_cart_outlined),
                    onPressed: widget.onCartTap,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              // Search bar placeholder
              GestureDetector(
                onTap: widget.onSearchTap,
                child: Container(
                  key: const Key('search_button'),
                  height: 44,
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF1E293B)
                        : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF334155)
                          : const Color(0xFFE2E8F0),
                    ),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  child: Row(
                    children: [
                      Icon(
                        Icons.search,
                        size: 20,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Search products...',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// Banner Carousel
// =============================================================================

/// Auto-playing banner carousel with dot indicators.
class _BannerCarousel extends StatefulWidget {
  const _BannerCarousel({required this.banners});

  final List<models.Banner> banners;

  @override
  State<_BannerCarousel> createState() => _BannerCarouselState();
}

class _BannerCarouselState extends State<_BannerCarousel> {
  late final PageController _pageController;
  Timer? _autoPlayTimer;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.9);
    _startAutoPlay();
  }

  @override
  void dispose() {
    _autoPlayTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _startAutoPlay() {
    _autoPlayTimer = Timer.periodic(
      const Duration(seconds: 4),
      (_) {
        if (!mounted) return;
        final nextPage = (_currentPage + 1) % widget.banners.length;
        _pageController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Column(
      children: [
        const SizedBox(height: 16),
        SizedBox(
          height: 170,
          child: PageView.builder(
            controller: _pageController,
            itemCount: widget.banners.length,
            onPageChanged: (index) {
              setState(() => _currentPage = index);
            },
            itemBuilder: (context, index) {
              final banner = widget.banners[index];
              return AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                margin: const EdgeInsets.symmetric(horizontal: 6),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: isDark
                        ? [
                            const Color(0xFF065F46),
                            const Color(0xFF064E3B),
                          ]
                        : [
                            const Color(0xFF059669),
                            const Color(0xFF047857),
                          ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: theme.colorScheme.primary.withValues(alpha: 0.2),
                      blurRadius: 12,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      // Background image if available
                      if (banner.image.isNotEmpty)
                        Image.network(
                          banner.image,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) =>
                              const SizedBox.shrink(),
                        ),
                      // Gradient overlay for text readability
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black.withValues(alpha: 0.4),
                            ],
                          ),
                        ),
                      ),
                      // Banner text content
                      Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Text(
                              banner.title,
                              style: theme.textTheme.titleLarge?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            if (banner.subtitle != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                banner.subtitle!,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: Colors.white.withValues(alpha: 0.9),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 12),
        // Dot indicators
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            widget.banners.length,
            (index) => AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: _currentPage == index ? 24 : 8,
              height: 8,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(4),
                color: _currentPage == index
                    ? theme.colorScheme.primary
                    : theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

// =============================================================================
// Categories Section
// =============================================================================

class _CategoriesSection extends StatelessWidget {
  const _CategoriesSection({
    required this.categories,
    this.onCategoryTap,
    this.onSeeAll,
  });

  final List<Category> categories;
  final void Function(Category)? onCategoryTap;
  final VoidCallback? onSeeAll;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Column(
      children: [
        _SectionHeader(title: 'Shop by Category', onSeeAll: onSeeAll),
        SizedBox(
          height: 110,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: categories.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (context, index) {
              final category = categories[index];
              return GestureDetector(
                onTap: () => onCategoryTap?.call(category),
                child: SizedBox(
                  width: 76,
                  child: Column(
                    children: [
                      // Circular category image chip with shadow
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isDark
                              ? const Color(0xFF1E293B)
                              : Colors.white,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.08),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                          border: Border.all(
                            color: isDark
                                ? const Color(0xFF334155)
                                : const Color(0xFFE2E8F0),
                            width: 1.5,
                          ),
                        ),
                        child: ClipOval(
                          child: category.image != null &&
                                  category.image!.isNotEmpty
                              ? Image.network(
                                  category.image!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => _CategoryIcon(
                                    name: category.name,
                                    theme: theme,
                                  ),
                                )
                              : _CategoryIcon(
                                  name: category.name,
                                  theme: theme,
                                ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        category.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w500,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
      ],
    );
  }
}

class _CategoryIcon extends StatelessWidget {
  const _CategoryIcon({required this.name, required this.theme});

  final String name;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        name.isNotEmpty ? name.substring(0, 1).toUpperCase() : '?',
        style: theme.textTheme.titleLarge?.copyWith(
          color: theme.colorScheme.primary,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

// =============================================================================
// Featured Products Grid
// =============================================================================

class _FeaturedProductsGrid extends StatelessWidget {
  const _FeaturedProductsGrid({
    required this.products,
    this.onProductTap,
  });

  final List<Product> products;
  final void Function(Product)? onProductTap;

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.68,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final product = products[index];
            return AnimatedFadeIn(
              index: index,
              child: ProductCard(
                product: product,
                onTap: () => onProductTap?.call(product),
                onAddToCart: () {
                  // Add to cart action - will be wired in cart feature
                },
              ),
            );
          },
          childCount: products.length,
        ),
      ),
    );
  }
}

// =============================================================================
// Section Header
// =============================================================================

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    this.onSeeAll,
  });

  final String title;
  final VoidCallback? onSeeAll;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          if (onSeeAll != null)
            TextButton(
              onPressed: onSeeAll,
              child: Text(
                'See All',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// =============================================================================
// Shimmer Loading States
// =============================================================================

class _BannerShimmer extends StatelessWidget {
  const _BannerShimmer();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: ShimmerWidget.box(
        width: double.infinity,
        height: 170,
        borderRadius: 16,
      ),
    );
  }
}

class _CategoriesShimmer extends StatelessWidget {
  const _CategoriesShimmer();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: ShimmerWidget.rectangle(width: 140, height: 18),
        ),
        SizedBox(
          height: 110,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: 6,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (_, __) => SizedBox(
              width: 76,
              child: Column(
                children: [
                  ShimmerWidget.circle(size: 64),
                  const SizedBox(height: 8),
                  ShimmerWidget.rectangle(width: 50, height: 10),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ProductGridShimmer extends StatelessWidget {
  const _ProductGridShimmer();

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.68,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        delegate: SliverChildBuilderDelegate(
          (_, __) => const ProductCardShimmer(),
          childCount: 6,
        ),
      ),
    );
  }
}

// =============================================================================
// Error State
// =============================================================================

class _ErrorRetrySection extends StatelessWidget {
  const _ErrorRetrySection({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Icon(
            Icons.error_outline,
            size: 40,
            color: theme.colorScheme.error,
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh, size: 18),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}
