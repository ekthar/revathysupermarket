import 'package:flutter/material.dart';

import '../../../core/network/api_client.dart';
import 'alert_setup_screen.dart';

/// Delivery partner dashboard screen.
///
/// Shows partner stats (deliveries today, cash collected, UPI collected,
/// lifetime total), active orders list, alert health card, and supports
/// pull-to-refresh.
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

class _DeliveryDashboardScreenState extends State<DeliveryDashboardScreen> {
  bool _isLoading = true;
  int _deliveriesToday = 0;
  double _cashCollected = 0;
  double _upiCollected = 0;
  double _lifetimeTotal = 0;
  List<Map<String, dynamic>> _activeOrders = [];

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    setState(() => _isLoading = true);

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
      // Dashboard data fetch failed - show empty state
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Hi, ${widget.partnerName}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadDashboard,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Alert health card
                  AlertHealthCard(
                    notificationGranted: true,
                    exactAlarmGranted: true,
                    batteryOptimizationDisabled: true,
                    onTap: widget.onAlertSetupTap,
                  ),
                  const SizedBox(height: 16),

                  // Stats cards
                  _StatsGrid(
                    deliveriesToday: _deliveriesToday,
                    cashCollected: _cashCollected,
                    upiCollected: _upiCollected,
                    lifetimeTotal: _lifetimeTotal,
                  ),
                  const SizedBox(height: 24),

                  // Active orders section
                  Text(
                    'Active Orders',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),

                  if (_activeOrders.isEmpty)
                    const Card(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Column(
                          children: [
                            Icon(
                              Icons.delivery_dining,
                              size: 48,
                              color: Colors.grey,
                            ),
                            SizedBox(height: 8),
                            Text(
                              'No active orders',
                              style: TextStyle(color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    ...(_activeOrders.map((order) => _ActiveOrderCard(
                          orderNumber:
                              order['orderNumber'] as String? ?? 'Unknown',
                          customerName:
                              order['customerName'] as String? ?? 'Customer',
                          address: order['address'] as String? ?? '',
                          status: order['status'] as String? ?? '',
                          onTap: () => widget.onOrderTap
                              ?.call(order['id'] as String? ?? ''),
                        ))),
                ],
              ),
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({
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
      childAspectRatio: 1.5,
      children: [
        _StatCard(
          label: 'Today',
          value: '$deliveriesToday',
          icon: Icons.local_shipping,
          color: Colors.blue,
        ),
        _StatCard(
          label: 'Cash',
          value: '\u20B9${cashCollected.toStringAsFixed(0)}',
          icon: Icons.payments,
          color: Colors.green,
        ),
        _StatCard(
          label: 'UPI',
          value: '\u20B9${upiCollected.toStringAsFixed(0)}',
          icon: Icons.phone_android,
          color: Colors.purple,
        ),
        _StatCard(
          label: 'Lifetime',
          value: '\u20B9${lifetimeTotal.toStringAsFixed(0)}',
          icon: Icons.trending_up,
          color: Colors.orange,
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActiveOrderCard extends StatelessWidget {
  const _ActiveOrderCard({
    required this.orderNumber,
    required this.customerName,
    required this.address,
    required this.status,
    required this.onTap,
  });

  final String orderNumber;
  final String customerName;
  final String address;
  final String status;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: onTap,
        leading: const CircleAvatar(
          child: Icon(Icons.delivery_dining),
        ),
        title: Text('#$orderNumber - $customerName'),
        subtitle: Text(
          address,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: Chip(
          label: Text(
            status.replaceAll('_', ' '),
            style: const TextStyle(fontSize: 10),
          ),
        ),
      ),
    );
  }
}
