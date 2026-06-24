import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/widgets.dart';

const _kTokenKey = 'auth_token';

class ApiClient {
  ApiClient({
    required FlutterSecureStorage secureStorage,
    required GlobalKey<NavigatorState> navigatorKey,
  })  : _secureStorage = secureStorage,
        _navigatorKey = navigatorKey {
    _dio = Dio(
      BaseOptions(
        baseUrl: const String.fromEnvironment('SITE_URL'),
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _secureStorage.read(key: _kTokenKey);
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          if (kDebugMode) {
            debugPrint('[API] ${options.method} ${options.uri}');
          }
          handler.next(options);
        },
        onResponse: (response, handler) {
          if (kDebugMode) {
            debugPrint(
                '[API] ${response.statusCode} ${response.requestOptions.uri}');
          }
          handler.next(response);
        },
        onError: (error, handler) async {
          if (kDebugMode) {
            debugPrint(
                '[API] ERROR ${error.response?.statusCode} ${error.requestOptions.uri}');
          }
          if (error.response?.statusCode == 401) {
            await _secureStorage.delete(key: _kTokenKey);
            // Schedule navigation for after the current frame to avoid
            // using context across async gaps.
            WidgetsBinding.instance.addPostFrameCallback((_) {
              final context = _navigatorKey.currentContext;
              if (context != null && context.mounted) {
                GoRouter.of(context).go('/login');
              }
            });
          }
          handler.next(error);
        },
      ),
    );
  }

  final FlutterSecureStorage _secureStorage;
  // ignore: unused_field
  final GlobalKey<NavigatorState> _navigatorKey;
  late final Dio _dio;

  Dio get dio => _dio;

  Future<void> setToken(String token) async {
    await _secureStorage.write(key: _kTokenKey, value: token);
  }

  Future<void> clearToken() async {
    await _secureStorage.delete(key: _kTokenKey);
  }

  Future<String?> getToken() async {
    return _secureStorage.read(key: _kTokenKey);
  }
}
