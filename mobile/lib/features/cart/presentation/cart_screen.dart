import 'package:flutter/material.dart';

import '../domain/cart_item_model.dart';

/// Cart screen with item list, quantity controls, and checkout button.
class CartScreen extends StatelessWidget {
  const CartScreen({
    super.key,
    this.items = const [],
    this.subtotal = 0,
    this.onUpdateQuantity,
    this.onRemoveItem,
    this.onCheckout,
    this.isValidating = false,
  });

  final List<CartItem> items;
  final double subtotal;
  final void Function(String productId, int quantity)? onUpdateQuantity;
  final void Function(String productId)? onRemoveItem;
  final VoidCallback? onCheckout;
  final bool isValidating;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('Cart (${items.length})'),
      ),
      body: items.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.shopping_cart_outlined,
                    size: 64,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Your cart is empty',
                    style: theme.textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Add items to get started',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            )
          : Column(
              children: [
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const Divider(height: 24),
                    itemBuilder: (context, index) {
                      final item = items[index];
                      return _CartItemTile(
                        item: item,
                        onUpdateQuantity: (qty) =>
                            onUpdateQuantity?.call(item.productId, qty),
                        onRemove: () => onRemoveItem?.call(item.productId),
                      );
                    },
                  ),
                ),
                _CheckoutBar(
                  subtotal: subtotal,
                  onCheckout: onCheckout,
                  isValidating: isValidating,
                ),
              ],
            ),
    );
  }
}

class _CartItemTile extends StatelessWidget {
  const _CartItemTile({
    required this.item,
    this.onUpdateQuantity,
    this.onRemove,
  });

  final CartItem item;
  final void Function(int)? onUpdateQuantity;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final effectivePrice = item.discountPrice ?? item.price;
    final lineTotal = effectivePrice * item.quantity;

    return Opacity(
      opacity: item.available ? 1.0 : 0.5,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.image, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  '${item.unit} - \u20B9${effectivePrice.toStringAsFixed(0)}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                if (!item.available && item.unavailableReason != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      item.unavailableReason!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.error,
                      ),
                    ),
                  ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _QuantityControl(
                      quantity: item.quantity,
                      onChanged: onUpdateQuantity,
                    ),
                    const Spacer(),
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
          IconButton(
            icon: const Icon(Icons.close, size: 18),
            onPressed: onRemove,
            visualDensity: VisualDensity.compact,
          ),
        ],
      ),
    );
  }
}

class _QuantityControl extends StatelessWidget {
  const _QuantityControl({required this.quantity, this.onChanged});

  final int quantity;
  final void Function(int)? onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Theme.of(context).colorScheme.outline),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          InkWell(
            onTap: () => onChanged?.call(quantity - 1),
            child: const Padding(
              padding: EdgeInsets.all(6),
              child: Icon(Icons.remove, size: 16),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              '$quantity',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ),
          InkWell(
            onTap: () => onChanged?.call(quantity + 1),
            child: const Padding(
              padding: EdgeInsets.all(6),
              child: Icon(Icons.add, size: 16),
            ),
          ),
        ],
      ),
    );
  }
}

class _CheckoutBar extends StatelessWidget {
  const _CheckoutBar({
    required this.subtotal,
    this.onCheckout,
    this.isValidating = false,
  });

  final double subtotal;
  final VoidCallback? onCheckout;
  final bool isValidating;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Subtotal',
                  style: theme.textTheme.bodySmall,
                ),
                Text(
                  '\u20B9${subtotal.toStringAsFixed(0)}',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 24),
            Expanded(
              child: FilledButton(
                onPressed: isValidating ? null : onCheckout,
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: isValidating
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Proceed to Checkout'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
