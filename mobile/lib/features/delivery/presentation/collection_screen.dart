import 'package:flutter/material.dart';

import '../../../core/network/api_client.dart';

/// Collection screen for recording cash/UPI payment at delivery.
///
/// The delivery partner enters cash and UPI amounts, with UPI reference
/// required when UPI amount is greater than zero. Validates against expected
/// amount returned by the backend.
class CollectionScreen extends StatefulWidget {
  const CollectionScreen({
    super.key,
    required this.orderId,
    required this.apiClient,
    required this.onCollected,
    this.expectedAmount,
  });

  final String orderId;
  final ApiClient apiClient;
  final VoidCallback onCollected;
  final double? expectedAmount;

  @override
  State<CollectionScreen> createState() => _CollectionScreenState();
}

class _CollectionScreenState extends State<CollectionScreen> {
  final _cashController = TextEditingController(text: '0');
  final _upiController = TextEditingController(text: '0');
  final _referenceController = TextEditingController();
  bool _isSubmitting = false;
  String? _error;
  Map<String, dynamic>? _result;

  @override
  void dispose() {
    _cashController.dispose();
    _upiController.dispose();
    _referenceController.dispose();
    super.dispose();
  }

  Future<void> _submitCollection() async {
    final cash = double.tryParse(_cashController.text) ?? 0;
    final upi = double.tryParse(_upiController.text) ?? 0;

    if (upi > 0 && _referenceController.text.trim().isEmpty) {
      setState(() => _error = 'UPI reference is required');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final response = await widget.apiClient.post<Map<String, dynamic>>(
        '/delivery/collect',
        data: {
          'orderId': widget.orderId,
          'cashCollected': cash,
          'upiCollected': upi,
          if (_referenceController.text.trim().isNotEmpty)
            'upiReference': _referenceController.text.trim(),
        },
      );

      _result = response.data;
      final balanced = response.data?['balanced'] as bool? ?? false;

      if (balanced) {
        widget.onCollected();
      } else {
        setState(() {
          _error = 'Amount does not match expected. '
              'Expected: \u20B9${response.data?['expectedAmount'] ?? 'unknown'}';
          _isSubmitting = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to record collection';
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Record Collection'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Expected amount
            if (widget.expectedAmount != null)
              Card(
                color: Colors.blue.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Expected Amount'),
                      Text(
                        '\u20B9${widget.expectedAmount!.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 24),

            // Cash collected
            TextField(
              controller: _cashController,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Cash Collected',
                border: OutlineInputBorder(),
                prefixText: '\u20B9 ',
                prefixIcon: Icon(Icons.payments),
              ),
            ),
            const SizedBox(height: 16),

            // UPI collected
            TextField(
              controller: _upiController,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'UPI Collected',
                border: OutlineInputBorder(),
                prefixText: '\u20B9 ',
                prefixIcon: Icon(Icons.phone_android),
              ),
            ),
            const SizedBox(height: 16),

            // UPI Reference
            TextField(
              controller: _referenceController,
              decoration: const InputDecoration(
                labelText: 'UPI Reference (required if UPI > 0)',
                hintText: 'Transaction ID',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.receipt),
              ),
            ),
            const SizedBox(height: 24),

            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text(
                  _error!,
                  style: const TextStyle(color: Colors.red),
                ),
              ),

            if (_result != null && !(_result!['balanced'] as bool? ?? false))
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Card(
                  color: Colors.orange.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text(
                      'Delta: \u20B9${_result!['delta'] ?? 0}',
                      style: const TextStyle(color: Colors.orange),
                    ),
                  ),
                ),
              ),

            FilledButton(
              onPressed: _isSubmitting ? null : _submitCollection,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Record Collection'),
            ),
          ],
        ),
      ),
    );
  }
}
