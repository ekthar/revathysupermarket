import 'package:badges/badges.dart' as badges;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/cart_provider.dart';
import '../theme/app_theme.dart';

class BottomNavBar extends ConsumerWidget {
  const BottomNavBar({
    super.key,
    required this.child,
  });

  final Widget child;

  static const _tabs = [
    _TabConfig(path: '/', icon: Icons.home_outlined, activeIcon: Icons.home, label: 'Home'),
    _TabConfig(path: '/products', icon: Icons.category_outlined, activeIcon: Icons.category, label: 'Categories'),
    _TabConfig(path: '/cart', icon: Icons.shopping_cart_outlined, activeIcon: Icons.shopping_cart, label: 'Cart'),
    _TabConfig(path: '/orders', icon: Icons.receipt_long_outlined, activeIcon: Icons.receipt_long, label: 'Orders'),
    _TabConfig(path: '/account', icon: Icons.person_outline, activeIcon: Icons.person, label: 'Account'),
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    for (int i = _tabs.length - 1; i >= 0; i--) {
      if (location == _tabs[i].path || location.startsWith('${_tabs[i].path}/')) {
        // Make sure home "/" doesn't match everything
        if (_tabs[i].path == '/' && location != '/') continue;
        return i;
      }
    }
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentIndex = _currentIndex(context);
    final cartItems = ref.watch(cartProvider);
    final cartCount = ref.read(cartProvider.notifier).totalItems;

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (index) {
          if (index != currentIndex) {
            context.go(_tabs[index].path);
          }
        },
        destinations: _tabs.map((tab) {
          final isCart = tab.path == '/cart';
          Widget icon = Icon(tab.icon);
          Widget activeIcon = Icon(tab.activeIcon);

          if (isCart && cartItems.isNotEmpty) {
            icon = badges.Badge(
              badgeContent: Text(
                '$cartCount',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
              badgeStyle: const badges.BadgeStyle(
                badgeColor: AppTheme.primaryColor,
                padding: EdgeInsets.all(4),
              ),
              child: Icon(tab.icon),
            );
            activeIcon = badges.Badge(
              badgeContent: Text(
                '$cartCount',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
              badgeStyle: const badges.BadgeStyle(
                badgeColor: AppTheme.primaryColor,
                padding: EdgeInsets.all(4),
              ),
              child: Icon(tab.activeIcon),
            );
          }

          return NavigationDestination(
            icon: icon,
            selectedIcon: activeIcon,
            label: tab.label,
          );
        }).toList(),
      ),
    );
  }
}

class _TabConfig {
  const _TabConfig({
    required this.path,
    required this.icon,
    required this.activeIcon,
    required this.label,
  });

  final String path;
  final IconData icon;
  final IconData activeIcon;
  final String label;
}
