import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/network/api_client.dart';
import '../../../core/widgets/animated_fade_in.dart';

/// Premium pickup confirmation screen with item checklist,
/// photo upload placeholder, and confirm button with loading state.
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
  bool _isLoadingItems = true;
  String? _error;
  List<Map<String, dynamic>> _items = [];
  final Map<int, bool> _checkedItems = {};
  bool _photoAdded = false;

  @override
  void initState() {
    super.initState();
    _loadOrderItems();
  }

  Future<void> _loadOrderItems() async {
    try {
      final response = await widget.apiClient.get<Map<String, dynamic>>(
        '/delivery/orders/${widget.orderId}',
      );
      final data = response.data;
      if (data != null) {
        final items =
            List<Map<String, dynamic>>.from(data['items'] as List? ?? []);
        setState(() {
          _items = items;
          for (int i = 0; i < items.length; i++) {
            _checkedItems[i] = false;
          }
          _isLoadingItems = false;
        });
      }
    } catch (_) {
      setState(() {
        _isLoadingItems = false;
        // Still allow confirmation with empty checklist
      });
    }
  }

  bool get _allItemsChecked {
    if (_items.isEmpty) return true;
    return _checkedItems.values.every((v) => v);
  }

  Future<void> _confirmPickup() async {
    if (!_allItemsChecked) {
      setState(() => _error = 'Please verify all items before confirming');
      return;
    }

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
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Confirm Pickup'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                // Order summary card
                AnimatedFadeIn(
                  index: 0,
                  child: _OrderSummaryCard(orderNumber: widget.orderNumber),
                ),
                const SizedBox(height: 20),

                // Item checklist
                AnimatedFadeIn(
                  index: 1,
                  child: _buildItemChecklist(colorScheme),
                ),
                const SizedBox(height: 20),

                // Photo upload placeholder
                AnimatedFadeIn(
                  index: 2,
                  child: _buildPhotoUpload(colorScheme),
                ),

                // Error message
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
                              color: colorScheme.error,
                              fontSize: 13,
                            ),
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
                onPressed: _isSubmitting ? null : _confirmPickup,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _allItemsChecked
                      ? const Color(0xFF059669)
                      : colorScheme.surfaceContainerHighest,
                  foregroundColor:
                      _allItemsChecked ? Colors.white : colorScheme.onSurface,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  disabledBackgroundColor:
                      colorScheme.surfaceContainerHighest,
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
                            'Confirm Pickup',
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

  Widget _buildItemChecklist(ColorScheme colorScheme) {
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
              Icon(Icons.checklist, color: colorScheme.primary, size: 18),
              const SizedBox(width: 8),
              Text(
                'Verify Items',
                style: GoogleFonts.interTight(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: colorScheme.onSurface,
                ),
              ),
              const Spacer(),
              if (_items.isNotEmpty)
                Text(
                  '${_checkedItems.values.where((v) => v).length}/${_items.length}',
                  style: GoogleFonts.interTight(
                    fontSize: 12,
                    color: colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          if (_isLoadingItems)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else if (_items.isEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'No items to verify',
                style: GoogleFonts.interTight(
                  fontSize: 13,
                  color: colorScheme.onSurface.withValues(alpha: 0.5),
                ),
              ),
            )
          else
            ...List.generate(_items.length, (index) {
              final item = _items[index];
              final isChecked = _checkedItems[index] ?? false;
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: InkWell(
                  onTap: () {
                    setState(() {
                      _checkedItems[index] = !isChecked;
                    });
                  },
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: isChecked
                          ? const Color(0xFF059669).withValues(alpha: 0.05)
                          : colorScheme.surfaceContainerHighest
                              .withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isChecked
                            ? const Color(0xFF059669).withValues(alpha: 0.3)
                            : Colors.transparent,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: isChecked
                                ? const Color(0xFF059669)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: isChecked
                                  ? const Color(0xFF059669)
                                  : colorScheme.outlineVariant,
                              width: 2,
                            ),
                          ),
                          child: isChecked
                              ? const Icon(
                                  Icons.check,
                                  color: Colors.white,
                                  size: 16,
                                )
                              : null,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            '${item['name'] ?? 'Item'} x${item['quantity'] ?? 1}',
                            style: GoogleFonts.interTight(
                              fontSize: 14,
                              color: colorScheme.onSurface,
                              decoration: isChecked
                                  ? TextDecoration.lineThrough
                                  : null,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildPhotoUpload(ColorScheme colorScheme) {
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
              Icon(Icons.camera_alt_outlined,
                  color: colorScheme.primary, size: 18),
              const SizedBox(width: 8),
              Text(
                'Photo Evidence (Optional)',
                style: GoogleFonts.interTight(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: colorScheme.onSurface,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: () {
              setState(() => _photoAdded = !_photoAdded);
            },
            child: Container(
              height: 120,
              width: double.infinity,
              decoration: BoxDecoration(
                color: _photoAdded
                    ? const Color(0xFF059669).withValues(alpha: 0.05)
                    : colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _photoAdded
                      ? const Color(0xFF059669).withValues(alpha: 0.3)
                      : colorScheme.outlineVariant.withValues(alpha: 0.5),
                  style: _photoAdded ? BorderStyle.solid : BorderStyle.none,
                ),
              ),
              child: _photoAdded
                  ? Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.check_circle,
                          color: Color(0xFF059669),
                          size: 32,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Photo added',
                          style: GoogleFonts.interTight(
                            fontSize: 13,
                            color: const Color(0xFF059669),
                          ),
                        ),
                      ],
                    )
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.add_a_photo_outlined,
                          color:
                              colorScheme.onSurface.withValues(alpha: 0.4),
                          size: 32,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Tap to add photo',
                          style: GoogleFonts.interTight(
                            fontSize: 13,
                            color:
                                colorScheme.onSurface.withValues(alpha: 0.5),
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

// ==========================================================
// Order Summary Card
// ==========================================================

class _OrderSummaryCard extends StatelessWidget {
  const _OrderSummaryCard({required this.orderNumber});

  final String orderNumber;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2563EB), Color(0xFF3B82F6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2563EB).withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.local_shipping,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Picking up',
                style: GoogleFonts.interTight(
                  fontSize: 13,
                  color: Colors.white.withValues(alpha: 0.8),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Order #$orderNumber',
                style: GoogleFonts.manrope(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
