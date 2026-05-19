// lib/navigation/app_shell.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/auth_service.dart';
import '../utils/app_theme.dart';
import 'nav_config.dart';

class AppShell extends StatelessWidget {
  final String role;
  final Widget child;

  const AppShell({super.key, required this.role, required this.child});

  @override
  Widget build(BuildContext context) {
    final items = navItemsForRole(role);
    final drawerItems = drawerItemsForRole(role);
    final location = GoRouterState.of(context).uri.path;

    int selected = 0;
    for (var i = 0; i < items.length; i++) {
      if (location == items[i].path || location.startsWith('${items[i].path}/')) {
        selected = i;
        break;
      }
    }

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        titleSpacing: 0,
        title: Row(
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.cyan, AppColors.green],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.bolt, color: Colors.black, size: 18),
            ),
            const SizedBox(width: 10),
            const Text('Workflow 360'),
          ],
        ),
        actions: [
          if (role == 'ADMIN' || role == 'GODOWN')
            IconButton(
              icon: const Icon(Icons.nfc),
              tooltip: 'RFID tools',
              onPressed: () => context.push('/rfid'),
            ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign out',
            onPressed: () async {
              await AuthService.clearSession();
              if (context.mounted) context.go('/roles');
            },
          ),
        ],
      ),
      drawer: drawerItems.isNotEmpty
          ? _AppDrawer(
              role: role,
              drawerItems: drawerItems,
              currentLocation: location,
            )
          : null,
      body: child,
      bottomNavigationBar: items.length <= 1
          ? null
          : _StyledBottomNav(
              items: items,
              selected: selected.clamp(0, items.length - 1),
            ),
    );
  }
}

// ─── Side Drawer ──────────────────────────────────────────────────────────────

class _AppDrawer extends StatelessWidget {
  final String role;
  final List<NavItem> drawerItems;
  final String currentLocation;

  const _AppDrawer({
    required this.role,
    required this.drawerItems,
    required this.currentLocation,
  });

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.horizontal(right: Radius.circular(20)),
      ),
      child: Column(
        children: [
          _DrawerHeader(role: role),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
              children: [
                _sectionLabel('MASTERS'),
                const SizedBox(height: 6),
                for (final item in drawerItems)
                  _DrawerTile(
                    item: item,
                    isActive: currentLocation == item.path ||
                        currentLocation.startsWith('${item.path}/'),
                  ),
              ],
            ),
          ),
          // Footer
          Container(
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            child: ListTile(
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
              leading: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.red.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.logout_rounded,
                    color: AppColors.red, size: 18),
              ),
              title: const Text(
                'Sign Out',
                style: TextStyle(
                  color: AppColors.red,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              onTap: () async {
                Navigator.of(context).pop();
                await AuthService.clearSession();
                if (context.mounted) context.go('/roles');
              },
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _sectionLabel(String label) => Padding(
        padding: const EdgeInsets.only(left: 6, bottom: 4),
        child: Text(
          label,
          style: const TextStyle(
            color: AppColors.subtext,
            fontSize: 10,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.6,
          ),
        ),
      );
}

class _DrawerHeader extends StatelessWidget {
  final String role;

  const _DrawerHeader({required this.role});

  Color get _roleColor {
    switch (role) {
      case 'GODOWN':
        return AppColors.amber;
      case 'DELIVERY':
        return AppColors.green;
      default:
        return AppColors.cyan;
    }
  }

  IconData get _roleIcon {
    switch (role) {
      case 'GODOWN':
        return Icons.warehouse_outlined;
      case 'DELIVERY':
        return Icons.local_shipping_outlined;
      default:
        return Icons.admin_panel_settings_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 56, 20, 24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            _roleColor.withValues(alpha: 0.14),
            AppColors.surface,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: const Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [_roleColor, _roleColor.withValues(alpha: 0.6)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: _roleColor.withValues(alpha: 0.35),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(_roleIcon, color: Colors.black, size: 28),
          ),
          const SizedBox(height: 14),
          const Text(
            'Workflow 360',
            style: TextStyle(
              color: AppColors.text,
              fontSize: 17,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(height: 7),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: _roleColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: _roleColor.withValues(alpha: 0.35)),
            ),
            child: Text(
              role,
              style: TextStyle(
                color: _roleColor,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DrawerTile extends StatelessWidget {
  final NavItem item;
  final bool isActive;

  const _DrawerTile({required this.item, required this.isActive});

  Color get _accent {
    switch (item.path) {
      case '/godowns':
        return AppColors.amber;
      case '/products':
        return AppColors.green;
      case '/masters/billers':
        return AppColors.cyan;
      default:
        return AppColors.cyan;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: isActive ? _accent.withValues(alpha: 0.1) : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isActive ? _accent.withValues(alpha: 0.28) : Colors.transparent,
        ),
      ),
      child: ListTile(
        dense: true,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
        leading: Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: _accent.withValues(alpha: isActive ? 0.18 : 0.08),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            item.icon,
            color: isActive ? _accent : AppColors.subtext,
            size: 19,
          ),
        ),
        title: Text(
          item.label,
          style: TextStyle(
            color: isActive ? _accent : AppColors.text,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
            fontSize: 14,
          ),
        ),
        trailing: isActive
            ? Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(
                  color: _accent,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: _accent.withValues(alpha: 0.6),
                      blurRadius: 6,
                    ),
                  ],
                ),
              )
            : const Icon(Icons.chevron_right,
                color: AppColors.subtext, size: 18),
        onTap: () {
          Navigator.of(context).pop();
          context.go(item.path);
        },
      ),
    );
  }
}

// ─── Bottom Navigation Bar ────────────────────────────────────────────────────

class _StyledBottomNav extends StatelessWidget {
  final List<NavItem> items;
  final int selected;

  const _StyledBottomNav({required this.items, required this.selected});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: const Border(top: BorderSide(color: AppColors.border)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.45),
            blurRadius: 24,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
          child: Row(
            children: [
              for (var i = 0; i < items.length; i++)
                _NavBarItem(
                  item: items[i],
                  isSelected: i == selected,
                  onTap: () => context.go(items[i].path),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavBarItem extends StatelessWidget {
  final NavItem item;
  final bool isSelected;
  final VoidCallback onTap;

  const _NavBarItem({
    required this.item,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeInOut,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.cyan.withValues(alpha: 0.1)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected
                  ? AppColors.cyan.withValues(alpha: 0.22)
                  : Colors.transparent,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                item.icon,
                size: 22,
                color: isSelected ? AppColors.cyan : AppColors.subtext,
              ),
              const SizedBox(height: 4),
              Text(
                item.label,
                style: TextStyle(
                  color: isSelected ? AppColors.cyan : AppColors.subtext,
                  fontSize: 11,
                  fontWeight:
                      isSelected ? FontWeight.w600 : FontWeight.w400,
                  letterSpacing: 0.2,
                ),
              ),
              const SizedBox(height: 3),
              AnimatedContainer(
                duration: const Duration(milliseconds: 220),
                width: isSelected ? 5 : 0,
                height: isSelected ? 5 : 0,
                decoration: BoxDecoration(
                  color: AppColors.cyan,
                  shape: BoxShape.circle,
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: AppColors.cyan.withValues(alpha: 0.7),
                            blurRadius: 6,
                          ),
                        ]
                      : null,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
