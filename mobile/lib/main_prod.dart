import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/config/environment.dart';

/// Entry point for the production environment.
///
/// Uses production API URL and disables debug features.
void main() {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(
    const ProviderScope(
      child: MsmApp(config: EnvironmentConfig.prod),
    ),
  );
}
