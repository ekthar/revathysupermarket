import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/domain/auth_state.dart';
import '../../features/auth/domain/user_model.dart';

/// Provider that exposes the current authentication state.
///
/// On app start, the state is [AuthState.loading()] while we check
/// for stored credentials. Once determined, it transitions to either
/// [AuthState.authenticated()] or [AuthState.unauthenticated()].
///
/// The [AuthNotifier] handles lifecycle transitions (login, logout,
/// token refresh) and notifies listeners to trigger router redirects.
final authStateProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});

/// Notifier that manages authentication state transitions.
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState.loading()) {
    _initialize();
  }

  /// Check for stored credentials on startup.
  ///
  /// In a real implementation this would use [TokenStorage] to check
  /// for a valid access/refresh token and validate it with the server.
  /// For now, we simulate a brief initialization delay then transition
  /// to unauthenticated.
  Future<void> _initialize() async {
    // Simulate a brief initialization delay (checking secure storage)
    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;
    state = const AuthState.unauthenticated();
  }

  /// Marks the user as authenticated after successful login.
  void setAuthenticated(User user) {
    state = AuthState.authenticated(user: user);
  }

  /// Marks the user as unauthenticated (e.g., after logout or token expiry).
  void setUnauthenticated() {
    state = const AuthState.unauthenticated();
  }
}
