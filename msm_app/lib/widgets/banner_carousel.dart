import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../theme/app_theme.dart';

class BannerCarousel extends StatefulWidget {
  const BannerCarousel({
    super.key,
    required this.bannerUrls,
    this.height = 180,
    this.autoScrollDuration = const Duration(seconds: 5),
    this.onBannerTap,
  });

  final List<String> bannerUrls;
  final double height;
  final Duration autoScrollDuration;
  final ValueChanged<int>? onBannerTap;

  @override
  State<BannerCarousel> createState() => _BannerCarouselState();
}

class _BannerCarouselState extends State<BannerCarousel> {
  late final PageController _pageController;
  Timer? _autoScrollTimer;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _startAutoScroll();
  }

  @override
  void dispose() {
    _autoScrollTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _startAutoScroll() {
    if (widget.bannerUrls.length <= 1) return;
    _autoScrollTimer = Timer.periodic(widget.autoScrollDuration, (_) {
      if (!mounted) return;
      final nextPage = ((_pageController.page?.round() ?? 0) + 1) %
          widget.bannerUrls.length;
      _pageController.animateToPage(
        nextPage,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    if (widget.bannerUrls.isEmpty) return const SizedBox.shrink();

    return Column(
      children: [
        SizedBox(
          height: widget.height,
          child: PageView.builder(
            controller: _pageController,
            itemCount: widget.bannerUrls.length,
            itemBuilder: (context, index) {
              return GestureDetector(
                onTap: () => widget.onBannerTap?.call(index),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: CachedNetworkImage(
                      imageUrl: widget.bannerUrls[index],
                      fit: BoxFit.cover,
                      width: double.infinity,
                      placeholder: (context, url) => Container(
                        color: Colors.grey.shade200,
                        child: const Center(
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                      ),
                      errorWidget: (context, url, error) => Container(
                        color: Colors.grey.shade200,
                        child: const Center(
                          child: Icon(Icons.broken_image, size: 40),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 12),
        SmoothPageIndicator(
          controller: _pageController,
          count: widget.bannerUrls.length,
          effect: WormEffect(
            dotHeight: 8,
            dotWidth: 8,
            activeDotColor: AppTheme.primaryColor,
            dotColor: Colors.grey.shade300,
          ),
        ),
      ],
    );
  }
}
