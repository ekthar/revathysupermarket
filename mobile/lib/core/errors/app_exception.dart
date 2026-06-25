/// Sealed class hierarchy for typed application exceptions.
///
/// Provides a structured way to handle errors across the app,
/// enabling pattern matching and consistent error presentation.
sealed class AppException implements Exception {
  const AppException({required this.message, this.stackTrace});

  final String message;
  final StackTrace? stackTrace;

  @override
  String toString() => '$runtimeType: $message';
}

/// Exception for network connectivity issues.
class NetworkException extends AppException {
  const NetworkException({
    super.message = 'No internet connection. Please check your network.',
    super.stackTrace,
  });
}

/// Exception for authentication/authorization failures.
class AuthException extends AppException {
  const AuthException({
    super.message = 'Authentication failed. Please log in again.',
    super.stackTrace,
    this.statusCode,
  });

  final int? statusCode;
}

/// Exception for server-side errors.
class ServerException extends AppException {
  const ServerException({
    super.message = 'Something went wrong. Please try again later.',
    super.stackTrace,
    this.statusCode,
  });

  final int? statusCode;
}

/// Exception for validation errors returned by the API.
class ValidationException extends AppException {
  const ValidationException({
    super.message = 'Please check your input and try again.',
    super.stackTrace,
    this.fieldErrors = const {},
  });

  final Map<String, String> fieldErrors;
}

/// Exception for request timeout.
class TimeoutException extends AppException {
  const TimeoutException({
    super.message = 'Request timed out. Please try again.',
    super.stackTrace,
  });
}
