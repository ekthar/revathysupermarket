import 'package:flutter/material.dart';

/// Notifications screen with notification list and mark-as-read.
class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({
    super.key,
    this.notifications = const [],
    this.onMarkRead,
    this.onTap,
    this.isLoading = false,
  });

  final List<Map<String, dynamic>> notifications;
  final void Function(String id)? onMarkRead;
  final void Function(Map<String, dynamic>)? onTap;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : notifications.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.notifications_none,
                        size: 64,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(height: 16),
                      Text('No notifications',
                          style: theme.textTheme.titleMedium),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: notifications.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final notif = notifications[index];
                    final isRead = notif['read'] as bool? ?? false;
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: isRead
                            ? theme.colorScheme.surfaceContainerHighest
                            : theme.colorScheme.primaryContainer,
                        child: Icon(
                          _iconForType(notif['type'] as String? ?? 'order'),
                          color: isRead
                              ? theme.colorScheme.onSurfaceVariant
                              : theme.colorScheme.onPrimaryContainer,
                          size: 20,
                        ),
                      ),
                      title: Text(
                        notif['title'] as String? ?? '',
                        style: TextStyle(
                          fontWeight:
                              isRead ? FontWeight.normal : FontWeight.bold,
                        ),
                      ),
                      subtitle: Text(
                        notif['body'] as String? ?? '',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      onTap: () {
                        if (!isRead) onMarkRead?.call(notif['id'] as String);
                        onTap?.call(notif);
                      },
                    );
                  },
                ),
    );
  }

  IconData _iconForType(String type) {
    return switch (type) {
      'order' => Icons.receipt_outlined,
      'delivery' => Icons.delivery_dining,
      'promo' => Icons.local_offer,
      _ => Icons.notifications_outlined,
    };
  }
}
