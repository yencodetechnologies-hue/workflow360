// lib/screens/rfid_shell_screen.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'product_list_screen.dart';
import 'scan_screen.dart';

class RfidShellScreen extends StatefulWidget {
  const RfidShellScreen({super.key});

  @override
  State<RfidShellScreen> createState() => _RfidShellScreenState();
}

class _RfidShellScreenState extends State<RfidShellScreen> {
  int _idx = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('RFID tools'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: IndexedStack(
        index: _idx,
        children: const [ProductListScreen(), ScanScreen()],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _idx,
        onDestinationSelected: (i) => setState(() => _idx = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.inventory_2), label: 'Products'),
          NavigationDestination(icon: Icon(Icons.radar), label: 'Scan'),
        ],
      ),
    );
  }
}
