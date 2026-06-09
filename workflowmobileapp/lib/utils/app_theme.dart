// lib/utils/app_theme.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Colors aligned with the web app (Tailwind: slate, emerald primary, emerald success).
class AppColors {
  // Page & surfaces (website: slate-50 → white → blue-50/30)
  static const bg = Color(0xFFF8FAFC);
  static const bgAlt = Color(0xFFEFF6FF);
  static const surface = Color(0xFFFFFFFF);
  static const card = Color(0xFFFFFFFF);
  static const border = Color(0xFFE2E8F0);

  // Brand primary (website: emerald-500 / emerald-600)
  static const primary = Color(0xFF059669);
  static const primaryLight = Color(0xFF10B981);
  static const primaryDark = Color(0xFF047857);
  static const purple = Color(0xFF064E3B);

  /// Legacy name used across screens — same as [primary].
  static const cyan = primary;

  static const green = Color(0xFF10B981);
  static const orange = Color(0xFFEC4899);
  static const red = Color(0xFFEF4444);
  static const amber = Color(0xFFF59E0B);
  static const accent = Color(0xFF3B82F6);

  static const text = Color(0xFF0F172A);
  static const subtext = Color(0xFF64748B);
  static const mono = Color(0xFF94A3B8);
}

class AppGradients {
  static const page = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [AppColors.bg, Colors.white, AppColors.bgAlt],
    stops: [0.0, 0.45, 1.0],
  );

  static const primary = LinearGradient(
    colors: [AppColors.primary, AppColors.purple],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const brandIcon = LinearGradient(
    colors: [AppColors.primaryLight, AppColors.primaryDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

/// Full-screen background matching the website body gradient.
class AppPageBackground extends StatelessWidget {
  final Widget child;

  const AppPageBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(gradient: AppGradients.page),
      child: child,
    );
  }
}

class AppTheme {
  static ThemeData get light => ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: AppColors.bg,
        colorScheme: const ColorScheme.light(
          primary: AppColors.primary,
          secondary: AppColors.green,
          surface: AppColors.surface,
          error: AppColors.red,
          onPrimary: Colors.white,
          onSurface: AppColors.text,
        ),
        textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme).copyWith(
          displaySmall: GoogleFonts.spaceGrotesk(
            color: AppColors.text,
            fontWeight: FontWeight.bold,
          ),
          headlineMedium: GoogleFonts.spaceGrotesk(
            color: AppColors.text,
            fontWeight: FontWeight.w700,
          ),
          titleMedium: GoogleFonts.inter(
            color: AppColors.text,
            fontWeight: FontWeight.w600,
          ),
          bodyMedium: GoogleFonts.inter(color: AppColors.text),
          bodySmall: GoogleFonts.inter(color: AppColors.subtext),
          labelSmall: GoogleFonts.jetBrainsMono(color: AppColors.mono),
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: AppColors.surface.withValues(alpha: 0.92),
          elevation: 0,
          scrolledUnderElevation: 0.5,
          shadowColor: Colors.black.withValues(alpha: 0.06),
          centerTitle: false,
          foregroundColor: AppColors.text,
          titleTextStyle: GoogleFonts.spaceGrotesk(
            color: AppColors.primary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.3,
          ),
          iconTheme: const IconThemeData(color: AppColors.primary),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            elevation: 2,
            shadowColor: AppColors.primary.withValues(alpha: 0.35),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
            textStyle: GoogleFonts.inter(
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.primary,
            side: const BorderSide(color: AppColors.border),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        cardTheme: CardThemeData(
          color: AppColors.card,
          surfaceTintColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: AppColors.border),
          ),
          elevation: 2,
          shadowColor: Colors.black.withValues(alpha: 0.08),
        ),
        dividerTheme: const DividerThemeData(color: AppColors.border),
        chipTheme: ChipThemeData(
          backgroundColor: AppColors.bg,
          selectedColor: AppColors.primary.withValues(alpha: 0.12),
          labelStyle: GoogleFonts.inter(color: AppColors.text, fontSize: 12),
          side: const BorderSide(color: AppColors.border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        snackBarTheme: SnackBarThemeData(
          backgroundColor: AppColors.text,
          contentTextStyle: GoogleFonts.inter(color: Colors.white),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          behavior: SnackBarBehavior.floating,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.surface,
          hintStyle: GoogleFonts.inter(color: AppColors.subtext),
          labelStyle: GoogleFonts.inter(color: AppColors.subtext),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
          ),
        ),
        tabBarTheme: TabBarThemeData(
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.subtext,
          labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
          dividerColor: AppColors.border,
        ),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: AppColors.surface,
          indicatorColor: AppColors.primary.withValues(alpha: 0.12),
          labelTextStyle: WidgetStateProperty.resolveWith((states) {
            final selected = states.contains(WidgetState.selected);
            return GoogleFonts.inter(
              fontSize: 11,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
              color: selected ? AppColors.primary : AppColors.subtext,
            );
          }),
        ),
        drawerTheme: const DrawerThemeData(
          backgroundColor: AppColors.surface,
        ),
        useMaterial3: true,
      );

  /// Kept for compatibility — same as [light].
  static ThemeData get dark => light;
}
