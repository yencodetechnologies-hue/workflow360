// lib/screens/queue_screen.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../services/godown_api.dart';
import '../utils/app_theme.dart';

class QueueScreen extends StatefulWidget {
  const QueueScreen({super.key});

  @override
  State<QueueScreen> createState() => _QueueScreenState();
}

class _QueueScreenState extends State<QueueScreen> {
  DateTime _date = DateTime.now();
  List<QueueRow> _rows = [];
  bool _loading = true;
  String? _error;

  String get _dateKey => DateFormat('yyyy-MM-dd').format(_date);

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
      final rows = await GodownApi.queueByDate(_dateKey);
      setState(() => _rows = rows);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('ApiException: ', '').replaceFirst('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (picked != null) {
      setState(() => _date = picked);
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Text('Godown queue', style: Theme.of(context).textTheme.titleLarge),
              ),
              OutlinedButton.icon(
                onPressed: _pickDate,
                icon: const Icon(Icons.calendar_today, size: 18),
                label: Text(_dateKey),
              ),
            ],
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
              : _error != null
                  ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.red)))
                  : _rows.isEmpty
                      ? const Center(child: Text('No deliveries scheduled'))
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            itemCount: _rows.length,
                            itemBuilder: (_, i) {
                              final d = _rows[i];
                              return Card(
                                color: AppColors.card,
                                margin: const EdgeInsets.only(bottom: 8),
                                child: ListTile(
                                  title: Text(d.deliveryNo, style: const TextStyle(fontWeight: FontWeight.w600)),
                                  subtitle: Text('${d.customerName}\n${d.siteName ?? d.siteAddress ?? ''}'),
                                  isThreeLine: true,
                                  trailing: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(d.status, style: const TextStyle(fontSize: 12, color: AppColors.cyan)),
                                      Text(
                                        DateFormat.Hm().format(DateTime.parse(d.deliveryAt).toLocal()),
                                        style: Theme.of(context).textTheme.bodySmall,
                                      ),
                                    ],
                                  ),
                                  onTap: () => context.push('/deliveries/${d.id}'),
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
