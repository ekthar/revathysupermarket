import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:msm_mobile/core/config/environment.dart';
import 'package:msm_mobile/core/network/api_client.dart';
import 'package:msm_mobile/core/network/auth_interceptor.dart';
import 'package:msm_mobile/features/delivery/data/assignment_repository.dart';
import 'package:msm_mobile/features/delivery/domain/assignment_event.dart';

class MockAuthInterceptor extends Mock implements AuthInterceptor {}

void main() {
  late ApiClient apiClient;
  late AssignmentRepository repository;
  final assignmentEvents = <AssignmentEvent>[];

  setUp(() {
    apiClient = ApiClient(
      config: EnvironmentConfig.dev,
      authInterceptor: MockAuthInterceptor(),
    );
    repository = AssignmentRepository(apiClient: apiClient);
    assignmentEvents.clear();
    repository.onNewAssignment = (event) => assignmentEvents.add(event);
  });

  tearDown(() {
    repository.dispose();
  });

  group('AssignmentRepository', () {
    group('reconciliation logic', () {
      test('triggers alarm for new assignments', () {
        // Simulate receiving assignments via push
        repository.handlePushAssignment({
          'eventId': 'event-1',
          'orderId': 'order-1',
          'orderNumber': 'ORD-001',
          'assignedAt': '2025-01-01T00:00:00Z',
        });

        expect(assignmentEvents.length, 1);
        expect(assignmentEvents[0].eventId, 'event-1');
        expect(assignmentEvents[0].orderId, 'order-1');
        expect(assignmentEvents[0].orderNumber, 'ORD-001');
      });

      test('does not trigger duplicate alarms for same eventId', () {
        repository.handlePushAssignment({
          'eventId': 'event-2',
          'orderId': 'order-2',
          'orderNumber': 'ORD-002',
          'assignedAt': '2025-01-01T00:00:00Z',
        });

        // Same event again (e.g., from poll after push)
        repository.handlePushAssignment({
          'eventId': 'event-2',
          'orderId': 'order-2',
          'orderNumber': 'ORD-002',
          'assignedAt': '2025-01-01T00:00:00Z',
        });

        expect(assignmentEvents.length, 1);
        expect(repository.alarmTriggeredEventIds, contains('event-2'));
      });

      test('triggers alarms for different eventIds', () {
        repository.handlePushAssignment({
          'eventId': 'event-3',
          'orderId': 'order-3',
          'orderNumber': 'ORD-003',
          'assignedAt': '2025-01-01T00:00:00Z',
        });

        repository.handlePushAssignment({
          'eventId': 'event-4',
          'orderId': 'order-4',
          'orderNumber': 'ORD-004',
          'assignedAt': '2025-01-01T00:00:00Z',
        });

        expect(assignmentEvents.length, 2);
      });

      test('ignores events with empty eventId', () {
        repository.handlePushAssignment({
          'eventId': '',
          'orderId': 'order-5',
          'orderNumber': 'ORD-005',
        });

        repository.handlePushAssignment({
          'orderId': 'order-6',
          'orderNumber': 'ORD-006',
        });

        expect(assignmentEvents.length, 0);
      });
    });

    group('pending assignments', () {
      test('tracks pending assignments after push', () {
        repository.handlePushAssignment({
          'eventId': 'event-10',
          'orderId': 'order-10',
          'orderNumber': 'ORD-010',
          'assignedAt': '2025-01-01T00:00:00Z',
          'customerName': 'Test Customer',
          'address': '123 Main St',
          'total': '500.00',
        });

        expect(repository.pendingAssignments.length, 1);
        expect(repository.pendingAssignments[0].customerName, 'Test Customer');
        expect(repository.pendingAssignments[0].total, 500.0);
      });
    });

    group('reset', () {
      test('clears all state on reset', () {
        repository.handlePushAssignment({
          'eventId': 'event-20',
          'orderId': 'order-20',
          'orderNumber': 'ORD-020',
          'assignedAt': '2025-01-01T00:00:00Z',
        });

        expect(repository.pendingAssignments.length, 1);
        expect(repository.alarmTriggeredEventIds, isNotEmpty);

        repository.reset();

        expect(repository.pendingAssignments.length, 0);
        expect(repository.alarmTriggeredEventIds, isEmpty);
      });

      test('allows new alarms for same event after reset', () {
        repository.handlePushAssignment({
          'eventId': 'event-21',
          'orderId': 'order-21',
          'orderNumber': 'ORD-021',
          'assignedAt': '2025-01-01T00:00:00Z',
        });

        expect(assignmentEvents.length, 1);

        repository.reset();

        // Same event after reset should trigger again
        repository.handlePushAssignment({
          'eventId': 'event-21',
          'orderId': 'order-21',
          'orderNumber': 'ORD-021',
          'assignedAt': '2025-01-01T00:00:00Z',
        });

        expect(assignmentEvents.length, 2);
      });
    });
  });
}
