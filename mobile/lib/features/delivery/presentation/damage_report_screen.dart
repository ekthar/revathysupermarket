import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/network/api_client.dart';
import '../../../core/widgets/animated_fade_in.dart';

/// Premium damage report screen for delivery partners.
///
/// Allows item selection with checkboxes, damage description,
/// photo upload placeholder, severity selector (Minor/Major/Critical),
/// and submit button with loading state.
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

enum _DamageSeverity { minor, major, critical }

class _DamageReportScreenState extends State<DamageReportScreen> {
  final Set<String> _selectedItemIds = {};
  final _descriptionController = TextEditingController();
  _DamageSeverity _severity = _DamageSeverity.minor;
  bool _photoAdded = false;
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submitReport() async {
    if (_selectedItemIds.isEmpty) {
      setState(() => _error = 'Please select at least one damaged item');
      return;
    }
    if (_descriptionController.text.trim().length < 3) {
      setState(() => _error = 'Please describe the damage (at least 3 characters)');
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
          'damagedItems': _selectedItemIds.toList(),
          'description': _descriptionController.text.trim(),
          'severity': _severity.name,
          'hasPhoto': _photoAdded,
        },
      );
      widget.onReported();
    } catch (e) {
      setState(() {
        _error = 'Failed to submit damage report. Please try again.';
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Damage'),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                // Header
                AnimatedFadeIn(
                  index: 0,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD97706).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: const Color(0xFFD97706).withValues(alpha: 0.2),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.warning_amber_rounded,
                          color: Color(0xFFD97706),
                          size: 24,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Report any damaged items from this delivery',
                            style: GoogleFonts.interTight(
                              fontSize: 13,
                              color: const Color(0xFFD97706),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Item selection
                AnimatedFadeIn(
                  index: 1,
                  child: _buildItemSelection(colorScheme),
                ),
                const SizedBox(height: 20),

                // Severity selector
                AnimatedFadeIn(
                  index: 2,
                  child: _buildSeveritySelector(colorScheme),
                ),
                const SizedBox(height: 20),

                // Description
                AnimatedFadeIn(
                  index: 3,
                  child: _buildDescriptionField(colorScheme),
                ),
                const SizedBox(height: 20),

                // Photo upload
                AnimatedFadeIn(
                  index: 4,
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

          // Submit button
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
                onPressed: _isSubmitting ? null : _submitReport,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFD97706),
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
                          const Icon(Icons.report, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Submit Report',
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

  Widget _buildItemSelection(ColorScheme colorScheme) {
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
              Icon(Icons.inventory_2_outlined,
                  color: colorScheme.primary, size: 18),
              const SizedBox(width: 8),
              Text(
                'Select Damaged Items',
                style: GoogleFonts.interTight(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: colorScheme.onSurface,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...widget.items.map((item) {
            final itemId = item['id'] as String? ?? '';
            final isSelected = _selectedItemIds.contains(itemId);
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: InkWell(
                onTap: () {
                  setState(() {
                    if (isSelected) {
                      _selectedItemIds.remove(itemId);
                    } else {
                      _selectedItemIds.add(itemId);
                    }
                  });
                },
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? const Color(0xFFD97706).withValues(alpha: 0.05)
                        : colorScheme.surfaceContainerHighest
                            .withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFFD97706).withValues(alpha: 0.3)
                          : Colors.transparent,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          color: isSelected
                              ? const Color(0xFFD97706)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: isSelected
                                ? const Color(0xFFD97706)
                                : colorScheme.outlineVariant,
                            width: 2,
                          ),
                        ),
                        child: isSelected
                            ? const Icon(Icons.check,
                                color: Colors.white, size: 16)
                            : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          '${item['name'] ?? 'Item'} x${item['quantity'] ?? 1}',
                          style: GoogleFonts.interTight(
                            fontSize: 14,
                            color: colorScheme.onSurface,
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

  Widget _buildSeveritySelector(ColorScheme colorScheme) {
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
              Icon(Icons.speed_outlined, color: colorScheme.primary, size: 18),
              const SizedBox(width: 8),
              Text(
                'Severity Level',
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
              _SeverityOption(
                label: 'Minor',
                color: const Color(0xFF059669),
                icon: Icons.info_outline,
                isSelected: _severity == _DamageSeverity.minor,
                onTap: () =>
                    setState(() => _severity = _DamageSeverity.minor),
              ),
              const SizedBox(width: 10),
              _SeverityOption(
                label: 'Major',
                color: const Color(0xFFD97706),
                icon: Icons.warning_amber,
                isSelected: _severity == _DamageSeverity.major,
                onTap: () =>
                    setState(() => _severity = _DamageSeverity.major),
              ),
              const SizedBox(width: 10),
              _SeverityOption(
                label: 'Critical',
                color: const Color(0xFFDC2626),
                icon: Icons.error_outline,
                isSelected: _severity == _DamageSeverity.critical,
                onTap: () =>
                    setState(() => _severity = _DamageSeverity.critical),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDescriptionField(ColorScheme colorScheme) {
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
              Icon(Icons.description_outlined,
                  color: colorScheme.primary, size: 18),
              const SizedBox(width: 8),
              Text(
                'Description',
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
            controller: _descriptionController,
            maxLines: 4,
            decoration: InputDecoration(
              hintText: 'Describe what happened to the items...',
              hintStyle: GoogleFonts.interTight(
                fontSize: 14,
                color: colorScheme.onSurface.withValues(alpha: 0.4),
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(
                  color: colorScheme.outlineVariant.withValues(alpha: 0.3),
                ),
              ),
            ),
          ),
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
                'Photo Evidence',
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
            onTap: () => setState(() => _photoAdded = !_photoAdded),
            child: Container(
              height: 100,
              width: double.infinity,
              decoration: BoxDecoration(
                color: _photoAdded
                    ? const Color(0xFFD97706).withValues(alpha: 0.05)
                    : colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _photoAdded
                      ? const Color(0xFFD97706).withValues(alpha: 0.3)
                      : colorScheme.outlineVariant.withValues(alpha: 0.5),
                ),
              ),
              child: _photoAdded
                  ? Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.check_circle,
                            color: Color(0xFFD97706), size: 28),
                        const SizedBox(height: 6),
                        Text(
                          'Photo attached',
                          style: GoogleFonts.interTight(
                            fontSize: 12,
                            color: const Color(0xFFD97706),
                          ),
                        ),
                      ],
                    )
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.add_a_photo_outlined,
                            color:
                                colorScheme.onSurface.withValues(alpha: 0.4),
                            size: 28),
                        const SizedBox(height: 6),
                        Text(
                          'Tap to take photo of damage',
                          style: GoogleFonts.interTight(
                            fontSize: 12,
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
// Severity Option Widget
// ==========================================================

class _SeverityOption extends StatelessWidget {
  const _SeverityOption({
    required this.label,
    required this.color,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final Color color;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
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
              Icon(icon, color: color, size: 22),
              const SizedBox(height: 6),
              Text(
                label,
                style: GoogleFonts.interTight(
                  fontSize: 12,
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
