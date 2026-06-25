import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure token storage using flutter_secure_storage.
///
/// Stores access token, refresh token, and device ID securely
/// in the platform's keychain/keystore.
class TokenStorage {
  TokenStorage({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _accessTokenKey = 'msm_access_token';
  static const _refreshTokenKey = 'msm_refresh_token';
  static const _deviceIdKey = 'msm_device_id';

  /// Saves the access token.
  Future<void> saveAccessToken(String token) async {
    await _storage.write(key: _accessTokenKey, value: token);
  }

  /// Retrieves the stored access token.
  Future<String?> getAccessToken() async {
    return _storage.read(key: _accessTokenKey);
  }

  /// Saves the refresh token.
  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _refreshTokenKey, value: token);
  }

  /// Retrieves the stored refresh token.
  Future<String?> getRefreshToken() async {
    return _storage.read(key: _refreshTokenKey);
  }

  /// Saves the device ID (installation ID).
  Future<void> saveDeviceId(String deviceId) async {
    await _storage.write(key: _deviceIdKey, value: deviceId);
  }

  /// Retrieves the stored device ID.
  Future<String?> getDeviceId() async {
    return _storage.read(key: _deviceIdKey);
  }

  /// Clears all stored credentials (used on logout).
  Future<void> clearAll() async {
    await Future.wait([
      _storage.delete(key: _accessTokenKey),
      _storage.delete(key: _refreshTokenKey),
    ]);
  }

  /// Checks if an access token exists.
  Future<bool> hasToken() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }
}
