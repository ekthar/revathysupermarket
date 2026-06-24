import 'dart:convert';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../api/api_client.dart';
import '../api/auth_repository.dart';
import '../models/user.dart';

const _kTokenKey = 'auth_token';
const _kUserKey = 'auth_user';

final navigatorKeyProvider = Provider<GlobalKey<NavigatorState>>((ref) {
  return GlobalKey<NavigatorState>();
});

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  final navigatorKey = ref.watch(navigatorKeyProvider);
  return ApiClient(secureStorage: storage, navigatorKey: navigatorKey);
});

final authProvider = StateNotifierProvider<AuthNotifier, User?>((ref) {
  return AuthNotifier(ref);
});

class AuthNotifier extends StateNotifier<User?> {
  AuthNotifier(this._ref) : super(null);

  final Ref _ref;

  FlutterSecureStorage get _storage => _ref.read(secureStorageProvider);

  /// Checks if a token exists in secure storage and loads user data if present.
  Future<void> initialize() async {
    final token = await _storage.read(key: _kTokenKey);
    if (token != null) {
      final userJson = await _storage.read(key: _kUserKey);
      if (userJson != null) {
        try {
          final decoded = jsonDecode(userJson) as Map<String, dynamic>;
          state = User.fromJson(decoded);
        } catch (_) {
          await _storage.delete(key: _kUserKey);
          await _storage.delete(key: _kTokenKey);
        }
      }
    }
  }

  /// Returns true if the user is authenticated (has a valid token).
  bool get isAuthenticated => state != null;

  /// Sends OTP to the given phone number.
  Future<int> sendOtp(String phone) async {
    final apiClient = _ref.read(apiClientProvider);
    final authRepo = AuthRepository(apiClient: apiClient);
    return authRepo.sendOtp(phone);
  }

  /// Verifies OTP and logs in the user.
  Future<void> verifyOtp({
    required String phone,
    required String otp,
    String? name,
  }) async {
    final apiClient = _ref.read(apiClientProvider);
    final authRepo = AuthRepository(apiClient: apiClient);
    final result = await authRepo.verifyOtp(
      phone: phone,
      otp: otp,
      name: name,
    );

    final token = result['token'] as String;
    final userData = result['user'] as Map<String, dynamic>;

    await apiClient.setToken(token);
    await _storage.write(key: _kUserKey, value: jsonEncode(userData));

    state = User.fromJson(userData);
  }

  /// Logs out the user by clearing stored credentials.
  Future<void> logout() async {
    final apiClient = _ref.read(apiClientProvider);
    await apiClient.clearToken();
    await _storage.delete(key: _kUserKey);
    state = null;
  }
}
