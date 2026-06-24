import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// Animation utilities for the MSM app.
/// Provides consistent animation patterns across the app.

/// Applies a fade-in + slide-up animation to a widget.
/// Usage: myWidget.fadeInUp(delay: 100.ms)
extension FadeInUpExtension on Widget {
  /// Fades in the widget while sliding up slightly.
  Widget fadeInUp({Duration? delay, Duration? duration}) {
    return animate(delay: delay)
        .fadeIn(duration: duration ?? 400.ms)
        .slideY(begin: 0.1, duration: duration ?? 400.ms);
  }
}

/// Returns a stagger delay for list item animations.
/// [index] is the position of the item in the list.
/// Delay = index * 50ms by default.
Duration staggerDelay(int index, {Duration interval = const Duration(milliseconds: 50)}) {
  return interval * index;
}

/// A widget that provides a 3D press effect on tap.
/// Scales down slightly when pressed for tactile feedback.
class Press3d extends StatefulWidget {
  const Press3d({
    super.key,
    required this.child,
    this.onTap,
    this.scaleDown = 0.95,
  });

  final Widget child;
  final VoidCallback? onTap;
  final double scaleDown;

  @override
  State<Press3d> createState() => _Press3dState();
}

class _Press3dState extends State<Press3d> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) {
        setState(() => _isPressed = false);
        widget.onTap?.call();
      },
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedScale(
        scale: _isPressed ? widget.scaleDown : 1.0,
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeInOut,
        child: widget.child,
      ),
    );
  }
}

/// A helper widget for product grids with pinned app bar and pull-to-refresh.
class ProductGridScaffold extends StatelessWidget {
  const ProductGridScaffold({
    super.key,
    required this.slivers,
    this.onRefresh,
    this.appBarTitle,
    this.pinned = true,
  });

  final List<Widget> slivers;
  final Future<void> Function()? onRefresh;
  final String? appBarTitle;
  final bool pinned;

  @override
  Widget build(BuildContext context) {
    Widget body = CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        if (appBarTitle != null)
          SliverAppBar(
            pinned: pinned,
            title: Text(appBarTitle!),
            backgroundColor: Theme.of(context).colorScheme.surface,
          ),
        ...slivers,
      ],
    );

    if (onRefresh != null) {
      body = RefreshIndicator(
        onRefresh: onRefresh!,
        color: Theme.of(context).colorScheme.primary,
        child: body,
      );
    }

    return body;
  }
}
