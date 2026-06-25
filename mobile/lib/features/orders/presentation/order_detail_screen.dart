import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/animated_fade_in.dart';
import '../../../core/widgets/shimmer_widget.dart';
import '../domain/order_model.dart';
import '../providers/orders_provider.dart';

/// Premium order detail screen with animated status timeline,
/// items list, price breakdown, delivery info, and action buttons.
class OrderDetailScreen extends ConsumerWidget {
  const OrderDetailScreen({
    super.key,
    required this.orderId,
    this.onTrackOrder,
  });

  final String orderId;
  final VoidCallback? onTrackOrder;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final orderAsync = ref.watch(orderDetailProvider(orderId));

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Order Details',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.invalidate(orderDetailProvider(orderId)),
          ),
        ],
      ),
      body: orderAsync.when(
        data: (order) => _OrderDetailContent(
          order: order,
          onTrackOrder: onTrackOrder,
        ),
        loading: () => const _OrderDetailShimmer(),
        error: (error, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline_rounded, size: 48, color: theme.colorScheme.error),
              const SizedBox(height: 16),
              Text('Failed to load order details', style: theme.textTheme.bodyLarge),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () => ref.invalidate(orderDetailProvider(orderId)),
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Main content of order detail.
class _OrderDetailContent extends StatelessWidget {
  const _OrderDetailContent({
    required this.order,
    this.onTrackOrder,
  });

  final OrderDetail order;
  final VoidCallback? onTrackOrder;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isActive = !['DELIVERED', 'CANCELLED'].contains(order.status);

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Order number and status header
          AnimatedFadeIn(
            index: 0,
            child: _OrderHeader(order: order),
          ),
          const SizedBox(height: 20),

          // Animated status timeline
          AnimatedFadeIn(
            index: 1,
            child: _AnimatedStatusTimeline(events: order.statusEvents),
          ),
          const SizedBox(height: 20),

          // Live tracking button (when out for delivery)
          if (isActive && order.deliveryLocation != null)
            AnimatedFadeIn(
              index: 2,
              child: _TrackingCard(onTrack: onTrackOrder),
            ),

          // Delivery partner info
          if (order.deliveryLocation != null)
            AnimatedFadeIn(
              index: 3,
              child: _DeliveryPartnerCard(),
            ),

          // Order items
          AnimatedFadeIn(
            index: 4,
            child: _OrderItemsSection(items: order.items),
          ),
          const SizedBox(height: 16),

          // Price breakdown
          AnimatedFadeIn(
            index: 5,
            child: _PriceBreakdownCard(order: order),
          ),
          const SizedBox(height: 16),

          // Address card
          AnimatedFadeIn(
            index: 6,
            child: _AddressCard(address: order.address),
          ),
          const SizedBox(height: 16),

          // Payment info
          AnimatedFadeIn(
            index: 7,
            child: _PaymentInfoCard(order: order),
          ),
          const SizedBox(height: 24),

          // Action buttons
          AnimatedFadeIn(
            index: 8,
            child: _ActionButtons(order: order),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

/// Order header with number and status badge.
class _OrderHeader extends StatelessWidget {
  const _OrderHeader({required this.order});

  final OrderDetail order;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final (color, label) = _getStatusInfo(order.status);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.receipt_long_rounded, color: color, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('#${order.orderNumber}', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(_formatDateTime(order.createdAt), style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: color.withValues(alpha: 0.3)),
            ),
            child: Text(label, style: theme.textTheme.labelMedium?.copyWith(color: color, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  String _formatDateTime(DateTime dt) {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${dt.day} ${months[dt.month - 1]} ${dt.year}, ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

/// Animated status timeline with vertical stepper and icons.
class _AnimatedStatusTimeline extends StatefulWidget {
  const _AnimatedStatusTimeline({required this.events});

  final List<OrderStatusEvent> events;

  @override
  State<_AnimatedStatusTimeline> createState() => _AnimatedStatusTimelineState();
}

class _AnimatedStatusTimelineState extends State<_AnimatedStatusTimeline>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 300 * widget.events.length),
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Order Status', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          ...widget.events.asMap().entries.map((entry) {
            final index = entry.key;
            final event = entry.value;
            final isLast = index == widget.events.length - 1;
            final intervalStart = index / widget.events.length;
            final intervalEnd = (index + 1) / widget.events.length;

            return AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                final progress = ((_controller.value - intervalStart) / (intervalEnd - intervalStart)).clamp(0.0, 1.0);
                return Opacity(opacity: progress, child: child);
              },
              child: IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 32,
                      child: Column(
                        children: [
                          Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isLast ? theme.colorScheme.primary : theme.colorScheme.primary.withValues(alpha: 0.2),
                            ),
                            child: Center(
                              child: Icon(
                                _getStatusIcon(event.status),
                                size: 14,
                                color: isLast ? Colors.white : theme.colorScheme.primary,
                              ),
                            ),
                          ),
                          if (!isLast)
                            Expanded(
                              child: Container(
                                width: 2,
                                margin: const EdgeInsets.symmetric(vertical: 4),
                                color: theme.colorScheme.primary.withValues(alpha: 0.3),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _statusLabel(event.status),
                              style: theme.textTheme.bodyMedium?.copyWith(fontWeight: isLast ? FontWeight.bold : FontWeight.w500),
                            ),
                            if (event.note != null)
                              Text(event.note!, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                            Text(
                              _formatTime(event.createdAt),
                              style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  IconData _getStatusIcon(String status) {
    return switch (status) {
      'ORDER_RECEIVED' => Icons.shopping_bag_outlined,
      'ACCEPTED' => Icons.check_circle_outline,
      'PACKING' => Icons.inventory_2_outlined,
      'READY_FOR_DELIVERY' => Icons.local_shipping_outlined,
      'OUT_FOR_DELIVERY' => Icons.delivery_dining,
      'ARRIVING' => Icons.near_me_outlined,
      'DELIVERED' => Icons.done_all,
      'CANCELLED' => Icons.cancel_outlined,
      _ => Icons.circle_outlined,
    };
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

  String _formatTime(DateTime dt) {
    return '${dt.day}/${dt.month}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

/// Live tracking card with button.
class _TrackingCard extends StatelessWidget {
  const _TrackingCard({this.onTrack});

  final VoidCallback? onTrack;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [theme.colorScheme.primary, theme.colorScheme.primary.withValues(alpha: 0.8)],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.delivery_dining, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Your order is on the way!', style: theme.textTheme.titleSmall?.copyWith(color: Colors.white, fontWeight: FontWeight.bold)),
                const SizedBox(height: 2),
                Text('Track live location', style: theme.textTheme.bodySmall?.copyWith(color: Colors.white70)),
              ],
            ),
          ),
          FilledButton.tonal(
            onPressed: onTrack,
            style: FilledButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: theme.colorScheme.primary,
            ),
            child: const Text('Track'),
          ),
        ],
      ),
    );
  }
}

/// Delivery partner info card.
class _DeliveryPartnerCard extends StatelessWidget {
  const _DeliveryPartnerCard();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: theme.colorScheme.primaryContainer,
            child: Icon(Icons.person_rounded, color: theme.colorScheme.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Delivery Partner', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                Text('Assigned and on the way', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
              ],
            ),
          ),
          IconButton(
            onPressed: () {},
            icon: Icon(Icons.phone_rounded, color: theme.colorScheme.primary),
          ),
        ],
      ),
    );
  }
}

/// Order items section with images and prices.
class _OrderItemsSection extends StatelessWidget {
  const _OrderItemsSection({required this.items});

  final List<OrderDetailItem> items;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Items (${items.length})', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          ...items.map((item) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Text(item.name.isNotEmpty ? item.name[0].toUpperCase() : '?', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold, color: theme.colorScheme.primary)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.name, style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis),
                      Text('x${item.quantity} @ \u20B9${item.price.toStringAsFixed(0)}', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                    ],
                  ),
                ),
                Text('\u20B9${(item.price * item.quantity).toStringAsFixed(0)}', style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
              ],
            ),
          )),
        ],
      ),
    );
  }
}

/// Price breakdown card.
class _PriceBreakdownCard extends StatelessWidget {
  const _PriceBreakdownCard({required this.order});

  final OrderDetail order;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Price Details', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          _PriceRow(label: 'Subtotal', value: order.subtotal),
          if (order.discount > 0)
            _PriceRow(label: 'Discount', value: -order.discount, isGreen: true),
          _PriceRow(label: 'Delivery Fee', value: order.deliveryFee),
          if (order.loyaltyPointsRedeemed > 0)
            _PriceRow(label: 'Loyalty Points', value: -(order.loyaltyPointsRedeemed / 10), isGreen: true),
          const Divider(height: 20),
          _PriceRow(label: 'Total', value: order.total, isBold: true),
        ],
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  const _PriceRow({required this.label, required this.value, this.isBold = false, this.isGreen = false});

  final String label;
  final double value;
  final bool isBold;
  final bool isGreen;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final style = isBold ? theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold) : theme.textTheme.bodyMedium;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: style),
          Text(
            '${value < 0 ? "-" : ""}\u20B9${value.abs().toStringAsFixed(0)}',
            style: style?.copyWith(color: isGreen ? Colors.green.shade700 : null),
          ),
        ],
      ),
    );
  }
}

/// Address card with map icon.
class _AddressCard extends StatelessWidget {
  const _AddressCard({required this.address});

  final OrderAddress address;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.location_on_rounded, color: theme.colorScheme.primary, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Delivery Address', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Text('${address.houseName}, ${address.street}', style: theme.textTheme.bodyMedium),
                Text('${address.landmark}, ${address.pincode}', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Payment info section.
class _PaymentInfoCard extends StatelessWidget {
  const _PaymentInfoCard({required this.order});

  final OrderDetail order;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final (icon, label) = _getPaymentInfo(order.paymentMethod);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: theme.colorScheme.primary, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Payment', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(label, style: theme.textTheme.bodyMedium),
                Text(_paymentStatusLabel(order.paymentStatus), style: theme.textTheme.bodySmall?.copyWith(color: order.paymentStatus == 'PAID' ? Colors.green.shade700 : theme.colorScheme.onSurfaceVariant)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  (IconData, String) _getPaymentInfo(String method) {
    return switch (method) {
      'COD' => (Icons.money_rounded, 'Cash on Delivery'),
      'UPI' || 'UPI_ON_DELIVERY' => (Icons.qr_code_rounded, 'UPI Payment'),
      'CARD' => (Icons.credit_card_rounded, 'Card Payment'),
      'WALLET' => (Icons.account_balance_wallet_rounded, 'Wallet'),
      _ => (Icons.payment_rounded, method),
    };
  }

  String _paymentStatusLabel(String status) {
    return switch (status) {
      'PAID' => 'Paid',
      'PENDING' => 'Payment Pending',
      'FAILED' => 'Payment Failed',
      'REFUNDED' => 'Refunded',
      _ => status,
    };
  }
}

/// Cancel/Reorder action buttons.
class _ActionButtons extends StatelessWidget {
  const _ActionButtons({required this.order});

  final OrderDetail order;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final canCancel = ['ORDER_RECEIVED', 'ACCEPTED', 'PACKING'].contains(order.status);
    final canReorder = order.status == 'DELIVERED';

    if (!canCancel && !canReorder) return const SizedBox.shrink();

    return Row(
      children: [
        if (canCancel)
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Cancel Order'),
                    content: const Text('Are you sure you want to cancel this order?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('No')),
                      FilledButton(onPressed: () => Navigator.pop(ctx), child: const Text('Yes, Cancel')),
                    ],
                  ),
                );
              },
              icon: const Icon(Icons.cancel_outlined),
              label: const Text('Cancel Order'),
              style: OutlinedButton.styleFrom(
                foregroundColor: theme.colorScheme.error,
                side: BorderSide(color: theme.colorScheme.error),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        if (canCancel && canReorder) const SizedBox(width: 12),
        if (canReorder)
          Expanded(
            child: FilledButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.replay_rounded),
              label: const Text('Reorder'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
      ],
    );
  }
}

/// Shimmer loading for order detail.
class _OrderDetailShimmer extends StatelessWidget {
  const _OrderDetailShimmer();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ShimmerWidget.box(width: double.infinity, height: 80),
          const SizedBox(height: 20),
          ShimmerWidget.box(width: double.infinity, height: 200),
          const SizedBox(height: 20),
          ShimmerWidget.box(width: double.infinity, height: 150),
          const SizedBox(height: 16),
          ShimmerWidget.box(width: double.infinity, height: 120),
          const SizedBox(height: 16),
          ShimmerWidget.box(width: double.infinity, height: 80),
        ],
      ),
    );
  }
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
