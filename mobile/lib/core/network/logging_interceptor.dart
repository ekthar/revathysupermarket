import 'dart:developer' as developer;

import 'package:dio/dio.dart';

/// Interceptor that logs HTTP requests and responses in dev mode.
///
/// Sensitive data (tokens, passwords) is never logged.
class LoggingInterceptor extends Interceptor {

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    developer.log(
      '[HTTP] --> ${options.method} ${options.uri}',
      name: 'ApiClient',
    );
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    developer.log(
      '[HTTP] <-- ${response.statusCode} ${response.requestOptions.method} '
      '${response.requestOptions.uri}',
      name: 'ApiClient',
    );
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    developer.log(
      '[HTTP] <-- ERROR ${err.response?.statusCode ?? 'UNKNOWN'} '
      '${err.requestOptions.method} ${err.requestOptions.uri}',
      name: 'ApiClient',
      level: 900,
    );
    handler.next(err);
  }
}
