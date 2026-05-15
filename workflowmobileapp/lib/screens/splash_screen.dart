// lib/screens/splash_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../services/auth_service.dart';
import '../utils/app_theme.dart';
import 'role_selection_screen.dart';
import 'workflow_home_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 2), _goNext);
  }

  Future<void> _goNext() async {
    if (!mounted) return;
    final token = await AuthService.getToken();
    final user = await AuthService.getUser();
    if (token != null && user != null) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => WorkflowHomeScreen(role: user.role)),
      );
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const RoleSelectionScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.hub_outlined, size: 72, color: AppColors.cyan)
                .animate()
                .fadeIn(duration: 600.ms)
                .scale(begin: const Offset(0.8, 0.8)),
            const SizedBox(height: 20),
            Text(
              'Workflow 360',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: AppColors.cyan,
                    letterSpacing: 1.2,
                  ),
            ).animate().fadeIn(delay: 300.ms),
            const SizedBox(height: 8),
            Text(
              'Inventory · Delivery · Returns',
              style: Theme.of(context).textTheme.bodySmall,
            ).animate().fadeIn(delay: 500.ms),
          ],
        ),
      ),
    );
  }
}
