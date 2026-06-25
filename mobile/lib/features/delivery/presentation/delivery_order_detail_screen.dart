import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/network/api_client.dart';
import '../../../core/widgets/animated_fade_in.dart';
import '../../../core/widgets/shimmer_widget.dart';

/// Delivery order detail screen with premium UI.
///
/// Shows status badge, customer info card, order items, payment info,
/// navigation card, notes, and dynamic action buttons based on status.
class DeliveryOrderDetailScreen extends StatefulWidget {
  const DeliveryOrderDetailScreen({
    super.key,
    required this.orderId,
    required this.apiClient,
    this.onPickup,
    this.onDamageReport,
    this.onCollection,
    this.onComplete,
  });

  final String orderId;
  final ApiClient apiClient;
  final VoidCallback? onPickup;
  final VoidCallback? onDamageReport;
  final VoidCallback? onCollection;
  final VoidCallback? onComplete;

  @override
  State<DeliveryOrderDetailScreen> createState() =>
      _DeliveryOrderDetailScreenState();
}

class _DeliveryOrderDetailScreenState extends State<DeliveryOrderDetailScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _orderData;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadOrderDetails();
  }

  Future<void> _loadOrderDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await widget.apiClient.get<Map<String, dynamic>>(
        '/delivery/orders/${widget.orderId}',
      );
      setState(() {
        _orderData = response.data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load order details';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          _orderData != null
              ? 'Order #${_orderData!['orderNumber'] ?? ''}'
              : 'Order Details',
        ),
        actions: [
          IconButton(
            onPressed: _loadOrderDetails,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _isLoading
          ? _buildShimmer()
          : _error != null
              ? _buildError(colorScheme)
              : _buildContent(theme),
    );
  }

  Widget _buildShimmer() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const ShimmerWidget.box(width: 120, height: 32, borderRadius: 16),
          const SizedBox(height: 20),
          const ShimmerWidget.box(
              width: double.infinity, height: 140, borderRadius: 16),
          const SizedBox(height: 16),
          const ShimmerWidget.box(
              width: double.infinity, height: 200, borderRadius: 16),
          const SizedBox(height: 16),
          const ShimmerWidget.box(
              width: double.infinity, height: 80, borderRadius: 16),
        ],
      ),
    );
  }

  Widget _buildError(ColorScheme colorScheme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: colorScheme.error.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.error_outline,
                size: 48,
                color: colorScheme.error,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: GoogleFonts.interTight(
                fontSize: 16,
                color: colorScheme.onSurface,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _loadOrderDetails,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(ThemeData theme) {
    final data = _orderData!;
    final colorScheme = theme.colorScheme;
    final items = List<Map<String, dynamic>>.from(data['items'] as List? ?? []);
    final status = data['status'] as String? ?? '';
    final customerName = data['customerName'] as String? ?? '';
    final phone = data['phone'] as String? ?? '';
    final address = data['address'] as String? ?? '';
    final total = (data['total'] as num?)?.toDouble() ?? 0;
    final paymentMethod = data['paymentMethod'] as String? ?? 'COD';
    final notes = data['notes'] as String?;

    return Column(
      children: [
        Expanded(
          child: RefreshIndicator(
            onRefresh: _loadOrderDetails,
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                // Status badge
                AnimatedFadeIn(
                  index: 0,
                  child: Center(
                    child: _StatusBadge(status: status),
                  ),
                ),
                const SizedBox(height: 20),

                // Customer info card
                AnimatedFadeIn(
                  index: 1,
                  child: _CustomerInfoCard(
                    name: customerName,
                    phone: phone,
                    address: address,
                  ),
                ),
                const SizedBox(height: 16),

                // Navigation card
                AnimatedFadeIn(
                  index: 2,
                  child: _NavigationCard(address: address),
                ),
                const SizedBox(height: 16),

                // Items card
                AnimatedFadeIn(
                  index: 3,
                  child: _OrderItemsCard(items: items, total: total),
                ),
                const SizedBox(height: 16),

                // Payment info
                AnimatedFadeIn(
                  index: 4,
                  child: _PaymentInfoCard(
                    method: paymentMethod,
                    amount: total,
                  ),
                ),

                // Notes section
                if (notes != null && notes.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  AnimatedFadeIn(
                    index: 5,
                    child: _NotesCard(notes: notes),
                  ),
                ],
                const SizedBox(height: 100), // Space for action buttons
              ],
            ),
          ),
        ),

        // Action buttons at bottom
        _ActionButtonsBar(
          status: status,
          onPickup: widget.onPickup,
          onDamageReport: widget.onDamageReport,
          onCollection: widget.onCollection,
          onComplete: widget.onComplete,
        ),
      ],
    );
  }
}

// ==========================================================
// Status Badge
// ==========================================================

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final String status;

  Color _statusColor() {
    switch (status) {
      case 'READY_FOR_DELIVERY':
        return const Color(0xFF2563EB);
      case 'OUT_FOR_DELIVERY':
        return const Color(0xFFD97706);
      case 'ARRIVING':
        return const Color(0xFFEA580C);
      case 'DELIVERED':
        return const Color(0xFF059669);
      default:
        return const Color(0xFF64748B);
    }
  }

  IconData _statusIcon() {
    switch (status) {
      case 'READY_FOR_DELIVERY':
        return Icons.inventory_2_outlined;
      case 'OUT_FOR_DELIVERY':
        return Icons.local_shipping_outlined;
      case 'ARRIVING':
        return Icons.pin_drop_outlined;
      case 'DELIVERED':
        return Icons.check_circle_outline;
      default:
        return Icons.info_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _statusColor();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_statusIcon(), color: color, size: 18),
          const SizedBox(width: 8),
          Text(
            status.replaceAll('_', ' '),
            style: GoogleFonts.interTight(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// ==========================================================
// Customer Info Card
// ==========================================================

class _CustomerInfoCard extends StatelessWidget {
  const _CustomerInfoCard({
    required this.name,
    required this.phone,
    required this.address,
  });

  final String name;
  final String phone;
  final String address;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: colorScheme.outlineVariant.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.person_outline,
                color: colorScheme.primary,
                size: 18,
              ),
              const SizedBox(width: 8),
              Text(
                'Customer',
                style: GoogleFonts.interTight(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: colorScheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            name,
            style: GoogleFonts.manrope(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Icon(
                Icons.location_on_outlined,
                size: 16,
                color: colorScheme.onSurface.withValues(alpha: 0.5),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  address,
                  style: GoogleFonts.interTight(
                    fontSize: 13,
                    color: colorScheme.onSurface.withValues(alpha: 0.7),
                  ),
                ),
              ),
            ],
          ),
          if (phone.isNotEmpty) ...[
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  // URL launcher for phone call
                },
                icon: const Icon(Icons.phone, size: 18),
                label: Text('Call $phone'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ==========================================================
// Navigation Card
// ==========================================================

class _NavigationCard extends StatelessWidget {
  const _NavigationCard({required this.address});

  final String address;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: colorScheme.outlineVariant.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF2563EB).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.directions,
              color: Color(0xFF2563EB),
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Get Directions',
                  style: GoogleFonts.interTight(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Open in Maps',
                  style: GoogleFonts.interTight(
                    fontSize: 12,
                    color: colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.open_in_new,
            size: 18,
            color: colorScheme.onSurface.withValues(alpha: 0.4),
          ),
        ],
      ),
    );
  }
}

// ==========================================================
// Order Items Card
// ==========================================================

class _OrderItemsCard extends StatelessWidget {
  const _OrderItemsCard({required this.items, required this.total});

  final List<Map<String, dynamic>> items;
  final double total;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: colorScheme.outlineVariant.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.shopping_bag_outlined,
                color: colorScheme.primary,
                size: 18,
              ),
              const SizedBox(width: 8),
              Text(
                'Items (${items.length})',
                style: GoogleFonts.interTight(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: colorScheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...items.map((item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Center(
                        child: Text(
                          '${item['quantity'] ?? 1}x',
                          style: GoogleFonts.interTight(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: colorScheme.onSurface.withValues(alpha: 0.7),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        item['name'] as String? ?? 'Item',
                        style: GoogleFonts.interTight(
                          fontSize: 14,
                          color: colorScheme.onSurface,
                        ),
                      ),
                    ),
                    Text(
                      '\u20B9${((item['price'] as num?)?.toDouble() ?? 0).toStringAsFixed(2)}',
                      style: GoogleFonts.interTight(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: colorScheme.onSurface,
                      ),
                    ),
                  ],
                ),
              )),
          const SizedBox(height: 12),
          Divider(color: colorScheme.outlineVariant.withValues(alpha: 0.3)),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total',
                style: GoogleFonts.manrope(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: colorScheme.onSurface,
                ),
              ),
              Text(
                '\u20B9${total.toStringAsFixed(2)}',
                style: GoogleFonts.manrope(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: colorScheme.primary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ==========================================================
// Payment Info Card
// ==========================================================

class _PaymentInfoCard extends StatelessWidget {
  const _PaymentInfoCard({required this.method, required this.amount});

  final String method;
  final double amount;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: colorScheme.outlineVariant.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF059669).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.payments_outlined,
              color: Color(0xFF059669),
              size: 20,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Payment',
                  style: GoogleFonts.interTight(
                    fontSize: 12,
                    color: colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  method.toUpperCase(),
                  style: GoogleFonts.interTight(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onSurface,
                  ),
                ),
              ],
            ),
          ),
          Text(
            '\u20B9${amount.toStringAsFixed(2)}',
            style: GoogleFonts.manrope(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: colorScheme.onSurface,
            ),
          ),
        ],
      ),
    );
  }
}

// ==========================================================
// Notes Card
// ==========================================================

class _NotesCard extends StatelessWidget {
  const _NotesCard({required this.notes});

  final String notes;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF3C7).withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFF59E0B).withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.sticky_note_2_outlined,
            color: Color(0xFFD97706),
            size: 18,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Notes',
                  style: GoogleFonts.interTight(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFFD97706),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  notes,
                  style: GoogleFonts.interTight(
                    fontSize: 13,
                    color: colorScheme.onSurface.withValues(alpha: 0.8),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ==========================================================
// Action Buttons Bar
// ==========================================================

class _ActionButtonsBar extends StatelessWidget {
  const _ActionButtonsBar({
    required this.status,
    this.onPickup,
    this.onDamageReport,
    this.onCollection,
    this.onComplete,
  });

  final String status;
  final VoidCallback? onPickup;
  final VoidCallback? onDamageReport;
  final VoidCallback? onCollection;
  final VoidCallback? onComplete;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        border: Border(
          top: BorderSide(
            color: colorScheme.outlineVariant.withValues(alpha: 0.3),
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (status == 'READY_FOR_DELIVERY')
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: onPickup,
                icon: const Icon(Icons.local_shipping),
                label: const Text('Mark as Picked Up'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
          if (status == 'OUT_FOR_DELIVERY' || status == 'ARRIVING') ...[
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: onComplete,
                icon: const Icon(Icons.check_circle),
                label: const Text('Complete Delivery'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF059669),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onCollection,
                    icon: const Icon(Icons.payments, size: 18),
                    label: const Text('Collect'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onDamageReport,
                    icon: const Icon(Icons.report_problem, size: 18),
                    label: const Text('Damage'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFD97706),
                      side: const BorderSide(color: Color(0xFFD97706)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
