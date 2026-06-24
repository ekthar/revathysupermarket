import 'package:flutter/material.dart';

import '../../../core/network/api_client.dart';

/// Delivery order detail screen showing order information, items,
/// customer address with map link, and call button.
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
    return Scaffold(
      appBar: AppBar(
        title: Text(
          _orderData != null
              ? 'Order #${_orderData!['orderNumber'] ?? ''}'
              : 'Order Details',
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadOrderDetails,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _buildContent(),
    );
  }

  Widget _buildContent() {
    final data = _orderData!;
    final items = List<Map<String, dynamic>>.from(data['items'] as List? ?? []);
    final status = data['status'] as String? ?? '';
    final customerName = data['customerName'] as String? ?? '';
    final phone = data['phone'] as String? ?? '';
    final address = data['address'] as String? ?? '';
    final total = (data['total'] as num?)?.toDouble() ?? 0;

    return RefreshIndicator(
      onRefresh: _loadOrderDetails,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Status chip
          Center(
            child: Chip(
              label: Text(status.replaceAll('_', ' ')),
              backgroundColor: _statusColor(status),
              labelStyle: const TextStyle(color: Colors.white),
            ),
          ),
          const SizedBox(height: 16),

          // Customer info card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Customer',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.person, size: 20),
                      const SizedBox(width: 8),
                      Expanded(child: Text(customerName)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 20),
                      const SizedBox(width: 8),
                      Expanded(child: Text(address)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      // Call button
                      if (phone.isNotEmpty)
                        OutlinedButton.icon(
                          onPressed: () {
                            // URL launcher would be used here in production
                          },
                          icon: const Icon(Icons.phone),
                          label: const Text('Call'),
                        ),
                      const SizedBox(width: 8),
                      // Map link
                      OutlinedButton.icon(
                        onPressed: () {
                          // Opens map with address in production
                        },
                        icon: const Icon(Icons.map),
                        label: const Text('Map'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Items card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Items (${items.length})',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 8),
                  ...items.map((item) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                '${item['name'] ?? 'Item'} x${item['quantity'] ?? 1}',
                              ),
                            ),
                            Text(
                              '\u20B9${((item['price'] as num?)?.toDouble() ?? 0).toStringAsFixed(2)}',
                              style:
                                  const TextStyle(fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                      )),
                  const Divider(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '\u20B9${total.toStringAsFixed(2)}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Action buttons based on status
          if (status == 'READY_FOR_DELIVERY')
            FilledButton.icon(
              onPressed: widget.onPickup,
              icon: const Icon(Icons.local_shipping),
              label: const Text('Mark as Picked Up'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),

          if (status == 'OUT_FOR_DELIVERY' || status == 'ARRIVING') ...[
            FilledButton.icon(
              onPressed: widget.onComplete,
              icon: const Icon(Icons.check_circle),
              label: const Text('Complete Delivery'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: widget.onCollection,
              icon: const Icon(Icons.payments),
              label: const Text('Record Collection'),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: widget.onDamageReport,
              icon: const Icon(Icons.report_problem),
              label: const Text('Report Damage'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.orange,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'READY_FOR_DELIVERY':
        return Colors.blue;
      case 'OUT_FOR_DELIVERY':
        return Colors.orange;
      case 'ARRIVING':
        return Colors.deepOrange;
      case 'DELIVERED':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }
}
