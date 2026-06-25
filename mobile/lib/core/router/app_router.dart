import 'package:animations/animations.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/domain/auth_state.dart';
import '../../features/auth/domain/user_model.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/otp_screen.dart';
import '../../features/products/presentation/home_screen.dart';
import '../../features/products/presentation/category_screen.dart';
import '../../features/cart/presentation/cart_screen.dart';
import '../../features/checkout/presentation/checkout_screen.dart';
import '../../features/orders/presentation/orders_screen.dart';
import '../../features/account/presentation/account_screen.dart';
import '../../features/account/presentation/wallet_screen.dart';
import '../../features/account/presentation/loyalty_screen.dart';
import '../../features/account/presentation/favorites_screen.dart';
import '../../features/account/presentation/addresses_screen.dart';
import '../../features/account/presentation/notifications_screen.dart';
import '../../features/account/presentation/settings_screen.dart';
import '../../features/support/presentation/support_screen.dart';
import '../../features/delivery/presentation/delivery_dashboard_screen.dart';
import '../../features/delivery/presentation/delivery_order_detail_screen.dart';
import '../../features/delivery/presentation/alert_setup_screen.dart';
import '../../features/delivery/presentation/pickup_confirmation_screen.dart';
import '../../features/delivery/presentation/damage_report_screen.dart';
import '../../features/delivery/presentation/collection_screen.dart';
import '../../features/delivery/presentation/completion_screen.dart';
import '../network/api_client.dart';
import '../widgets/bottom_nav_shell.dart';

/// Route path constants for the application.
abstract class AppRoutes {
  static const splash = '/';
  static const login = '/login';
  static const otp = '/otp';

  // Customer routes
  static const customerHome = '/customer/home';
  static const categories = '/customer/categories';
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
  static const deliveryAlertSetup = '/delivery/alert-setup';
  static const deliveryPickup = '/delivery/orders/:id/pickup';
  static const deliveryDamage = '/delivery/orders/:id/damage';
  static const deliveryCollection = '/delivery/orders/:id/collection';
  static const deliveryCompletion = '/delivery/orders/:id/complete';
}

/// Navigator keys for nested navigation in ShellRoute.
final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

/// Creates the application router with role-based guards and bottom nav shell.
///
/// [apiClient] is required for screens that interact with the backend.
/// If null, delivery screens will show a placeholder until the client
/// is available (during auth loading state).
GoRouter createAppRouter({
  required AuthState authState,
  ApiClient? apiClient,
}) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: AppRoutes.splash,
    debugLogDiagnostics: true,
    redirect: (context, state) => _globalRedirect(authState, state),
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const _SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: LoginScreen(
            onSendOtp: (phone) {
              context.push(AppRoutes.otp, extra: phone);
            },
          ),
          transitionsBuilder: _fadeThroughTransition,
        ),
      ),
      GoRoute(
        path: AppRoutes.otp,
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: OtpScreen(
            phone: state.extra as String? ?? '',
            onVerify: (otp) {
              // After OTP verification, auth state change will
              // trigger redirect to the appropriate home screen.
            },
          ),
          transitionsBuilder: _sharedAxisTransition,
        ),
      ),

      // === Customer routes wrapped in StatefulShellRoute ===
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return BottomNavShell(navigationShell: navigationShell);
        },
        branches: [
          // Tab 0: Home
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.customerHome,
                pageBuilder: (context, state) => CustomTransitionPage(
                  key: state.pageKey,
                  child: HomeScreen(
                    onCategoryTap: (category) {
                      context.push(AppRoutes.categories);
                    },
                    onProductTap: (product) {
                      // Navigate to product detail
                    },
                    onCartTap: () => context.push(AppRoutes.cart),
                    onSearchTap: () {
                      // Open search
                    },
                  ),
                  transitionsBuilder: _sharedAxisTransition,
                ),
              ),
            ],
          ),
          // Tab 1: Categories
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.categories,
                pageBuilder: (context, state) => CustomTransitionPage(
                  key: state.pageKey,
                  child: CategoryScreen(
                    categoryName: 'All Categories',
                    onProductTap: (product) {
                      // Navigate to product detail
                    },
                  ),
                  transitionsBuilder: _sharedAxisTransition,
                ),
              ),
            ],
          ),
          // Tab 2: Cart
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.cart,
                pageBuilder: (context, state) => CustomTransitionPage(
                  key: state.pageKey,
                  child: CartScreen(
                    onCheckout: () => context.push(AppRoutes.checkout),
                  ),
                  transitionsBuilder: _sharedAxisTransition,
                ),
              ),
            ],
          ),
          // Tab 3: Orders
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.orders,
                pageBuilder: (context, state) => CustomTransitionPage(
                  key: state.pageKey,
                  child: OrdersScreen(
                    onOrderTap: (order) {
                      context.push(
                        AppRoutes.orderDetail.replaceFirst(':id', order.id),
                      );
                    },
                  ),
                  transitionsBuilder: _sharedAxisTransition,
                ),
              ),
            ],
          ),
          // Tab 4: Account
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.account,
                pageBuilder: (context, state) => CustomTransitionPage(
                  key: state.pageKey,
                  child: AccountScreen(
                    onWalletTap: () => context.push(AppRoutes.wallet),
                    onLoyaltyTap: () => context.push(AppRoutes.loyalty),
                    onFavoritesTap: () => context.push(AppRoutes.favorites),
                    onAddressesTap: () => context.push(AppRoutes.addresses),
                    onNotificationsTap: () =>
                        context.push(AppRoutes.notifications),
                    onSettingsTap: () => context.push(AppRoutes.settings),
                    onSupportTap: () => context.push(AppRoutes.support),
                  ),
                  transitionsBuilder: _sharedAxisTransition,
                ),
              ),
            ],
          ),
        ],
      ),

      // === Customer routes outside the shell (push on top of nav) ===
      GoRoute(
        path: AppRoutes.checkout,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: CheckoutScreen(
            onPlaceOrder: (data) {
              context.go(AppRoutes.orders);
            },
          ),
          transitionsBuilder: _fadeThroughTransition,
        ),
      ),
      GoRoute(
        path: AppRoutes.orderDetail,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final id = state.pathParameters['id']!;
          return CustomTransitionPage(
            key: state.pageKey,
            child: _OrderDetailPage(orderId: id),
            transitionsBuilder: _sharedAxisTransition,
          );
        },
      ),
      GoRoute(
        path: AppRoutes.orderTracking,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final id = state.pathParameters['id']!;
          return CustomTransitionPage(
            key: state.pageKey,
            child: _OrderTrackingPage(orderId: id),
            transitionsBuilder: _fadeThroughTransition,
          );
        },
      ),
      GoRoute(
        path: AppRoutes.wallet,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const WalletScreen(),
          transitionsBuilder: _sharedAxisTransition,
        ),
      ),
      GoRoute(
        path: AppRoutes.loyalty,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const LoyaltyScreen(),
          transitionsBuilder: _sharedAxisTransition,
        ),
      ),
      GoRoute(
        path: AppRoutes.favorites,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const FavoritesScreen(),
          transitionsBuilder: _sharedAxisTransition,
        ),
      ),
      GoRoute(
        path: AppRoutes.addresses,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const AddressesScreen(),
          transitionsBuilder: _sharedAxisTransition,
        ),
      ),
      GoRoute(
        path: AppRoutes.notifications,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const NotificationsScreen(),
          transitionsBuilder: _sharedAxisTransition,
        ),
      ),
      GoRoute(
        path: AppRoutes.settings,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const SettingsScreen(),
          transitionsBuilder: _sharedAxisTransition,
        ),
      ),
      GoRoute(
        path: AppRoutes.support,
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: SupportScreen(
            onNewTicket: () {
              // Navigate to new ticket screen
            },
          ),
          transitionsBuilder: _sharedAxisTransition,
        ),
      ),

      // === Delivery partner routes (no bottom nav) ===
      GoRoute(
        path: AppRoutes.deliveryLogin,
        builder: (context, state) => LoginScreen(
          onSendOtp: (phone) {
            context.push(AppRoutes.otp, extra: phone);
          },
        ),
      ),
      GoRoute(
        path: AppRoutes.deliveryDashboard,
        builder: (context, state) {
          if (apiClient == null) {
            return const _LoadingPage();
          }
          return DeliveryDashboardScreen(
            apiClient: apiClient,
            onOrderTap: (orderId) {
              context.push(
                AppRoutes.deliveryOrderDetail.replaceFirst(':id', orderId),
              );
            },
            onAlertSetupTap: () {
              context.push(AppRoutes.deliveryAlertSetup);
            },
          );
        },
      ),
      GoRoute(
        path: AppRoutes.deliveryOrderDetail,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          if (apiClient == null) {
            return const _LoadingPage();
          }
          return DeliveryOrderDetailScreen(
            orderId: id,
            apiClient: apiClient,
            onPickup: () {
              context.push(
                AppRoutes.deliveryPickup.replaceFirst(':id', id),
              );
            },
            onDamageReport: () {
              context.push(
                AppRoutes.deliveryDamage.replaceFirst(':id', id),
              );
            },
            onCollection: () {
              context.push(
                AppRoutes.deliveryCollection.replaceFirst(':id', id),
              );
            },
            onComplete: () {
              context.push(
                AppRoutes.deliveryCompletion.replaceFirst(':id', id),
              );
            },
          );
        },
      ),
      GoRoute(
        path: AppRoutes.deliveryAlertSetup,
        builder: (context, state) => AlertSetupScreen(
          onSetupComplete: () {
            context.go(AppRoutes.deliveryDashboard);
          },
        ),
      ),
      GoRoute(
        path: AppRoutes.deliveryPickup,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          if (apiClient == null) {
            return const _LoadingPage();
          }
          return PickupConfirmationScreen(
            orderId: id,
            orderNumber: state.extra as String? ?? id,
            apiClient: apiClient,
            onConfirmed: () => context.pop(),
          );
        },
      ),
      GoRoute(
        path: AppRoutes.deliveryDamage,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          if (apiClient == null) {
            return const _LoadingPage();
          }
          final items =
              state.extra as List<Map<String, dynamic>>? ?? const [];
          return DamageReportScreen(
            orderId: id,
            items: items,
            apiClient: apiClient,
            onReported: () => context.pop(),
          );
        },
      ),
      GoRoute(
        path: AppRoutes.deliveryCollection,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          if (apiClient == null) {
            return const _LoadingPage();
          }
          final expectedAmount = state.extra as double?;
          return CollectionScreen(
            orderId: id,
            apiClient: apiClient,
            onCollected: () => context.pop(),
            expectedAmount: expectedAmount,
          );
        },
      ),
      GoRoute(
        path: AppRoutes.deliveryCompletion,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          if (apiClient == null) {
            return const _LoadingPage();
          }
          return CompletionScreen(
            orderId: id,
            orderNumber: state.extra as String? ?? id,
            apiClient: apiClient,
            onCompleted: (ref) {
              context.go(AppRoutes.deliveryDashboard);
            },
          );
        },
      ),
    ],
  );
}

// ===========================
// Page Transitions
// ===========================

/// Shared axis horizontal transition for tab-to-tab navigation.
Widget _sharedAxisTransition(
  BuildContext context,
  Animation<double> animation,
  Animation<double> secondaryAnimation,
  Widget child,
) {
  return SharedAxisTransition(
    animation: animation,
    secondaryAnimation: secondaryAnimation,
    transitionType: SharedAxisTransitionType.horizontal,
    child: child,
  );
}

/// Fade through transition for modal/overlay navigation.
Widget _fadeThroughTransition(
  BuildContext context,
  Animation<double> animation,
  Animation<double> secondaryAnimation,
  Widget child,
) {
  return FadeThroughTransition(
    animation: animation,
    secondaryAnimation: secondaryAnimation,
    child: child,
  );
}

// ===========================
// Redirect Logic
// ===========================

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
      // Unauthenticated users should be sent to login.
      // Redirect away from splash so the app doesn't get stuck there.
      if (isSplash) return AppRoutes.login;
      if (isAuthRoute) return null;
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

// ===========================
// Inline Page Widgets
// ===========================

/// Splash screen that shows a loading indicator while auth state is determined.
///
/// The router redirect handles navigation once auth state resolves,
/// so this screen simply shows a branded loading state.
class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.storefront,
              size: 80,
              color: theme.colorScheme.primary,
            ),
            const SizedBox(height: 24),
            Text(
              'MSM Supermarket',
              style: theme.textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 32),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}

/// Simple loading page shown when required dependencies are not yet available.
class _LoadingPage extends StatelessWidget {
  const _LoadingPage();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}

/// Wrapper page for order detail that handles loading the order by ID.
///
/// In a full implementation this would fetch the order from the repository.
/// Currently displays order ID with a placeholder for data loading.
class _OrderDetailPage extends StatelessWidget {
  const _OrderDetailPage({required this.orderId});

  final String orderId;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Order #$orderId'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(
              'Loading order details...',
              style: theme.textTheme.bodyLarge,
            ),
          ],
        ),
      ),
    );
  }
}

/// Wrapper page for order tracking that handles real-time location display.
///
/// In a full implementation this would poll for delivery partner location
/// and display it on a map.
class _OrderTrackingPage extends StatelessWidget {
  const _OrderTrackingPage({required this.orderId});

  final String orderId;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Tracking #$orderId'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.local_shipping,
              size: 64,
              color: theme.colorScheme.primary,
            ),
            const SizedBox(height: 16),
            Text(
              'Live tracking',
              style: theme.textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Order #$orderId',
              style: theme.textTheme.bodyLarge,
            ),
          ],
        ),
      ),
    );
  }
}
