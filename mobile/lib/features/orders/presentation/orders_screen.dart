import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/animated_fade_in.dart';
import '../../../core/widgets/shimmer_widget.dart';
import '../domain/order_model.dart';
import '../providers/orders_provider.dart';

/// Premium orders screen with pull-to-refresh, status filter chips,
/// animated order cards, and shimmer loading.
class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({
    super.key,
    this.onOrderTap,
  });

  final void Function(OrderSummary)? onOrderTap;

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> {
  String _selectedFilter = 'ALL';

  final List<Map<String, dynamic>> _filters = [
    {'value': 'ALL', 'label': 'All'},
    {'value': 'ACTIVE', 'label': 'Active'},
    {'value': 'DELIVERED', 'label': 'Delivered'},
    {'value': 'CANCELLED', 'label': 'Cancelled'},
  ];

  Future<void> _onRefresh() async {
    ref.invalidate(ordersProvider);
    await Future.delayed(const Duration(milliseconds: 300));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ordersAsync = ref.watch(filteredOrdersProvider(_selectedFilter));

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'My Orders',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: Column(
        children: [
          // Status filter chips
          _FilterChips(
            filters: _filters,
            selectedFilter: _selectedFilter,
            onFilterChanged: (filter) {
              setState(() => _selectedFilter = filter);
            },
          ),
          // Orders list
          Expanded(
            child: RefreshIndicator(
              onRefresh: _onRefresh,
              color: theme.colorScheme.primary,
              child: ordersAsync.when(
                data: (orders) => orders.isEmpty
                    ? _EmptyOrdersState(filter: _selectedFilter)
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        itemCount: orders.length,
                        itemBuilder: (context, index) {
                          final order = orders[index];
                          return AnimatedFadeIn(
                            index: index,
                            child: _OrderCard(
                              order: order,
                              onTap: () => widget.onOrderTap?.call(order),
                            ),
                          );
                        },
                      ),
                loading: () => const _OrdersShimmer(),
                error: (error, _) => _ErrorState(
                  message: 'Failed to load orders',
                  onRetry: () => ref.invalidate(ordersProvider),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Filter chips row for order status filtering.
class _FilterChips extends StatelessWidget {
  const _FilterChips({
    required this.filters,
    required this.selectedFilter,
    required this.onFilterChanged,
  });

  final List<Map<String, dynamic>> filters;
  final String selectedFilter;
  final void Function(String) onFilterChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SizedBox(
      height: 56,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: filters.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final filter = filters[index];
          final isSelected = selectedFilter == filter['value'];
          return FilterChip(
            label: Text(filter['label'] as String),
            selected: isSelected,
            onSelected: (_) => onFilterChanged(filter['value'] as String),
            selectedColor: theme.colorScheme.primaryContainer,
            checkmarkColor: theme.colorScheme.primary,
            labelStyle: TextStyle(
              color: isSelected ? theme.colorScheme.primary : theme.colorScheme.onSurfaceVariant,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            ),
            side: BorderSide(
              color: isSelected ? theme.colorScheme.primary : theme.colorScheme.outlineVariant,
            ),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          );
        },
      ),
    );
  }
}

/// Premium order card with status badge, items preview, and delivery info.
class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order, this.onTap});

  final OrderSummary order;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row with order number and status
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.receipt_long_rounded, color: theme.colorScheme.primary, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('#${order.orderNumber}', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
                      Text(_formatDate(order.createdAt), style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                    ],
                  ),
                ),
                _StatusBadge(status: order.status),
              ],
            ),
            const SizedBox(height: 14),
            // Items preview thumbnails
            if (order.items.isNotEmpty) ...[
              Row(
                children: [
                  ...order.items.take(3).map((item) => Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: Text(
                          item.name.isNotEmpty ? item.name[0].toUpperCase() : '?',
                          style: theme.textTheme.labelSmall?.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  )),
                  if (order.items.length > 3)
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primaryContainer,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: Text('+${order.items.length - 3}', style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  const Spacer(),
                  Text('${order.itemCount} item${order.itemCount > 1 ? 's' : ''}', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                ],
              ),
              const SizedBox(height: 12),
            ],
            // Footer with total and delivery info
            Row(
              children: [
                Text('\u20B9${order.total.toStringAsFixed(0)}', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(width: 8),
                Text(order.paymentMethod, style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                const Spacer(),
                if (order.estimatedDeliveryAt != null)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.access_time_rounded, size: 14, color: theme.colorScheme.onSurfaceVariant),
                      const SizedBox(width: 4),
                      Text(_formatTime(order.estimatedDeliveryAt!), style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                    ],
                  ),
                Icon(Icons.chevron_right_rounded, color: theme.colorScheme.onSurfaceVariant, size: 20),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  String _formatTime(DateTime dt) {
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

/// Colored status badge.
class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (color, label) = _getStatusInfo(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
      ),
    );
  }

  (Color, String) _getStatusInfo(String status) {
    return switch (status) {
      'ORDER_RECEIVED' => (Colors.blue, 'Received'),
      'ACCEPTED' => (Colors.indigo, 'Accepted'),
      'PACKING' => (Colors.orange, 'Packing'),
      'READY_FOR_DELIVERY' => (Colors.teal, 'Ready'),
      'OUT_FOR_DELIVERY' => (Colors.deepPurple, 'On the way'),
      'ARRIVING' => (Colors.green, 'Arriving'),
      'DELIVERED' => (Colors.green.shade800, 'Delivered'),
      'CANCELLED' => (Colors.red, 'Cancelled'),
      _ => (Colors.grey, status),
    };
  }
}

/// Empty state for filtered orders.
class _EmptyOrdersState extends StatelessWidget {
  const _EmptyOrdersState({required this.filter});

  final String filter;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final message = switch (filter) {
      'ACTIVE' => 'No active orders',
      'DELIVERED' => 'No delivered orders yet',
      'CANCELLED' => 'No cancelled orders',
      _ => 'No orders yet',
    };

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.receipt_long_outlined, size: 44, color: theme.colorScheme.primary),
          ),
          const SizedBox(height: 20),
          Text(message, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text('Your orders will appear here', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}

/// Error state with retry button.
class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline_rounded, size: 48, color: theme.colorScheme.error),
          const SizedBox(height: 16),
          Text(message, style: theme.textTheme.bodyLarge),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

/// Shimmer loading state for orders list.
class _OrdersShimmer extends StatelessWidget {
  const _OrdersShimmer();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: List.generate(
          4,
          (index) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: Theme.of(context).colorScheme.surface,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      ShimmerWidget.box(width: 36, height: 36),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ShimmerWidget.rectangle(width: 120, height: 14),
                            const SizedBox(height: 6),
                            ShimmerWidget.rectangle(width: 80, height: 10),
                          ],
                        ),
                      ),
                      ShimmerWidget.rectangle(width: 60, height: 22, borderRadius: 8),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: List.generate(3, (_) => Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: ShimmerWidget.box(width: 36, height: 36),
                    )),
                  ),
                  const SizedBox(height: 12),
                  ShimmerWidget.rectangle(width: double.infinity, height: 14),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
