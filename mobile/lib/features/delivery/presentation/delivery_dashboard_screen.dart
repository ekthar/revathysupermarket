import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/network/api_client.dart';
import '../../../core/widgets/animated_fade_in.dart';
import '../../../core/widgets/shimmer_widget.dart';
import 'alert_setup_screen.dart';

/// Delivery partner dashboard screen with premium UI.
///
/// Shows partner stats (deliveries today, cash collected, UPI collected,
/// lifetime total) in gradient 2x2 grid, active orders with premium cards,
/// alert health indicator, pull-to-refresh, shimmer loading, and FAB.
class DeliveryDashboardScreen extends StatefulWidget {
  const DeliveryDashboardScreen({
    super.key,
    required this.apiClient,
    this.partnerName = 'Delivery Partner',
    this.onOrderTap,
    this.onAlertSetupTap,
  });

  final ApiClient apiClient;
  final String partnerName;
  final void Function(String orderId)? onOrderTap;
  final VoidCallback? onAlertSetupTap;

  @override
  State<DeliveryDashboardScreen> createState() =>
      _DeliveryDashboardScreenState();
}

class _DeliveryDashboardScreenState extends State<DeliveryDashboardScreen>
    with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  String? _error;
  int _deliveriesToday = 0;
  double _cashCollected = 0;
  double _upiCollected = 0;
  double _lifetimeTotal = 0;
  List<Map<String, dynamic>> _activeOrders = [];

  late final AnimationController _fabController;

  @override
  void initState() {
    super.initState();
    _fabController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _loadDashboard();
  }

  @override
  void dispose() {
    _fabController.dispose();
    super.dispose();
  }

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  Future<void> _loadDashboard() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await widget.apiClient.get<Map<String, dynamic>>(
        '/delivery/dashboard',
      );
      final data = response.data;
      if (data != null) {
        setState(() {
          _deliveriesToday = data['deliveriesToday'] as int? ?? 0;
          _cashCollected = (data['cashCollected'] as num?)?.toDouble() ?? 0;
          _upiCollected = (data['upiCollected'] as num?)?.toDouble() ?? 0;
          _lifetimeTotal = (data['lifetimeTotal'] as num?)?.toDouble() ?? 0;
          _activeOrders = List<Map<String, dynamic>>.from(
            data['activeOrders'] as List? ?? [],
          );
        });
      }
    } catch (_) {
      setState(() => _error = 'Failed to load dashboard');
    } finally {
      setState(() => _isLoading = false);
      _fabController.forward();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadDashboard,
        color: colorScheme.primary,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Premium App Bar with greeting
            SliverAppBar(
              expandedHeight: 120,
              floating: false,
              pinned: true,
              backgroundColor: colorScheme.surface,
              flexibleSpace: FlexibleSpaceBar(
                titlePadding: const EdgeInsets.only(left: 20, bottom: 16),
                title: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _greeting,
                      style: GoogleFonts.interTight(
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                        color: colorScheme.onSurface.withValues(alpha: 0.6),
                      ),
                    ),
                    Text(
                      widget.partnerName,
                      style: GoogleFonts.manrope(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: colorScheme.onSurface,
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                IconButton(
                  icon: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.notifications_outlined,
                      color: colorScheme.onSurface,
                      size: 20,
                    ),
                  ),
                  onPressed: () {},
                ),
                const SizedBox(width: 8),
              ],
            ),

            // Body content
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildListDelegate(
                  _isLoading ? _buildShimmerContent() : _buildContent(theme),
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: ScaleTransition(
        scale: CurvedAnimation(
          parent: _fabController,
          curve: Curves.easeOutBack,
        ),
        child: FloatingActionButton(
          onPressed: _showQuickActions,
          backgroundColor: colorScheme.primary,
          foregroundColor: Colors.white,
          elevation: 4,
          child: const Icon(Icons.bolt),
        ),
      ),
    );
  }

  List<Widget> _buildShimmerContent() {
    return [
      // Stats shimmer
      GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.4,
        children: List.generate(
          4,
          (_) => const ShimmerWidget.box(
            width: double.infinity,
            height: 100,
            borderRadius: 16,
          ),
        ),
      ),
      const SizedBox(height: 24),
      // Alert card shimmer
      const ShimmerWidget.box(width: double.infinity, height: 64),
      const SizedBox(height: 24),
      // Orders shimmer
      const ShimmerWidget.rectangle(width: 120, height: 20),
      const SizedBox(height: 12),
      ...List.generate(
        3,
        (_) => const Padding(
          padding: EdgeInsets.only(bottom: 12),
          child: ShimmerWidget.box(width: double.infinity, height: 100),
        ),
      ),
    ];
  }

  List<Widget> _buildContent(ThemeData theme) {
    final colorScheme = theme.colorScheme;

    return [
      // Error state
      if (_error != null) ...[
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colorScheme.error.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(Icons.error_outline, color: colorScheme.error),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  _error!,
                  style: TextStyle(color: colorScheme.error),
                ),
              ),
              TextButton(
                onPressed: _loadDashboard,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
      ],

      // Stats grid with gradient cards
      AnimatedFadeIn(
        index: 0,
        child: _PremiumStatsGrid(
          deliveriesToday: _deliveriesToday,
          cashCollected: _cashCollected,
          upiCollected: _upiCollected,
          lifetimeTotal: _lifetimeTotal,
        ),
      ),
      const SizedBox(height: 20),

      // Alert health card
      AnimatedFadeIn(
        index: 1,
        child: _PremiumAlertHealthCard(
          onTap: widget.onAlertSetupTap,
        ),
      ),
      const SizedBox(height: 24),

      // Active orders section
      AnimatedFadeIn(
        index: 2,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Active Orders',
              style: GoogleFonts.manrope(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: colorScheme.onSurface,
              ),
            ),
            if (_activeOrders.isNotEmpty)
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: colorScheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${_activeOrders.length}',
                  style: TextStyle(
                    color: colorScheme.primary,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
          ],
        ),
      ),
      const SizedBox(height: 12),

      // Active orders list
      if (_activeOrders.isEmpty)
        AnimatedFadeIn(
          index: 3,
          child: Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: colorScheme.outlineVariant.withValues(alpha: 0.3),
              ),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.delivery_dining_outlined,
                  size: 48,
                  color: colorScheme.onSurface.withValues(alpha: 0.3),
                ),
                const SizedBox(height: 12),
                Text(
                  'No active orders',
                  style: GoogleFonts.interTight(
                    fontSize: 14,
                    color: colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'New orders will appear here',
                  style: GoogleFonts.interTight(
                    fontSize: 12,
                    color: colorScheme.onSurface.withValues(alpha: 0.3),
                  ),
                ),
              ],
            ),
          ),
        )
      else
        ...List.generate(
          _activeOrders.length,
          (index) {
            final order = _activeOrders[index];
            return AnimatedFadeIn(
              index: index + 3,
              child: _PremiumActiveOrderCard(
                orderNumber: order['orderNumber'] as String? ?? 'Unknown',
                customerName: order['customerName'] as String? ?? 'Customer',
                address: order['address'] as String? ?? '',
                status: order['status'] as String? ?? '',
                distance: order['distance'] as String?,
                onTap: () =>
                    widget.onOrderTap?.call(order['id'] as String? ?? ''),
              ),
            );
          },
        ),
    ];
  }

  void _showQuickActions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Quick Actions',
                style: GoogleFonts.manrope(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 20),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.blue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.refresh, color: Colors.blue),
                ),
                title: const Text('Refresh Dashboard'),
                onTap: () {
                  Navigator.pop(context);
                  _loadDashboard();
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.orange.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child:
                      const Icon(Icons.notifications, color: Colors.orange),
                ),
                title: const Text('Alert Setup'),
                onTap: () {
                  Navigator.pop(context);
                  widget.onAlertSetupTap?.call();
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }
}

// ==========================================================
// Premium Stats Grid
// ==========================================================

class _PremiumStatsGrid extends StatelessWidget {
  const _PremiumStatsGrid({
    required this.deliveriesToday,
    required this.cashCollected,
    required this.upiCollected,
    required this.lifetimeTotal,
  });

  final int deliveriesToday;
  final double cashCollected;
  final double upiCollected;
  final double lifetimeTotal;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.4,
      children: [
        _GradientStatCard(
          label: 'Deliveries Today',
          value: '$deliveriesToday',
          icon: Icons.local_shipping_outlined,
          colors: const [Color(0xFF2563EB), Color(0xFF3B82F6)],
        ),
        _GradientStatCard(
          label: 'Cash Collected',
          value: '\u20B9${cashCollected.toStringAsFixed(0)}',
          icon: Icons.payments_outlined,
          colors: const [Color(0xFF059669), Color(0xFF10B981)],
        ),
        _GradientStatCard(
          label: 'UPI Collected',
          value: '\u20B9${upiCollected.toStringAsFixed(0)}',
          icon: Icons.phone_android_outlined,
          colors: const [Color(0xFF7C3AED), Color(0xFF8B5CF6)],
        ),
        _GradientStatCard(
          label: 'Lifetime Total',
          value: '\u20B9${lifetimeTotal.toStringAsFixed(0)}',
          icon: Icons.trending_up_rounded,
          colors: const [Color(0xFFD97706), Color(0xFFF59E0B)],
        ),
      ],
    );
  }
}

class _GradientStatCard extends StatelessWidget {
  const _GradientStatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.colors,
  });

  final String label;
  final String value;
  final IconData icon;
  final List<Color> colors;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: colors.first.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [
            // Decorative circle
            Positioned(
              top: -15,
              right: -15,
              child: Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.1),
                ),
              ),
            ),
            // Content
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Icon(icon, color: Colors.white.withValues(alpha: 0.9), size: 22),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        value,
                        style: GoogleFonts.manrope(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        label,
                        style: GoogleFonts.interTight(
                          fontSize: 11,
                          fontWeight: FontWeight.w400,
                          color: Colors.white.withValues(alpha: 0.8),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ==========================================================
// Premium Alert Health Card
// ==========================================================

class _PremiumAlertHealthCard extends StatelessWidget {
  const _PremiumAlertHealthCard({this.onTap});

  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    // Wrap the existing AlertHealthCard with a premium container
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: colorScheme.outlineVariant.withValues(alpha: 0.3),
        ),
        color: colorScheme.surface,
      ),
      child: AlertHealthCard(
        notificationGranted: true,
        exactAlarmGranted: true,
        batteryOptimizationDisabled: true,
        onTap: onTap,
      ),
    );
  }
}

// ==========================================================
// Premium Active Order Card
// ==========================================================

class _PremiumActiveOrderCard extends StatelessWidget {
  const _PremiumActiveOrderCard({
    required this.orderNumber,
    required this.customerName,
    required this.address,
    required this.status,
    this.distance,
    required this.onTap,
  });

  final String orderNumber;
  final String customerName;
  final String address;
  final String status;
  final String? distance;
  final VoidCallback onTap;

  Color _statusColor() {
    switch (status) {
      case 'READY_FOR_DELIVERY':
        return const Color(0xFF2563EB);
      case 'OUT_FOR_DELIVERY':
        return const Color(0xFFD97706);
      case 'ARRIVING':
        return const Color(0xFFDC2626);
      case 'DELIVERED':
        return const Color(0xFF059669);
      default:
        return const Color(0xFF64748B);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final badgeColor = _statusColor();

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: colorScheme.outlineVariant.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                // Leading avatar
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: badgeColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.delivery_dining,
                    color: badgeColor,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 14),
                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              customerName,
                              style: GoogleFonts.interTight(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: colorScheme.onSurface,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: badgeColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              status.replaceAll('_', ' '),
                              style: GoogleFonts.interTight(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: badgeColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.location_on_outlined,
                            size: 14,
                            color: colorScheme.onSurface.withValues(alpha: 0.5),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              address,
                              style: GoogleFonts.interTight(
                                fontSize: 12,
                                color:
                                    colorScheme.onSurface.withValues(alpha: 0.6),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (distance != null) ...[
                            const SizedBox(width: 8),
                            Text(
                              distance!,
                              style: GoogleFonts.interTight(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: colorScheme.primary,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '#$orderNumber',
                        style: GoogleFonts.interTight(
                          fontSize: 11,
                          color: colorScheme.onSurface.withValues(alpha: 0.4),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Icon(
                  Icons.chevron_right,
                  color: colorScheme.onSurface.withValues(alpha: 0.3),
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
