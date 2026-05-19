// lib/navigation/app_router.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../screens/billers_screen.dart';
import '../screens/create_delivery_screen.dart';
import '../screens/dashboard_screen.dart';
import '../screens/deliveries_list_screen.dart';
import '../screens/delivery_detail_screen.dart';
import '../screens/delivery_scan_screen.dart';
import '../screens/assign_rfid_intake_screen.dart';
import '../screens/godown_detail_screen.dart';
import '../screens/godowns_list_screen.dart';
import '../screens/login_screen.dart';
import '../screens/products_admin_screen.dart';
import '../screens/queue_screen.dart';
import '../screens/reports_screen.dart';
import '../screens/rfid_shell_screen.dart';
import '../screens/role_selection_screen.dart';
import '../screens/splash_screen.dart';
import '../services/app_state.dart';
import '../services/auth_service.dart';
import 'app_shell.dart';

final _rootKey = GlobalKey<NavigatorState>();

class AppRouter {
  static GoRouter create() {
    return GoRouter(
      navigatorKey: _rootKey,
      initialLocation: '/splash',
      redirect: (context, state) async {
        final path = state.uri.path;
        final public = path == '/splash' || path == '/roles' || path.startsWith('/login');
        final token = await AuthService.getToken();
        final user = await AuthService.getUser();
        if (token == null || user == null) {
          if (public) return null;
          return '/roles';
        }
        if (path == '/splash' || path == '/roles' || path.startsWith('/login')) {
          if (user.role == 'DELIVERY') return '/deliveries';
          if (user.role == 'GODOWN') return '/queue';
          return '/dashboard';
        }
        if (user.role == 'DELIVERY') {
          const allowed = ['/deliveries', '/rfid'];
          final ok = allowed.any((p) => path == p || path.startsWith('$p/')) ||
              path.startsWith('/scan/');
          if (!ok) return '/deliveries';
        }
        if (user.role == 'GODOWN' && path == '/dashboard') return '/queue';
        return null;
      },
      routes: [
        GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
        GoRoute(path: '/roles', builder: (_, __) => const RoleSelectionScreen()),
        GoRoute(
          path: '/login/:role',
          builder: (_, state) => LoginScreen(role: state.pathParameters['role']!.toUpperCase()),
        ),
        GoRoute(
          parentNavigatorKey: _rootKey,
          path: '/deliveries/create',
          builder: (_, __) => const CreateDeliveryScreen(),
        ),
        GoRoute(
          parentNavigatorKey: _rootKey,
          path: '/deliveries/:id',
          builder: (_, state) => DeliveryDetailScreen(deliveryId: state.pathParameters['id']!),
        ),
        GoRoute(
          parentNavigatorKey: _rootKey,
          path: '/godowns/:id',
          builder: (_, state) => GodownDetailScreen(godownId: state.pathParameters['id']!),
        ),
        GoRoute(
          parentNavigatorKey: _rootKey,
          path: '/godowns/:godownId/assign-rfid',
          builder: (_, state) => AssignRfidIntakeScreen(
            godownId: state.pathParameters['godownId']!,
            initialProductId: state.uri.queryParameters['productId'],
          ),
        ),
        GoRoute(
          parentNavigatorKey: _rootKey,
          path: '/scan/:deliveryId',
          builder: (_, state) {
            final extra = state.extra as Map<String, dynamic>?;
            return DeliveryScanScreen(
              deliveryId: state.pathParameters['deliveryId']!,
              deliveryNo: extra?['deliveryNo'] as String? ?? '',
              mode: extra?['mode'] as String? ?? 'dispatch',
              role: extra?['role'] as String? ?? 'GODOWN',
            );
          },
        ),
        GoRoute(
          parentNavigatorKey: _rootKey,
          path: '/rfid',
          builder: (context, _) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              context.read<AppState>().initReader();
            });
            return const RfidShellScreen();
          },
        ),
        ShellRoute(
          builder: (context, state, child) {
            return FutureBuilder<AuthUser?>(
              future: AuthService.getUser(),
              builder: (context, snap) {
                final role = snap.data?.role ?? 'ADMIN';
                return AppShell(role: role, child: child);
              },
            );
          },
          routes: [
            GoRoute(path: '/dashboard', builder: (_, __) => const DashboardScreen()),
            GoRoute(path: '/queue', builder: (_, __) => const QueueScreen()),
            GoRoute(path: '/godowns', builder: (_, __) => const GodownsListScreen()),
            GoRoute(path: '/products', builder: (_, __) => const ProductsAdminScreen()),
            GoRoute(path: '/deliveries', builder: (_, __) => const DeliveriesListScreen()),
            GoRoute(path: '/reports', builder: (_, __) => const ReportsScreen()),
            GoRoute(path: '/masters/billers', builder: (_, __) => const BillersScreen()),
          ],
        ),
      ],
    );
  }
}
