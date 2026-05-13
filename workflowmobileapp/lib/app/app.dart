import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:workflow360_rfid_app/features/history/history_screen.dart';
import 'package:workflow360_rfid_app/features/management/management_screen.dart';
import 'package:workflow360_rfid_app/features/management/tagged_products_screen.dart';
import 'package:workflow360_rfid_app/features/products/products_screen.dart';
import 'package:workflow360_rfid_app/features/products/product_detail_screen.dart';
import 'package:workflow360_rfid_app/features/products/product_detail_args.dart';
import 'package:workflow360_rfid_app/features/scan/scan_screen.dart';

final _router = GoRouter(
  initialLocation: '/management',
  routes: <RouteBase>[
    GoRoute(
      path: '/management',
      builder: (context, state) => const ManagementScreen(),
    ),
    GoRoute(
      path: '/products',
      builder: (context, state) => const ProductsScreen(),
    ),
    GoRoute(
      path: '/products/:id',
      builder: (context, state) {
        final extra = state.extra;
        if (extra is! ProductDetailArgs) return const ProductsScreen();
        return ProductDetailScreen(product: extra.product);
      },
    ),
    GoRoute(
      path: '/scan',
      builder: (context, state) => const ScanScreen(),
    ),
    GoRoute(
      path: '/history',
      builder: (context, state) => const HistoryScreen(),
    ),
    GoRoute(
      path: '/tagged-products',
      builder: (context, state) => const TaggedProductsScreen(),
    ),
  ],
);

class Workflow360App extends ConsumerWidget {
  const Workflow360App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'Workflow360 RFID',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0B57D0)),
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(),
        ),
      ),
      routerConfig: _router,
    );
  }
}
