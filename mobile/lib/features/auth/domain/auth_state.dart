import 'package:freezed_annotation/freezed_annotation.dart';

import 'user_model.dart';

part 'auth_state.freezed.dart';

/// Represents the authentication state of the application.
///
/// Uses Freezed union types for exhaustive pattern matching:
/// - [AuthStateAuthenticated]: User is logged in with valid credentials.
/// - [AuthStateUnauthenticated]: User is not logged in.
/// - [AuthStateLoading]: Auth state is being determined (e.g., on app start).
@freezed
sealed class AuthState with _$AuthState {
  const factory AuthState.authenticated({required User user}) =
      AuthStateAuthenticated;
  const factory AuthState.unauthenticated() = AuthStateUnauthenticated;
  const factory AuthState.loading() = AuthStateLoading;
}
