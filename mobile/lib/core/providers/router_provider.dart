import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../router/app_router.dart';
import 'auth_provider.dart';

/// Provider that creates and manages the [GoRouter] lifecycle.
///
/// The router is stable across widget rebuilds. It uses
/// [GoRouter.refreshListenable] to react to auth state changes
/// without being recreated. This prevents the infinite splash
/// screen loop caused by router recreation on every build.
final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  final router = createAppRouter(authState: authState);

  // Dispose the router when the provider is disposed
  ref.onDispose(() {
    router.dispose();
  });

  return router;
});
