import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/network/api_client.dart';
import '../../../core/widgets/animated_fade_in.dart';

/// Premium delivery completion screen with animated success checkmark,
/// delivery summary, customer rating prompt, celebration animation,
/// and back to dashboard button.
class CompletionScreen extends StatefulWidget {
  const CompletionScreen({
    super.key,
    required this.orderId,
    required this.orderNumber,
    required this.apiClient,
    required this.onCompleted,
  });

  final String orderId;
  final String orderNumber;
  final ApiClient apiClient;
  final void Function(String completionReference) onCompleted;

  @override
  State<CompletionScreen> createState() => _CompletionScreenState();
}

class _CompletionScreenState extends State<CompletionScreen>
    with TickerProviderStateMixin {
  final _otpController = TextEditingController();
  bool _isSubmitting = false;
  bool _isCompleted = false;
  String? _error;
  String? _completionReference;
  int _rating = 0;
  bool _otpValid = false;

  late final AnimationController _checkAnimController;
  late final Animation<double> _checkScaleAnimation;
  late final AnimationController _confettiController;

  @override
  void initState() {
    super.initState();
    _otpController.addListener(_validateOtp);

    _checkAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _checkScaleAnimation = CurvedAnimation(
      parent: _checkAnimController,
      curve: Curves.elasticOut,
    );

    _confettiController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );
  }

  @override
  void dispose() {
    _otpController.dispose();
    _checkAnimController.dispose();
    _confettiController.dispose();
    super.dispose();
  }

  void _validateOtp() {
    final isValid = RegExp(r'^\d{6}$').hasMatch(_otpController.text);
    if (isValid != _otpValid) {
      setState(() => _otpValid = isValid);
    }
  }

  Future<void> _completeDelivery() async {
    if (!_otpValid) {
      setState(() => _error = 'Please enter a valid 6-digit OTP');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final response = await widget.apiClient.post<Map<String, dynamic>>(
        '/delivery/complete',
        data: {
          'orderId': widget.orderId,
          'otp': _otpController.text,
        },
      );

      final data = response.data;
      final completionRef =
          data?['completionReference'] as String? ?? 'unknown';

      setState(() {
        _isCompleted = true;
        _completionReference = completionRef;
        _isSubmitting = false;
      });

      // Trigger animations
      _checkAnimController.forward();
      _confettiController.forward();
    } catch (e) {
      setState(() {
        _error = 'Failed to complete delivery. Check OTP and try again.';
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: _isCompleted
          ? null
          : AppBar(title: const Text('Complete Delivery')),
      body: _isCompleted
          ? _buildSuccessView(colorScheme)
          : _buildOtpView(colorScheme),
    );
  }

  Widget _buildOtpView(ColorScheme colorScheme) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Icon
                AnimatedFadeIn(
                  index: 0,
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFF059669).withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.verified_user_outlined,
                      size: 48,
                      color: Color(0xFF059669),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Complete Order #${widget.orderNumber}',
                  style: GoogleFonts.manrope(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: colorScheme.onSurface,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Enter the 6-digit OTP provided by the customer',
                  style: GoogleFonts.interTight(
                    fontSize: 14,
                    color: colorScheme.onSurface.withValues(alpha: 0.6),
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),

                // OTP input
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: TextField(
                    controller: _otpController,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    maxLength: 6,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    style: GoogleFonts.manrope(
                      fontSize: 32,
                      letterSpacing: 12,
                      fontWeight: FontWeight.w700,
                      color: colorScheme.onSurface,
                    ),
                    decoration: InputDecoration(
                      hintText: '------',
                      hintStyle: GoogleFonts.manrope(
                        fontSize: 32,
                        letterSpacing: 12,
                        color: colorScheme.onSurface.withValues(alpha: 0.2),
                      ),
                      counterText: '',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 18,
                      ),
                    ),
                  ),
                ),

                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: colorScheme.error.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _error!,
                      style: TextStyle(color: colorScheme.error, fontSize: 13),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Complete button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: (_otpValid && !_isSubmitting) ? _completeDelivery : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                foregroundColor: Colors.white,
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
                          'Complete Delivery',
                          style: GoogleFonts.interTight(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildSuccessView(ColorScheme colorScheme) {
    return Stack(
      children: [
        // Confetti animation
        AnimatedBuilder(
          animation: _confettiController,
          builder: (context, child) {
            return CustomPaint(
              painter: _ConfettiPainter(
                progress: _confettiController.value,
              ),
              size: MediaQuery.of(context).size,
            );
          },
        ),

        // Content
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const Spacer(),

                // Animated checkmark
                ScaleTransition(
                  scale: _checkScaleAnimation,
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: const Color(0xFF059669).withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Container(
                        width: 72,
                        height: 72,
                        decoration: const BoxDecoration(
                          color: Color(0xFF059669),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.check,
                          color: Colors.white,
                          size: 40,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Success message
                Text(
                  'Delivery Complete!',
                  style: GoogleFonts.manrope(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Thank you for the delivery',
                  style: GoogleFonts.interTight(
                    fontSize: 15,
                    color: colorScheme.onSurface.withValues(alpha: 0.6),
                  ),
                ),
                const SizedBox(height: 24),

                // Delivery summary card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: colorScheme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: colorScheme.outlineVariant.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Column(
                    children: [
                      _SummaryRow(
                        label: 'Order',
                        value: '#${widget.orderNumber}',
                      ),
                      const SizedBox(height: 8),
                      _SummaryRow(
                        label: 'Reference',
                        value: _completionReference ?? 'N/A',
                      ),
                      const SizedBox(height: 8),
                      _SummaryRow(
                        label: 'Status',
                        value: 'Delivered',
                        valueColor: const Color(0xFF059669),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Rating prompt
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: colorScheme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: colorScheme.outlineVariant.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'How was the delivery?',
                        style: GoogleFonts.interTight(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(5, (index) {
                          return GestureDetector(
                            onTap: () => setState(() => _rating = index + 1),
                            child: Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 4),
                              child: Icon(
                                index < _rating
                                    ? Icons.star
                                    : Icons.star_border,
                                color: index < _rating
                                    ? const Color(0xFFF59E0B)
                                    : colorScheme.onSurface
                                        .withValues(alpha: 0.3),
                                size: 36,
                              ),
                            ),
                          );
                        }),
                      ),
                    ],
                  ),
                ),

                const Spacer(),

                // Back to dashboard
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      widget.onCompleted(_completionReference ?? '');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: colorScheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.home_outlined, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Back to Dashboard',
                          style: GoogleFonts.interTight(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ==========================================================
// Summary Row Widget
// ==========================================================

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.interTight(
            fontSize: 13,
            color: colorScheme.onSurface.withValues(alpha: 0.6),
          ),
        ),
        Text(
          value,
          style: GoogleFonts.interTight(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: valueColor ?? colorScheme.onSurface,
          ),
        ),
      ],
    );
  }
}

// ==========================================================
// Confetti Painter (celebration animation)
// ==========================================================

class _ConfettiPainter extends CustomPainter {
  _ConfettiPainter({required this.progress});

  final double progress;
  final Random _random = Random(42);

  @override
  void paint(Canvas canvas, Size size) {
    if (progress <= 0) return;

    final colors = [
      const Color(0xFF059669),
      const Color(0xFFF59E0B),
      const Color(0xFF2563EB),
      const Color(0xFF7C3AED),
      const Color(0xFFEC4899),
      const Color(0xFFEF4444),
    ];

    for (int i = 0; i < 40; i++) {
      final paint = Paint()
        ..color = colors[i % colors.length].withValues(alpha: (1 - progress) * 0.8);

      final startX = _random.nextDouble() * size.width;
      final startY = -20.0;
      final currentY = startY + (size.height + 40) * progress * (0.5 + _random.nextDouble() * 0.5);
      final currentX = startX + sin(progress * pi * 2 + i) * 30;

      final confettiWidth = 6.0 + _random.nextDouble() * 4;
      final confettiHeight = 4.0 + _random.nextDouble() * 3;

      canvas.save();
      canvas.translate(currentX, currentY);
      canvas.rotate(progress * pi * 2 * (_random.nextBool() ? 1 : -1));
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(
            center: Offset.zero,
            width: confettiWidth,
            height: confettiHeight,
          ),
          const Radius.circular(2),
        ),
        paint,
      );
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _ConfettiPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
