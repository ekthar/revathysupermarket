import 'dart:collection';

import 'package:flutter/material.dart';

import '../domain/assignment_event.dart';
import '../services/alarm_audio_service.dart';

/// Full-screen alarm overlay for delivery assignment alerts.
///
/// Displays order details with looping alarm audio. Only one alarm screen
/// is active at a time - additional assignments are queued and shown
/// sequentially after the user dismisses or views the current one.
class AssignmentAlarmScreen extends StatefulWidget {
  const AssignmentAlarmScreen({
    super.key,
    required this.initialEvent,
    required this.alarmAudioService,
    required this.onDismiss,
    required this.onViewOrder,
  });

  final AssignmentEvent initialEvent;
  final AlarmAudioService alarmAudioService;
  final void Function(AssignmentEvent event) onDismiss;
  final void Function(AssignmentEvent event) onViewOrder;

  @override
  State<AssignmentAlarmScreen> createState() => AssignmentAlarmScreenState();
}

class AssignmentAlarmScreenState extends State<AssignmentAlarmScreen> {
  late AssignmentEvent _currentEvent;
  final Queue<AssignmentEvent> _eventQueue = Queue();

  @override
  void initState() {
    super.initState();
    _currentEvent = widget.initialEvent;
    widget.alarmAudioService.startAlarm();
  }

  /// Enqueue an additional assignment to show after the current one.
  void enqueueEvent(AssignmentEvent event) {
    _eventQueue.add(event);
  }

  /// Whether there are more events in the queue.
  bool get hasQueuedEvents => _eventQueue.isNotEmpty;

  void _handleDismiss() {
    widget.alarmAudioService.stopAlarm();
    widget.onDismiss(_currentEvent);

    if (_eventQueue.isNotEmpty) {
      setState(() {
        _currentEvent = _eventQueue.removeFirst();
      });
      widget.alarmAudioService.startAlarm();
    }
  }

  void _handleViewOrder() {
    widget.alarmAudioService.stopAlarm();
    widget.onViewOrder(_currentEvent);
  }

  @override
  void dispose() {
    widget.alarmAudioService.stopAlarm();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.red.shade900,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Alarm icon with animation-like pulsing
              const Icon(
                Icons.notifications_active,
                size: 80,
                color: Colors.white,
              ),
              const SizedBox(height: 24),

              // Title
              Text(
                'New Delivery Assignment',
                style: theme.textTheme.headlineMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),

              // Order details card
              Card(
                elevation: 8,
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _DetailRow(
                        icon: Icons.receipt_long,
                        label: 'Order',
                        value: '#${_currentEvent.orderNumber}',
                      ),
                      if (_currentEvent.customerName != null) ...[
                        const SizedBox(height: 12),
                        _DetailRow(
                          icon: Icons.person,
                          label: 'Customer',
                          value: _currentEvent.customerName!,
                        ),
                      ],
                      if (_currentEvent.address != null) ...[
                        const SizedBox(height: 12),
                        _DetailRow(
                          icon: Icons.location_on,
                          label: 'Address',
                          value: _currentEvent.address!,
                        ),
                      ],
                      if (_currentEvent.total != null) ...[
                        const SizedBox(height: 12),
                        _DetailRow(
                          icon: Icons.currency_rupee,
                          label: 'Total',
                          value: _currentEvent.total!.toStringAsFixed(2),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Queue indicator
              if (_eventQueue.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(
                    '+${_eventQueue.length} more assignment(s) waiting',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: Colors.white70,
                    ),
                  ),
                ),

              // Action buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _handleDismiss,
                      icon: const Icon(Icons.close),
                      label: const Text('Dismiss'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: _handleViewOrder,
                      icon: const Icon(Icons.visibility),
                      label: const Text('View Order'),
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.red.shade900,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: Colors.grey.shade600),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
