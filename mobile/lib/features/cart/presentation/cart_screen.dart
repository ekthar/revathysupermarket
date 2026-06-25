import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/animated_fade_in.dart';
import '../../../core/widgets/shimmer_widget.dart';
import '../domain/cart_item_model.dart';
import '../providers/cart_provider.dart';

/// Premium cart screen with slide-to-delete, animated quantities,
/// GST breakdown, savings badge, and sticky checkout bar.
class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({
    super.key,
    this.onCheckout,
  });

  final VoidCallback? onCheckout;

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  final GlobalKey<AnimatedListState> _listKey = GlobalKey<AnimatedListState>();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cartState = ref.watch(cartProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'My Cart',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          if (cartState.items.isNotEmpty)
            TextButton.icon(
              onPressed: () => _showClearCartDialog(context),
              icon: const Icon(Icons.delete_outline, size: 18),
              label: const Text('Clear'),
            ),
        ],
      ),
      body: cartState.isLoading
          ? const _CartShimmer()
          : cartState.isEmpty
              ? _EmptyCartState(onStartShopping: () {
                  Navigator.of(context).pop();
                })
              : Column(
                  children: [
                    // Savings callout badge
                    if (cartState.totalSavings > 0)
                      AnimatedFadeIn(
                        index: 0,
                        child: _SavingsBanner(
                          savings: cartState.totalSavings,
                        ),
                      ),
                    // Cart items list
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        itemCount: cartState.items.length,
                        itemBuilder: (context, index) {
                          final item = cartState.items[index];
                          return AnimatedFadeIn(
                            index: index,
                            child: _DismissibleCartItem(
                              item: item,
                              onRemove: () {
                                ref
                                    .read(cartProvider.notifier)
                                    .removeItem(item.productId);
                              },
                              onUpdateQuantity: (qty) {
                                ref
                                    .read(cartProvider.notifier)
                                    .updateQuantity(item.productId, qty);
                              },
                            ),
                          );
                        },
                      ),
                    ),
                    // GST breakdown section
                    _PriceBreakdown(cartState: cartState),
                    // Sticky bottom checkout bar
                    _StickyCheckoutBar(
                      total: cartState.total,
                      itemCount: cartState.totalQuantity,
                      isValidating: cartState.isValidating,
                      onCheckout: widget.onCheckout,
                    ),
                  ],
                ),
    );
  }

  void _showClearCartDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear Cart'),
        content: const Text(
          'Are you sure you want to remove all items from your cart?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              ref.read(cartProvider.notifier).clearCart();
              Navigator.pop(ctx);
            },
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }
}

/// Empty cart state with illustration and 'Start Shopping' button.
class _EmptyCartState extends StatelessWidget {
  const _EmptyCartState({this.onStartShopping});

  final VoidCallback? onStartShopping;

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
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.shopping_cart_outlined,
                size: 56,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Your cart is empty',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Looks like you have not added anything to your cart yet.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 32),
            FilledButton.icon(
              onPressed: onStartShopping,
              icon: const Icon(Icons.storefront_rounded),
              label: const Text('Start Shopping'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Savings callout badge shown when discount items are in cart.
class _SavingsBanner extends StatelessWidget {
  const _SavingsBanner({required this.savings});

  final double savings;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.green.shade50,
            Colors.green.shade100,
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.local_offer, color: Colors.green.shade700, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'You are saving \u20B9${savings.toStringAsFixed(0)} on this order!',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: Colors.green.shade800,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Dismissible cart item with red background and trash icon on swipe.
class _DismissibleCartItem extends StatelessWidget {
  const _DismissibleCartItem({
    required this.item,
    required this.onRemove,
    required this.onUpdateQuantity,
  });

  final CartItem item;
  final VoidCallback onRemove;
  final void Function(int quantity) onUpdateQuantity;

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: ValueKey(item.productId),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onRemove(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 24),
        margin: const EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(
          color: Colors.red.shade50,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.delete_rounded, color: Colors.red.shade600, size: 28),
            const SizedBox(height: 4),
            Text(
              'Delete',
              style: TextStyle(
                color: Colors.red.shade600,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
      child: _CartItemCard(
        item: item,
        onUpdateQuantity: onUpdateQuantity,
      ),
    );
  }
}

/// Premium cart item card with network image, price, and animated quantity.
class _CartItemCard extends StatelessWidget {
  const _CartItemCard({
    required this.item,
    required this.onUpdateQuantity,
  });

  final CartItem item;
  final void Function(int) onUpdateQuantity;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final effectivePrice = item.discountPrice ?? item.price;
    final lineTotal = effectivePrice * item.quantity;
    final hasDiscount = item.discountPrice != null &&
        item.discountPrice! < item.price;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: item.available
              ? theme.colorScheme.outlineVariant.withValues(alpha: 0.5)
              : theme.colorScheme.error.withValues(alpha: 0.3),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Opacity(
        opacity: item.available ? 1.0 : 0.6,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Product image from network
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 72,
                height: 72,
                child: item.image.isNotEmpty
                    ? Image.network(
                        item.image,
                        width: 72,
                        height: 72,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: theme.colorScheme.surfaceContainerHighest,
                          child: Icon(
                            Icons.image_outlined,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      )
                    : Container(
                        color: theme.colorScheme.surfaceContainerHighest,
                        child: Icon(
                          Icons.image_outlined,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
              ),
            ),
            const SizedBox(width: 12),
            // Item details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.name,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    item.unit,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        '\u20B9${effectivePrice.toStringAsFixed(0)}',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.primary,
                        ),
                      ),
                      if (hasDiscount) ...[
                        const SizedBox(width: 6),
                        Text(
                          '\u20B9${item.price.toStringAsFixed(0)}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (!item.available && item.unavailableReason != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        item.unavailableReason!,
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.error,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            // Right section: quantity and line total
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _AnimatedQuantityControl(
                  quantity: item.quantity,
                  onChanged: onUpdateQuantity,
                ),
                const SizedBox(height: 8),
                Text(
                  '\u20B9${lineTotal.toStringAsFixed(0)}',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Animated quantity control with scale animation on number change.
class _AnimatedQuantityControl extends StatefulWidget {
  const _AnimatedQuantityControl({
    required this.quantity,
    required this.onChanged,
  });

  final int quantity;
  final void Function(int) onChanged;

  @override
  State<_AnimatedQuantityControl> createState() =>
      _AnimatedQuantityControlState();
}

class _AnimatedQuantityControlState extends State<_AnimatedQuantityControl>
    with SingleTickerProviderStateMixin {
  late AnimationController _scaleController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.3).animate(
      CurvedAnimation(parent: _scaleController, curve: Curves.easeInOut),
    );
  }

  @override
  void didUpdateWidget(_AnimatedQuantityControl oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.quantity != widget.quantity) {
      _scaleController.forward().then((_) => _scaleController.reverse());
    }
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _QuantityButton(
            icon: widget.quantity <= 1
                ? Icons.delete_outline
                : Icons.remove,
            onTap: () {
              if (widget.quantity <= 1) {
                widget.onChanged(0);
              } else {
                widget.onChanged(widget.quantity - 1);
              }
            },
            isDestructive: widget.quantity <= 1,
          ),
          AnimatedBuilder(
            animation: _scaleAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _scaleAnimation.value,
                child: child,
              );
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                '${widget.quantity}',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          _QuantityButton(
            icon: Icons.add,
            onTap: () => widget.onChanged(widget.quantity + 1),
          ),
        ],
      ),
    );
  }
}

class _QuantityButton extends StatelessWidget {
  const _QuantityButton({
    required this.icon,
    required this.onTap,
    this.isDestructive = false,
  });

  final IconData icon;
  final VoidCallback onTap;
  final bool isDestructive;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Icon(
          icon,
          size: 18,
          color: isDestructive
              ? theme.colorScheme.error
              : theme.colorScheme.primary,
        ),
      ),
    );
  }
}

/// Price breakdown section showing subtotal, GST, delivery, and savings.
class _PriceBreakdown extends StatelessWidget {
  const _PriceBreakdown({required this.cartState});

  final CartState cartState;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Bill Details',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          _BillRow(
            label: 'Item Total',
            value: '\u20B9${cartState.subtotal.toStringAsFixed(0)}',
          ),
          _BillRow(
            label: 'GST (5%)',
            value: '\u20B9${cartState.gst.toStringAsFixed(0)}',
          ),
          _BillRow(
            label: 'Delivery Fee',
            value: cartState.deliveryFee == 0
                ? 'FREE'
                : '\u20B9${cartState.deliveryFee.toStringAsFixed(0)}',
            valueColor: cartState.deliveryFee == 0 ? Colors.green : null,
          ),
          if (cartState.totalSavings > 0)
            _BillRow(
              label: 'Total Savings',
              value: '-\u20B9${cartState.totalSavings.toStringAsFixed(0)}',
              valueColor: Colors.green.shade700,
            ),
          const Divider(height: 16),
          _BillRow(
            label: 'Grand Total',
            value: '\u20B9${cartState.total.toStringAsFixed(0)}',
            isBold: true,
          ),
          if (cartState.subtotal < 500)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Add \u20B9${(500 - cartState.subtotal).toStringAsFixed(0)} more for free delivery',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _BillRow extends StatelessWidget {
  const _BillRow({
    required this.label,
    required this.value,
    this.isBold = false,
    this.valueColor,
  });

  final String label;
  final String value;
  final bool isBold;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textStyle = isBold
        ? theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)
        : theme.textTheme.bodyMedium;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: textStyle),
          Text(
            value,
            style: textStyle?.copyWith(
              color: valueColor,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

/// Sticky bottom bar with total and checkout button.
class _StickyCheckoutBar extends StatelessWidget {
  const _StickyCheckoutBar({
    required this.total,
    required this.itemCount,
    required this.isValidating,
    this.onCheckout,
  });

  final double total;
  final int itemCount;
  final bool isValidating;
  final VoidCallback? onCheckout;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Total section
            Expanded(
              flex: 2,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$itemCount item${itemCount > 1 ? 's' : ''}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '\u20B9${total.toStringAsFixed(0)}',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            // Checkout button
            Expanded(
              flex: 3,
              child: FilledButton(
                onPressed: isValidating ? null : onCheckout,
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: isValidating
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'Proceed to Checkout',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.arrow_forward_rounded, size: 18),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Shimmer loading state for cart.
class _CartShimmer extends StatelessWidget {
  const _CartShimmer();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: List.generate(
          4,
          (index) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                ShimmerWidget.box(width: 72, height: 72),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ShimmerWidget.rectangle(
                        width: double.infinity,
                        height: 14,
                      ),
                      const SizedBox(height: 8),
                      ShimmerWidget.rectangle(width: 80, height: 12),
                      const SizedBox(height: 8),
                      ShimmerWidget.rectangle(width: 60, height: 14),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
