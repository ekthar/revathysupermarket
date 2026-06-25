import 'package:flutter/material.dart';

import '../domain/order_model.dart';

/// Order detail screen with items, timeline, and delivery location.
class OrderDetailScreen extends StatelessWidget {
  const OrderDetailScreen({
    super.key,
    required this.order,
    this.onRefresh,
  });

  final OrderDetail order;
  final VoidCallback? onRefresh;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('#${order.orderNumber}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: onRefresh,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => onRefresh?.call(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Status Timeline
              _StatusTimeline(events: order.statusEvents),
              const SizedBox(height: 24),

              // Delivery Location
              if (order.deliveryLocation != null) ...[
                Card(
                  color: theme.colorScheme.primaryContainer,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Icon(
                          Icons.delivery_dining,
                          color: theme.colorScheme.onPrimaryContainer,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Your delivery partner is on the way!',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color:
                                  theme.colorScheme.onPrimaryContainer,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Items
              Text(
                'Items',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              ...order.items.map((item) => _ItemRow(item: item)),
              const Divider(height: 24),

              // Order Summary
              _SummaryRow(label: 'Subtotal', value: order.subtotal),
              if (order.discount > 0)
                _SummaryRow(
                  label: 'Discount',
                  value: -order.discount,
                  isGreen: true,
                ),
              _SummaryRow(label: 'Delivery Fee', value: order.deliveryFee),
              const Divider(height: 16),
              _SummaryRow(
                label: 'Total',
                value: order.total,
                isBold: true,
              ),
              const SizedBox(height: 16),

              // Delivery Info
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Delivery Address',
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${order.address.houseName}, ${order.address.street}',
                        style: theme.textTheme.bodyMedium,
                      ),
                      Text(
                        '${order.address.landmark}, ${order.address.pincode}',
                        style: theme.textTheme.bodySmall,
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Icon(Icons.payment,
                              size: 16,
                              color: theme.colorScheme.onSurfaceVariant),
                          const SizedBox(width: 8),
                          Text(
                            '${order.paymentMethod} - ${order.paymentStatus}',
                            style: theme.textTheme.bodySmall,
                          ),
                        ],
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

class _StatusTimeline extends StatelessWidget {
  const _StatusTimeline({required this.events});

  final List<OrderStatusEvent> events;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      children: events.asMap().entries.map((entry) {
        final index = entry.key;
        final event = entry.value;
        final isLast = index == events.length - 1;

        return IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 24,
                child: Column(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isLast
                            ? theme.colorScheme.primary
                            : theme.colorScheme.outline,
                      ),
                    ),
                    if (!isLast)
                      Expanded(
                        child: Container(
                          width: 2,
                          color: theme.colorScheme.outlineVariant,
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _statusLabel(event.status),
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight:
                              isLast ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                      if (event.note != null)
                        Text(
                          event.note!,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      Text(
                        _formatDateTime(event.createdAt),
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  String _statusLabel(String status) {
    return switch (status) {
      'ORDER_RECEIVED' => 'Order Received',
      'ACCEPTED' => 'Accepted',
      'PACKING' => 'Packing',
      'READY_FOR_DELIVERY' => 'Ready for Delivery',
      'OUT_FOR_DELIVERY' => 'Out for Delivery',
      'ARRIVING' => 'Arriving',
      'DELIVERED' => 'Delivered',
      'CANCELLED' => 'Cancelled',
      _ => status,
    };
  }

  String _formatDateTime(DateTime dt) {
    return '${dt.day}/${dt.month}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

class _ItemRow extends StatelessWidget {
  const _ItemRow({required this.item});

  final OrderDetailItem item;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(
              '${item.name} x ${item.quantity}',
              style: theme.textTheme.bodyMedium,
            ),
          ),
          Text(
            '\u20B9${(item.price * item.quantity).toStringAsFixed(0)}',
            style: theme.textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.isBold = false,
    this.isGreen = false,
  });

  final String label;
  final double value;
  final bool isBold;
  final bool isGreen;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final style = isBold
        ? theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)
        : theme.textTheme.bodyMedium;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: style),
          Text(
            '${value < 0 ? "-" : ""}\u20B9${value.abs().toStringAsFixed(0)}',
            style: style?.copyWith(
              color: isGreen ? Colors.green.shade700 : null,
            ),
          ),
        ],
      ),
    );
  }
}
