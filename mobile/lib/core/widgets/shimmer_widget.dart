import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

/// Shape options for the shimmer placeholder.
enum ShimmerShape {
  /// Rectangular with rounded corners (default).
  box,

  /// Circular shape.
  circle,

  /// Wide rectangle for text-line placeholders.
  rectangle,
}

/// A reusable shimmer loading placeholder widget.
///
/// Displays an animated shimmer effect in the specified [shape],
/// useful as a skeleton loader across all screens.
///
/// ```dart
/// ShimmerWidget.box(width: 100, height: 100)
/// ShimmerWidget.circle(size: 48)
/// ShimmerWidget.rectangle(width: double.infinity, height: 16)
/// ```
class ShimmerWidget extends StatelessWidget {
  const ShimmerWidget({
    super.key,
    required this.width,
    required this.height,
    this.shape = ShimmerShape.box,
    this.borderRadius = 12.0,
  });

  /// Creates a box-shaped shimmer placeholder.
  const ShimmerWidget.box({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 12.0,
  }) : shape = ShimmerShape.box;

  /// Creates a circular shimmer placeholder.
  factory ShimmerWidget.circle({
    Key? key,
    required double size,
  }) {
    return ShimmerWidget(
      key: key,
      width: size,
      height: size,
      shape: ShimmerShape.circle,
    );
  }

  /// Creates a rectangle shimmer placeholder (ideal for text lines).
  const ShimmerWidget.rectangle({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 6.0,
  }) : shape = ShimmerShape.rectangle;

  final double width;
  final double height;
  final ShimmerShape shape;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final baseColor = isDark
        ? const Color(0xFF1E293B) // Slate 800
        : const Color(0xFFE2E8F0); // Slate 200

    final highlightColor = isDark
        ? const Color(0xFF334155) // Slate 700
        : const Color(0xFFF1F5F9); // Slate 100

    return Shimmer.fromColors(
      baseColor: baseColor,
      highlightColor: highlightColor,
      child: _buildShape(),
    );
  }

  Widget _buildShape() {
    switch (shape) {
      case ShimmerShape.circle:
        return Container(
          width: width,
          height: height,
          decoration: const BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
          ),
        );
      case ShimmerShape.rectangle:
        return Container(
          width: width,
          height: height,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(borderRadius),
          ),
        );
      case ShimmerShape.box:
        return Container(
          width: width,
          height: height,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(borderRadius),
          ),
        );
    }
  }
}

/// A convenience widget that displays multiple shimmer lines
/// to simulate text content loading.
class ShimmerLines extends StatelessWidget {
  const ShimmerLines({
    super.key,
    this.lines = 3,
    this.spacing = 12.0,
    this.lineHeight = 14.0,
    this.lastLineWidth = 0.6,
  });

  final int lines;
  final double spacing;
  final double lineHeight;

  /// Width fraction of the last line (0.0 to 1.0).
  final double lastLineWidth;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: List.generate(lines, (index) {
        final isLast = index == lines - 1;
        return Padding(
          padding: EdgeInsets.only(bottom: isLast ? 0 : spacing),
          child: FractionallySizedBox(
            widthFactor: isLast ? lastLineWidth : 1.0,
            child: ShimmerWidget.rectangle(
              width: double.infinity,
              height: lineHeight,
            ),
          ),
        );
      }),
    );
  }
}
