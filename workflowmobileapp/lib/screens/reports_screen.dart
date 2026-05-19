// lib/screens/reports_screen.dart

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/auth_service.dart';
import '../services/report_api.dart';
import '../utils/app_theme.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  DateTime _date = DateTime.now();
  Map<String, dynamic>? _daily;
  List<dynamic> _missing = [];
  List<StockRow>? _stock;
  List<dynamic>? _customerHistory;
  final _customerQ = TextEditingController();
  bool _loading = false;
  String? _error;
  String _role = 'ADMIN';

  String get _dateKey => DateFormat('yyyy-MM-dd').format(_date);

  bool get _canLoadStock => _role == 'ADMIN' || _role == 'GODOWN';

  bool get _canCustomerHistory => _role == 'ADMIN' || _role == 'BILLER';

  @override
  void dispose() {
    _customerQ.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final user = await AuthService.getUser();
    setState(() => _role = user?.role ?? 'ADMIN');
    _loadDaily();
    _loadMissing();
  }

  Future<void> _loadDaily() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final report = await ReportApi.dailyReport(_dateKey);
      setState(() => _daily = report);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _loadMissing() async {
    try {
      final rows = await ReportApi.missingItems();
      setState(() => _missing = rows);
    } catch (_) {}
  }

  Future<void> _loadStock() async {
    setState(() => _loading = true);
    try {
      final rows = await ReportApi.stockReport();
      setState(() => _stock = rows);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _searchCustomer() async {
    final q = _customerQ.text.trim();
    if (q.isEmpty) return;
    setState(() => _loading = true);
    try {
      final rows = await ReportApi.customerHistory(q);
      setState(() => _customerHistory = rows);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final summary = _daily?['summary'] as Map<String, dynamic>? ?? {};
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Expanded(child: Text('Reports', style: Theme.of(context).textTheme.titleLarge)),
            OutlinedButton(
              onPressed: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _date,
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2030),
                );
                if (picked != null) {
                  setState(() => _date = picked);
                  _loadDaily();
                }
              },
              child: Text(_dateKey),
            ),
          ],
        ),
        if (_loading) const LinearProgressIndicator(color: AppColors.cyan),
        if (_error != null) Text(_error!, style: const TextStyle(color: AppColors.red)),
        const SizedBox(height: 12),
        ExpansionTile(
          title: const Text('Daily delivery report'),
          initiallyExpanded: true,
          children: [
            ListTile(title: const Text('Total'), trailing: Text('${summary['total'] ?? '—'}')),
            ListTile(title: const Text('Upcoming'), trailing: Text('${summary['upcoming'] ?? '—'}')),
            ListTile(title: const Text('Dispatched'), trailing: Text('${summary['dispatched'] ?? '—'}')),
            ListTile(title: const Text('Delivered'), trailing: Text('${summary['delivered'] ?? '—'}')),
            ListTile(title: const Text('Pending return'), trailing: Text('${summary['pendingReturn'] ?? '—'}')),
          ],
        ),
        ExpansionTile(
          title: Text('Missing / pending returns (${_missing.length})'),
          children: _missing.isEmpty
              ? [const ListTile(title: Text('None'))]
              : _missing.take(20).map((m) {
                  final map = m as Map<String, dynamic>;
                  return ListTile(
                    title: Text(map['deliveryNo']?.toString() ?? '—'),
                    subtitle: Text(map['customerName']?.toString() ?? ''),
                  );
                }).toList(),
        ),
        if (_canLoadStock)
          ExpansionTile(
            title: Text('Stock report${_stock != null ? ' (${_stock!.length})' : ''}'),
            onExpansionChanged: (open) {
              if (open && _stock == null) _loadStock();
            },
            children: _stock == null
                ? [const ListTile(title: Text('Tap to load'))]
                : _stock!.take(30).map((s) => ListTile(
                      title: Text(s.particulars ?? s.productId),
                      subtitle: Text('Godown ${s.godownId}'),
                      trailing: Text('${s.qty}'),
                    )).toList(),
          ),
        if (_canCustomerHistory)
          ExpansionTile(
            title: const Text('Customer history'),
            children: [
              Padding(
                padding: const EdgeInsets.all(8),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _customerQ,
                        decoration: const InputDecoration(hintText: 'Search customer…'),
                      ),
                    ),
                    IconButton.filled(onPressed: _searchCustomer, icon: const Icon(Icons.search)),
                  ],
                ),
              ),
              if (_customerHistory == null)
                const ListTile(title: Text('Search to load'))
              else if (_customerHistory!.isEmpty)
                const ListTile(title: Text('No results'))
              else
                ..._customerHistory!.take(20).map((h) {
                  final map = h as Map<String, dynamic>;
                  return ListTile(
                    title: Text(map['customerName']?.toString() ?? '—'),
                    subtitle: Text(map['deliveryNo']?.toString() ?? ''),
                  );
                }),
            ],
          ),
      ],
    );
  }
}
