import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/config/environment.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/offline_banner.dart';
import 'features/auth/domain/auth_state.dart';

/// The root application widget.
///
/// Sets up MaterialApp.router with theming, routing, and offline detection.
class MsmApp extends ConsumerWidget {
  const MsmApp({super.key, required this.config});

  final EnvironmentConfig config;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // TODO: Replace with actual auth state from Riverpod provider
    const authState = AuthState.unauthenticated();

    final router = createAppRouter(authState: authState);

    return MaterialApp.router(
      title: config.appName,
      debugShowCheckedModeBanner: config.isDev,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      routerConfig: router,
      builder: (context, child) {
        return OfflineBanner(
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
