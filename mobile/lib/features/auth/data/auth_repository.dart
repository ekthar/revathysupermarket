import 'package:dio/dio.dart';

import '../../../core/config/environment.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/errors/error_handler.dart';
import '../domain/user_model.dart';
import 'token_storage.dart';

/// Result of a successful login operation.
class LoginResult {
  const LoginResult({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
  });

  final User user;
  final String accessToken;
  final String refreshToken;
}

/// Repository handling authentication operations.
///
/// Manages login (phone+OTP or email+password), token refresh,
/// logout, and authentication state checks.
class AuthRepository {
  AuthRepository({
    required TokenStorage tokenStorage,
    required EnvironmentConfig config,
    Dio? dio,
  })  : _tokenStorage = tokenStorage,
        _config = config,
        _dio = dio ?? Dio();

  final TokenStorage _tokenStorage;
  final EnvironmentConfig _config;
  final Dio _dio;

  /// Logs in with phone number and OTP.
  Future<LoginResult> loginWithPhone({
    required String phone,
    required String otp,
  }) async {
    return _login({'phone': phone, 'otp': otp});
  }

  /// Logs in with email and password.
  Future<LoginResult> loginWithEmail({
    required String email,
    required String password,
  }) async {
    return _login({'email': email, 'password': password});
  }

  /// Refreshes the access token using the stored refresh token.
  ///
  /// Returns true if refresh was successful, false otherwise.
  Future<bool> refreshToken() async {
    try {
      final refreshToken = await _tokenStorage.getRefreshToken();
      final deviceId = await _tokenStorage.getDeviceId();

      if (refreshToken == null || deviceId == null) return false;

      final response = await _dio.post<Map<String, dynamic>>(
        '${_config.baseUrl}/auth/refresh',
        data: {
          'refreshToken': refreshToken,
          'deviceId': deviceId,
        },
      );

      final data = response.data;
      if (data == null) return false;

      final newAccessToken = data['accessToken'] as String;
      final newRefreshToken = data['refreshToken'] as String;

      await Future.wait([
        _tokenStorage.saveAccessToken(newAccessToken),
        _tokenStorage.saveRefreshToken(newRefreshToken),
      ]);

      return true;
    } catch (_) {
      return false;
    }
  }

  /// Logs out the current user, revoking tokens on the server.
  Future<void> logout() async {
    try {
      final accessToken = await _tokenStorage.getAccessToken();
      final refreshToken = await _tokenStorage.getRefreshToken();

      if (accessToken != null && refreshToken != null) {
        await _dio.post<void>(
          '${_config.baseUrl}/auth/logout',
          data: {'refreshToken': refreshToken},
          options: Options(
            headers: {'Authorization': 'Bearer $accessToken'},
          ),
        );
      }
    } catch (_) {
      // Best-effort logout; clear local tokens regardless
    } finally {
      await _tokenStorage.clearAll();
    }
  }

  /// Checks if the user has stored credentials.
  Future<bool> get isAuthenticated => _tokenStorage.hasToken();

  Future<LoginResult> _login(Map<String, dynamic> credentials) async {
    try {
      final deviceId = await _tokenStorage.getDeviceId();

      final response = await _dio.post<Map<String, dynamic>>(
        '${_config.baseUrl}/auth/login',
        data: {
          ...credentials,
          if (deviceId != null) 'deviceId': deviceId,
        },
      );

      final data = response.data;
      if (data == null) {
        throw const ServerException(message: 'Empty response from server.');
      }

      final accessToken = data['accessToken'] as String;
      final refreshToken = data['refreshToken'] as String;
      final userData = data['user'] as Map<String, dynamic>;

      await Future.wait([
        _tokenStorage.saveAccessToken(accessToken),
        _tokenStorage.saveRefreshToken(refreshToken),
      ]);

      return LoginResult(
        user: User.fromJson(userData),
        accessToken: accessToken,
        refreshToken: refreshToken,
      );
    } on DioException catch (e) {
      throw ErrorHandler.fromDioException(e);
    }
  }
}
