import 'api_client.dart';

class AuthRepository {
  AuthRepository({required this.apiClient});

  final ApiClient apiClient;

  /// Sends OTP to the given phone number.
  /// Returns the expiry duration in seconds on success.
  Future<int> sendOtp(String phone) async {
    final response = await apiClient.dio.post(
      '/api/auth/otp/send',
      data: {'phone': phone},
    );
    return response.data['expiresIn'] as int;
  }

  /// Verifies OTP and returns the auth token and user data.
  /// Calls the flutter-auth bridge endpoint.
  Future<Map<String, dynamic>> verifyOtp({
    required String phone,
    required String otp,
    String? name,
  }) async {
    final response = await apiClient.dio.post(
      '/api/flutter-auth',
      data: {
        'phone': phone,
        'otp': otp,
        if (name != null) 'name': name,
      },
    );
    return response.data as Map<String, dynamic>;
  }
}
