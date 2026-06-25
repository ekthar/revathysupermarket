import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/animated_fade_in.dart';
import '../../../core/widgets/gradient_card.dart';
import '../providers/account_provider.dart';

/// Premium account hub screen with gradient profile card, wallet/loyalty
/// quick stats, and a colorful menu grid layout.
class AccountScreen extends ConsumerStatefulWidget {
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
  ConsumerState<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends ConsumerState<AccountScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final walletAsync = ref.watch(walletProvider);
    final loyaltyAsync = ref.watch(loyaltyProvider);

    final balance = walletAsync.whenOrNull(data: (d) => d.balance) ??
        widget.walletBalance;
    final points = loyaltyAsync.whenOrNull(data: (d) => d.points) ??
        widget.loyaltyPoints;
    final tier =
        loyaltyAsync.whenOrNull(data: (d) => d.tier) ?? 'Bronze';
    final tierProgress =
        loyaltyAsync.whenOrNull(data: (d) => d.tierProgress) ?? 0.0;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Gradient AppBar with profile
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: AppTheme.emeraldGradient,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Row(
                          children: [
                            // Avatar with gradient border
                            Container(
                              padding: const EdgeInsets.all(3),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.white.withValues(alpha: 0.9),
                                    Colors.white.withValues(alpha: 0.4),
                                  ],
                                ),
                              ),
                              child: CircleAvatar(
                                radius: 32,
                                backgroundColor:
                                    Colors.white.withValues(alpha: 0.2),
                                child: Text(
                                  (widget.userName?.isNotEmpty == true
                                          ? widget.userName![0]
                                          : '?')
                                      .toUpperCase(),
                                  style: theme.textTheme.headlineMedium
                                      ?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    widget.userName ?? 'Guest',
                                    style: theme.textTheme.titleLarge?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  if (widget.phone != null)
                                    Text(
                                      widget.phone!,
                                      style:
                                          theme.textTheme.bodyMedium?.copyWith(
                                        color: Colors.white
                                            .withValues(alpha: 0.85),
                                      ),
                                    ),
                                  if (widget.email != null)
                                    Text(
                                      widget.email!,
                                      style:
                                          theme.textTheme.bodySmall?.copyWith(
                                        color: Colors.white
                                            .withValues(alpha: 0.7),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            title: const Text('Account'),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Wallet & Loyalty Quick Stats
                  AnimatedFadeIn(
                    index: 0,
                    child: Row(
                      children: [
                        // Wallet Balance Card
                        Expanded(
                          child: GradientCard.wallet(
                            onTap: widget.onWalletTap,
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: BoxDecoration(
                                        color: Colors.white
                                            .withValues(alpha: 0.2),
                                        borderRadius:
                                            BorderRadius.circular(8),
                                      ),
                                      child: const Icon(
                                        Icons.account_balance_wallet,
                                        color: Colors.white,
                                        size: 18,
                                      ),
                                    ),
                                    const Spacer(),
                                    const Icon(
                                      Icons.arrow_forward_ios,
                                      color: Colors.white70,
                                      size: 14,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  '\u20B9${balance.toStringAsFixed(0)}',
                                  style:
                                      theme.textTheme.headlineMedium?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Wallet Balance',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color:
                                        Colors.white.withValues(alpha: 0.8),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Loyalty Points Card with progress ring
                        Expanded(
                          child: GradientCard.loyalty(
                            onTap: widget.onLoyaltyTap,
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    SizedBox(
                                      width: 30,
                                      height: 30,
                                      child: Stack(
                                        alignment: Alignment.center,
                                        children: [
                                          CircularProgressIndicator(
                                            value: tierProgress.clamp(0.0, 1.0),
                                            strokeWidth: 3,
                                            backgroundColor: Colors.white
                                                .withValues(alpha: 0.2),
                                            valueColor:
                                                const AlwaysStoppedAnimation(
                                                    Colors.white),
                                          ),
                                          const Icon(
                                            Icons.star,
                                            color: Colors.white,
                                            size: 14,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const Spacer(),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.white
                                            .withValues(alpha: 0.2),
                                        borderRadius:
                                            BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        tier,
                                        style: theme.textTheme.labelSmall
                                            ?.copyWith(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  '$points',
                                  style:
                                      theme.textTheme.headlineMedium?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Loyalty Points',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color:
                                        Colors.white.withValues(alpha: 0.8),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Menu Grid (2x4)
                  AnimatedFadeIn(
                    index: 1,
                    child: _buildMenuGrid(context),
                  ),

                  const SizedBox(height: 24),

                  // Logout Button
                  AnimatedFadeIn(
                    index: 2,
                    child: SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () => _showLogoutDialog(context),
                        icon: Icon(
                          Icons.logout,
                          color: theme.colorScheme.error,
                        ),
                        label: Text(
                          'Logout',
                          style: TextStyle(color: theme.colorScheme.error),
                        ),
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(
                            color: theme.colorScheme.error
                                .withValues(alpha: 0.5),
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuGrid(BuildContext context) {
    final menuItems = [
      _MenuGridItem(
        icon: Icons.account_balance_wallet,
        label: 'Wallet',
        color: const Color(0xFF059669),
        onTap: widget.onWalletTap,
      ),
      _MenuGridItem(
        icon: Icons.star,
        label: 'Loyalty',
        color: const Color(0xFF7C3AED),
        onTap: widget.onLoyaltyTap,
      ),
      _MenuGridItem(
        icon: Icons.favorite,
        label: 'Favorites',
        color: const Color(0xFFDC2626),
        onTap: widget.onFavoritesTap,
      ),
      _MenuGridItem(
        icon: Icons.location_on,
        label: 'Addresses',
        color: const Color(0xFF2563EB),
        onTap: widget.onAddressesTap,
      ),
      _MenuGridItem(
        icon: Icons.notifications,
        label: 'Notifications',
        color: const Color(0xFFD97706),
        onTap: widget.onNotificationsTap,
      ),
      _MenuGridItem(
        icon: Icons.settings,
        label: 'Settings',
        color: const Color(0xFF475569),
        onTap: widget.onSettingsTap,
      ),
      _MenuGridItem(
        icon: Icons.support_agent,
        label: 'Support',
        color: const Color(0xFF0D9488),
        onTap: widget.onSupportTap,
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        crossAxisSpacing: 12,
        mainAxisSpacing: 16,
        childAspectRatio: 0.85,
      ),
      itemCount: menuItems.length,
      itemBuilder: (context, index) {
        final item = menuItems[index];
        return _buildGridMenuItem(context, item, index);
      },
    );
  }

  Widget _buildGridMenuItem(
      BuildContext context, _MenuGridItem item, int index) {
    final theme = Theme.of(context);

    return AnimatedFadeIn(
      index: index + 2,
      child: GestureDetector(
        onTap: item.onTap,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: item.color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                item.icon,
                color: item.color,
                size: 24,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              item.label,
              style: theme.textTheme.labelSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    final theme = Theme.of(context);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Logout'),
        content: const Text(
          'Are you sure you want to logout? You will need to sign in again.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              widget.onLogout?.call();
            },
            style: FilledButton.styleFrom(
              backgroundColor: theme.colorScheme.error,
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
}

class _MenuGridItem {
  const _MenuGridItem({
    required this.icon,
    required this.label,
    required this.color,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;
}
