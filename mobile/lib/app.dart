import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/config/environment.dart';
import 'core/providers/router_provider.dart';
import 'core/theme/app_theme.dart';
import 'core/widgets/offline_banner.dart';

/// The root application widget.
///
/// Sets up MaterialApp.router with theming, routing, and offline detection.
/// The router is managed by a Riverpod provider to ensure it remains stable
/// across widget rebuilds and only updates when auth state changes.
class MsmApp extends ConsumerWidget {
  const MsmApp({super.key, required this.config});

  final EnvironmentConfig config;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

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
