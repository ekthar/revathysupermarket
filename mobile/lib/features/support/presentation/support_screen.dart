import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/animated_fade_in.dart';
import '../../../core/widgets/shimmer_widget.dart';
import '../../account/providers/account_provider.dart';

/// Redesigned support screen with status filter tabs, colored status badges,
/// last message preview, timestamps, animated FAB, and empty state.
class SupportScreen extends ConsumerStatefulWidget {
  const SupportScreen({
    super.key,
    this.tickets = const [],
    this.onTicketTap,
    this.onNewTicket,
    this.isLoading = false,
  });

  final List<Map<String, dynamic>> tickets;
  final void Function(Map<String, dynamic>)? onTicketTap;
  final VoidCallback? onNewTicket;
  final bool isLoading;

  @override
  ConsumerState<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends ConsumerState<SupportScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late AnimationController _fabController;
  late Animation<double> _fabScale;

  final _statusFilters = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _statusFilters.length, vsync: this);

    _fabController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fabScale = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fabController, curve: Curves.elasticOut),
    );
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) _fabController.forward();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _fabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ticketsAsync = ref.watch(supportTicketsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Support'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: TabBar(
            controller: _tabController,
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            indicatorSize: TabBarIndicatorSize.label,
            tabs: _statusFilters
                .map((f) => Tab(text: f))
                .toList(),
          ),
        ),
      ),
      floatingActionButton: ScaleTransition(
        scale: _fabScale,
        child: FloatingActionButton.extended(
          onPressed: widget.onNewTicket,
          icon: const Icon(Icons.add),
          label: const Text('New Ticket'),
        ),
      ),
      body: ticketsAsync.when(
        loading: () => _buildShimmerLoading(),
        error: (_, __) => _buildBody(
          context,
          theme,
          widget.tickets
              .map((t) => SupportTicket.fromJson(t))
              .toList(),
        ),
        data: (tickets) => _buildBody(context, theme, tickets),
      ),
    );
  }

  Widget _buildShimmerLoading() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      itemBuilder: (_, __) => const Padding(
        padding: EdgeInsets.only(bottom: 12),
        child: ShimmerWidget.box(
          width: double.infinity,
          height: 100,
          borderRadius: 16,
        ),
      ),
    );
  }

  Widget _buildBody(
    BuildContext context,
    ThemeData theme,
    List<SupportTicket> tickets,
  ) {
    return TabBarView(
      controller: _tabController,
      children: _statusFilters.map((filter) {
        final filtered = _filterTickets(tickets, filter);
        if (filtered.isEmpty) {
          return _buildEmptyState(context, theme);
        }
        return RefreshIndicator(
          onRefresh: () => ref.refresh(supportTicketsProvider.future),
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
            itemCount: filtered.length,
            itemBuilder: (context, index) {
              final ticket = filtered[index];
              return AnimatedFadeIn(
                index: index,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _TicketCard(
                    ticket: ticket,
                    onTap: () => widget.onTicketTap?.call({
                      'id': ticket.id,
                      'ticketNumber': ticket.ticketNumber,
                      'subject': ticket.subject,
                      'status': ticket.status,
                      'lastMessage': ticket.lastMessage,
                      'createdAt': ticket.createdAt,
                      'updatedAt': ticket.updatedAt,
                    }),
                  ),
                ),
              );
            },
          ),
        );
      }).toList(),
    );
  }

  List<SupportTicket> _filterTickets(
      List<SupportTicket> tickets, String filter) {
    if (filter == 'All') return tickets;
    final statusMap = {
      'Open': 'OPEN',
      'In Progress': 'IN_PROGRESS',
      'Resolved': 'RESOLVED',
      'Closed': 'CLOSED',
    };
    final targetStatus = statusMap[filter];
    return tickets.where((t) => t.status == targetStatus).toList();
  }

  Widget _buildEmptyState(BuildContext context, ThemeData theme) {
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
              Icons.support_agent,
              size: 48,
              color: theme.colorScheme.primary.withValues(alpha: 0.5),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'No support tickets',
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Need help? Create a new ticket.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _TicketCard extends StatelessWidget {
  const _TicketCard({required this.ticket, this.onTap});

  final SupportTicket ticket;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final (color, label) = _statusInfo(ticket.status);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: theme.colorScheme.outline.withValues(alpha: 0.1),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    ticket.subject,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                // Colored status badge
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    label,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: color,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            // Ticket number
            Text(
              '#${ticket.ticketNumber}',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            // Last message preview
            if (ticket.lastMessage != null && ticket.lastMessage!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                ticket.lastMessage!,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 8),
            // Timestamp
            Row(
              children: [
                Icon(
                  Icons.access_time,
                  size: 14,
                  color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.6),
                ),
                const SizedBox(width: 4),
                Text(
                  ticket.updatedAt ?? ticket.createdAt,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant
                        .withValues(alpha: 0.6),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  (Color, String) _statusInfo(String status) {
    switch (status) {
      case 'OPEN':
        return (Colors.blue, 'Open');
      case 'IN_PROGRESS':
        return (Colors.orange, 'In Progress');
      case 'RESOLVED':
        return (Colors.green, 'Resolved');
      case 'CLOSED':
        return (Colors.grey, 'Closed');
      default:
        return (Colors.grey, status);
    }
  }
}
