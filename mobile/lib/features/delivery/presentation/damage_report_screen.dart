import 'package:flutter/material.dart';

import '../../../core/network/api_client.dart';

/// Damage report screen for delivery partners.
///
/// Allows selecting an item, specifying quantity, reason, reduction amount,
/// and optionally providing evidence (photo URL). Calls POST /api/delivery/damage.
class DamageReportScreen extends StatefulWidget {
  const DamageReportScreen({
    super.key,
    required this.orderId,
    required this.items,
    required this.apiClient,
    required this.onReported,
  });

  final String orderId;
  final List<Map<String, dynamic>> items;
  final ApiClient apiClient;
  final VoidCallback onReported;

  @override
  State<DamageReportScreen> createState() => _DamageReportScreenState();
}

class _DamageReportScreenState extends State<DamageReportScreen> {
  String? _selectedItemId;
  final _quantityController = TextEditingController(text: '1');
  final _reasonController = TextEditingController();
  final _amountController = TextEditingController();
  final _evidenceController = TextEditingController();
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _quantityController.dispose();
    _reasonController.dispose();
    _amountController.dispose();
    _evidenceController.dispose();
    super.dispose();
  }

  Future<void> _submitReport() async {
    if (_selectedItemId == null) {
      setState(() => _error = 'Please select an item');
      return;
    }
    if (_reasonController.text.trim().length < 3) {
      setState(() => _error = 'Reason must be at least 3 characters');
      return;
    }
    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0) {
      setState(() => _error = 'Enter a valid reduction amount');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      await widget.apiClient.post(
        '/delivery/damage',
        data: {
          'orderId': widget.orderId,
          'orderItemId': _selectedItemId,
          'quantity': int.tryParse(_quantityController.text) ?? 1,
          'reason': _reasonController.text.trim(),
          'reductionAmount': amount,
          if (_evidenceController.text.isNotEmpty)
            'evidenceUrl': _evidenceController.text.trim(),
        },
      );
      widget.onReported();
    } catch (e) {
      setState(() {
        _error = 'Failed to submit damage report';
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Damage'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Item selector
            DropdownButtonFormField<String>(
              value: _selectedItemId,
              decoration: const InputDecoration(
                labelText: 'Affected Item',
                border: OutlineInputBorder(),
              ),
              items: widget.items
                  .map((item) => DropdownMenuItem(
                        value: item['id'] as String?,
                        child: Text(item['name'] as String? ?? 'Item'),
                      ))
                  .toList(),
              onChanged: (value) => setState(() => _selectedItemId = value),
            ),
            const SizedBox(height: 16),

            // Quantity
            TextField(
              controller: _quantityController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Quantity',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            // Reason
            TextField(
              controller: _reasonController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Reason for damage',
                hintText: 'Describe what happened...',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            // Reduction amount
            TextField(
              controller: _amountController,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Reduction Amount (\u20B9)',
                border: OutlineInputBorder(),
                prefixText: '\u20B9 ',
              ),
            ),
            const SizedBox(height: 16),

            // Evidence URL (in production, this would be a camera/upload)
            TextField(
              controller: _evidenceController,
              decoration: const InputDecoration(
                labelText: 'Evidence Photo URL (optional)',
                hintText: 'https://...',
                border: OutlineInputBorder(),
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

            FilledButton(
              onPressed: _isSubmitting ? null : _submitReport,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: Colors.orange,
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Submit Damage Report'),
            ),
          ],
        ),
      ),
    );
  }
}
