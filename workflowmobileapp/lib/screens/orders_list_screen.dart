// lib/screens/orders_list_screen.dart

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/auth_service.dart';
import '../services/order_api.dart';
import '../utils/app_theme.dart';

class OrdersListScreen extends StatefulWidget {
  const OrdersListScreen({super.key});

  @override
  State<OrdersListScreen> createState() => _OrdersListScreenState();
}

class _OrdersListScreenState extends State<OrdersListScreen> {
  List<OrderRow> _orders = [];
  bool _loading = true;
  String? _error;
  String _tab = 'upcoming';
  String? _godownName;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final user = await AuthService.getUser();
    setState(() => _godownName = user?.godownName ?? user?.siteName);
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await OrderApi.listOrders();
      setState(() => _orders = list);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('ApiException: ', '').replaceFirst('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  List<OrderRow> get _filtered {
    if (_tab == 'upcoming') {
      return _orders.where((o) => o.status == 'CREATED' || o.status == 'ALLOCATED').toList();
    }
    return _orders;
  }

  @override
  Widget build(BuildContext context) {
    final df = DateFormat('d MMM yyyy, HH:mm');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Orders', style: Theme.of(context).textTheme.headlineSmall),
              if (_godownName != null)
                Text(
                  _godownName!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.subtext),
                ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              ChoiceChip(
                label: const Text('Upcoming'),
                selected: _tab == 'upcoming',
                onSelected: (_) => setState(() => _tab = 'upcoming'),
              ),
              const SizedBox(width: 8),
              ChoiceChip(
                label: const Text('All'),
                selected: _tab == 'all',
                onSelected: (_) => setState(() => _tab = 'all'),
              ),
            ],
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
              : _error != null
                  ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.red)))
                  : _filtered.isEmpty
                      ? const Center(child: Text('No orders'))
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _filtered.length,
                            itemBuilder: (_, i) {
                              final o = _filtered[i];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 10),
                                child: ListTile(
                                  title: Text(o.customerName, style: const TextStyle(fontWeight: FontWeight.w600)),
                                  subtitle: Text(
                                    '${o.siteName ?? o.siteAddress ?? '—'}\n${df.format(o.deliveryAt)}',
                                  ),
                                  isThreeLine: true,
                                  trailing: Chip(label: Text(o.status, style: const TextStyle(fontSize: 11))),
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
