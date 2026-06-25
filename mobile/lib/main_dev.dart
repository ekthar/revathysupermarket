import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/config/environment.dart';

/// Entry point for the development environment.
///
/// Uses dev API URL (localhost) and enables debug features.
void main() {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(
    const ProviderScope(
      child: MsmApp(config: EnvironmentConfig.dev),
    ),
  );
}
