import 'package:flutter/material.dart';

/// Settings screen with push notification toggles.
class SettingsScreen extends StatefulWidget {
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
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late bool _orderUpdates;
  late bool _promotions;

  @override
  void initState() {
    super.initState();
    _orderUpdates = widget.orderUpdates;
    _promotions = widget.promotions;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'Push Notifications',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.primary,
              ),
            ),
          ),
          SwitchListTile(
            title: const Text('Order Updates'),
            subtitle: const Text(
                'Get notified about order status changes'),
            value: _orderUpdates,
            onChanged: (value) {
              setState(() => _orderUpdates = value);
              widget.onToggleOrderUpdates?.call(value);
            },
          ),
          SwitchListTile(
            title: const Text('Promotions'),
            subtitle: const Text(
                'Receive offers and promotional notifications'),
            value: _promotions,
            onChanged: (value) {
              setState(() => _promotions = value);
              widget.onTogglePromotions?.call(value);
            },
          ),
          const Divider(height: 32),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'About',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.primary,
              ),
            ),
          ),
          const ListTile(
            title: Text('Version'),
            subtitle: Text('1.0.0'),
          ),
        ],
      ),
    );
  }
}
