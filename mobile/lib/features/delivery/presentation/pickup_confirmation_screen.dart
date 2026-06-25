import 'package:flutter/material.dart';

import '../../../core/network/api_client.dart';

/// Pickup confirmation screen.
///
/// Marks an order as picked up via PATCH /api/delivery/orders/[id]
/// with action: 'picked_up'. Uses mobile auth via the ApiClient.
class PickupConfirmationScreen extends StatefulWidget {
  const PickupConfirmationScreen({
    super.key,
    required this.orderId,
    required this.orderNumber,
    required this.apiClient,
    required this.onConfirmed,
  });

  final String orderId;
  final String orderNumber;
  final ApiClient apiClient;
  final VoidCallback onConfirmed;

  @override
  State<PickupConfirmationScreen> createState() =>
      _PickupConfirmationScreenState();
}

class _PickupConfirmationScreenState extends State<PickupConfirmationScreen> {
  bool _isSubmitting = false;
  String? _error;

  Future<void> _confirmPickup() async {
    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      await widget.apiClient.patch(
        '/delivery/orders/${widget.orderId}',
        data: {'action': 'picked_up'},
      );
      widget.onConfirmed();
    } catch (e) {
      setState(() {
        _error = 'Failed to confirm pickup. Please try again.';
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Confirm Pickup'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.local_shipping,
              size: 80,
              color: Colors.blue,
            ),
            const SizedBox(height: 24),
            Text(
              'Picking up Order #${widget.orderNumber}',
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Confirm that you have picked up all items for this order.',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text(
                  _error!,
                  style: const TextStyle(color: Colors.red),
                  textAlign: TextAlign.center,
                ),
              ),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _isSubmitting ? null : _confirmPickup,
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Confirm Pickup'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
