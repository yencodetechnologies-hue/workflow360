// lib/screens/deliveries_list_screen.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../navigation/nav_config.dart';
import '../services/auth_service.dart';
import '../services/delivery_api.dart';
import '../utils/app_theme.dart';

class DeliveriesListScreen extends StatefulWidget {
  const DeliveriesListScreen({super.key});

  @override
  State<DeliveriesListScreen> createState() => _DeliveriesListScreenState();
}

class _DeliveriesListScreenState extends State<DeliveriesListScreen> {
  List<DeliveryRow> _deliveries = [];
  bool _loading = true;
  String? _error;
  String _q = '';
  String _tab = 'all';
  String _role = 'ADMIN';

  static const _tabs = [
    ('all', 'All'),
    ('OUT_FOR_DELIVERY', 'Out for delivery'),
    ('DELIVERED', 'Delivered'),
    ('RETURN_PICKUP', 'Return pickup'),
    ('PENDING_RETURN', 'Pending return'),
    ('COMPLETED', 'Done'),
  ];

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final user = await AuthService.getUser();
    setState(() => _role = user?.role ?? 'ADMIN');
    _load();
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
      setState(() => _error = e.toString().replaceFirst('ApiException: ', '').replaceFirst('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  List<DeliveryRow> get _filtered {
    final s = _q.trim().toLowerCase();
    return _deliveries.where((d) {
      if (_tab != 'all' && d.status != _tab) return false;
      if (s.isEmpty) return true;
      return d.deliveryNo.toLowerCase().contains(s) ||
          d.customerName.toLowerCase().contains(s) ||
          (d.siteName?.toLowerCase().contains(s) ?? false);
    }).toList();
  }

  void _openScan(DeliveryRow d) {
    final mode = scanModeForDelivery(_role, d.status);
    context.push('/scan/${d.id}', extra: {
      'deliveryNo': d.deliveryNo,
      'mode': mode,
      'role': _role,
    }).then((_) => _load());
  }

  @override
  Widget build(BuildContext context) {
    final canCreate = canCreateDelivery(_role);
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(hintText: 'Search deliveries…', prefixIcon: Icon(Icons.search)),
                  onChanged: (v) => setState(() => _q = v),
                ),
              ),
              if (canCreate) ...[
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: () => context.push('/deliveries/create').then((_) => _load()),
                  icon: const Icon(Icons.add),
                ),
              ],
            ],
          ),
        ),
        SizedBox(
          height: 44,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            children: _tabs.map((t) {
              final active = _tab == t.$1;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: Text(t.$2),
                  selected: active,
                  onSelected: (_) => setState(() => _tab = t.$1),
                ),
              );
            }).toList(),
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
              : _error != null
                  ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.red)))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _filtered.length,
                        itemBuilder: (_, i) {
                          final d = _filtered[i];
                          return Card(
                            color: AppColors.card,
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              title: Text(d.deliveryNo, style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: Text(
                                '${d.customerName}\n'
                                '${deliveryStatusLabel(d.status)}\n'
                                '${d.siteAddress ?? d.siteName ?? ''}',
                              ),
                              isThreeLine: true,
                              trailing: IconButton(
                                icon: const Icon(Icons.qr_code_scanner, color: AppColors.cyan),
                                onPressed: () => _openScan(d),
                              ),
                              onTap: () => context.push('/deliveries/${d.id}').then((_) => _load()),
                            ),
                          );
                        },
                      ),
                    ),
        ),
      ],
    );
  }
}
