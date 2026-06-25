import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:msm_mobile/core/config/environment.dart';
import 'package:msm_mobile/features/auth/data/auth_repository.dart';
import 'package:msm_mobile/features/auth/data/token_storage.dart';

class MockDio extends Mock implements Dio {}

class MockTokenStorage extends Mock implements TokenStorage {}

void main() {
  late MockDio mockDio;
  late MockTokenStorage mockTokenStorage;
  late AuthRepository authRepository;
  const config = EnvironmentConfig.dev;

  setUp(() {
    mockDio = MockDio();
    mockTokenStorage = MockTokenStorage();
    authRepository = AuthRepository(
      tokenStorage: mockTokenStorage,
      config: config,
      dio: mockDio,
    );
  });

  group('AuthRepository', () {
    group('loginWithPhone', () {
      test('returns LoginResult on successful login', () async {
        when(() => mockTokenStorage.getDeviceId())
            .thenAnswer((_) async => 'device-123');
        when(() => mockTokenStorage.saveAccessToken(any()))
            .thenAnswer((_) async {});
        when(() => mockTokenStorage.saveRefreshToken(any()))
            .thenAnswer((_) async {});

        when(() => mockDio.post<Map<String, dynamic>>(
              any(),
              data: any(named: 'data'),
            )).thenAnswer((_) async => Response(
              requestOptions: RequestOptions(path: '/auth/login'),
              statusCode: 200,
              data: {
                'accessToken': 'test-access-token',
                'refreshToken': 'test-refresh-token',
                'user': {
                  'id': 'user-1',
                  'name': 'Test User',
                  'role': 'CUSTOMER',
                  'phone': '+919876543210',
                },
              },
            ));

        final result = await authRepository.loginWithPhone(
          phone: '+919876543210',
          otp: '123456',
        );

        expect(result.user.id, 'user-1');
        expect(result.user.name, 'Test User');
        expect(result.accessToken, 'test-access-token');
        expect(result.refreshToken, 'test-refresh-token');

        verify(() => mockTokenStorage.saveAccessToken('test-access-token'))
            .called(1);
        verify(() => mockTokenStorage.saveRefreshToken('test-refresh-token'))
            .called(1);
      });

      test('throws on invalid credentials', () async {
        when(() => mockTokenStorage.getDeviceId())
            .thenAnswer((_) async => 'device-123');

        when(() => mockDio.post<Map<String, dynamic>>(
              any(),
              data: any(named: 'data'),
            )).thenThrow(DioException(
          requestOptions: RequestOptions(path: '/auth/login'),
          response: Response(
            requestOptions: RequestOptions(path: '/auth/login'),
            statusCode: 401,
            data: {'error': 'Invalid OTP'},
          ),
          type: DioExceptionType.badResponse,
        ));

        expect(
          () => authRepository.loginWithPhone(
            phone: '+919876543210',
            otp: '000000',
          ),
          throwsA(anything),
        );
      });
    });

    group('refreshToken', () {
      test('returns true on successful refresh', () async {
        when(() => mockTokenStorage.getRefreshToken())
            .thenAnswer((_) async => 'old-refresh-token');
        when(() => mockTokenStorage.getDeviceId())
            .thenAnswer((_) async => 'device-123');
        when(() => mockTokenStorage.saveAccessToken(any()))
            .thenAnswer((_) async {});
        when(() => mockTokenStorage.saveRefreshToken(any()))
            .thenAnswer((_) async {});

        when(() => mockDio.post<Map<String, dynamic>>(
              any(),
              data: any(named: 'data'),
            )).thenAnswer((_) async => Response(
              requestOptions: RequestOptions(path: '/auth/refresh'),
              statusCode: 200,
              data: {
                'accessToken': 'new-access-token',
                'refreshToken': 'new-refresh-token',
              },
            ));

        final result = await authRepository.refreshToken();

        expect(result, true);
        verify(() => mockTokenStorage.saveAccessToken('new-access-token'))
            .called(1);
        verify(() => mockTokenStorage.saveRefreshToken('new-refresh-token'))
            .called(1);
      });

      test('returns false when no refresh token stored', () async {
        when(() => mockTokenStorage.getRefreshToken())
            .thenAnswer((_) async => null);
        when(() => mockTokenStorage.getDeviceId())
            .thenAnswer((_) async => 'device-123');

        final result = await authRepository.refreshToken();

        expect(result, false);
      });

      test('returns false on server error', () async {
        when(() => mockTokenStorage.getRefreshToken())
            .thenAnswer((_) async => 'old-refresh-token');
        when(() => mockTokenStorage.getDeviceId())
            .thenAnswer((_) async => 'device-123');

        when(() => mockDio.post<Map<String, dynamic>>(
              any(),
              data: any(named: 'data'),
            )).thenThrow(DioException(
          requestOptions: RequestOptions(path: '/auth/refresh'),
          type: DioExceptionType.connectionTimeout,
        ));

        final result = await authRepository.refreshToken();

        expect(result, false);
      });
    });

    group('logout', () {
      test('clears tokens and calls server', () async {
        when(() => mockTokenStorage.getAccessToken())
            .thenAnswer((_) async => 'access-token');
        when(() => mockTokenStorage.getRefreshToken())
            .thenAnswer((_) async => 'refresh-token');
        when(() => mockTokenStorage.getDeviceId())
            .thenAnswer((_) async => 'device-123');
        when(() => mockTokenStorage.clearAll()).thenAnswer((_) async {});

        when(() => mockDio.post<void>(
              any(),
              data: any(named: 'data'),
              options: any(named: 'options'),
            )).thenAnswer((_) async => Response(
              requestOptions: RequestOptions(path: '/auth/logout'),
              statusCode: 200,
            ));

        await authRepository.logout();

        verify(() => mockTokenStorage.clearAll()).called(1);
      });

      test('clears tokens even on server error', () async {
        when(() => mockTokenStorage.getAccessToken())
            .thenAnswer((_) async => 'access-token');
        when(() => mockTokenStorage.getRefreshToken())
            .thenAnswer((_) async => 'refresh-token');
        when(() => mockTokenStorage.getDeviceId())
            .thenAnswer((_) async => 'device-123');
        when(() => mockTokenStorage.clearAll()).thenAnswer((_) async {});

        when(() => mockDio.post<void>(
              any(),
              data: any(named: 'data'),
              options: any(named: 'options'),
            )).thenThrow(DioException(
          requestOptions: RequestOptions(path: '/auth/logout'),
          type: DioExceptionType.connectionTimeout,
        ));

        await authRepository.logout();

        verify(() => mockTokenStorage.clearAll()).called(1);
      });
    });

    group('isAuthenticated', () {
      test('delegates to token storage', () async {
        when(() => mockTokenStorage.hasToken())
            .thenAnswer((_) async => true);

        final result = await authRepository.isAuthenticated;

        expect(result, true);
      });
    });
  });
}
