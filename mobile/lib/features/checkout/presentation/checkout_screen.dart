import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/animated_fade_in.dart';
import '../../cart/providers/cart_provider.dart';

/// Premium checkout screen with step indicator, address picker,
/// delivery slots, payment methods, promo code, and order summary.
class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({
    super.key,
    this.onPlaceOrder,
  });

  final void Function(CheckoutData data)? onPlaceOrder;

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen>
    with TickerProviderStateMixin {
  int _currentStep = 0;
  String _paymentMethod = 'COD';
  int _selectedAddressIndex = 0;
  int _selectedSlotIndex = -1;
  bool _isPlacingOrder = false;
  String? _promoCode;
  bool _promoApplied = false;
  String? _promoError;
  int _loyaltyPointsToRedeem = 0;

  final _promoController = TextEditingController();
  late final AnimationController _stepAnimController;
  late final Animation<double> _stepAnimation;

  final List<Map<String, dynamic>> _addresses = [
    {'id': '1', 'label': 'Home', 'houseName': 'Flat 4B, Green Valley Apt', 'street': 'MG Road', 'pincode': '682001'},
    {'id': '2', 'label': 'Work', 'houseName': 'Technopark Phase 3', 'street': 'Kazhakkoottam', 'pincode': '695582'},
  ];

  final List<Map<String, String>> _deliverySlots = [
    {'time': '9:00 - 11:00', 'label': 'Morning'},
    {'time': '11:00 - 1:00', 'label': 'Late Morning'},
    {'time': '2:00 - 4:00', 'label': 'Afternoon'},
    {'time': '4:00 - 6:00', 'label': 'Evening'},
    {'time': '6:00 - 8:00', 'label': 'Late Evening'},
    {'time': '8:00 - 10:00', 'label': 'Night'},
  ];

  @override
  void initState() {
    super.initState();
    _stepAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _stepAnimation = CurvedAnimation(
      parent: _stepAnimController,
      curve: Curves.easeInOut,
    );
    _stepAnimController.forward();
  }

  @override
  void dispose() {
    _promoController.dispose();
    _stepAnimController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_currentStep < 2) {
      setState(() => _currentStep++);
      _stepAnimController.reset();
      _stepAnimController.forward();
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
      _stepAnimController.reset();
      _stepAnimController.forward();
    }
  }

  void _applyPromo() {
    final code = _promoController.text.trim();
    if (code.isEmpty) {
      setState(() => _promoError = 'Please enter a promo code');
      return;
    }
    // Simulate promo validation
    if (code.toUpperCase() == 'SAVE10' || code.toUpperCase() == 'FRESH20') {
      setState(() {
        _promoApplied = true;
        _promoCode = code;
        _promoError = null;
      });
    } else {
      setState(() {
        _promoApplied = false;
        _promoError = 'Invalid promo code';
      });
    }
  }

  void _handlePlaceOrder() {
    setState(() => _isPlacingOrder = true);
    final address = _addresses[_selectedAddressIndex];
    widget.onPlaceOrder?.call(CheckoutData(
      paymentMethod: _paymentMethod,
      deliveryMode: _selectedSlotIndex >= 0 ? 'SCHEDULED' : 'ASAP',
      promoCode: _promoApplied ? _promoCode : null,
      loyaltyPoints: _loyaltyPointsToRedeem,
      notes: null,
      addressId: address['id'] as String?,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cartState = ref.watch(cartProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Checkout',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: _currentStep > 0 ? _previousStep : () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          // Step indicator
          _StepIndicator(currentStep: _currentStep),
          // Step content
          Expanded(
            child: FadeTransition(
              opacity: _stepAnimation,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: _buildStepContent(theme, cartState),
              ),
            ),
          ),
          // Bottom action button
          _buildBottomAction(theme, cartState),
        ],
      ),
    );
  }

  Widget _buildStepContent(ThemeData theme, CartState cartState) {
    switch (_currentStep) {
      case 0:
        return _buildAddressStep(theme);
      case 1:
        return _buildPaymentStep(theme);
      case 2:
        return _buildReviewStep(theme, cartState);
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildAddressStep(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Delivery Address', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        ..._addresses.asMap().entries.map((entry) {
          final index = entry.key;
          final addr = entry.value;
          final isSelected = index == _selectedAddressIndex;
          return AnimatedFadeIn(
            index: index,
            child: GestureDetector(
              onTap: () => setState(() => _selectedAddressIndex = index),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isSelected ? theme.colorScheme.primaryContainer.withValues(alpha: 0.3) : theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSelected ? theme.colorScheme.primary : theme.colorScheme.outlineVariant,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isSelected ? theme.colorScheme.primary.withValues(alpha: 0.1) : theme.colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(Icons.location_on_rounded, color: isSelected ? theme.colorScheme.primary : theme.colorScheme.onSurfaceVariant, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(addr['label'] as String, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
                              if (index == 0) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(color: theme.colorScheme.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                                  child: Text('Default', style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w600)),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text('${addr['houseName']}, ${addr['street']}, ${addr['pincode']}', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                        ],
                      ),
                    ),
                    if (isSelected) Icon(Icons.check_circle, color: theme.colorScheme.primary),
                  ],
                ),
              ),
            ),
          );
        }),
        const SizedBox(height: 24),
        Text('Delivery Slot', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            childAspectRatio: 1.6,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
          ),
          itemCount: _deliverySlots.length,
          itemBuilder: (context, index) {
            final slot = _deliverySlots[index];
            final isSelected = index == _selectedSlotIndex;
            return GestureDetector(
              onTap: () => setState(() => _selectedSlotIndex = index),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  color: isSelected ? theme.colorScheme.primary : theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isSelected ? theme.colorScheme.primary : theme.colorScheme.outlineVariant),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(slot['label']!, style: theme.textTheme.labelSmall?.copyWith(color: isSelected ? Colors.white : theme.colorScheme.onSurfaceVariant, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text(slot['time']!, style: theme.textTheme.labelSmall?.copyWith(color: isSelected ? Colors.white70 : theme.colorScheme.onSurfaceVariant, fontSize: 10)),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildPaymentStep(ThemeData theme) {
    final paymentMethods = [
      ('COD', 'Cash on Delivery', Icons.money_rounded),
      ('UPI', 'UPI Payment', Icons.qr_code_rounded),
      ('CARD', 'Credit/Debit Card', Icons.credit_card_rounded),
      ('WALLET', 'Wallet', Icons.account_balance_wallet_rounded),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Payment Method', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        ...paymentMethods.asMap().entries.map((entry) {
          final index = entry.key;
          final method = entry.value;
          final isSelected = _paymentMethod == method.$1;
          return AnimatedFadeIn(
            index: index,
            child: GestureDetector(
              onTap: () => setState(() => _paymentMethod = method.$1),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isSelected ? theme.colorScheme.primaryContainer.withValues(alpha: 0.3) : theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isSelected ? theme.colorScheme.primary : theme.colorScheme.outlineVariant, width: isSelected ? 2 : 1),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: isSelected ? theme.colorScheme.primary.withValues(alpha: 0.15) : theme.colorScheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(12)),
                      child: Icon(method.$3, color: isSelected ? theme.colorScheme.primary : theme.colorScheme.onSurfaceVariant),
                    ),
                    const SizedBox(width: 14),
                    Expanded(child: Text(method.$2, style: theme.textTheme.bodyLarge?.copyWith(fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal))),
                    Radio<String>(value: method.$1, groupValue: _paymentMethod, onChanged: (v) => setState(() => _paymentMethod = v!)),
                  ],
                ),
              ),
            ),
          );
        }),
        const SizedBox(height: 24),
        Text('Promo Code', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _promoController,
                enabled: !_promoApplied,
                decoration: InputDecoration(
                  hintText: 'Enter promo code',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  isDense: true,
                  prefixIcon: const Icon(Icons.local_offer_outlined, size: 20),
                  suffixIcon: _promoApplied ? Icon(Icons.check_circle, color: Colors.green.shade600) : null,
                ),
              ),
            ),
            const SizedBox(width: 12),
            FilledButton(
              onPressed: _promoApplied ? () => setState(() { _promoApplied = false; _promoCode = null; _promoController.clear(); }) : _applyPromo,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(_promoApplied ? 'Remove' : 'Apply'),
            ),
          ],
        ),
        if (_promoError != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(_promoError!, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.error)),
          ),
        if (_promoApplied)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text('Promo code applied successfully!', style: theme.textTheme.bodySmall?.copyWith(color: Colors.green.shade700, fontWeight: FontWeight.w500)),
          ),
        const SizedBox(height: 24),
        Text('Loyalty Points', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text('Available: 250 points', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        const SizedBox(height: 8),
        Slider(
          value: _loyaltyPointsToRedeem.toDouble(),
          min: 0,
          max: 250,
          divisions: 25,
          label: '$_loyaltyPointsToRedeem pts',
          onChanged: (v) => setState(() => _loyaltyPointsToRedeem = v.round()),
        ),
        if (_loyaltyPointsToRedeem > 0)
          Text('Redeeming $_loyaltyPointsToRedeem points = \u20B9${(_loyaltyPointsToRedeem / 10).toStringAsFixed(0)} discount', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.primary)),
      ],
    );
  }

  Widget _buildReviewStep(ThemeData theme, CartState cartState) {
    final loyaltyDiscount = _loyaltyPointsToRedeem / 10;
    final total = cartState.total - loyaltyDiscount;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Order Summary', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        // Delivery info card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: theme.colorScheme.surfaceContainerLow, borderRadius: BorderRadius.circular(16)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.location_on_rounded, size: 18, color: theme.colorScheme.primary),
                  const SizedBox(width: 8),
                  Text('Delivering to', style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600)),
                ],
              ),
              const SizedBox(height: 8),
              Text('${_addresses[_selectedAddressIndex]['label']} - ${_addresses[_selectedAddressIndex]['houseName']}', style: theme.textTheme.bodyMedium),
              if (_selectedSlotIndex >= 0) ...[
                const Divider(height: 20),
                Row(
                  children: [
                    Icon(Icons.access_time_rounded, size: 18, color: theme.colorScheme.primary),
                    const SizedBox(width: 8),
                    Text('Delivery Slot: ${_deliverySlots[_selectedSlotIndex]['time']}', style: theme.textTheme.bodyMedium),
                  ],
                ),
              ],
              const Divider(height: 20),
              Row(
                children: [
                  Icon(Icons.payment_rounded, size: 18, color: theme.colorScheme.primary),
                  const SizedBox(width: 8),
                  Text('Payment: $_paymentMethod', style: theme.textTheme.bodyMedium),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        // Price breakdown
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: theme.colorScheme.surfaceContainerLow, borderRadius: BorderRadius.circular(16)),
          child: Column(
            children: [
              _SummaryRow(label: 'Subtotal', value: cartState.subtotal),
              _SummaryRow(label: 'GST (5%)', value: cartState.gst),
              _SummaryRow(label: 'Delivery Fee', value: cartState.deliveryFee),
              if (_loyaltyPointsToRedeem > 0)
                _SummaryRow(label: 'Loyalty Discount', value: -loyaltyDiscount, isDiscount: true),
              if (_promoApplied)
                _SummaryRow(label: 'Promo Discount', value: -50, isDiscount: true),
              const Divider(height: 16),
              _SummaryRow(label: 'Total', value: total - (_promoApplied ? 50 : 0), isBold: true),
            ],
          ),
        ),
        const SizedBox(height: 16),
        // Items summary
        Text('${cartState.itemCount} items in cart', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
      ],
    );
  }

  Widget _buildBottomAction(ThemeData theme, CartState cartState) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 10, offset: const Offset(0, -3))],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _isPlacingOrder ? null : (_currentStep < 2 ? _nextStep : _handlePlaceOrder),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _isPlacingOrder
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Text(
                    _currentStep < 2 ? 'Continue' : 'Place Order - \u20B9${cartState.total.toStringAsFixed(0)}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
          ),
        ),
      ),
    );
  }
}

/// Animated step indicator with 3 steps.
class _StepIndicator extends StatelessWidget {
  const _StepIndicator({required this.currentStep});

  final int currentStep;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final steps = ['Address', 'Payment', 'Review'];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Row(
        children: List.generate(steps.length * 2 - 1, (index) {
          if (index.isOdd) {
            // Connector line
            final stepIndex = index ~/ 2;
            final isCompleted = stepIndex < currentStep;
            return Expanded(
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                height: 3,
                decoration: BoxDecoration(
                  color: isCompleted ? theme.colorScheme.primary : theme.colorScheme.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            );
          }
          // Step dot
          final stepIndex = index ~/ 2;
          final isActive = stepIndex == currentStep;
          final isCompleted = stepIndex < currentStep;
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: isActive ? 32 : 24,
                height: isActive ? 32 : 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isCompleted || isActive ? theme.colorScheme.primary : theme.colorScheme.surfaceContainerHighest,
                  border: Border.all(
                    color: isActive ? theme.colorScheme.primary : Colors.transparent,
                    width: 2,
                  ),
                ),
                child: Center(
                  child: isCompleted
                      ? const Icon(Icons.check, color: Colors.white, size: 14)
                      : Text(
                          '${stepIndex + 1}',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: isActive ? Colors.white : theme.colorScheme.onSurfaceVariant,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                steps[stepIndex],
                style: theme.textTheme.labelSmall?.copyWith(
                  color: isActive || isCompleted ? theme.colorScheme.primary : theme.colorScheme.onSurfaceVariant,
                  fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          );
        }),
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
            style: style?.copyWith(color: isDiscount ? Colors.green.shade700 : null),
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
