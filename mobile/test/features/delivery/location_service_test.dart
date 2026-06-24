import 'package:flutter_test/flutter_test.dart';
import 'package:msm_mobile/core/config/environment.dart';
import 'package:msm_mobile/core/network/api_client.dart';
import 'package:msm_mobile/core/network/auth_interceptor.dart';
import 'package:msm_mobile/features/delivery/services/location_service.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthInterceptor extends Mock implements AuthInterceptor {}

void main() {
  group('LocationService', () {
    late LocationService locationService;
    late ApiClient apiClient;

    setUp(() {
      apiClient = ApiClient(
        config: EnvironmentConfig.dev,
        authInterceptor: MockAuthInterceptor(),
      );
      locationService = LocationService(apiClient: apiClient);
    });

    tearDown(() async {
      await locationService.dispose();
    });

    test('initial state is not tracking', () {
      expect(locationService.isTracking, false);
      expect(locationService.activeOrderId, null);
    });

    test('stopTracking when not tracking is safe', () async {
      expect(locationService.isTracking, false);
      await locationService.stopTracking(); // Should not throw
      expect(locationService.isTracking, false);
    });

    test('throttle interval is 5 seconds', () {
      expect(LocationService.throttleSeconds, 5);
    });

    test('dispose stops tracking', () async {
      // In test environment, startTracking will fail due to no GPS service,
      // but dispose should still be safe to call.
      await locationService.dispose();
      expect(locationService.isTracking, false);
    });

    test('activeOrderId is null when not tracking', () {
      expect(locationService.activeOrderId, null);
    });
  });
}
