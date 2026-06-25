import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/config/environment.dart';

/// Default entry point (development mode).
///
/// For production builds, use: flutter run -t lib/main_prod.dart
void main() {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(
    const ProviderScope(
      child: MsmApp(config: EnvironmentConfig.dev),
    ),
  );
}
