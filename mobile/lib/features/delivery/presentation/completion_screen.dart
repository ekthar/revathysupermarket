import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/network/api_client.dart';

/// Delivery completion screen with 6-digit OTP input and slide-to-deliver.
///
/// Calls POST /api/delivery/complete with the order ID and OTP.
/// Shows success state with completion reference on success.
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

class _CompletionScreenState extends State<CompletionScreen> {
  final _otpController = TextEditingController();
  bool _isSubmitting = false;
  String? _error;
  double _slideValue = 0;
  bool _otpValid = false;

  @override
  void initState() {
    super.initState();
    _otpController.addListener(_validateOtp);
  }

  @override
  void dispose() {
    _otpController.dispose();
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
      widget.onCompleted(completionRef);
    } catch (e) {
      setState(() {
        _error = 'Failed to complete delivery. Check OTP and try again.';
        _isSubmitting = false;
        _slideValue = 0;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Complete Delivery'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.verified_user,
              size: 64,
              color: Colors.green,
            ),
            const SizedBox(height: 16),
            Text(
              'Complete Order #${widget.orderNumber}',
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Enter the 6-digit OTP provided by the customer.',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),

            // OTP input
            TextField(
              controller: _otpController,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              maxLength: 6,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              style: const TextStyle(
                fontSize: 32,
                letterSpacing: 12,
                fontWeight: FontWeight.bold,
              ),
              decoration: const InputDecoration(
                hintText: '------',
                border: OutlineInputBorder(),
                counterText: '',
              ),
            ),
            const SizedBox(height: 24),

            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text(
                  _error!,
                  style: const TextStyle(color: Colors.red),
                  textAlign: TextAlign.center,
                ),
              ),

            // Slide to deliver
            if (_otpValid) ...[
              Text(
                'Slide to deliver',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(30),
                  color: Colors.green.shade100,
                ),
                child: SliderTheme(
                  data: SliderThemeData(
                    thumbShape:
                        const RoundSliderThumbShape(enabledThumbRadius: 20),
                    trackHeight: 50,
                    activeTrackColor: Colors.green,
                    inactiveTrackColor: Colors.green.shade100,
                    thumbColor: Colors.green.shade700,
                  ),
                  child: Slider(
                    value: _slideValue,
                    onChanged: _isSubmitting
                        ? null
                        : (value) => setState(() => _slideValue = value),
                    onChangeEnd: (value) {
                      if (value > 0.9) {
                        _completeDelivery();
                      } else {
                        setState(() => _slideValue = 0);
                      }
                    },
                  ),
                ),
              ),
            ],

            if (_isSubmitting) ...[
              const SizedBox(height: 24),
              const CircularProgressIndicator(),
              const SizedBox(height: 8),
              const Text('Completing delivery...'),
            ],
          ],
        ),
      ),
    );
  }
}
