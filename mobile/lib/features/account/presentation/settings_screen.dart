import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/animated_fade_in.dart';
import '../providers/account_provider.dart';

/// Redesigned settings screen with Material 3 toggle switches,
/// theme selector (System/Light/Dark), app version, clear cache,
/// and about section.
class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({
    super.key,
    this.orderUpdates = true,
    this.promotions = true,
    this.onToggleOrderUpdates,
    this.onTogglePromotions,
  });

  final bool orderUpdates;
  final bool promotions;
  final void Function(bool)? onToggleOrderUpdates;
  final void Function(bool)? onTogglePromotions;

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final settings = ref.watch(settingsProvider);
    final settingsNotifier = ref.read(settingsProvider.notifier);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Notifications Section
            AnimatedFadeIn(
              index: 0,
              child: _buildSection(
                context,
                title: 'Notifications',
                icon: Icons.notifications_outlined,
                color: const Color(0xFFD97706),
                children: [
                  _buildToggleRow(
                    context,
                    title: 'Order Updates',
                    subtitle: 'Get notified about order status changes',
                    value: settings.orderUpdates,
                    onChanged: (value) {
                      settingsNotifier.toggleOrderUpdates(value);
                      widget.onToggleOrderUpdates?.call(value);
                    },
                  ),
                  const Divider(height: 1),
                  _buildToggleRow(
                    context,
                    title: 'Promotions',
                    subtitle: 'Receive offers and promotional notifications',
                    value: settings.promotions,
                    onChanged: (value) {
                      settingsNotifier.togglePromotions(value);
                      widget.onTogglePromotions?.call(value);
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Theme Selector Section
            AnimatedFadeIn(
              index: 1,
              child: _buildSection(
                context,
                title: 'Appearance',
                icon: Icons.palette_outlined,
                color: const Color(0xFF7C3AED),
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Theme Mode',
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        // Segmented control for theme
                        Container(
                          decoration: BoxDecoration(
                            color:
                                theme.colorScheme.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              _buildThemeOption(
                                context,
                                label: 'System',
                                icon: Icons.phone_android,
                                isSelected: settings.themeMode == 'system',
                                onTap: () =>
                                    settingsNotifier.setThemeMode('system'),
                              ),
                              _buildThemeOption(
                                context,
                                label: 'Light',
                                icon: Icons.light_mode,
                                isSelected: settings.themeMode == 'light',
                                onTap: () =>
                                    settingsNotifier.setThemeMode('light'),
                              ),
                              _buildThemeOption(
                                context,
                                label: 'Dark',
                                icon: Icons.dark_mode,
                                isSelected: settings.themeMode == 'dark',
                                onTap: () =>
                                    settingsNotifier.setThemeMode('dark'),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Storage & Cache
            AnimatedFadeIn(
              index: 2,
              child: _buildSection(
                context,
                title: 'Storage',
                icon: Icons.storage_outlined,
                color: const Color(0xFF059669),
                children: [
                  ListTile(
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 16),
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.orange.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.cleaning_services,
                        color: Colors.orange,
                        size: 20,
                      ),
                    ),
                    title: const Text('Clear Cache'),
                    subtitle: const Text('Free up storage space'),
                    trailing: const Icon(
                      Icons.chevron_right,
                      size: 20,
                    ),
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Cache cleared successfully'),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // About Section
            AnimatedFadeIn(
              index: 3,
              child: _buildSection(
                context,
                title: 'About',
                icon: Icons.info_outline,
                color: const Color(0xFF2563EB),
                children: [
                  _buildAboutRow(
                    context,
                    title: 'Version',
                    value: '1.0.0',
                  ),
                  const Divider(height: 1),
                  _buildAboutRow(
                    context,
                    title: 'Build',
                    value: '2024.06.01',
                  ),
                  const Divider(height: 1),
                  ListTile(
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 16),
                    title: const Text('Terms of Service'),
                    trailing: const Icon(Icons.open_in_new, size: 16),
                    onTap: () {},
                  ),
                  const Divider(height: 1),
                  ListTile(
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 16),
                    title: const Text('Privacy Policy'),
                    trailing: const Icon(Icons.open_in_new, size: 16),
                    onTap: () {},
                  ),
                  const Divider(height: 1),
                  ListTile(
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 16),
                    title: const Text('Open Source Licenses'),
                    trailing: const Icon(Icons.chevron_right, size: 20),
                    onTap: () {},
                  ),
                ],
              ),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(
    BuildContext context, {
    required String title,
    required IconData icon,
    required Color color,
    required List<Widget> children,
  }) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 16),
            ),
            const SizedBox(width: 10),
            Text(
              title,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: theme.colorScheme.outline.withValues(alpha: 0.1),
            ),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildToggleRow(
    BuildContext context, {
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      title: Text(title),
      subtitle: Text(subtitle),
      value: value,
      onChanged: onChanged,
    );
  }

  Widget _buildThemeOption(
    BuildContext context, {
    required String label,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final theme = Theme.of(context);

    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? theme.colorScheme.primary : null,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                size: 20,
                color: isSelected
                    ? Colors.white
                    : theme.colorScheme.onSurfaceVariant,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: isSelected
                      ? Colors.white
                      : theme.colorScheme.onSurfaceVariant,
                  fontWeight:
                      isSelected ? FontWeight.bold : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAboutRow(
    BuildContext context, {
    required String title,
    required String value,
  }) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: theme.textTheme.bodyMedium),
          Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
