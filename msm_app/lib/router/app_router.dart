import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';
import '../screens/account_screen.dart';
import '../screens/cart_screen.dart';
import '../screens/checkout_screen.dart';
import '../screens/home_screen.dart';
import '../screens/live_tracking_screen.dart';
import '../screens/login_screen.dart';
import '../screens/offers_screen.dart';
import '../screens/order_detail_screen.dart';
import '../screens/order_history_screen.dart';
import '../screens/product_detail_screen.dart';
import '../screens/product_list_screen.dart';
import '../widgets/bottom_nav_bar.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authNotifier = ref.watch(authProvider.notifier);
  final navigatorKey = ref.watch(navigatorKeyProvider);

  return GoRouter(
    navigatorKey: navigatorKey,
    initialLocation: '/',
    redirect: (BuildContext context, GoRouterState state) {
      final isAuthenticated = authNotifier.isAuthenticated;
      final location = state.matchedLocation;

      // Protected routes that require authentication
      final protectedPaths = ['/checkout', '/orders'];
      final isProtected = protectedPaths.any(
        (path) => location == path || location.startsWith('$path/'),
      );

      if (isProtected && !isAuthenticated) {
        return '/login?returnTo=${Uri.encodeComponent(state.uri.toString())}';
      }

      return null;
    },
    routes: [
      // Shell route with bottom navigation bar for main tabs
      ShellRoute(
        builder: (context, state, child) {
          return BottomNavBar(child: child);
        },
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/products',
            builder: (context, state) {
              final category = state.uri.queryParameters['category'];
              final search = state.uri.queryParameters['search'];
              return ProductListScreen(category: category, search: search);
            },
          ),
          GoRoute(
            path: '/cart',
            builder: (context, state) => const CartScreen(),
          ),
          GoRoute(
            path: '/orders',
            builder: (context, state) => const OrderHistoryScreen(),
          ),
          GoRoute(
            path: '/account',
            builder: (context, state) => const AccountScreen(),
          ),
        ],
      ),
      // Routes outside the shell (no bottom nav)
      GoRoute(
        path: '/products/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ProductDetailScreen(productId: id);
        },
      ),
      GoRoute(
        path: '/checkout',
        builder: (context, state) => const CheckoutScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) {
          final returnTo = state.uri.queryParameters['returnTo'];
          return LoginScreen(returnTo: returnTo);
        },
      ),
      GoRoute(
        path: '/orders/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return OrderDetailScreen(orderId: id);
        },
      ),
      GoRoute(
        path: '/track/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return LiveTrackingScreen(orderId: id);
        },
      ),
      GoRoute(
        path: '/offers',
        builder: (context, state) => const OffersScreen(),
      ),
    ],
  );
});
