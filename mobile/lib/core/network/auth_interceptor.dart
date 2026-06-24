import 'package:dio/dio.dart';

import '../../features/auth/data/token_storage.dart';

/// Interceptor that attaches the Bearer token to outgoing requests
/// and handles 401 responses by refreshing the token and retrying.
class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required TokenStorage tokenStorage,
    required Future<bool> Function() onRefreshToken,
    required void Function() onForceLogout,
  })  : _tokenStorage = tokenStorage,
        _onRefreshToken = onRefreshToken,
        _onForceLogout = onForceLogout;

  final TokenStorage _tokenStorage;
  final Future<bool> Function() _onRefreshToken;
  final void Function() _onForceLogout;

  bool _isRefreshing = false;

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

    // Prevent concurrent refresh attempts
    if (_isRefreshing) {
      return handler.next(err);
    }

    _isRefreshing = true;
    try {
      final refreshed = await _onRefreshToken();
      if (refreshed) {
        // Retry the original request with new token
        final token = await _tokenStorage.getAccessToken();
        final options = err.requestOptions;
        options.headers['Authorization'] = 'Bearer $token';

        final dio = Dio();
        final response = await dio.fetch(options);
        return handler.resolve(response);
      } else {
        _onForceLogout();
        return handler.next(err);
      }
    } catch (_) {
      _onForceLogout();
      return handler.next(err);
    } finally {
      _isRefreshing = false;
    }
  }
}
