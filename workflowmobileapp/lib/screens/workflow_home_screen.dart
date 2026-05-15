// lib/screens/workflow_home_screen.dart

import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/delivery_api.dart';
import '../utils/app_theme.dart';
import 'delivery_scan_screen.dart';
import 'role_selection_screen.dart';
import 'product_list_screen.dart';
import 'scan_screen.dart';

class WorkflowHomeScreen extends StatefulWidget {
  final String role;

  const WorkflowHomeScreen({super.key, required this.role});

  @override
  State<WorkflowHomeScreen> createState() => _WorkflowHomeScreenState();
}

class _WorkflowHomeScreenState extends State<WorkflowHomeScreen> {
  List<DeliveryRow> _deliveries = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.role == 'GODOWN' || widget.role == 'DELIVERY') {
      _load();
    } else {
      _loading = false;
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await DeliveryApi.listDeliveries();
      setState(() => _deliveries = list);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _logout() async {
    await AuthService.clearSession();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const RoleSelectionScreen()),
      (_) => false,
    );
  }

  String _scanModeFor(DeliveryRow d) {
    if (widget.role == 'GODOWN') return 'dispatch';
    if (d.status == 'DISPATCHED') return 'pickup';
    return 'deliver';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Workflow 360'),
        backgroundColor: AppColors.surface,
        actions: [
          IconButton(icon: const Icon(Icons.logout), onPressed: _logout),
        ],
      ),
      body: widget.role == 'ADMIN' || widget.role == 'GODOWN'
          ? Column(
              children: [
                if (widget.role == 'GODOWN')
                  Expanded(
                    child: _DeliveriesBody(
                      role: widget.role,
                      deliveries: _deliveries,
                      loading: _loading,
                      error: _error,
                      onRefresh: _load,
                      onScan: (d) {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => DeliveryScanScreen(
                              deliveryId: d.id,
                              deliveryNo: d.deliveryNo,
                              mode: _scanModeFor(d),
                              role: widget.role,
                            ),
                          ),
                        ).then((_) => _load());
                      },
                    ),
                  )
                else
                  Expanded(child: _AdminBody(onOpenRfid: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const _RfidShell()),
                    );
                  })),
                if (widget.role == 'GODOWN')
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const _RfidShell()),
                        );
                      },
                      icon: const Icon(Icons.nfc),
                      label: const Text('Tag enroll & bulk assign'),
                    ),
                  ),
              ],
            )
          : _DeliveriesBody(
              role: widget.role,
              deliveries: _deliveries,
              loading: _loading,
              error: _error,
              onRefresh: _load,
              onScan: (d) {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => DeliveryScanScreen(
                      deliveryId: d.id,
                      deliveryNo: d.deliveryNo,
                      mode: _scanModeFor(d),
                      role: widget.role,
                    ),
                  ),
                ).then((_) => _load());
              },
            ),
    );
  }
}

class _AdminBody extends StatelessWidget {
  final VoidCallback onOpenRfid;

  const _AdminBody({required this.onOpenRfid});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Admin', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(
            'Use the web dashboard for orders and billers. Open RFID tools below for tag enrollment.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: onOpenRfid,
            icon: const Icon(Icons.nfc),
            label: const Text('RFID tag tools'),
          ),
        ],
      ),
    );
  }
}

class _DeliveriesBody extends StatelessWidget {
  final String role;
  final List<DeliveryRow> deliveries;
  final bool loading;
  final String? error;
  final VoidCallback onRefresh;
  final void Function(DeliveryRow) onScan;

  const _DeliveriesBody({
    required this.role,
    required this.deliveries,
    required this.loading,
    this.error,
    required this.onRefresh,
    required this.onScan,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.cyan));
    }
    if (error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(error!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.red)),
              const SizedBox(height: 16),
              FilledButton(onPressed: onRefresh, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }
    if (deliveries.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('No deliveries assigned'),
            const SizedBox(height: 16),
            FilledButton(onPressed: onRefresh, child: const Text('Refresh')),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: deliveries.length,
        itemBuilder: (_, i) {
          final d = deliveries[i];
          return Card(
            color: AppColors.card,
            margin: const EdgeInsets.only(bottom: 10),
            child: ListTile(
              title: Text(d.deliveryNo, style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text('${d.customerName}\n${d.status}${d.vehicleLabel != null ? ' · ${d.vehicleLabel}' : ''}'),
              isThreeLine: true,
              trailing: const Icon(Icons.qr_code_scanner, color: AppColors.cyan),
              onTap: () => onScan(d),
            ),
          );
        },
      ),
    );
  }
}

/// Minimal RFID shell for admin tag enrollment (existing screens).
class _RfidShell extends StatefulWidget {
  const _RfidShell();

  @override
  State<_RfidShell> createState() => _RfidShellState();
}

class _RfidShellState extends State<_RfidShell> {
  int _idx = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('RFID tools')),
      body: IndexedStack(
        index: _idx,
        children: const [
          ProductListScreen(),
          ScanScreen(),
        ],
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
