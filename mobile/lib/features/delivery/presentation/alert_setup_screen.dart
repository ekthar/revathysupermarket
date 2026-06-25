import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

import '../services/alarm_audio_service.dart';

/// Alert setup screen for delivery partners.
///
/// First-run screen that verifies all required permissions and capabilities:
/// 1. Notification permission
/// 2. Exact alarm / full-screen intent capability (Android)
/// 3. Battery optimization status
/// 4. Test alarm sound
///
/// Shows an actionable health/status card with green/yellow/red indicators
/// for each capability.
class AlertSetupScreen extends StatefulWidget {
  const AlertSetupScreen({
    super.key,
    required this.onSetupComplete,
  });

  final VoidCallback onSetupComplete;

  @override
  State<AlertSetupScreen> createState() => _AlertSetupScreenState();
}

class _AlertSetupScreenState extends State<AlertSetupScreen> {
  bool _notificationGranted = false;
  bool _exactAlarmGranted = false;
  bool _batteryOptimizationDisabled = false;
  bool _testAlarmPlayed = false;
  bool _isLoading = true;
  final AlarmAudioService _testAlarmService = AlarmAudioService();

  @override
  void initState() {
    super.initState();
    _checkPermissions();
  }

  Future<void> _checkPermissions() async {
    setState(() => _isLoading = true);

    final notifStatus = await Permission.notification.status;
    _notificationGranted = notifStatus.isGranted;

    // On Android, check for exact alarm permission (API 31+)
    // On iOS, this is not applicable
    final alarmStatus = await Permission.scheduleExactAlarm.status;
    _exactAlarmGranted = alarmStatus.isGranted || alarmStatus.isLimited;

    final batteryStatus = await Permission.ignoreBatteryOptimizations.status;
    _batteryOptimizationDisabled = batteryStatus.isGranted;

    setState(() => _isLoading = false);
  }

  Future<void> _requestNotificationPermission() async {
    final status = await Permission.notification.request();
    setState(() => _notificationGranted = status.isGranted);
  }

  Future<void> _requestExactAlarm() async {
    final status = await Permission.scheduleExactAlarm.request();
    setState(() => _exactAlarmGranted = status.isGranted || status.isLimited);
  }

  Future<void> _requestBatteryOptimization() async {
    final status = await Permission.ignoreBatteryOptimizations.request();
    setState(() => _batteryOptimizationDisabled = status.isGranted);
  }

  Future<void> _playTestAlarm() async {
    await _testAlarmService.startAlarm();
    setState(() => _testAlarmPlayed = true);

    // Stop after 3 seconds
    await Future.delayed(const Duration(seconds: 3));
    await _testAlarmService.stopAlarm();
  }

  bool get _allPermissionsGranted =>
      _notificationGranted && _exactAlarmGranted && _batteryOptimizationDisabled;

  @override
  void dispose() {
    _testAlarmService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Alert Setup'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header
                  const Icon(
                    Icons.notifications_active,
                    size: 64,
                    color: Colors.orange,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Set Up Delivery Alerts',
                    style: Theme.of(context).textTheme.headlineSmall,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'We need a few permissions to ensure you never miss a delivery assignment.',
                    style: Theme.of(context).textTheme.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),

                  // Permission cards
                  _PermissionCard(
                    title: 'Notifications',
                    description: 'Required to receive delivery alerts',
                    isGranted: _notificationGranted,
                    onRequest: _requestNotificationPermission,
                  ),
                  const SizedBox(height: 12),
                  _PermissionCard(
                    title: 'Exact Alarms',
                    description:
                        'Required for full-screen alert display (Android)',
                    isGranted: _exactAlarmGranted,
                    onRequest: _requestExactAlarm,
                    // NOTE: On Android 14+ (API 34), full-screen intents are
                    // limited to calling/alarm apps by Play Store policy.
                    // If permission is denied, alerts will degrade gracefully
                    // to heads-up notifications.
                    footnote:
                        'Android 14+ may restrict full-screen intents to alarm apps.',
                  ),
                  const SizedBox(height: 12),
                  _PermissionCard(
                    title: 'Battery Optimization',
                    description:
                        'Disable to prevent missed alerts in background',
                    isGranted: _batteryOptimizationDisabled,
                    onRequest: _requestBatteryOptimization,
                  ),
                  const SizedBox(height: 24),

                  // Test alarm
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                _testAlarmPlayed
                                    ? Icons.check_circle
                                    : Icons.volume_up,
                                color: _testAlarmPlayed
                                    ? Colors.green
                                    : Colors.grey,
                              ),
                              const SizedBox(width: 12),
                              const Text(
                                'Test Alarm Sound',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ElevatedButton(
                            onPressed: _playTestAlarm,
                            child: const Text('Play Test Alarm'),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Complete setup
                  FilledButton(
                    onPressed: widget.onSetupComplete,
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text(
                      _allPermissionsGranted
                          ? 'Complete Setup'
                          : 'Continue Anyway',
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

/// Card showing permission status with an action button.
class _PermissionCard extends StatelessWidget {
  const _PermissionCard({
    required this.title,
    required this.description,
    required this.isGranted,
    required this.onRequest,
    this.footnote,
  });

  final String title;
  final String description;
  final bool isGranted;
  final VoidCallback onRequest;
  final String? footnote;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(
              isGranted ? Icons.check_circle : Icons.warning_amber_rounded,
              color: isGranted ? Colors.green : Colors.orange,
              size: 32,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  if (footnote != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        footnote!,
                        style: TextStyle(
                          fontSize: 11,
                          fontStyle: FontStyle.italic,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            if (!isGranted)
              TextButton(
                onPressed: onRequest,
                child: const Text('Enable'),
              ),
          ],
        ),
      ),
    );
  }
}

/// Widget that shows alert health status - suitable for embedding
/// in the delivery dashboard.
class AlertHealthCard extends StatelessWidget {
  const AlertHealthCard({
    super.key,
    required this.notificationGranted,
    required this.exactAlarmGranted,
    required this.batteryOptimizationDisabled,
    this.onTap,
  });

  final bool notificationGranted;
  final bool exactAlarmGranted;
  final bool batteryOptimizationDisabled;
  final VoidCallback? onTap;

  Color get _statusColor {
    if (notificationGranted && exactAlarmGranted && batteryOptimizationDisabled) {
      return Colors.green;
    }
    if (notificationGranted) {
      return Colors.orange;
    }
    return Colors.red;
  }

  String get _statusText {
    if (notificationGranted && exactAlarmGranted && batteryOptimizationDisabled) {
      return 'All alerts enabled';
    }
    if (notificationGranted) {
      return 'Some permissions missing';
    }
    return 'Alerts may not work';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Icon(Icons.shield, color: _statusColor),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  _statusText,
                  style: TextStyle(
                    color: _statusColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: Colors.grey.shade400,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
