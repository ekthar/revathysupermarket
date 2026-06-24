import 'package:flutter/material.dart';

import '../../products/domain/product_model.dart';

/// Favorites screen showing saved products with remove option.
class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({
    super.key,
    this.products = const [],
    this.onProductTap,
    this.onRemove,
    this.isLoading = false,
  });

  final List<Product> products;
  final void Function(Product)? onProductTap;
  final void Function(Product)? onRemove;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Favorites')),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : products.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.favorite_outline,
                        size: 64,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(height: 16),
                      Text('No favorites yet',
                          style: theme.textTheme.titleMedium),
                      const SizedBox(height: 8),
                      Text(
                        'Save products you love for quick access',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: products.length,
                  separatorBuilder: (_, __) => const Divider(),
                  itemBuilder: (context, index) {
                    final product = products[index];
                    return ListTile(
                      leading: Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.image, size: 24),
                      ),
                      title: Text(product.name),
                      subtitle: Text(
                        '\u20B9${(product.discountPrice ?? product.price).toStringAsFixed(0)}',
                        style: TextStyle(color: theme.colorScheme.primary),
                      ),
                      trailing: IconButton(
                        icon: Icon(
                          Icons.favorite,
                          color: theme.colorScheme.error,
                        ),
                        onPressed: () => onRemove?.call(product),
                      ),
                      onTap: () => onProductTap?.call(product),
                    );
                  },
                ),
    );
  }
}
