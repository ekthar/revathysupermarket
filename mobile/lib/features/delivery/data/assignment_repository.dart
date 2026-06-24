import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../../core/network/api_client.dart';
import '../domain/assignment_event.dart';

/// Repository for managing delivery assignment events.
///
/// Handles fetching pending assignments from the backend, acknowledging them,
/// and reconciliation logic. Prevents duplicate alarms using a local Set
/// of active eventIds.
///
/// Reconciliation triggers:
/// - App startup
/// - App resume (AppLifecycleState.resumed)
/// - Login
/// - Network recovery
/// - Periodic (every 30 seconds while foregrounded)
class AssignmentRepository {
  AssignmentRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  /// Set of eventIds for which an alarm has already been triggered.
  /// Prevents duplicate alarms from repeated polls or pushes.
  final Set<String> _alarmTriggeredEventIds = {};

  /// Currently pending (unacknowledged) assignments.
  final List<AssignmentEvent> _pendingAssignments = [];

  /// Timer for periodic reconciliation.
  Timer? _reconciliationTimer;

  /// Callback invoked when a new assignment needs to trigger an alarm.
  void Function(AssignmentEvent event)? onNewAssignment;

  /// Get the current pending assignments.
  List<AssignmentEvent> get pendingAssignments =>
      List.unmodifiable(_pendingAssignments);

  /// Get the set of event IDs that have already triggered alarms.
  Set<String> get alarmTriggeredEventIds =>
      Set.unmodifiable(_alarmTriggeredEventIds);

  /// Start periodic reconciliation (every 30 seconds).
  void startPeriodicReconciliation() {
    _reconciliationTimer?.cancel();
    _reconciliationTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => reconcile(),
    );
  }

  /// Stop periodic reconciliation.
  void stopPeriodicReconciliation() {
    _reconciliationTimer?.cancel();
    _reconciliationTimer = null;
  }

  /// Reconcile: fetch pending assignments from backend and trigger
  /// alarms for any new (not-yet-alarmed) events.
  ///
  /// Called on startup, resume, login, network recovery, and periodically.
  Future<void> reconcile() async {
    try {
      final assignments = await fetchPendingAssignments();
      _pendingAssignments
        ..clear()
        ..addAll(assignments);

      // Trigger alarm for any assignment not yet alarmed
      for (final assignment in assignments) {
        if (!_alarmTriggeredEventIds.contains(assignment.eventId)) {
          _alarmTriggeredEventIds.add(assignment.eventId);
          onNewAssignment?.call(assignment);
        }
      }
    } catch (e) {
      debugPrint('AssignmentRepository: Reconciliation failed: $e');
    }
  }

  /// Fetch pending (unacknowledged) assignments from the backend.
  Future<List<AssignmentEvent>> fetchPendingAssignments() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/assignments',
    );

    final data = response.data;
    if (data == null) return [];

    final events = data['events'] as List<dynamic>? ?? [];
    return events
        .map((e) => AssignmentEvent.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Acknowledge an assignment event via the backend.
  ///
  /// Idempotent: calling multiple times for the same event is safe.
  /// Ownership is checked server-side.
  Future<bool> acknowledgeAssignment(String eventId) async {
    try {
      await _apiClient.post(
        '/assignments',
        data: {'eventId': eventId},
      );

      // Remove from pending list
      _pendingAssignments.removeWhere((e) => e.eventId == eventId);
      return true;
    } catch (e) {
      debugPrint('AssignmentRepository: Acknowledge failed: $e');
      return false;
    }
  }

  /// Handle an incoming FCM push for a new assignment.
  ///
  /// Checks if we already triggered an alarm for this event to
  /// prevent duplicates.
  void handlePushAssignment(Map<String, dynamic> data) {
    final eventId = data['eventId'] as String?;
    if (eventId == null || eventId.isEmpty) return;

    // Prevent duplicate alarms
    if (_alarmTriggeredEventIds.contains(eventId)) return;

    final event = AssignmentEvent(
      eventId: eventId,
      orderId: data['orderId'] as String? ?? '',
      orderNumber: data['orderNumber'] as String? ?? '',
      assignedAt: DateTime.tryParse(data['assignedAt'] as String? ?? '') ??
          DateTime.now(),
      customerName: data['customerName'] as String?,
      address: data['address'] as String?,
      total: double.tryParse(data['total']?.toString() ?? ''),
    );

    _alarmTriggeredEventIds.add(eventId);
    _pendingAssignments.add(event);
    onNewAssignment?.call(event);
  }

  /// Reset state (e.g., on logout).
  void reset() {
    _alarmTriggeredEventIds.clear();
    _pendingAssignments.clear();
    stopPeriodicReconciliation();
  }

  /// Dispose the repository.
  void dispose() {
    stopPeriodicReconciliation();
  }
}
