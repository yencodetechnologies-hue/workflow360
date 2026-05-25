// lib/screens/role_selection_screen.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../utils/app_theme.dart';

class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Workflow 360'),
        backgroundColor: AppColors.surface,
      ),
      body: AppPageBackground(
        child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Select your role',
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Choose how you will use the app today',
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            _RoleCard(
              icon: Icons.admin_panel_settings_outlined,
              title: 'Admin',
              subtitle: 'Manage orders and deliveries',
              color: AppColors.primary,
              onTap: () => _openLogin(context, 'ADMIN'),
            ),
            const SizedBox(height: 16),
            _RoleCard(
              icon: Icons.warehouse_outlined,
              title: 'Godown',
              subtitle: 'Dispatch scan & vehicle verify',
              color: AppColors.green,
              onTap: () => _openLogin(context, 'GODOWN'),
            ),
            const SizedBox(height: 16),
            _RoleCard(
              icon: Icons.local_shipping_outlined,
              title: 'Delivery',
              subtitle: 'Pickup at godown · deliver at biller',
              color: AppColors.accent,
              onTap: () => _openLogin(context, 'DELIVERY'),
            ),
          ],
        ),
      ),
      ),
    );
  }

  void _openLogin(BuildContext context, String role) {
    context.push('/login/${role.toLowerCase()}');
  }
}

class _RoleCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _RoleCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.card,
      elevation: 2,
      shadowColor: Colors.black.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.border),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 32),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.subtext),
            ],
          ),
        ),
      ),
    );
  }
}
