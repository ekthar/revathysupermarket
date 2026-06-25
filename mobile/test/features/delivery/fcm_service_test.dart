import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:msm_mobile/core/config/environment.dart';
import 'package:msm_mobile/core/network/api_client.dart';
import 'package:msm_mobile/core/network/auth_interceptor.dart';
import 'package:msm_mobile/core/firebase/fcm_service.dart';

class MockAuthInterceptor extends Mock implements AuthInterceptor {}

void main() {
  group('FcmService', () {
    late ApiClient apiClient;
    late FcmService fcmService;
    final receivedAssignments = <Map<String, dynamic>>[];
    final tappedLinks = <String>[];

    setUp(() {
      apiClient = ApiClient(
        config: EnvironmentConfig.dev,
        authInterceptor: MockAuthInterceptor(),
      );
      receivedAssignments.clear();
      tappedLinks.clear();
      fcmService = FcmService(
        apiClient: apiClient,
        config: EnvironmentConfig.dev,
        installationId: 'test-installation-id',
        onAssignmentReceived: (data) => receivedAssignments.add(data),
        onNotificationTapped: (link) => tappedLinks.add(link),
      );
    });

    tearDown(() {
      fcmService.dispose();
    });

    test('initial state is not initialized', () {
      expect(fcmService.isInitialized, false);
      expect(fcmService.currentToken, null);
    });

    test('initialize returns false when Firebase is not configured', () async {
      // In test environment, Firebase is not configured so initialization
      // should fail gracefully and return false.
      final result = await fcmService.initialize();
      expect(result, false);
      expect(fcmService.isInitialized, false);
    });

    test('callbacks are properly configured', () {
      // Verify callback assignment
      expect(fcmService.onAssignmentReceived, isNotNull);
      expect(fcmService.onNotificationTapped, isNotNull);
    });

    test('dispose is safe to call multiple times', () {
      fcmService.dispose();
      fcmService.dispose(); // Should not throw
    });
  });
}
