import 'package:flutter/material.dart';

/// Loyalty points screen with balance and history.
class LoyaltyScreen extends StatelessWidget {
  const LoyaltyScreen({
    super.key,
    this.points = 0,
    this.transactions = const [],
  });

  final int points;
  final List<Map<String, dynamic>> transactions;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Loyalty Points')),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.secondaryContainer,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.star,
                  size: 48,
                  color: theme.colorScheme.onSecondaryContainer,
                ),
                const SizedBox(height: 8),
                Text(
                  '$points',
                  style: theme.textTheme.headlineLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.onSecondaryContainer,
                  ),
                ),
                Text(
                  'Points Available',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSecondaryContainer,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Points History',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          Expanded(
            child: transactions.isEmpty
                ? Center(
                    child: Text(
                      'No transactions yet',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: transactions.length,
                    separatorBuilder: (_, __) => const Divider(),
                    itemBuilder: (context, index) {
                      final tx = transactions[index];
                      final pts = tx['points'] as int? ?? 0;
                      final isEarn = pts > 0;
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: isEarn
                              ? Colors.green.shade50
                              : Colors.orange.shade50,
                          child: Icon(
                            isEarn ? Icons.add : Icons.remove,
                            color: isEarn ? Colors.green : Colors.orange,
                            size: 20,
                          ),
                        ),
                        title: Text(tx['reason'] as String? ?? ''),
                        subtitle: Text(tx['date'] as String? ?? ''),
                        trailing: Text(
                          '${isEarn ? "+" : ""}$pts pts',
                          style: theme.textTheme.titleSmall?.copyWith(
                            color: isEarn ? Colors.green : Colors.orange,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
