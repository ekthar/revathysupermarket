import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';

/// A banner that appears when the device loses internet connectivity.
///
/// Listens to connectivity changes and displays a material banner
/// at the top of the screen when offline.
class OfflineBanner extends StatefulWidget {
  const OfflineBanner({super.key, required this.child});

  final Widget child;

  @override
  State<OfflineBanner> createState() => _OfflineBannerState();
}

class _OfflineBannerState extends State<OfflineBanner> {
  bool _isOffline = false;

  @override
  void initState() {
    super.initState();
    _checkConnectivity();
    Connectivity().onConnectivityChanged.listen(_updateConnectionStatus);
  }

  Future<void> _checkConnectivity() async {
    final result = await Connectivity().checkConnectivity();
    _updateConnectionStatus(result);
  }

  void _updateConnectionStatus(List<ConnectivityResult> result) {
    if (!mounted) return;
    setState(() {
      _isOffline = result.contains(ConnectivityResult.none);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (_isOffline)
          MaterialBanner(
            content: const Text(
              'No internet connection',
              style: TextStyle(color: Colors.white),
            ),
            leading: const Icon(Icons.wifi_off, color: Colors.white),
            backgroundColor: Colors.red.shade700,
            actions: [
              TextButton(
                onPressed: _checkConnectivity,
                child: const Text(
                  'Retry',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ],
          ),
        Expanded(child: widget.child),
      ],
    );
  }
}
