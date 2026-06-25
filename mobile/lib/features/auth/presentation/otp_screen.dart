import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

/// OTP verification screen with animated pin input fields, countdown timer
/// with circular progress, resend cooldown, and verification success state.
class OtpScreen extends StatefulWidget {
  const OtpScreen({
    super.key,
    required this.phone,
    this.onVerify,
    this.onResend,
  });

  final String phone;
  final void Function(String otp)? onVerify;
  final VoidCallback? onResend;

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> with TickerProviderStateMixin {
  static const _otpLength = 6;
  static const _countdownDuration = 30;

  final List<TextEditingController> _controllers = [];
  final List<FocusNode> _focusNodes = [];

  Timer? _timer;
  int _countdown = _countdownDuration;
  bool _canResend = false;
  bool _isVerifying = false;
  bool _isVerified = false;

  late final AnimationController _fadeController;
  late final AnimationController _successController;
  late final Animation<double> _fadeAnimation;
  late final Animation<double> _successScale;
  late final Animation<double> _successFade;

  @override
  void initState() {
    super.initState();

    // Initialize controllers and focus nodes for each pin box
    for (int i = 0; i < _otpLength; i++) {
      _controllers.add(TextEditingController());
      _focusNodes.add(FocusNode());
    }

    // Entry animation
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOutCubic,
    );

    // Success animation
    _successController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _successScale = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _successController,
        curve: Curves.elasticOut,
      ),
    );
    _successFade = CurvedAnimation(
      parent: _successController,
      curve: Curves.easeIn,
    );

    _startCountdown();
    _fadeController.forward();

    // Focus the first pin field
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _focusNodes[0].requestFocus();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _fadeController.dispose();
    _successController.dispose();
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void _startCountdown() {
    _countdown = _countdownDuration;
    _canResend = false;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _countdown--;
        if (_countdown <= 0) {
          _canResend = true;
          timer.cancel();
        }
      });
    });
  }

  String get _currentOtp {
    return _controllers.map((c) => c.text).join();
  }

  void _onDigitChanged(int index, String value) {
    if (value.length == 1) {
      // Move to next field
      if (index < _otpLength - 1) {
        _focusNodes[index + 1].requestFocus();
      } else {
        // All digits entered, auto-submit
        _focusNodes[index].unfocus();
        _handleVerify();
      }
    } else if (value.isEmpty && index > 0) {
      // Handle backspace - move to previous field
      _focusNodes[index - 1].requestFocus();
    }
  }

  Future<void> _handleVerify() async {
    final otp = _currentOtp;
    if (otp.length != _otpLength) return;

    setState(() => _isVerifying = true);

    // Simulate small delay for visual feedback
    await Future.delayed(const Duration(milliseconds: 500));

    if (mounted) {
      setState(() {
        _isVerifying = false;
        _isVerified = true;
      });
      _successController.forward();

      // Wait for animation then call callback
      await Future.delayed(const Duration(milliseconds: 800));
      widget.onVerify?.call(otp);
    }
  }

  void _handleResend() {
    if (!_canResend) return;
    // Clear all fields
    for (final c in _controllers) {
      c.clear();
    }
    _focusNodes[0].requestFocus();
    widget.onResend?.call();
    _startCountdown();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isDark
                ? [
                    const Color(0xFF064E3B),
                    const Color(0xFF0F172A),
                  ]
                : [
                    const Color(0xFF059669),
                    const Color(0xFFF8FAFC),
                  ],
            stops: const [0.0, 0.35],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Custom app bar
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.arrow_back_ios_new_rounded),
                      color: Colors.white,
                    ),
                    const Spacer(),
                  ],
                ),
              ),

              Expanded(
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      children: [
                        const SizedBox(height: 16),

                        // Header
                        Icon(
                          _isVerified
                              ? Icons.check_circle_rounded
                              : Icons.message_rounded,
                          size: 56,
                          color: Colors.white,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _isVerified
                              ? 'Verified!'
                              : 'Verify your number',
                          style: theme.textTheme.headlineLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _isVerified
                              ? 'Redirecting you now...'
                              : 'Enter the 6-digit code sent to\n${widget.phone}',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: Colors.white.withValues(alpha: 0.85),
                          ),
                          textAlign: TextAlign.center,
                        ),

                        const SizedBox(height: 40),

                        // === Verification Success State ===
                        if (_isVerified)
                          ScaleTransition(
                            scale: _successScale,
                            child: FadeTransition(
                              opacity: _successFade,
                              child: Container(
                                width: 100,
                                height: 100,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF059669),
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF059669)
                                          .withValues(alpha: 0.4),
                                      blurRadius: 24,
                                      spreadRadius: 4,
                                    ),
                                  ],
                                ),
                                child: const Icon(
                                  Icons.check_rounded,
                                  size: 48,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          )
                        else ...[
                          // === Pin Input Fields ===
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? const Color(0xFF1E293B)
                                      .withValues(alpha: 0.9)
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black
                                      .withValues(alpha: 0.08),
                                  blurRadius: 16,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceEvenly,
                                  children: List.generate(
                                    _otpLength,
                                    (index) => _AnimatedPinBox(
                                      controller: _controllers[index],
                                      focusNode: _focusNodes[index],
                                      isDark: isDark,
                                      onChanged: (value) =>
                                          _onDigitChanged(index, value),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 24),

                                // Verify button
                                if (_isVerifying)
                                  const SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                    ),
                                  )
                                else
                                  SizedBox(
                                    width: double.infinity,
                                    child: FilledButton(
                                      onPressed: _currentOtp.length ==
                                              _otpLength
                                          ? _handleVerify
                                          : null,
                                      style: FilledButton.styleFrom(
                                        padding:
                                            const EdgeInsets.symmetric(
                                                vertical: 16),
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(14),
                                        ),
                                      ),
                                      child: const Text('Verify Code'),
                                    ),
                                  ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 32),

                          // === Countdown Timer with Circular Progress ===
                          _CountdownTimer(
                            countdown: _countdown,
                            totalDuration: _countdownDuration,
                            canResend: _canResend,
                            onResend: _handleResend,
                            isDark: isDark,
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Animated individual pin input box that scales on focus.
class _AnimatedPinBox extends StatefulWidget {
  const _AnimatedPinBox({
    required this.controller,
    required this.focusNode,
    required this.isDark,
    required this.onChanged,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final bool isDark;
  final ValueChanged<String> onChanged;

  @override
  State<_AnimatedPinBox> createState() => _AnimatedPinBoxState();
}

class _AnimatedPinBoxState extends State<_AnimatedPinBox>
    with SingleTickerProviderStateMixin {
  late final AnimationController _scaleController;
  late final Animation<double> _scale;
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _scale = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _scaleController, curve: Curves.easeOutBack),
    );

    widget.focusNode.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    widget.focusNode.removeListener(_onFocusChange);
    _scaleController.dispose();
    super.dispose();
  }

  void _onFocusChange() {
    setState(() => _isFocused = widget.focusNode.hasFocus);
    if (_isFocused) {
      _scaleController.forward();
    } else {
      _scaleController.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasValue = widget.controller.text.isNotEmpty;
    final primaryColor = const Color(0xFF059669);

    return ScaleTransition(
      scale: _scale,
      child: Container(
        width: 44,
        height: 56,
        decoration: BoxDecoration(
          color: widget.isDark
              ? (_isFocused
                  ? const Color(0xFF334155)
                  : const Color(0xFF1E293B))
              : (_isFocused
                  ? primaryColor.withValues(alpha: 0.05)
                  : const Color(0xFFF8FAFC)),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: _isFocused
                ? primaryColor
                : (hasValue
                    ? primaryColor.withValues(alpha: 0.5)
                    : (widget.isDark
                        ? const Color(0xFF475569)
                        : const Color(0xFFE2E8F0))),
            width: _isFocused ? 2 : 1.5,
          ),
          boxShadow: _isFocused
              ? [
                  BoxShadow(
                    color: primaryColor.withValues(alpha: 0.2),
                    blurRadius: 8,
                    spreadRadius: 1,
                  ),
                ]
              : null,
        ),
        child: Center(
          child: TextField(
            controller: widget.controller,
            focusNode: widget.focusNode,
            textAlign: TextAlign.center,
            keyboardType: TextInputType.number,
            maxLength: 1,
            onChanged: widget.onChanged,
            style: GoogleFonts.manrope(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: widget.isDark ? Colors.white : const Color(0xFF0F172A),
            ),
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(1),
            ],
            decoration: const InputDecoration(
              counterText: '',
              border: InputBorder.none,
              contentPadding: EdgeInsets.zero,
              isDense: true,
            ),
          ),
        ),
      ),
    );
  }
}

/// Countdown timer widget with circular progress indicator and resend button.
class _CountdownTimer extends StatelessWidget {
  const _CountdownTimer({
    required this.countdown,
    required this.totalDuration,
    required this.canResend,
    required this.onResend,
    required this.isDark,
  });

  final int countdown;
  final int totalDuration;
  final bool canResend;
  final VoidCallback onResend;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final progress = countdown / totalDuration;
    final primaryColor = const Color(0xFF059669);

    if (canResend) {
      return Column(
        children: [
          Text(
            "Didn't receive the code?",
            style: theme.textTheme.bodyMedium?.copyWith(
              color: isDark
                  ? const Color(0xFF94A3B8)
                  : const Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: onResend,
            icon: const Icon(Icons.refresh_rounded, size: 20),
            label: const Text('Resend OTP'),
            style: TextButton.styleFrom(
              foregroundColor: primaryColor,
            ),
          ),
        ],
      );
    }

    return Column(
      children: [
        SizedBox(
          width: 56,
          height: 56,
          child: Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 56,
                height: 56,
                child: CircularProgressIndicator(
                  value: progress,
                  strokeWidth: 3,
                  backgroundColor: isDark
                      ? const Color(0xFF334155)
                      : const Color(0xFFE2E8F0),
                  valueColor: AlwaysStoppedAnimation<Color>(primaryColor),
                ),
              ),
              Text(
                '${countdown}s',
                style: GoogleFonts.interTight(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: isDark
                      ? const Color(0xFF94A3B8)
                      : const Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Resend code in $countdown seconds',
          style: theme.textTheme.bodySmall?.copyWith(
            color: isDark
                ? const Color(0xFF94A3B8)
                : const Color(0xFF64748B),
          ),
        ),
      ],
    );
  }
}
