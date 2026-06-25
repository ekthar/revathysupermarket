import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Material 3 theme configuration for the MSM Mobile app.
///
/// Uses Google Fonts:
/// - Inter Tight for body/UI text (labels, body, titles)
/// - Manrope for display and headline text
///
/// Provides light and dark themes with a premium emerald + slate palette
/// matching the Next.js web application.
abstract class AppTheme {
  // === Brand Colors ===
  static const _primaryEmerald = Color(0xFF059669); // Emerald 600
  static const _primaryEmeraldLight = Color(0xFF10B981); // Emerald 500
  static const _primaryEmeraldDark = Color(0xFF047857); // Emerald 700

  // Emerald gradient stops
  static const emeraldGradient = [
    Color(0xFF059669), // Emerald 600
    Color(0xFF10B981), // Emerald 500
  ];

  static const emeraldDarkGradient = [
    Color(0xFF047857), // Emerald 700
    Color(0xFF059669), // Emerald 600
  ];

  // Accent gradients for cards
  static const walletGradient = [
    Color(0xFF059669), // Emerald 600
    Color(0xFF0D9488), // Teal 600
  ];

  static const loyaltyGradient = [
    Color(0xFF7C3AED), // Violet 600
    Color(0xFF8B5CF6), // Violet 500
  ];

  static const statsGradient = [
    Color(0xFF2563EB), // Blue 600
    Color(0xFF3B82F6), // Blue 500
  ];

  // Slate palette for dark mode
  static const _slate50 = Color(0xFFF8FAFC);
  static const _slate100 = Color(0xFFF1F5F9);
  static const _slate200 = Color(0xFFE2E8F0);
  static const _slate300 = Color(0xFFCBD5E1);
  static const _slate400 = Color(0xFF94A3B8);
  static const _slate500 = Color(0xFF64748B);
  static const _slate600 = Color(0xFF475569);
  static const _slate700 = Color(0xFF334155);
  static const _slate800 = Color(0xFF1E293B);
  static const _slate900 = Color(0xFF0F172A);
  static const _slate950 = Color(0xFF020617);

  // Semantic colors
  static const _success = Color(0xFF16A34A); // Green 600
  static const _warning = Color(0xFFD97706); // Amber 600
  static const _error = Color(0xFFDC2626); // Red 600
  static const _errorLight = Color(0xFFF87171); // Red 400
  static const _info = Color(0xFF2563EB); // Blue 600

  /// Exposed brand colors for use in custom widgets
  static Color get primaryEmerald => _primaryEmerald;
  static Color get primaryEmeraldLight => _primaryEmeraldLight;

  // ===========================
  // LIGHT THEME
  // ===========================
  static ThemeData get light {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: _primaryEmerald,
      brightness: Brightness.light,
      primary: _primaryEmerald,
      onPrimary: Colors.white,
      primaryContainer: const Color(0xFFD1FAE5), // Emerald 100
      onPrimaryContainer: _primaryEmeraldDark,
      secondary: _slate600,
      onSecondary: Colors.white,
      secondaryContainer: _slate100,
      onSecondaryContainer: _slate800,
      tertiary: const Color(0xFF0D9488), // Teal 600
      surface: Colors.white,
      onSurface: _slate900,
      surfaceContainerHighest: _slate100,
      error: _error,
      onError: Colors.white,
    );

    final baseTextTheme = _buildLightTextTheme();

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      brightness: Brightness.light,
      scaffoldBackgroundColor: _slate50,
      textTheme: baseTextTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: _slate900,
        elevation: 0,
        scrolledUnderElevation: 1,
        centerTitle: true,
        titleTextStyle: GoogleFonts.manrope(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: _slate900,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: _slate200),
        ),
        color: Colors.white,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: _primaryEmerald,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          elevation: 0,
          textStyle: GoogleFonts.interTight(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: _primaryEmerald,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          side: BorderSide(color: _primaryEmerald.withValues(alpha: 0.5)),
          textStyle: GoogleFonts.interTight(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: _primaryEmerald,
          textStyle: GoogleFonts.interTight(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: _slate300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: _slate300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: _primaryEmerald, width: 2),
        ),
        filled: true,
        fillColor: _slate50,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        hintStyle: GoogleFonts.interTight(
          color: _slate400,
          fontSize: 14,
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: _primaryEmerald,
        unselectedItemColor: _slate400,
        selectedLabelStyle: GoogleFonts.interTight(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: GoogleFonts.interTight(
          fontSize: 12,
          fontWeight: FontWeight.w400,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: _primaryEmerald.withValues(alpha: 0.1),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return GoogleFonts.interTight(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: _primaryEmerald,
            );
          }
          return GoogleFonts.interTight(
            fontSize: 12,
            fontWeight: FontWeight.w400,
            color: _slate500,
          );
        }),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        backgroundColor: _slate100,
        selectedColor: _primaryEmerald.withValues(alpha: 0.1),
        labelStyle: GoogleFonts.interTight(
          fontSize: 13,
          fontWeight: FontWeight.w500,
        ),
      ),
      dividerTheme: DividerThemeData(
        color: _slate200,
        thickness: 1,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        backgroundColor: _slate800,
        contentTextStyle: GoogleFonts.interTight(
          color: Colors.white,
          fontSize: 14,
        ),
      ),
      dialogTheme: DialogThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
      ),
    );
  }

  // ===========================
  // DARK THEME
  // ===========================
  static ThemeData get dark {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: _primaryEmerald,
      brightness: Brightness.dark,
      primary: _primaryEmeraldLight,
      onPrimary: _slate900,
      primaryContainer: const Color(0xFF064E3B), // Emerald 900
      onPrimaryContainer: const Color(0xFF6EE7B7), // Emerald 300
      secondary: _slate400,
      onSecondary: _slate900,
      secondaryContainer: _slate700,
      onSecondaryContainer: _slate200,
      tertiary: const Color(0xFF2DD4BF), // Teal 400
      surface: _slate800,
      onSurface: _slate100,
      surfaceContainerHighest: _slate700,
      error: _errorLight,
      onError: _slate900,
    );

    final baseTextTheme = _buildDarkTextTheme();

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: _slate900,
      textTheme: baseTextTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: _slate800,
        foregroundColor: _slate100,
        elevation: 0,
        scrolledUnderElevation: 1,
        centerTitle: true,
        titleTextStyle: GoogleFonts.manrope(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: _slate100,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: _slate800,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: _slate700),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: _primaryEmeraldLight,
          foregroundColor: _slate900,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          elevation: 0,
          textStyle: GoogleFonts.interTight(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: _primaryEmeraldLight,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          side: BorderSide(
            color: _primaryEmeraldLight.withValues(alpha: 0.5),
          ),
          textStyle: GoogleFonts.interTight(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: _primaryEmeraldLight,
          textStyle: GoogleFonts.interTight(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: _slate600),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: _slate600),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: _primaryEmeraldLight, width: 2),
        ),
        filled: true,
        fillColor: _slate700,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        hintStyle: GoogleFonts.interTight(
          color: _slate400,
          fontSize: 14,
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        type: BottomNavigationBarType.fixed,
        backgroundColor: _slate800,
        selectedItemColor: _primaryEmeraldLight,
        unselectedItemColor: _slate500,
        selectedLabelStyle: GoogleFonts.interTight(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: GoogleFonts.interTight(
          fontSize: 12,
          fontWeight: FontWeight.w400,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: _slate800,
        indicatorColor: _primaryEmeraldLight.withValues(alpha: 0.15),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return GoogleFonts.interTight(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: _primaryEmeraldLight,
            );
          }
          return GoogleFonts.interTight(
            fontSize: 12,
            fontWeight: FontWeight.w400,
            color: _slate400,
          );
        }),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        backgroundColor: _slate700,
        selectedColor: _primaryEmeraldLight.withValues(alpha: 0.15),
        labelStyle: GoogleFonts.interTight(
          fontSize: 13,
          fontWeight: FontWeight.w500,
        ),
      ),
      dividerTheme: DividerThemeData(
        color: _slate700,
        thickness: 1,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        backgroundColor: _slate700,
        contentTextStyle: GoogleFonts.interTight(
          color: _slate100,
          fontSize: 14,
        ),
      ),
      dialogTheme: DialogThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        backgroundColor: _slate800,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: _slate800,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
      ),
    );
  }

  // ===========================
  // TEXT THEMES
  // ===========================

  /// Builds the light mode text theme using Inter Tight for body/UI
  /// and Manrope for display/headline styles.
  static TextTheme _buildLightTextTheme() {
    return _mergeTextThemes(
      brightness: Brightness.light,
      color: _slate900,
      secondaryColor: _slate600,
    );
  }

  /// Builds the dark mode text theme using Inter Tight for body/UI
  /// and Manrope for display/headline styles.
  static TextTheme _buildDarkTextTheme() {
    return _mergeTextThemes(
      brightness: Brightness.dark,
      color: _slate100,
      secondaryColor: _slate300,
    );
  }

  /// Merges Manrope (display/headline) and Inter Tight (body/title/label)
  /// into a single cohesive TextTheme.
  static TextTheme _mergeTextThemes({
    required Brightness brightness,
    required Color color,
    required Color secondaryColor,
  }) {
    // Manrope for display and headline styles
    final manropeTheme = GoogleFonts.manropeTextTheme(
      brightness == Brightness.light
          ? ThemeData.light().textTheme
          : ThemeData.dark().textTheme,
    );

    // Inter Tight for body, title, and label styles
    final interTightTheme = GoogleFonts.interTightTextTheme(
      brightness == Brightness.light
          ? ThemeData.light().textTheme
          : ThemeData.dark().textTheme,
    );

    return TextTheme(
      // Display styles - Manrope
      displayLarge: manropeTheme.displayLarge?.copyWith(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        color: color,
        height: 1.2,
        letterSpacing: -0.5,
      ),
      displayMedium: manropeTheme.displayMedium?.copyWith(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        color: color,
        height: 1.2,
        letterSpacing: -0.3,
      ),
      displaySmall: manropeTheme.displaySmall?.copyWith(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        color: color,
        height: 1.3,
        letterSpacing: -0.2,
      ),
      // Headline styles - Manrope
      headlineLarge: manropeTheme.headlineLarge?.copyWith(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        color: color,
        height: 1.3,
      ),
      headlineMedium: manropeTheme.headlineMedium?.copyWith(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: color,
        height: 1.3,
      ),
      headlineSmall: manropeTheme.headlineSmall?.copyWith(
        fontSize: 18,
        fontWeight: FontWeight.w500,
        color: color,
        height: 1.4,
      ),
      // Title styles - Inter Tight
      titleLarge: interTightTheme.titleLarge?.copyWith(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: color,
        height: 1.4,
      ),
      titleMedium: interTightTheme.titleMedium?.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: color,
        height: 1.4,
      ),
      titleSmall: interTightTheme.titleSmall?.copyWith(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: color,
        height: 1.4,
      ),
      // Body styles - Inter Tight
      bodyLarge: interTightTheme.bodyLarge?.copyWith(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: color,
        height: 1.5,
      ),
      bodyMedium: interTightTheme.bodyMedium?.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: color,
        height: 1.5,
      ),
      bodySmall: interTightTheme.bodySmall?.copyWith(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: secondaryColor,
        height: 1.5,
      ),
      // Label styles - Inter Tight
      labelLarge: interTightTheme.labelLarge?.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: color,
        height: 1.4,
      ),
      labelMedium: interTightTheme.labelMedium?.copyWith(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: color,
        height: 1.4,
      ),
      labelSmall: interTightTheme.labelSmall?.copyWith(
        fontSize: 10,
        fontWeight: FontWeight.w500,
        color: secondaryColor,
        height: 1.4,
      ),
    );
  }
}
