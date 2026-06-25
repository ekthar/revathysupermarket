import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/animated_fade_in.dart';
import '../../../core/widgets/shimmer_widget.dart';
import '../domain/product_model.dart';
import '../providers/products_provider.dart';
import 'widgets/product_card.dart';

/// Premium product detail screen with hero image, animated add-to-cart button,
/// expandable description, related products, and rich pricing display.
class ProductDetailScreen extends ConsumerStatefulWidget {
  const ProductDetailScreen({
    super.key,
    required this.product,
    this.onAddToCart,
    this.cartQuantity = 0,
  });

  final Product product;
  final void Function(Product)? onAddToCart;
  final int cartQuantity;

  @override
  ConsumerState<ProductDetailScreen> createState() =>
      _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _cartButtonController;
  late final Animation<double> _cartButtonScale;
  bool _descriptionExpanded = false;
  int _quantity = 0;

  @override
  void initState() {
    super.initState();
    _quantity = widget.cartQuantity;
    _cartButtonController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _cartButtonScale = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(
        parent: _cartButtonController,
        curve: Curves.easeInOut,
      ),
    );
  }

  @override
  void dispose() {
    _cartButtonController.dispose();
    super.dispose();
  }

  void _addToCart() {
    _cartButtonController.forward().then((_) {
      _cartButtonController.reverse();
    });
    setState(() => _quantity++);
    widget.onAddToCart?.call(widget.product);
  }

  void _incrementQuantity() {
    setState(() => _quantity++);
    widget.onAddToCart?.call(widget.product);
  }

  void _decrementQuantity() {
    if (_quantity > 0) {
      setState(() => _quantity--);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final product = widget.product;
    final hasDiscount = product.discountPrice != null;
    final displayPrice = product.discountPrice ?? product.price;
    final inStock = product.stock > 0;
    final percentOff = hasDiscount
        ? ((1 - displayPrice / product.price) * 100).toStringAsFixed(0)
        : null;

    // Fetch related products by category
    final relatedAsync =
        ref.watch(productsByCategoryProvider(product.categoryId));

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Hero image with floating back button
          SliverToBoxAdapter(
            child: _HeroImageSection(
              product: product,
              isDark: isDark,
            ),
          ),

          // Product info
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product name
                  AnimatedFadeIn(
                    index: 0,
                    child: Text(
                      product.name,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        letterSpacing: -0.3,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  AnimatedFadeIn(
                    index: 1,
                    child: Text(
                      product.unit,
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Price section with discount
                  AnimatedFadeIn(
                    index: 2,
                    child: _PriceSection(
                      displayPrice: displayPrice,
                      originalPrice: product.price,
                      hasDiscount: hasDiscount,
                      percentOff: percentOff,
                      theme: theme,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Stock indicator
                  AnimatedFadeIn(
                    index: 3,
                    child: _StockIndicator(
                      stock: product.stock,
                      theme: theme,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // GST info
                  if (product.gstRate != null)
                    AnimatedFadeIn(
                      index: 4,
                      child: _GstInfo(
                        gstRate: product.gstRate!,
                        theme: theme,
                      ),
                    ),

                  const SizedBox(height: 24),

                  // Expandable description
                  AnimatedFadeIn(
                    index: 5,
                    child: _ExpandableDescription(
                      description: product.description,
                      expanded: _descriptionExpanded,
                      onToggle: () {
                        setState(() {
                          _descriptionExpanded = !_descriptionExpanded;
                        });
                      },
                      theme: theme,
                    ),
                  ),

                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),

          // Related products section
          SliverToBoxAdapter(
            child: relatedAsync.when(
              data: (products) {
                // Filter out current product
                final related =
                    products.where((p) => p.id != product.id).toList();
                if (related.isEmpty) return const SizedBox.shrink();
                return _RelatedProductsSection(
                  products: related,
                  theme: theme,
                );
              },
              loading: () => const _RelatedProductsShimmer(),
              error: (_, __) => const SizedBox.shrink(),
            ),
          ),

          // Bottom spacing for the cart button
          const SliverToBoxAdapter(
            child: SizedBox(height: 100),
          ),
        ],
      ),

      // Animated Add to Cart button
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: AnimatedBuilder(
            animation: _cartButtonScale,
            builder: (context, child) {
              return Transform.scale(
                scale: _cartButtonScale.value,
                child: child,
              );
            },
            child: _quantity > 0
                ? _QuantityControls(
                    quantity: _quantity,
                    onIncrement: inStock ? _incrementQuantity : null,
                    onDecrement: _decrementQuantity,
                    theme: theme,
                  )
                : _AddToCartButton(
                    inStock: inStock,
                    onPressed: inStock ? _addToCart : null,
                    theme: theme,
                  ),
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// Hero Image Section
// =============================================================================

class _HeroImageSection extends StatelessWidget {
  const _HeroImageSection({
    required this.product,
    required this.isDark,
  });

  final Product product;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Hero image
        Hero(
          tag: 'product-${product.id}',
          child: Container(
            height: 300,
            width: double.infinity,
            decoration: BoxDecoration(
              color: isDark
                  ? const Color(0xFF1E293B)
                  : const Color(0xFFF8FAFC),
            ),
            child: product.image.isNotEmpty
                ? Image.network(
                    product.image,
                    fit: BoxFit.cover,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return const Center(
                        child: ShimmerWidget.box(
                          width: double.infinity,
                          height: 300,
                          borderRadius: 0,
                        ),
                      );
                    },
                    errorBuilder: (_, __, ___) => Center(
                      child: Icon(
                        Icons.image_not_supported_outlined,
                        size: 80,
                        color: isDark
                            ? const Color(0xFF64748B)
                            : const Color(0xFFCBD5E1),
                      ),
                    ),
                  )
                : Center(
                    child: Icon(
                      Icons.image_outlined,
                      size: 80,
                      color: isDark
                          ? const Color(0xFF64748B)
                          : const Color(0xFFCBD5E1),
                    ),
                  ),
          ),
        ),
        // Floating back button
        Positioned(
          top: MediaQuery.of(context).padding.top + 8,
          left: 16,
          child: Container(
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.black.withValues(alpha: 0.5)
                  : Colors.white.withValues(alpha: 0.9),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: IconButton(
              icon: Icon(
                Icons.arrow_back,
                color: isDark ? Colors.white : Colors.black87,
              ),
              onPressed: () => Navigator.of(context).pop(),
            ),
          ),
        ),
      ],
    );
  }
}

// =============================================================================
// Price Section
// =============================================================================

class _PriceSection extends StatelessWidget {
  const _PriceSection({
    required this.displayPrice,
    required this.originalPrice,
    required this.hasDiscount,
    this.percentOff,
    required this.theme,
  });

  final double displayPrice;
  final double originalPrice;
  final bool hasDiscount;
  final String? percentOff;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(
          '\u20B9${displayPrice.toStringAsFixed(2)}',
          style: theme.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.primary,
          ),
        ),
        if (hasDiscount) ...[
          const SizedBox(width: 12),
          Text(
            '\u20B9${originalPrice.toStringAsFixed(2)}',
            style: theme.textTheme.titleMedium?.copyWith(
              decoration: TextDecoration.lineThrough,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFFDC2626).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: const Color(0xFFDC2626).withValues(alpha: 0.3),
              ),
            ),
            child: Text(
              '$percentOff% OFF',
              style: theme.textTheme.labelMedium?.copyWith(
                color: const Color(0xFFDC2626),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

// =============================================================================
// Stock Indicator
// =============================================================================

class _StockIndicator extends StatelessWidget {
  const _StockIndicator({
    required this.stock,
    required this.theme,
  });

  final int stock;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    final Color color;
    final String label;
    final IconData icon;

    if (stock == 0) {
      color = const Color(0xFFDC2626); // Red
      label = 'Out of Stock';
      icon = Icons.cancel_outlined;
    } else if (stock <= 5) {
      color = const Color(0xFFD97706); // Amber
      label = 'Only $stock left';
      icon = Icons.warning_amber_rounded;
    } else {
      color = const Color(0xFF059669); // Green
      label = 'In Stock ($stock available)';
      icon = Icons.check_circle_outline;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// GST Info
// =============================================================================

class _GstInfo extends StatelessWidget {
  const _GstInfo({
    required this.gstRate,
    required this.theme,
  });

  final double gstRate;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        children: [
          Icon(
            Icons.receipt_long_outlined,
            size: 16,
            color: theme.colorScheme.onSurfaceVariant,
          ),
          const SizedBox(width: 6),
          Text(
            'GST: ${gstRate.toStringAsFixed(1)}% inclusive',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// Expandable Description
// =============================================================================

class _ExpandableDescription extends StatelessWidget {
  const _ExpandableDescription({
    required this.description,
    required this.expanded,
    required this.onToggle,
    required this.theme,
  });

  final String description;
  final bool expanded;
  final VoidCallback onToggle;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          onTap: onToggle,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Description',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              AnimatedRotation(
                turns: expanded ? 0.5 : 0.0,
                duration: const Duration(milliseconds: 200),
                child: Icon(
                  Icons.keyboard_arrow_down,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        AnimatedCrossFade(
          firstChild: Text(
            description,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              height: 1.5,
            ),
          ),
          secondChild: Text(
            description,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              height: 1.5,
            ),
          ),
          crossFadeState:
              expanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
          duration: const Duration(milliseconds: 200),
        ),
        if (!expanded && description.length > 150)
          GestureDetector(
            onTap: onToggle,
            child: Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                'Read more',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

// =============================================================================
// Add to Cart Button
// =============================================================================

class _AddToCartButton extends StatelessWidget {
  const _AddToCartButton({
    required this.inStock,
    this.onPressed,
    required this.theme,
  });

  final bool inStock;
  final VoidCallback? onPressed;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: FilledButton.icon(
        onPressed: onPressed,
        icon: const Icon(Icons.add_shopping_cart_rounded),
        label: Text(
          inStock ? 'Add to Cart' : 'Out of Stock',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        style: FilledButton.styleFrom(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          elevation: inStock ? 2 : 0,
        ),
      ),
    );
  }
}

// =============================================================================
// Quantity Controls (shown when item is in cart)
// =============================================================================

class _QuantityControls extends StatelessWidget {
  const _QuantityControls({
    required this.quantity,
    this.onIncrement,
    this.onDecrement,
    required this.theme,
  });

  final int quantity;
  final VoidCallback? onIncrement;
  final VoidCallback? onDecrement;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 56,
      decoration: BoxDecoration(
        color: theme.colorScheme.primary,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.primary.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Decrement button
          IconButton(
            onPressed: onDecrement,
            icon: Icon(
              quantity == 1 ? Icons.delete_outline : Icons.remove,
              color: theme.colorScheme.onPrimary,
            ),
          ),
          // Quantity display
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            transitionBuilder: (child, animation) {
              return ScaleTransition(scale: animation, child: child);
            },
            child: Text(
              '$quantity',
              key: ValueKey<int>(quantity),
              style: theme.textTheme.titleLarge?.copyWith(
                color: theme.colorScheme.onPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          // Increment button
          IconButton(
            onPressed: onIncrement,
            icon: Icon(
              Icons.add,
              color: theme.colorScheme.onPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// Related Products Section
// =============================================================================

class _RelatedProductsSection extends StatelessWidget {
  const _RelatedProductsSection({
    required this.products,
    required this.theme,
  });

  final List<Product> products;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            'Related Products',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 220,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: products.length > 8 ? 8 : products.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final product = products[index];
              return SizedBox(
                width: 155,
                child: AnimatedFadeIn(
                  index: index,
                  child: ProductCard(
                    product: product,
                    heroTag: 'related-${product.id}',
                    onTap: () {
                      // Navigate to product detail
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => ProductDetailScreen(
                            product: product,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// =============================================================================
// Related Products Shimmer
// =============================================================================

class _RelatedProductsShimmer extends StatelessWidget {
  const _RelatedProductsShimmer();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: ShimmerWidget.rectangle(width: 140, height: 18),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 220,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: 4,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, __) => const SizedBox(
              width: 155,
              child: ProductCardShimmer(),
            ),
          ),
        ),
      ],
    );
  }
}
