import 'package:flutter/material.dart';

/// Checkout screen with address, payment, delivery mode, promo code, and loyalty points.
class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({
    super.key,
    this.subtotal = 0,
    this.deliveryFee = 0,
    this.discount = 0,
    this.total = 0,
    this.onPlaceOrder,
    this.addresses = const [],
    this.loyaltyPoints = 0,
    this.walletBalance = 0,
    this.isLoading = false,
  });

  final double subtotal;
  final double deliveryFee;
  final double discount;
  final double total;
  final void Function(CheckoutData data)? onPlaceOrder;
  final List<Map<String, dynamic>> addresses;
  final int loyaltyPoints;
  final double walletBalance;
  final bool isLoading;

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  String _paymentMethod = 'COD';
  String _deliveryMode = 'ASAP';
  int _selectedAddressIndex = 0;
  final _promoController = TextEditingController();
  final _loyaltyController = TextEditingController();
  final _notesController = TextEditingController();

  @override
  void dispose() {
    _promoController.dispose();
    _loyaltyController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _handlePlaceOrder() {
    final address = widget.addresses.isNotEmpty
        ? widget.addresses[_selectedAddressIndex]
        : null;

    widget.onPlaceOrder?.call(CheckoutData(
      paymentMethod: _paymentMethod,
      deliveryMode: _deliveryMode,
      promoCode: _promoController.text.isEmpty ? null : _promoController.text,
      loyaltyPoints: int.tryParse(_loyaltyController.text) ?? 0,
      notes: _notesController.text.isEmpty ? null : _notesController.text,
      addressId: address?['id'] as String?,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Address Selection
            _SectionHeader(title: 'Delivery Address'),
            if (widget.addresses.isEmpty)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('No saved addresses. Add one to continue.'),
                ),
              )
            else
              ...widget.addresses.asMap().entries.map((entry) {
                final index = entry.key;
                final addr = entry.value;
                return RadioListTile<int>(
                  value: index,
                  groupValue: _selectedAddressIndex,
                  onChanged: (v) => setState(() => _selectedAddressIndex = v!),
                  title: Text(addr['label'] as String? ?? 'Address'),
                  subtitle: Text(
                    '${addr['houseName']}, ${addr['street']}, ${addr['pincode']}',
                  ),
                  dense: true,
                );
              }),
            const SizedBox(height: 16),

            // Payment Method
            _SectionHeader(title: 'Payment Method'),
            ..._buildPaymentOptions(),
            const SizedBox(height: 16),

            // Delivery Mode
            _SectionHeader(title: 'Delivery Mode'),
            RadioListTile<String>(
              value: 'ASAP',
              groupValue: _deliveryMode,
              onChanged: (v) => setState(() => _deliveryMode = v!),
              title: const Text('ASAP'),
              subtitle: const Text('Delivered as soon as possible'),
              dense: true,
            ),
            RadioListTile<String>(
              value: 'SCHEDULED',
              groupValue: _deliveryMode,
              onChanged: (v) => setState(() => _deliveryMode = v!),
              title: const Text('Scheduled'),
              subtitle: const Text('Choose a delivery slot'),
              dense: true,
            ),
            const SizedBox(height: 16),

            // Promo Code
            _SectionHeader(title: 'Promo Code'),
            TextField(
              controller: _promoController,
              decoration: InputDecoration(
                hintText: 'Enter promo code',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                isDense: true,
              ),
            ),
            const SizedBox(height: 16),

            // Loyalty Points
            if (widget.loyaltyPoints > 0) ...[
              _SectionHeader(title: 'Loyalty Points (${widget.loyaltyPoints} available)'),
              TextField(
                controller: _loyaltyController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  hintText: 'Points to redeem',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  isDense: true,
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Notes
            _SectionHeader(title: 'Notes (Optional)'),
            TextField(
              controller: _notesController,
              maxLines: 2,
              decoration: InputDecoration(
                hintText: 'Any special instructions?',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                isDense: true,
              ),
            ),
            const SizedBox(height: 24),

            // Order Summary
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _SummaryRow(label: 'Subtotal', value: widget.subtotal),
                    if (widget.discount > 0)
                      _SummaryRow(
                        label: 'Discount',
                        value: -widget.discount,
                        isDiscount: true,
                      ),
                    _SummaryRow(label: 'Delivery Fee', value: widget.deliveryFee),
                    const Divider(height: 16),
                    _SummaryRow(
                      label: 'Total',
                      value: widget.total,
                      isBold: true,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Place Order Button
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: widget.isLoading ? null : _handlePlaceOrder,
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: widget.isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(
                        'Place Order - \u20B9${widget.total.toStringAsFixed(0)}',
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: theme.colorScheme.onPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildPaymentOptions() {
    const methods = [
      ('COD', 'Cash on Delivery', Icons.money),
      ('UPI_ON_DELIVERY', 'UPI on Delivery', Icons.qr_code),
      ('CARD', 'Card Payment', Icons.credit_card),
      ('WALLET', 'Wallet', Icons.account_balance_wallet),
    ];

    return methods.map((m) {
      return RadioListTile<String>(
        value: m.$1,
        groupValue: _paymentMethod,
        onChanged: (v) => setState(() => _paymentMethod = v!),
        title: Text(m.$2),
        secondary: Icon(m.$3),
        dense: true,
      );
    }).toList();
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.isBold = false,
    this.isDiscount = false,
  });

  final String label;
  final double value;
  final bool isBold;
  final bool isDiscount;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final style = isBold
        ? theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)
        : theme.textTheme.bodyMedium;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: style),
          Text(
            '${isDiscount ? "-" : ""}\u20B9${value.abs().toStringAsFixed(0)}',
            style: style?.copyWith(
              color: isDiscount ? Colors.green.shade700 : null,
            ),
          ),
        ],
      ),
    );
  }
}

/// Data class for checkout form submission.
class CheckoutData {
  const CheckoutData({
    required this.paymentMethod,
    required this.deliveryMode,
    this.promoCode,
    this.loyaltyPoints = 0,
    this.notes,
    this.addressId,
  });

  final String paymentMethod;
  final String deliveryMode;
  final String? promoCode;
  final int loyaltyPoints;
  final String? notes;
  final String? addressId;
}
