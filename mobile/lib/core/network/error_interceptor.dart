import 'package:dio/dio.dart';

import '../errors/error_handler.dart';

/// Interceptor that converts Dio errors into typed [AppException] instances.
class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final appException = ErrorHandler.fromDioException(err);
    handler.next(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: err.type,
        error: appException,
        message: appException.message,
      ),
    );
  }
}
