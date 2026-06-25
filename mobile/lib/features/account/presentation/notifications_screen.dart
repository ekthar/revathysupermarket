import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/animated_fade_in.dart';
import '../../../core/widgets/shimmer_widget.dart';
import '../providers/account_provider.dart';

/// Redesigned notifications screen with date grouping (Today, Yesterday, Earlier),
/// read/unread styling, type-based icons, swipe to dismiss/mark read, and pull-to-refresh.
class NotificationsScreen extends ConsumerStatefulWidget {
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
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final notificationsAsync = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: notificationsAsync.when(
        loading: () => _buildShimmerLoading(),
        error: (_, __) => _buildContent(
          context,
          theme,
          widget.notifications
              .map((n) => AppNotification.fromJson(n))
              .toList(),
        ),
        data: (notifications) =>
            _buildContent(context, theme, notifications),
      ),
    );
  }

  Widget _buildShimmerLoading() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 8,
      itemBuilder: (_, __) => const Padding(
        padding: EdgeInsets.only(bottom: 12),
        child: ShimmerWidget.box(
          width: double.infinity,
          height: 72,
          borderRadius: 12,
        ),
      ),
    );
  }

  Widget _buildContent(
    BuildContext context,
    ThemeData theme,
    List<AppNotification> notifications,
  ) {
    if (notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.notifications_none,
                size: 48,
                color: theme.colorScheme.primary.withValues(alpha: 0.5),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'All caught up!',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'No new notifications',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      );
    }

    // Group notifications by date
    final grouped = _groupByDate(notifications);

    return RefreshIndicator(
      onRefresh: () => ref.refresh(notificationsProvider.future),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: grouped.length,
        itemBuilder: (context, groupIndex) {
          final group = grouped[groupIndex];
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  group.label,
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              ...group.items.asMap().entries.map((entry) {
                final index = entry.key;
                final notif = entry.value;
                return AnimatedFadeIn(
                  index: index,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Dismissible(
                      key: ValueKey(notif.id),
                      direction: DismissDirection.endToStart,
                      background: Container(
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 20),
                        decoration: BoxDecoration(
                          color: Colors.blue.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.done_all, color: Colors.blue),
                            SizedBox(width: 8),
                            Text(
                              'Mark Read',
                              style: TextStyle(
                                color: Colors.blue,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      onDismissed: (_) {
                        widget.onMarkRead?.call(notif.id);
                      },
                      child: _NotificationCard(
                        notification: notif,
                        onTap: () {
                          if (!notif.isRead) {
                            widget.onMarkRead?.call(notif.id);
                          }
                          widget.onTap?.call({
                            'id': notif.id,
                            'title': notif.title,
                            'body': notif.body,
                            'type': notif.type,
                            'date': notif.date,
                            'read': notif.isRead,
                          });
                        },
                      ),
                    ),
                  ),
                );
              }),
            ],
          );
        },
      ),
    );
  }

  List<_NotificationGroup> _groupByDate(List<AppNotification> notifications) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));

    final todayItems = <AppNotification>[];
    final yesterdayItems = <AppNotification>[];
    final earlierItems = <AppNotification>[];

    for (final n in notifications) {
      final dateParts = n.date.split('T').first.split('-');
      if (dateParts.length == 3) {
        final date = DateTime.tryParse(n.date) ??
            DateTime(
              int.tryParse(dateParts[0]) ?? 2024,
              int.tryParse(dateParts[1]) ?? 1,
              int.tryParse(dateParts[2]) ?? 1,
            );
        final dateOnly = DateTime(date.year, date.month, date.day);
        if (dateOnly == today) {
          todayItems.add(n);
        } else if (dateOnly == yesterday) {
          yesterdayItems.add(n);
        } else {
          earlierItems.add(n);
        }
      } else {
        earlierItems.add(n);
      }
    }

    final groups = <_NotificationGroup>[];
    if (todayItems.isNotEmpty) {
      groups.add(_NotificationGroup(label: 'Today', items: todayItems));
    }
    if (yesterdayItems.isNotEmpty) {
      groups.add(
          _NotificationGroup(label: 'Yesterday', items: yesterdayItems));
    }
    if (earlierItems.isNotEmpty) {
      groups.add(_NotificationGroup(label: 'Earlier', items: earlierItems));
    }
    // If all groups empty, put all in Earlier
    if (groups.isEmpty && notifications.isNotEmpty) {
      groups.add(_NotificationGroup(label: 'Earlier', items: notifications));
    }
    return groups;
  }
}

class _NotificationGroup {
  const _NotificationGroup({required this.label, required this.items});
  final String label;
  final List<AppNotification> items;
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({
    required this.notification,
    this.onTap,
  });

  final AppNotification notification;
  final VoidCallback? onTap;

  IconData _iconForType(String type) {
    switch (type) {
      case 'order':
        return Icons.receipt_outlined;
      case 'delivery':
        return Icons.local_shipping;
      case 'promo':
        return Icons.local_offer;
      case 'system':
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _colorForType(String type) {
    switch (type) {
      case 'order':
        return const Color(0xFF059669);
      case 'delivery':
        return const Color(0xFF2563EB);
      case 'promo':
        return const Color(0xFFD97706);
      case 'system':
      default:
        return const Color(0xFF475569);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = _colorForType(notification.type);
    final isUnread = !notification.isRead;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isUnread
              ? color.withValues(alpha: 0.03)
              : theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isUnread
                ? color.withValues(alpha: 0.15)
                : theme.colorScheme.outline.withValues(alpha: 0.1),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                _iconForType(notification.type),
                color: color,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight:
                                isUnread ? FontWeight.bold : FontWeight.w500,
                          ),
                        ),
                      ),
                      if (isUnread)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Color(0xFF2563EB),
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.body,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
