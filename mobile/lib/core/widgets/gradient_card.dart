import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// A reusable gradient card widget for wallet, loyalty, and stats displays.
///
/// Provides a modern card with a gradient background, optional icon,
/// and customizable content area. Supports preset gradient styles
/// or fully custom colors.
///
/// ```dart
/// GradientCard(
///   gradient: AppTheme.walletGradient,
///   child: Column(
///     children: [
///       Text('Wallet Balance'),
///       Text('\u20B91,250'),
///     ],
///   ),
/// )
/// ```
class GradientCard extends StatelessWidget {
  const GradientCard({
    super.key,
    required this.child,
    this.gradient,
    this.colors,
    this.begin = Alignment.topLeft,
    this.end = Alignment.bottomRight,
    this.borderRadius = 20.0,
    this.padding = const EdgeInsets.all(20),
    this.height,
    this.width,
    this.onTap,
    this.elevation = 0,
    this.overlayOpacity = 0.1,
  }) : assert(
          gradient != null || colors != null,
          'Either gradient or colors must be provided',
        );

  /// Preset gradient colors (from AppTheme).
  final List<Color>? gradient;

  /// Custom gradient colors (overrides [gradient]).
  final List<Color>? colors;

  /// Gradient start alignment.
  final Alignment begin;

  /// Gradient end alignment.
  final Alignment end;

  /// Corner radius.
  final double borderRadius;

  /// Internal padding.
  final EdgeInsets padding;

  /// Fixed height (null for auto-sizing).
  final double? height;

  /// Fixed width (null for full width).
  final double? width;

  /// Optional tap handler.
  final VoidCallback? onTap;

  /// Card elevation.
  final double elevation;

  /// Opacity of the white overlay pattern (adds depth).
  final double overlayOpacity;

  /// The card content.
  final Widget child;

  /// Creates a wallet-themed gradient card.
  factory GradientCard.wallet({
    Key? key,
    required Widget child,
    VoidCallback? onTap,
    EdgeInsets padding = const EdgeInsets.all(20),
  }) {
    return GradientCard(
      key: key,
      gradient: AppTheme.walletGradient,
      onTap: onTap,
      padding: padding,
      child: child,
    );
  }

  /// Creates a loyalty-themed gradient card.
  factory GradientCard.loyalty({
    Key? key,
    required Widget child,
    VoidCallback? onTap,
    EdgeInsets padding = const EdgeInsets.all(20),
  }) {
    return GradientCard(
      key: key,
      gradient: AppTheme.loyaltyGradient,
      onTap: onTap,
      padding: padding,
      child: child,
    );
  }

  /// Creates a stats-themed gradient card.
  factory GradientCard.stats({
    Key? key,
    required Widget child,
    VoidCallback? onTap,
    EdgeInsets padding = const EdgeInsets.all(20),
  }) {
    return GradientCard(
      key: key,
      gradient: AppTheme.statsGradient,
      onTap: onTap,
      padding: padding,
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    final gradientColors = colors ?? gradient!;

    final card = Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradientColors,
          begin: begin,
          end: end,
        ),
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: elevation > 0
            ? [
                BoxShadow(
                  color: gradientColors.first.withValues(alpha: 0.3),
                  blurRadius: elevation * 4,
                  offset: Offset(0, elevation * 2),
                ),
              ]
            : null,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: Stack(
          children: [
            // Decorative overlay circles for depth
            if (overlayOpacity > 0) ...[
              Positioned(
                top: -30,
                right: -30,
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: overlayOpacity),
                  ),
                ),
              ),
              Positioned(
                bottom: -20,
                left: -20,
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color:
                        Colors.white.withValues(alpha: overlayOpacity * 0.7),
                  ),
                ),
              ),
            ],
            // Content
            Padding(
              padding: padding,
              child: child,
            ),
          ],
        ),
      ),
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: card,
      );
    }

    return card;
  }
}
