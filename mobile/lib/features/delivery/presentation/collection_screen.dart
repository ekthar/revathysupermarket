import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/network/api_client.dart';
import '../../../core/widgets/animated_fade_in.dart';
import '../../../core/widgets/gradient_card.dart';

/// Premium collection screen for recording cash/UPI payment at delivery.
///
/// Shows expected amount prominently with gradient, payment method selector,
/// actual collected amount input, discrepancy warning, and confirm button.
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

enum _PaymentMethod { cash, upi }

class _CollectionScreenState extends State<CollectionScreen> {
  _PaymentMethod _selectedMethod = _PaymentMethod.cash;
  final _amountController = TextEditingController();
  final _referenceController = TextEditingController();
  bool _isSubmitting = false;
  String? _error;
  double? _discrepancy;

  @override
  void initState() {
    super.initState();
    if (widget.expectedAmount != null) {
      _amountController.text = widget.expectedAmount!.toStringAsFixed(2);
    }
    _amountController.addListener(_checkDiscrepancy);
  }

  @override
  void dispose() {
    _amountController.dispose();
    _referenceController.dispose();
    super.dispose();
  }

  void _checkDiscrepancy() {
    if (widget.expectedAmount == null) {
      setState(() => _discrepancy = null);
      return;
    }
    final entered = double.tryParse(_amountController.text) ?? 0;
    final diff = entered - widget.expectedAmount!;
    setState(() {
      _discrepancy = diff.abs() > 0.01 ? diff : null;
    });
  }

  Future<void> _submitCollection() async {
    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0) {
      setState(() => _error = 'Please enter a valid amount');
      return;
    }

    if (_selectedMethod == _PaymentMethod.upi &&
        _referenceController.text.trim().isEmpty) {
      setState(() => _error = 'UPI reference is required');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final data = <String, dynamic>{
        'orderId': widget.orderId,
        'paymentMethod': _selectedMethod.name,
        'amount': amount,
      };

      if (_selectedMethod == _PaymentMethod.cash) {
        data['cashCollected'] = amount;
        data['upiCollected'] = 0;
      } else {
        data['cashCollected'] = 0;
        data['upiCollected'] = amount;
        data['upiReference'] = _referenceController.text.trim();
      }

      final response = await widget.apiClient.post<Map<String, dynamic>>(
        '/delivery/collect',
        data: data,
      );

      final balanced = response.data?['balanced'] as bool? ?? false;
      if (balanced) {
        widget.onCollected();
      } else {
        setState(() {
          _error =
              'Amount mismatch. Expected: \u20B9${response.data?['expectedAmount'] ?? 'unknown'}';
          _isSubmitting = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to record collection. Please try again.';
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Collect Payment'),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                // Expected amount card
                if (widget.expectedAmount != null)
                  AnimatedFadeIn(
                    index: 0,
                    child: _ExpectedAmountCard(
                      amount: widget.expectedAmount!,
                    ),
                  ),
                const SizedBox(height: 24),

                // Payment method selector
                AnimatedFadeIn(
                  index: 1,
                  child: _buildPaymentMethodSelector(colorScheme),
                ),
                const SizedBox(height: 20),

                // Amount input
                AnimatedFadeIn(
                  index: 2,
                  child: _buildAmountInput(colorScheme),
                ),

                // UPI reference (shown when UPI selected)
                if (_selectedMethod == _PaymentMethod.upi) ...[
                  const SizedBox(height: 16),
                  AnimatedFadeIn(
                    index: 3,
                    child: _buildUpiReference(colorScheme),
                  ),
                ],

                // Discrepancy warning
                if (_discrepancy != null) ...[
                  const SizedBox(height: 16),
                  _buildDiscrepancyWarning(colorScheme),
                ],

                // Error
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: colorScheme.error.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.error_outline,
                            color: colorScheme.error, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _error!,
                            style: TextStyle(
                                color: colorScheme.error, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Confirm button
          Container(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            decoration: BoxDecoration(
              color: colorScheme.surface,
              border: Border(
                top: BorderSide(
                  color: colorScheme.outlineVariant.withValues(alpha: 0.3),
                ),
              ),
            ),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitCollection,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF059669),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.check_circle, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Confirm Collection',
                            style: GoogleFonts.interTight(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethodSelector(ColorScheme colorScheme) {
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
              Icon(Icons.payment_outlined,
                  color: colorScheme.primary, size: 18),
              const SizedBox(width: 8),
              Text(
                'Payment Method',
                style: GoogleFonts.interTight(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: colorScheme.onSurface,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _PaymentMethodButton(
                label: 'Cash',
                icon: Icons.payments_outlined,
                color: const Color(0xFF059669),
                isSelected: _selectedMethod == _PaymentMethod.cash,
                onTap: () =>
                    setState(() => _selectedMethod = _PaymentMethod.cash),
              ),
              const SizedBox(width: 12),
              _PaymentMethodButton(
                label: 'UPI',
                icon: Icons.phone_android_outlined,
                color: const Color(0xFF7C3AED),
                isSelected: _selectedMethod == _PaymentMethod.upi,
                onTap: () =>
                    setState(() => _selectedMethod = _PaymentMethod.upi),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAmountInput(ColorScheme colorScheme) {
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
              Icon(Icons.currency_rupee,
                  color: colorScheme.primary, size: 18),
              const SizedBox(width: 8),
              Text(
                'Amount Collected',
                style: GoogleFonts.interTight(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: colorScheme.onSurface,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _amountController,
            keyboardType:
                const TextInputType.numberWithOptions(decimal: true),
            style: GoogleFonts.manrope(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: colorScheme.onSurface,
            ),
            decoration: InputDecoration(
              prefixText: '\u20B9 ',
              prefixStyle: GoogleFonts.manrope(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: colorScheme.onSurface,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUpiReference(ColorScheme colorScheme) {
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
              Icon(Icons.receipt_outlined,
                  color: colorScheme.primary, size: 18),
              const SizedBox(width: 8),
              Text(
                'UPI Reference',
                style: GoogleFonts.interTight(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: colorScheme.onSurface,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _referenceController,
            decoration: InputDecoration(
              hintText: 'Enter transaction ID',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDiscrepancyWarning(ColorScheme colorScheme) {
    final isOver = _discrepancy! > 0;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFD97706).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFFD97706).withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.warning_amber_rounded,
            color: Color(0xFFD97706),
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Amount Discrepancy',
                  style: GoogleFonts.interTight(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFFD97706),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  isOver
                      ? '\u20B9${_discrepancy!.toStringAsFixed(2)} over expected'
                      : '\u20B9${_discrepancy!.abs().toStringAsFixed(2)} under expected',
                  style: GoogleFonts.interTight(
                    fontSize: 12,
                    color: const Color(0xFFD97706),
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
// Expected Amount Card
// ==========================================================

class _ExpectedAmountCard extends StatelessWidget {
  const _ExpectedAmountCard({required this.amount});

  final double amount;

  @override
  Widget build(BuildContext context) {
    return GradientCard(
      colors: const [Color(0xFF059669), Color(0xFF10B981)],
      elevation: 4,
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Text(
            'Expected Amount',
            style: GoogleFonts.interTight(
              fontSize: 14,
              color: Colors.white.withValues(alpha: 0.8),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '\u20B9${amount.toStringAsFixed(2)}',
            style: GoogleFonts.manrope(
              fontSize: 36,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Collect this amount from customer',
            style: GoogleFonts.interTight(
              fontSize: 12,
              color: Colors.white.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }
}

// ==========================================================
// Payment Method Button
// ==========================================================

class _PaymentMethodButton extends StatelessWidget {
  const _PaymentMethodButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final Color color;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: isSelected ? color.withValues(alpha: 0.1) : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? color : Colors.grey.withValues(alpha: 0.3),
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? color : Colors.grey, size: 24),
              const SizedBox(height: 8),
              Text(
                label,
                style: GoogleFonts.interTight(
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  color: isSelected ? color : Colors.grey,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
