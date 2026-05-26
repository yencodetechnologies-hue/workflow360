// lib/navigation/nav_config.dart

import 'package:flutter/material.dart';

class NavItem {
  final String label;
  final String path;
  final IconData icon;

  const NavItem({required this.label, required this.path, required this.icon});
}

List<NavItem> navItemsForRole(String role, {String? godownId}) {
  switch (role) {
    case 'DELIVERY':
      return const [
        NavItem(label: 'Deliveries', path: '/deliveries', icon: Icons.local_shipping_outlined),
      ];
    case 'GODOWN':
      return const [
        NavItem(label: 'Dashboard', path: '/dashboard', icon: Icons.dashboard_outlined),
        NavItem(label: 'Queue', path: '/queue', icon: Icons.schedule_outlined),
        NavItem(label: 'Deliveries', path: '/deliveries', icon: Icons.local_shipping_outlined),
        NavItem(label: 'Orders', path: '/orders', icon: Icons.receipt_long_outlined),
      ];
    default:
      return const [
        NavItem(label: 'Dashboard', path: '/dashboard', icon: Icons.dashboard_outlined),
        NavItem(label: 'Deliveries', path: '/deliveries', icon: Icons.local_shipping_outlined),
        NavItem(label: 'Reports', path: '/reports', icon: Icons.assessment_outlined),
      ];
  }
}

List<NavItem> drawerItemsForRole(String role, {String? godownId}) {
  switch (role) {
    case 'DELIVERY':
      return const [];
    case 'GODOWN':
      return [
        if (godownId != null && godownId.isNotEmpty)
          NavItem(
            label: 'My godown',
            path: '/godowns/$godownId',
            icon: Icons.warehouse_outlined,
          ),
        const NavItem(label: 'Reports', path: '/reports', icon: Icons.assessment_outlined),
      ];
    default:
      return const [
        NavItem(label: 'Godowns', path: '/godowns', icon: Icons.warehouse_outlined),
        NavItem(label: 'Products', path: '/products', icon: Icons.inventory_2_outlined),
        NavItem(label: 'Billers', path: '/masters/billers', icon: Icons.people_outline),
      ];
  }
}

const scanModes = ['dispatch', 'pickup', 'deliver', 'return'];

bool canScanAction(String role, String action) {
  if (role == 'ADMIN') return true;
  if (action == 'pickup' || action == 'deliver') return role == 'DELIVERY';
  return role == 'GODOWN';
}

String scanModeForDelivery(String role, String status) {
  if (role == 'ADMIN') {
    if (status == 'UPCOMING') return 'dispatch';
    if (status == 'DISPATCHED') return 'pickup';
    if (status == 'PENDING_RETURN' || status == 'DELIVERED') return 'return';
    return 'deliver';
  }
  if (role == 'GODOWN') {
    if (status == 'PENDING_RETURN' || status == 'DELIVERED') return 'return';
    return 'dispatch';
  }
  if (status == 'DISPATCHED') return 'pickup';
  if (status == 'PENDING_RETURN') return 'return';
  return 'deliver';
}

bool canCreateDelivery(String role) => role == 'ADMIN';
