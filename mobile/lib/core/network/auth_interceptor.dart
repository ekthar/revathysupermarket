import 'dart:async';

import 'package:dio/dio.dart';

import '../../features/auth/data/token_storage.dart';

/// Interceptor that attaches the Bearer token to outgoing requests
/// and handles 401 responses by refreshing the token and retrying.
///
/// Uses a Completer-based queue so that concurrent 401 responses wait
/// for a single refresh to complete rather than being dropped.
class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required TokenStorage tokenStorage,
    required Future<bool> Function() onRefreshToken,
    required void Function() onForceLogout,
    required Dio dio,
  })  : _tokenStorage = tokenStorage,
        _onRefreshToken = onRefreshToken,
        _onForceLogout = onForceLogout,
        _dio = dio;

  final TokenStorage _tokenStorage;
  final Future<bool> Function() _onRefreshToken;
  final void Function() _onForceLogout;

  /// The configured Dio instance used for retrying failed requests.
  final Dio _dio;

  bool _isRefreshing = false;
  Completer<bool>? _refreshCompleter;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip auth for login and refresh endpoints
    final skipAuthPaths = ['/auth/login', '/auth/refresh'];
    if (skipAuthPaths.any((path) => options.path.contains(path))) {
      return handler.next(options);
    }

    final token = await _tokenStorage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    return handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode != 401) {
      return handler.next(err);
    }

    // Skip refresh for auth endpoints
    final skipRefreshPaths = ['/auth/login', '/auth/refresh'];
    if (skipRefreshPaths
        .any((path) => err.requestOptions.path.contains(path))) {
      return handler.next(err);
    }

    // If a refresh is already in progress, wait for it to complete
    if (_isRefreshing) {
      final success = await _refreshCompleter?.future ?? false;
      if (success) {
        return _retryRequest(err, handler);
      } else {
        return handler.next(err);
      }
    }

    _isRefreshing = true;
    _refreshCompleter = Completer<bool>();

    try {
      final refreshed = await _onRefreshToken();
      _refreshCompleter!.complete(refreshed);

      if (refreshed) {
        return _retryRequest(err, handler);
      } else {
        _onForceLogout();
        return handler.next(err);
      }
    } catch (_) {
      _refreshCompleter!.complete(false);
      _onForceLogout();
      return handler.next(err);
    } finally {
      _isRefreshing = false;
      _refreshCompleter = null;
    }
  }

  /// Retries the original request using the configured Dio instance
  /// with the refreshed access token.
  Future<void> _retryRequest(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final token = await _tokenStorage.getAccessToken();
    final options = err.requestOptions;
    options.headers['Authorization'] = 'Bearer $token';

    try {
      final response = await _dio.fetch(options);
      return handler.resolve(response);
    } on DioException catch (retryErr) {
      return handler.next(retryErr);
    }
  }
}
