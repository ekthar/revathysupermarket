import 'package:flutter/material.dart';

import '../../../../core/widgets/shimmer_widget.dart';
import '../../domain/product_model.dart';

/// A shared animated product card widget used across home grid, category grid,
/// and related products sections.
///
/// Features:
/// - Network image with shimmer placeholder
/// - Price with discount display
/// - Quick add button with scale animation
/// - Hero wrapping for detail screen transition
class ProductCard extends StatefulWidget {
  const ProductCard({
    super.key,
    required this.product,
    this.onTap,
    this.onAddToCart,
    this.heroTag,
  });

  final Product product;
  final VoidCallback? onTap;
  final VoidCallback? onAddToCart;

  /// Custom hero tag. Defaults to 'product-{id}' if null.
  final String? heroTag;

  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _addButtonController;
  late final Animation<double> _scaleAnimation;
  bool _isImageLoaded = false;

  @override
  void initState() {
    super.initState();
    _addButtonController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
      lowerBound: 0.0,
      upperBound: 1.0,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.85).animate(
      CurvedAnimation(
        parent: _addButtonController,
        curve: Curves.easeInOut,
      ),
    );
  }

  @override
  void dispose() {
    _addButtonController.dispose();
    super.dispose();
  }

  void _onAddTapDown(TapDownDetails details) {
    _addButtonController.forward();
  }

  void _onAddTapUp(TapUpDetails details) {
    _addButtonController.reverse();
    widget.onAddToCart?.call();
  }

  void _onAddTapCancel() {
    _addButtonController.reverse();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final product = widget.product;
    final hasDiscount = product.discountPrice != null;
    final displayPrice = product.discountPrice ?? product.price;
    final percentOff = hasDiscount
        ? ((1 - displayPrice / product.price) * 100).toStringAsFixed(0)
        : null;

    final heroTag = widget.heroTag ?? 'product-${product.id}';

    return GestureDetector(
      onTap: widget.onTap,
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: isDark
                  ? Colors.black.withValues(alpha: 0.3)
                  : Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image section with hero
            Expanded(
              flex: 3,
              child: Stack(
                children: [
                  Hero(
                    tag: heroTag,
                    child: Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF334155)
                            : const Color(0xFFF8FAFC),
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(16),
                        ),
                      ),
                      child: ClipRRect(
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(16),
                        ),
                        child: _buildProductImage(product, isDark),
                      ),
                    ),
                  ),
                  // Discount badge
                  if (hasDiscount)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDC2626),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '$percentOff% OFF',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ),
                  // Quick add button
                  Positioned(
                    bottom: 8,
                    right: 8,
                    child: GestureDetector(
                      onTapDown: _onAddTapDown,
                      onTapUp: _onAddTapUp,
                      onTapCancel: _onAddTapCancel,
                      child: AnimatedBuilder(
                        animation: _scaleAnimation,
                        builder: (context, child) {
                          return Transform.scale(
                            scale: _scaleAnimation.value,
                            child: child,
                          );
                        },
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary,
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: [
                              BoxShadow(
                                color: theme.colorScheme.primary
                                    .withValues(alpha: 0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.add,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Info section
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      product.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        height: 1.2,
                      ),
                    ),
                    Text(
                      product.unit,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontSize: 11,
                      ),
                    ),
                    Row(
                      children: [
                        Text(
                          '\u20B9${displayPrice.toStringAsFixed(0)}',
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: theme.colorScheme.primary,
                          ),
                        ),
                        if (hasDiscount) ...[
                          const SizedBox(width: 4),
                          Text(
                            '\u20B9${product.price.toStringAsFixed(0)}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              decoration: TextDecoration.lineThrough,
                              color: theme.colorScheme.onSurfaceVariant,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductImage(Product product, bool isDark) {
    if (product.image.isEmpty) {
      return Center(
        child: Icon(
          Icons.image_outlined,
          size: 40,
          color: isDark ? const Color(0xFF64748B) : const Color(0xFFCBD5E1),
        ),
      );
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        // Shimmer placeholder shown until image loads
        if (!_isImageLoaded)
          const ShimmerWidget.box(
            width: double.infinity,
            height: double.infinity,
            borderRadius: 0,
          ),
        Image.network(
          product.image,
          fit: BoxFit.cover,
          loadingBuilder: (context, child, loadingProgress) {
            if (loadingProgress == null) {
              // Image has loaded
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted && !_isImageLoaded) {
                  setState(() => _isImageLoaded = true);
                }
              });
              return child;
            }
            return const SizedBox.shrink();
          },
          errorBuilder: (context, error, stackTrace) {
            return Center(
              child: Icon(
                Icons.image_not_supported_outlined,
                size: 40,
                color:
                    isDark ? const Color(0xFF64748B) : const Color(0xFFCBD5E1),
              ),
            );
          },
        ),
      ],
    );
  }
}

/// A shimmer placeholder matching the ProductCard layout.
class ProductCardShimmer extends StatelessWidget {
  const ProductCardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: isDark
                ? Colors.black.withValues(alpha: 0.3)
                : Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image placeholder
          Expanded(
            flex: 3,
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
              child: ShimmerWidget.box(
                width: double.infinity,
                height: double.infinity,
                borderRadius: 0,
              ),
            ),
          ),
          // Info placeholder
          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  ShimmerWidget.rectangle(
                    width: double.infinity,
                    height: 12,
                  ),
                  ShimmerWidget.rectangle(width: 50, height: 10),
                  ShimmerWidget.rectangle(width: 60, height: 14),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
