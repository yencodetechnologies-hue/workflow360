// lib/screens/dashboard_screen.dart

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/auth_service.dart';
import '../services/delivery_api.dart';
import '../services/report_api.dart';
import '../utils/app_theme.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _daily;
  int _stockUnits = 0;
  int _deliveryCount = 0;
  String? _godownLabel;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final user = await AuthService.getUser();
      final godownId = user?.godownId;
      setState(() => _godownLabel = user?.godownName ?? user?.siteName);
      final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
      final results = await Future.wait([
        ReportApi.dailyReport(today),
        ReportApi.stockReport(godownId: godownId),
        DeliveryApi.listDeliveries(limit: 50),
      ]);
      final stock = results[1] as List<StockRow>;
      final deliveries = results[2] as List<DeliveryRow>;
      setState(() {
        _daily = results[0] as Map<String, dynamic>;
        _stockUnits = stock.fold(0, (s, r) => s + r.qty);
        _deliveryCount = deliveries.length;
      });
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('ApiException: ', '').replaceFirst('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: AppColors.cyan));
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error!, style: const TextStyle(color: AppColors.red), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton(onPressed: _load, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }
    final summary = _daily?['summary'] as Map<String, dynamic>? ?? {};
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Dashboard', style: Theme.of(context).textTheme.headlineSmall),
          if (_godownLabel != null) ...[
            const SizedBox(height: 4),
            Text(_godownLabel!, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.subtext)),
          ],
          const SizedBox(height: 4),
          Text('Live KPIs from reports API', style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _KpiCard(label: 'Deliveries today', value: '${summary['total'] ?? _deliveryCount}'),
              _KpiCard(label: 'Upcoming', value: '${summary['upcoming'] ?? 0}'),
              _KpiCard(label: 'Dispatched', value: '${summary['dispatched'] ?? 0}'),
              _KpiCard(label: 'Delivered', value: '${summary['delivered'] ?? 0}'),
              _KpiCard(label: 'Pending return', value: '${summary['pendingReturn'] ?? 0}'),
              _KpiCard(label: 'Stock units', value: '$_stockUnits'),
            ],
          ),
        ],
      ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  final String label;
  final String value;

  const _KpiCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 160,
      child: Card(
        color: AppColors.card,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 8),
              Text(value, style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppColors.cyan)),
            ],
          ),
        ),
      ),
    );
  }
}
