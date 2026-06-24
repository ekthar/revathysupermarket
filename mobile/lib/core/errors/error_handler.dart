import 'package:dio/dio.dart';

import 'app_exception.dart';

/// Converts raw exceptions into typed [AppException] instances
/// and provides user-facing error messages.
class ErrorHandler {
  const ErrorHandler._();

  /// Converts a [DioException] to a typed [AppException].
  static AppException fromDioException(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const TimeoutException();

      case DioExceptionType.connectionError:
        return const NetworkException();

      case DioExceptionType.badResponse:
        return _handleResponseError(error);

      case DioExceptionType.cancel:
        return const ServerException(message: 'Request was cancelled.');

      case DioExceptionType.badCertificate:
        return const ServerException(
          message: 'Certificate verification failed.',
        );

      case DioExceptionType.unknown:
        if (error.error.toString().contains('SocketException')) {
          return const NetworkException();
        }
        return ServerException(
          message: error.message ?? 'An unexpected error occurred.',
        );
    }
  }

  /// Converts any exception to a typed [AppException].
  static AppException fromException(Object error, [StackTrace? stackTrace]) {
    if (error is AppException) return error;
    if (error is DioException) return fromDioException(error);
    return ServerException(
      message: 'An unexpected error occurred.',
      stackTrace: stackTrace,
    );
  }

  /// Returns a user-friendly message for the given exception.
  static String getUserMessage(AppException exception) {
    return exception.message;
  }

  static AppException _handleResponseError(DioException error) {
    final statusCode = error.response?.statusCode;
    final data = error.response?.data;

    if (statusCode == null) {
      return ServerException(
        message: _extractMessage(data) ?? 'Something went wrong.',
      );
    }

    switch (statusCode) {
      case 401:
        return const AuthException(statusCode: 401);

      case 403:
        return const AuthException(
          message: 'You do not have permission to perform this action.',
          statusCode: 403,
        );

      case 422:
        final fieldErrors = <String, String>{};
        if (data is Map<String, dynamic> && data['errors'] is Map) {
          final errors = data['errors'] as Map<String, dynamic>;
          errors.forEach((key, value) {
            fieldErrors[key] = value.toString();
          });
        }
        return ValidationException(
          message: _extractMessage(data) ?? 'Validation failed.',
          fieldErrors: fieldErrors,
        );

      case 404:
        return const ServerException(
          message: 'The requested resource was not found.',
          statusCode: 404,
        );

      case 429:
        return const ServerException(
          message: 'Too many requests. Please wait and try again.',
          statusCode: 429,
        );

      case >= 500:
        return ServerException(
          message: _extractMessage(data) ?? 'Server error. Please try again.',
          statusCode: statusCode,
        );

      default:
        return ServerException(
          message: _extractMessage(data) ?? 'Something went wrong.',
          statusCode: statusCode,
        );
    }
  }

  static String? _extractMessage(dynamic data) {
    if (data is Map<String, dynamic>) {
      return data['message'] as String? ?? data['error'] as String?;
    }
    return null;
  }
}
