import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/animated_fade_in.dart';
import '../../../core/widgets/gradient_card.dart';
import '../../../core/widgets/shimmer_widget.dart';
import '../providers/account_provider.dart';

/// Redesigned loyalty screen with animated progress ring, tier badges,
/// earn rules, and date-grouped redemption history.
class LoyaltyScreen extends ConsumerStatefulWidget {
  const LoyaltyScreen({
    super.key,
    this.points = 0,
    this.transactions = const [],
  });

  final int points;
  final List<Map<String, dynamic>> transactions;

  @override
  ConsumerState<LoyaltyScreen> createState() => _LoyaltyScreenState();
}

class _LoyaltyScreenState extends ConsumerState<LoyaltyScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _progressController;
  late Animation<double> _progressAnimation;

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _progressAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _progressController, curve: Curves.easeOutCubic),
    );
    _progressController.forward();
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final loyaltyAsync = ref.watch(loyaltyProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Loyalty Points')),
      body: loyaltyAsync.when(
        loading: () => _buildShimmerLoading(),
        error: (_, __) => _buildContent(
          context,
          theme,
          LoyaltyData(
            points: widget.points,
            transactions: widget.transactions
                .map((t) => LoyaltyTransaction(
                      id: t['id'] as String? ?? '',
                      points: t['points'] as int? ?? 0,
                      reason: t['reason'] as String? ?? '',
                      date: t['date'] as String? ?? '',
                    ))
                .toList(),
          ),
        ),
        data: (data) => _buildContent(context, theme, data),
      ),
    );
  }

  Widget _buildShimmerLoading() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const ShimmerWidget.box(
            width: double.infinity,
            height: 200,
            borderRadius: 20,
          ),
          const SizedBox(height: 24),
          Row(
            children: List.generate(
              4,
              (_) => const Expanded(
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 4),
                  child: ShimmerWidget.box(
                    width: double.infinity,
                    height: 80,
                    borderRadius: 12,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          const ShimmerLines(lines: 4),
        ],
      ),
    );
  }

  Widget _buildContent(
    BuildContext context,
    ThemeData theme,
    LoyaltyData data,
  ) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Points Balance with Progress Ring
          AnimatedFadeIn(
            index: 0,
            child: GradientCard.loyalty(
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Total Points',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: Colors.white.withValues(alpha: 0.8),
                          ),
                        ),
                        const SizedBox(height: 4),
                        // Animated number
                        AnimatedBuilder(
                          animation: _progressAnimation,
                          builder: (context, _) {
                            final displayPoints =
                                (data.points * _progressAnimation.value)
                                    .toInt();
                            return Text(
                              '$displayPoints',
                              style:
                                  theme.textTheme.displayMedium?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${data.tier} Tier',
                          style: theme.textTheme.titleSmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.9),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Circular Progress Ring
                  AnimatedBuilder(
                    animation: _progressAnimation,
                    builder: (context, _) {
                      return SizedBox(
                        width: 80,
                        height: 80,
                        child: CustomPaint(
                          painter: _TierProgressPainter(
                            progress: data.tierProgress.clamp(0.0, 1.0) *
                                _progressAnimation.value,
                            backgroundColor:
                                Colors.white.withValues(alpha: 0.2),
                            progressColor: Colors.white,
                            strokeWidth: 6,
                          ),
                          child: Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.star,
                                  color: Colors.white,
                                  size: 20,
                                ),
                                Text(
                                  '${(data.tierProgress * 100).toInt()}%',
                                  style:
                                      theme.textTheme.labelSmall?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),

          // Tier Badges Section
          AnimatedFadeIn(
            index: 1,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Tiers',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildTierBadge(context, 'Bronze', Icons.shield,
                        const Color(0xFFCD7F32), data.tier == 'Bronze'),
                    _buildTierBadge(context, 'Silver', Icons.shield,
                        const Color(0xFFC0C0C0), data.tier == 'Silver'),
                    _buildTierBadge(context, 'Gold', Icons.shield,
                        const Color(0xFFFFD700), data.tier == 'Gold'),
                    _buildTierBadge(context, 'Platinum', Icons.diamond,
                        const Color(0xFF4FC3F7), data.tier == 'Platinum'),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Earn Rules
          AnimatedFadeIn(
            index: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'How to Earn',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                _buildEarnRuleCard(
                  context,
                  icon: Icons.shopping_cart,
                  title: 'Shop & Earn',
                  description: 'Earn 1 point for every \u20B910 spent',
                  color: AppTheme.primaryEmerald,
                ),
                const SizedBox(height: 8),
                _buildEarnRuleCard(
                  context,
                  icon: Icons.rate_review,
                  title: 'Review Products',
                  description: 'Get 5 points for each review',
                  color: const Color(0xFF2563EB),
                ),
                const SizedBox(height: 8),
                _buildEarnRuleCard(
                  context,
                  icon: Icons.person_add,
                  title: 'Refer Friends',
                  description: 'Earn 50 points per referral',
                  color: const Color(0xFF7C3AED),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Redemption History
          AnimatedFadeIn(
            index: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Points History',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                if (data.transactions.isEmpty)
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        'No history yet. Start earning points!',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  )
                else
                  ..._buildGroupedHistory(context, data.transactions),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTierBadge(BuildContext context, String label, IconData icon,
      Color color, bool isActive) {
    final theme = Theme.of(context);

    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isActive ? color.withValues(alpha: 0.15) : null,
          border: Border.all(
            color: isActive ? color : theme.colorScheme.outline.withValues(alpha: 0.2),
            width: isActive ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 4),
            Text(
              label,
              style: theme.textTheme.labelSmall?.copyWith(
                color: isActive ? color : theme.colorScheme.onSurfaceVariant,
                fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEarnRuleCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String description,
    required Color color,
  }) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  description,
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildGroupedHistory(
    BuildContext context,
    List<LoyaltyTransaction> transactions,
  ) {
    final theme = Theme.of(context);
    final grouped = <String, List<LoyaltyTransaction>>{};
    for (final tx in transactions) {
      final dateKey = tx.date.split('T').first;
      grouped.putIfAbsent(dateKey, () => []).add(tx);
    }

    final widgets = <Widget>[];
    for (final entry in grouped.entries) {
      widgets.add(
        Padding(
          padding: const EdgeInsets.only(top: 8, bottom: 8),
          child: Text(
            entry.key,
            style: theme.textTheme.labelMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      );
      for (final tx in entry.value) {
        final isEarn = tx.points > 0;
        widgets.add(
          Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: theme.colorScheme.outline.withValues(alpha: 0.1),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: isEarn
                        ? Colors.green.withValues(alpha: 0.1)
                        : Colors.orange.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    isEarn ? Icons.add_circle_outline : Icons.remove_circle_outline,
                    color: isEarn ? Colors.green : Colors.orange,
                    size: 18,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    tx.reason,
                    style: theme.textTheme.titleSmall,
                  ),
                ),
                Text(
                  '${isEarn ? "+" : ""}${tx.points} pts',
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: isEarn ? Colors.green : Colors.orange,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        );
      }
    }
    return widgets;
  }
}

/// Custom painter for the circular tier progress ring.
class _TierProgressPainter extends CustomPainter {
  _TierProgressPainter({
    required this.progress,
    required this.backgroundColor,
    required this.progressColor,
    required this.strokeWidth,
  });

  final double progress;
  final Color backgroundColor;
  final Color progressColor;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Background circle
    final bgPaint = Paint()
      ..color = backgroundColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);

    // Progress arc
    final progressPaint = Paint()
      ..color = progressColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _TierProgressPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
