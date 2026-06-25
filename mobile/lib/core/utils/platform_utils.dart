import 'package:flutter/foundation.dart' show kIsWeb;

/// Utility class for platform detection.
///
/// Provides safe platform checks that work across all platforms
/// including web (where dart:io is not available).
class PlatformUtils {
  PlatformUtils._();

  /// Whether the app is running on the web platform.
  static bool get isWeb => kIsWeb;

  /// Whether the app is running on a mobile platform (Android or iOS).
  /// Returns false on web.
  static bool get isMobile => !kIsWeb;
}
