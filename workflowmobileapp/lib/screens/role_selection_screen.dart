// lib/screens/role_selection_screen.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../utils/app_theme.dart';

class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({super.key});

  static const _roles = [
    _RoleOption(
      role: 'ADMIN',
      icon: Icons.admin_panel_settings_rounded,
      title: 'Admin',
      subtitle: 'Orders, deliveries & oversight',
      gradient: AppGradients.primary,
      accent: AppColors.primary,
      features: ['Dashboard', 'Reports'],
    ),
    _RoleOption(
      role: 'GODOWN',
      icon: Icons.warehouse_rounded,
      title: 'Godown',
      subtitle: 'Dispatch scan & vehicle verify',
      gradient: LinearGradient(
        colors: [Color(0xFFD97706), AppColors.amber],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      accent: AppColors.amber,
      features: ['RFID scan', 'Queue'],
    ),
    _RoleOption(
      role: 'DELIVERY',
      icon: Icons.local_shipping_rounded,
      title: 'Delivery',
      subtitle: 'Pickup at godown · deliver at biller',
      gradient: LinearGradient(
        colors: [Color(0xFF059669), AppColors.green],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      accent: AppColors.green,
      features: ['Routes', 'Proof'],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: AppPageBackground(
        child: Stack(
          children: [
            const _BackgroundOrbs(),
            SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const _BrandHeader(),
                    const SizedBox(height: 36),
                    Text(
                      'Select your role',
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: AppColors.text,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Choose how you will use the app today',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: AppColors.subtext,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 24),
                    ..._roles.map(
                      (r) => Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: _RoleCard(
                          option: r,
                          onTap: () => context.push('/login/${r.role.toLowerCase()}'),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'RFID-powered logistics · Workflow 360',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: AppColors.mono,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RoleOption {
  final String role;
  final IconData icon;
  final String title;
  final String subtitle;
  final LinearGradient gradient;
  final Color accent;
  final List<String> features;

  const _RoleOption({
    required this.role,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.gradient,
    required this.accent,
    required this.features,
  });
}

class _BrandHeader extends StatelessWidget {
  const _BrandHeader();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            gradient: AppGradients.brandIcon,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.35),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: const Icon(
            Icons.hub_rounded,
            color: Colors.white,
            size: 36,
          ),
        ),
        const SizedBox(height: 20),
        ShaderMask(
          shaderCallback: (bounds) => AppGradients.primary.createShader(bounds),
          child: Text(
            'Workflow 360',
            style: GoogleFonts.spaceGrotesk(
              fontSize: 28,
              fontWeight: FontWeight.w700,
              color: Colors.white,
              letterSpacing: -0.5,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Smart warehouse & delivery',
          style: GoogleFonts.inter(
            fontSize: 14,
            color: AppColors.subtext,
          ),
        ),
      ],
    );
  }
}

class _BackgroundOrbs extends StatelessWidget {
  const _BackgroundOrbs();

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Stack(
        children: [
          Positioned(
            top: -80,
            right: -60,
            child: _orb(AppColors.primary, 180),
          ),
          Positioned(
            top: 120,
            left: -100,
            child: _orb(AppColors.accent, 140),
          ),
          Positioned(
            bottom: 80,
            right: -40,
            child: _orb(AppColors.green, 120),
          ),
        ],
      ),
    );
  }

  Widget _orb(Color color, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: 0.07),
      ),
    );
  }
}

class _RoleCard extends StatefulWidget {
  final _RoleOption option;
  final VoidCallback onTap;

  const _RoleCard({required this.option, required this.onTap});

  @override
  State<_RoleCard> createState() => _RoleCardState();
}

class _RoleCardState extends State<_RoleCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final o = widget.option;
    return AnimatedScale(
      scale: _pressed ? 0.98 : 1,
      duration: const Duration(milliseconds: 120),
      curve: Curves.easeOut,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: widget.onTap,
          onHighlightChanged: (v) => setState(() => _pressed = v),
          borderRadius: BorderRadius.circular(20),
          child: Ink(
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: o.accent.withValues(alpha: 0.2),
              ),
              boxShadow: [
                BoxShadow(
                  color: o.accent.withValues(alpha: 0.12),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      width: 5,
                      decoration: BoxDecoration(gradient: o.gradient),
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
                        child: Row(
                          children: [
                            Container(
                              width: 52,
                              height: 52,
                              decoration: BoxDecoration(
                                gradient: o.gradient,
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: [
                                  BoxShadow(
                                    color: o.accent.withValues(alpha: 0.3),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Icon(o.icon, color: Colors.white, size: 26),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    o.title,
                                    style: GoogleFonts.inter(
                                      fontSize: 17,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.text,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    o.subtitle,
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      color: AppColors.subtext,
                                      height: 1.35,
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  Wrap(
                                    spacing: 6,
                                    runSpacing: 6,
                                    children: o.features
                                        .map((f) => _FeatureChip(
                                              label: f,
                                              color: o.accent,
                                            ))
                                        .toList(),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: o.accent.withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.arrow_forward_rounded,
                                size: 18,
                                color: o.accent,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _FeatureChip extends StatelessWidget {
  final String label;
  final Color color;

  const _FeatureChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: color,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}
