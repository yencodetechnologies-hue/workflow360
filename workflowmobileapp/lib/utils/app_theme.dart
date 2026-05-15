// lib/utils/app_theme.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const bg      = Color(0xFF080C14);
  static const surface = Color(0xFF111827);
  static const card    = Color(0xFF1A2234);
  static const border  = Color(0xFF1E293B);
  static const cyan    = Color(0xFF00D4FF);
  static const green   = Color(0xFF00E676);
  static const orange  = Color(0xFFFF6B35);
  static const red     = Color(0xFFFF3D5A);
  static const amber   = Color(0xFFFFAB00);
  static const text    = Color(0xFFE2E8F0);
  static const subtext = Color(0xFF64748B);
  static const mono    = Color(0xFF94A3B8);
}

class AppTheme {
  static ThemeData get dark => ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AppColors.bg,
        colorScheme: const ColorScheme.dark(
          primary:   AppColors.cyan,
          secondary: AppColors.green,
          surface:   AppColors.surface,
          error:     AppColors.red,
        ),
        textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).copyWith(
          displaySmall:  GoogleFonts.spaceGrotesk(
              color: AppColors.text, fontWeight: FontWeight.bold),
          headlineMedium: GoogleFonts.spaceGrotesk(
              color: AppColors.text, fontWeight: FontWeight.w700),
          titleMedium: GoogleFonts.inter(
              color: AppColors.text, fontWeight: FontWeight.w600),
          bodyMedium:  GoogleFonts.inter(color: AppColors.text),
          bodySmall:   GoogleFonts.inter(color: AppColors.subtext),
          labelSmall:  GoogleFonts.jetBrainsMono(color: AppColors.mono),
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: AppColors.surface,
          elevation: 0,
          centerTitle: false,
          titleTextStyle: GoogleFonts.spaceGrotesk(
              color: AppColors.cyan,
              fontSize: 18,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5),
          iconTheme: const IconThemeData(color: AppColors.cyan),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.cyan,
            foregroundColor: AppColors.bg,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10)),
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
            textStyle: GoogleFonts.inter(
                fontWeight: FontWeight.w700, fontSize: 14),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.cyan,
            side: const BorderSide(color: AppColors.cyan),
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10)),
          ),
        ),
        cardTheme: CardThemeData(
          color: AppColors.card,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: const BorderSide(color: AppColors.border),
          ),
          elevation: 0,
        ),
        dividerTheme: const DividerThemeData(color: AppColors.border),
        chipTheme: ChipThemeData(
          backgroundColor: AppColors.card,
          selectedColor: AppColors.cyan.withOpacity(0.15),
          labelStyle: GoogleFonts.inter(color: AppColors.text, fontSize: 12),
          side: const BorderSide(color: AppColors.border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        snackBarTheme: SnackBarThemeData(
          backgroundColor: AppColors.card,
          contentTextStyle: GoogleFonts.inter(color: AppColors.text),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          behavior: SnackBarBehavior.floating,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.surface,
          hintStyle: GoogleFonts.inter(color: AppColors.subtext),
          border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.border)),
          enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.border)),
          focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.cyan, width: 1.5)),
        ),
        tabBarTheme: TabBarThemeData(
          indicatorColor: AppColors.cyan,
          labelColor: AppColors.cyan,
          unselectedLabelColor: AppColors.subtext,
          labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
          dividerColor: AppColors.border,
        ),
        useMaterial3: true,
      );
}
