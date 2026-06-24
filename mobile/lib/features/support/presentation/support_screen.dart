import 'package:flutter/material.dart';

/// Support ticket list screen.
class SupportScreen extends StatelessWidget {
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
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Support')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: onNewTicket,
        icon: const Icon(Icons.add),
        label: const Text('New Ticket'),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : tickets.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.support_agent,
                        size: 64,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No support tickets',
                        style: theme.textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Need help? Create a ticket.',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: tickets.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final ticket = tickets[index];
                    return _TicketCard(
                      ticket: ticket,
                      onTap: () => onTicketTap?.call(ticket),
                    );
                  },
                ),
    );
  }
}

class _TicketCard extends StatelessWidget {
  const _TicketCard({required this.ticket, this.onTap});

  final Map<String, dynamic> ticket;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final status = ticket['status'] as String? ?? 'OPEN';

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      ticket['subject'] as String? ?? '',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  _StatusChip(status: status),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '#${ticket['ticketNumber'] ?? ''}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (color, label) = _statusInfo(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
      ),
    );
  }

  (Color, String) _statusInfo(String status) {
    return switch (status) {
      'OPEN' => (Colors.blue, 'Open'),
      'IN_PROGRESS' => (Colors.orange, 'In Progress'),
      'WAITING_FOR_CUSTOMER' => (Colors.purple, 'Awaiting Reply'),
      'RESOLVED' => (Colors.green, 'Resolved'),
      'CLOSED' => (Colors.grey, 'Closed'),
      _ => (Colors.grey, status),
    };
  }
}
