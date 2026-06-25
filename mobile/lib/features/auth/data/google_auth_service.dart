import 'dart:math';

/// Service that handles Google Sign-In flow.
///
/// Since the google_sign_in Flutter package requires native platform setup
/// (google-services.json for Android, GoogleService-Info.plist for iOS),
/// this service provides a simulated ID token for development purposes.
///
/// In production, replace [getGoogleIdToken] with the actual
/// google_sign_in package implementation that retrieves a real ID token
/// from Google's OAuth servers.
class GoogleAuthService {
  GoogleAuthService();

  /// Whether a Google sign-in flow is currently active.
  bool _isSigningIn = false;
  bool get isSigningIn => _isSigningIn;

  /// Initiates Google Sign-In and returns the ID token.
  ///
  /// Returns `null` if the user cancels the sign-in flow or
  /// if an error occurs during authentication.
  ///
  /// In development mode, this returns a simulated token.
  /// In production, this should use the google_sign_in package
  /// to get a real Google ID token.
  Future<String?> getGoogleIdToken() async {
    if (_isSigningIn) return null;

    _isSigningIn = true;
    try {
      // Simulate the Google Sign-In delay
      await Future.delayed(const Duration(seconds: 1));

      // In production, replace this with:
      // final googleUser = await GoogleSignIn(scopes: ['email']).signIn();
      // if (googleUser == null) return null;
      // final googleAuth = await googleUser.authentication;
      // return googleAuth.idToken;

      // Generate a simulated ID token for development
      final token = _generateSimulatedToken();
      return token;
    } catch (_) {
      return null;
    } finally {
      _isSigningIn = false;
    }
  }

  /// Signs out from Google.
  Future<void> signOut() async {
    // In production:
    // await GoogleSignIn().signOut();
    await Future.delayed(const Duration(milliseconds: 200));
  }

  /// Generates a simulated JWT-like token for development.
  String _generateSimulatedToken() {
    final random = Random.secure();
    final bytes = List<int>.generate(32, (_) => random.nextInt(256));
    final tokenPart = bytes
        .map((b) => b.toRadixString(16).padLeft(2, '0'))
        .join();
    return 'simulated_google_id_token_$tokenPart';
  }
}
