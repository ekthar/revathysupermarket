import 'package:flutter/material.dart';

/// Account hub screen with profile info and menu items.
class AccountScreen extends StatelessWidget {
  const AccountScreen({
    super.key,
    this.userName,
    this.phone,
    this.email,
    this.walletBalance = 0,
    this.loyaltyPoints = 0,
    this.onWalletTap,
    this.onLoyaltyTap,
    this.onFavoritesTap,
    this.onAddressesTap,
    this.onNotificationsTap,
    this.onSettingsTap,
    this.onSupportTap,
    this.onLogout,
  });

  final String? userName;
  final String? phone;
  final String? email;
  final double walletBalance;
  final int loyaltyPoints;
  final VoidCallback? onWalletTap;
  final VoidCallback? onLoyaltyTap;
  final VoidCallback? onFavoritesTap;
  final VoidCallback? onAddressesTap;
  final VoidCallback? onNotificationsTap;
  final VoidCallback? onSettingsTap;
  final VoidCallback? onSupportTap;
  final VoidCallback? onLogout;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Account'),
      ),
      body: ListView(
        children: [
          // Profile Header
          Container(
            padding: const EdgeInsets.all(24),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: theme.colorScheme.primaryContainer,
                  child: Text(
                    (userName?.isNotEmpty == true
                            ? userName![0]
                            : '?')
                        .toUpperCase(),
                    style: theme.textTheme.headlineMedium?.copyWith(
                      color: theme.colorScheme.onPrimaryContainer,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        userName ?? 'Guest',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (phone != null)
                        Text(phone!, style: theme.textTheme.bodySmall),
                      if (email != null)
                        Text(email!, style: theme.textTheme.bodySmall),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Quick Stats
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: _QuickStatCard(
                    icon: Icons.account_balance_wallet,
                    label: 'Wallet',
                    value: '\u20B9${walletBalance.toStringAsFixed(0)}',
                    onTap: onWalletTap,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _QuickStatCard(
                    icon: Icons.star,
                    label: 'Points',
                    value: '$loyaltyPoints',
                    onTap: onLoyaltyTap,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Menu Items
          _MenuItem(
            icon: Icons.account_balance_wallet,
            title: 'Wallet',
            subtitle: 'Balance & transactions',
            onTap: onWalletTap,
          ),
          _MenuItem(
            icon: Icons.star,
            title: 'Loyalty Points',
            subtitle: 'Earn & redeem points',
            onTap: onLoyaltyTap,
          ),
          _MenuItem(
            icon: Icons.favorite_outline,
            title: 'Favorites',
            subtitle: 'Your favorite products',
            onTap: onFavoritesTap,
          ),
          _MenuItem(
            icon: Icons.location_on_outlined,
            title: 'Addresses',
            subtitle: 'Manage delivery addresses',
            onTap: onAddressesTap,
          ),
          _MenuItem(
            icon: Icons.notifications_outlined,
            title: 'Notifications',
            subtitle: 'Your notifications',
            onTap: onNotificationsTap,
          ),
          _MenuItem(
            icon: Icons.settings_outlined,
            title: 'Settings',
            subtitle: 'App preferences',
            onTap: onSettingsTap,
          ),
          _MenuItem(
            icon: Icons.support_agent,
            title: 'Support',
            subtitle: 'Get help',
            onTap: onSupportTap,
          ),
          const Divider(height: 32),
          _MenuItem(
            icon: Icons.logout,
            title: 'Logout',
            subtitle: 'Sign out of your account',
            onTap: onLogout,
            isDestructive: true,
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _QuickStatCard extends StatelessWidget {
  const _QuickStatCard({
    required this.icon,
    required this.label,
    required this.value,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Icon(icon, color: theme.colorScheme.primary),
              const SizedBox(height: 8),
              Text(
                value,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(label, style: theme.textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  const _MenuItem({
    required this.icon,
    required this.title,
    this.subtitle,
    this.onTap,
    this.isDestructive = false,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;
  final bool isDestructive;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = isDestructive ? theme.colorScheme.error : null;

    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(title, style: TextStyle(color: color)),
      subtitle: subtitle != null ? Text(subtitle!) : null,
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
