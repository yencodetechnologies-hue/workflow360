// lib/main.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'services/app_state.dart';
import 'utils/app_theme.dart';
import 'screens/product_list_screen.dart';
import 'screens/scanned_products_screen.dart';
import 'screens/scan_screen.dart';
import 'screens/history_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarBrightness: Brightness.dark,
    statusBarIconBrightness: Brightness.light,
  ));
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppState(),
      child: const RfidApp(),
    ),
  );
}

class RfidApp extends StatelessWidget {
  const RfidApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'RFID Product Manager',
        theme: AppTheme.dark,
        debugShowCheckedModeBanner: false,
        home: const _Shell(),
      );
}

class _Shell extends StatefulWidget {
  const _Shell();
  @override
  State<_Shell> createState() => _ShellState();
}

class _ShellState extends State<_Shell> {
  int _idx = 0;
  late final AppState _appState;

  static const _screens = [
    ProductListScreen(),
    ScannedProductsScreen(),
    ScanScreen(),
    HistoryScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _appState = context.read<AppState>();
    _appState.addListener(_onAppStateChanged);
    // Init reader after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _appState.initReader();
      _appState.loadProducts();
    });
  }

  @override
  void dispose() {
    _appState.removeListener(_onAppStateChanged);
    super.dispose();
  }

  void _onAppStateChanged() {
    if (!mounted) return;
    final tab = _appState.takePendingMainTabIfAny();
    if (tab != null) {
      setState(() => _idx = tab);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            _ReaderDot(),
            const SizedBox(width: 8),
            const Flexible(
              child: Text(
                'RFID Product Manager',
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Consumer<AppState>(
              builder: (_, state, __) => ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 160),
                child: Chip(
                  avatar: const Icon(Icons.nfc, size: 14),
                  label: Text(
                    state.selectedProduct?.name ?? 'None',
                    style: const TextStyle(fontSize: 11),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: IndexedStack(index: _idx, children: _screens),
      bottomNavigationBar: NavigationBar(
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.cyan.withOpacity(0.15),
        selectedIndex: _idx,
        onDestinationSelected: (i) => setState(() => _idx = i),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.inventory_2_outlined),
            selectedIcon: const Icon(Icons.inventory_2, color: AppColors.cyan),
            label: 'Products',
          ),
          NavigationDestination(
            icon: const Icon(Icons.assignment_outlined),
            selectedIcon:
                const Icon(Icons.assignment, color: AppColors.cyan),
            label: 'Assign products',
          ),
          NavigationDestination(
            icon: const Icon(Icons.radar_outlined),
            selectedIcon: const Icon(Icons.radar, color: AppColors.cyan),
            label: 'Scan new products',
          ),
          NavigationDestination(
            icon: const Icon(Icons.history_outlined),
            selectedIcon: const Icon(Icons.history, color: AppColors.cyan),
            label: 'History',
          ),
        ],
      ),
    );
  }
}

class _ReaderDot extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (_, state, __) {
        final color = switch (state.status) {
          ReaderStatus.ready    => AppColors.green,
          ReaderStatus.scanning => AppColors.amber,
          ReaderStatus.busy     => AppColors.cyan,
          ReaderStatus.error    => AppColors.red,
          _                     => AppColors.subtext,
        };
        return Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color,
            boxShadow: [BoxShadow(color: color.withOpacity(0.7), blurRadius: 5)],
          ),
        );
      },
    );
  }
}
