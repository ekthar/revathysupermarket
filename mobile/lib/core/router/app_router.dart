import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/domain/auth_state.dart';
import '../../features/auth/domain/user_model.dart';

/// Route path constants for the application.
abstract class AppRoutes {
  static const splash = '/';
  static const login = '/login';
  static const otp = '/otp';

  // Customer routes
  static const customerHome = '/customer/home';
  static const cart = '/customer/cart';
  static const checkout = '/customer/checkout';
  static const orders = '/customer/orders';
  static const orderDetail = '/customer/orders/:id';
  static const orderTracking = '/customer/orders/:id/tracking';
  static const account = '/customer/account';
  static const wallet = '/customer/wallet';
  static const loyalty = '/customer/loyalty';
  static const favorites = '/customer/favorites';
  static const addresses = '/customer/addresses';
  static const notifications = '/customer/notifications';
  static const settings = '/customer/settings';
  static const support = '/customer/support';

  // Delivery partner routes
  static const deliveryLogin = '/delivery/login';
  static const deliveryDashboard = '/delivery/dashboard';
  static const deliveryOrderDetail = '/delivery/orders/:id';
}

/// Creates the application router with role-based guards.
GoRouter createAppRouter({
  required AuthState authState,
}) {
  return GoRouter(
    initialLocation: AppRoutes.splash,
    debugLogDiagnostics: true,
    redirect: (context, state) => _globalRedirect(authState, state),
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const _PlaceholderPage(title: 'Splash'),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const _PlaceholderPage(title: 'Login'),
      ),
      GoRoute(
        path: AppRoutes.otp,
        builder: (context, state) => const _PlaceholderPage(title: 'OTP'),
      ),

      // Customer routes
      GoRoute(
        path: AppRoutes.customerHome,
        builder: (context, state) =>
            const _PlaceholderPage(title: 'Customer Home'),
      ),
      GoRoute(
        path: AppRoutes.cart,
        builder: (context, state) => const _PlaceholderPage(title: 'Cart'),
      ),
      GoRoute(
        path: AppRoutes.checkout,
        builder: (context, state) =>
            const _PlaceholderPage(title: 'Checkout'),
      ),
      GoRoute(
        path: AppRoutes.orders,
        builder: (context, state) => const _PlaceholderPage(title: 'Orders'),
      ),
      GoRoute(
        path: AppRoutes.orderDetail,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return _PlaceholderPage(title: 'Order $id');
        },
      ),
      GoRoute(
        path: AppRoutes.orderTracking,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return _PlaceholderPage(title: 'Tracking $id');
        },
      ),
      GoRoute(
        path: AppRoutes.account,
        builder: (context, state) => const _PlaceholderPage(title: 'Account'),
      ),
      GoRoute(
        path: AppRoutes.wallet,
        builder: (context, state) => const _PlaceholderPage(title: 'Wallet'),
      ),
      GoRoute(
        path: AppRoutes.loyalty,
        builder: (context, state) => const _PlaceholderPage(title: 'Loyalty'),
      ),
      GoRoute(
        path: AppRoutes.favorites,
        builder: (context, state) =>
            const _PlaceholderPage(title: 'Favorites'),
      ),
      GoRoute(
        path: AppRoutes.addresses,
        builder: (context, state) =>
            const _PlaceholderPage(title: 'Addresses'),
      ),
      GoRoute(
        path: AppRoutes.notifications,
        builder: (context, state) =>
            const _PlaceholderPage(title: 'Notifications'),
      ),
      GoRoute(
        path: AppRoutes.settings,
        builder: (context, state) =>
            const _PlaceholderPage(title: 'Settings'),
      ),
      GoRoute(
        path: AppRoutes.support,
        builder: (context, state) => const _PlaceholderPage(title: 'Support'),
      ),

      // Delivery partner routes
      GoRoute(
        path: AppRoutes.deliveryLogin,
        builder: (context, state) =>
            const _PlaceholderPage(title: 'Delivery Login'),
      ),
      GoRoute(
        path: AppRoutes.deliveryDashboard,
        builder: (context, state) =>
            const _PlaceholderPage(title: 'Delivery Dashboard'),
      ),
      GoRoute(
        path: AppRoutes.deliveryOrderDetail,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return _PlaceholderPage(title: 'Delivery Order $id');
        },
      ),
    ],
  );
}

/// Global redirect logic implementing role-based access control.
String? _globalRedirect(AuthState authState, GoRouterState state) {
  final location = state.matchedLocation;
  final isAuthRoute =
      location == AppRoutes.login || location == AppRoutes.otp ||
      location == AppRoutes.deliveryLogin;
  final isSplash = location == AppRoutes.splash;

  return authState.when(
    loading: () {
      // While determining auth state, stay on splash
      if (isSplash) return null;
      return AppRoutes.splash;
    },
    unauthenticated: () {
      // Unauthenticated users can only access auth routes or splash
      if (isAuthRoute || isSplash) return null;
      return AppRoutes.login;
    },
    authenticated: (user) {
      // Authenticated users should not stay on auth/splash routes
      if (isAuthRoute || isSplash) {
        return _homeRouteForRole(user.role);
      }

      // Role-based route access control
      if (_isDeliveryRoute(location) && user.role != UserRole.deliveryPartner) {
        return _homeRouteForRole(user.role);
      }
      if (_isCustomerRoute(location) && user.role == UserRole.deliveryPartner) {
        return _homeRouteForRole(user.role);
      }

      return null;
    },
  );
}

/// Returns the home route for a given user role.
String _homeRouteForRole(UserRole role) {
  switch (role) {
    case UserRole.deliveryPartner:
      return AppRoutes.deliveryDashboard;
    case UserRole.customer:
    case UserRole.admin:
    case UserRole.staff:
      return AppRoutes.customerHome;
  }
}

bool _isDeliveryRoute(String location) {
  return location.startsWith('/delivery');
}

bool _isCustomerRoute(String location) {
  return location.startsWith('/customer');
}

/// Placeholder page used during development while real pages are being built.
class _PlaceholderPage extends StatelessWidget {
  const _PlaceholderPage({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Text(
          title,
          style: Theme.of(context).textTheme.headlineMedium,
        ),
      ),
    );
  }
}
