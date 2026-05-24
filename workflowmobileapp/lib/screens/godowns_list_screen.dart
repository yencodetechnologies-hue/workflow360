// lib/screens/godowns_list_screen.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/auth_service.dart';
import '../services/godown_api.dart';
import '../services/report_api.dart';
import '../utils/app_theme.dart';
import '../utils/delivery_wizard.dart';

class GodownsListScreen extends StatefulWidget {
  const GodownsListScreen({super.key});

  @override
  State<GodownsListScreen> createState() => _GodownsListScreenState();
}

class _GodownsListScreenState extends State<GodownsListScreen> {
  List<GodownRow> _godowns = [];
  Map<String, int> _stockByGodown = {};
  bool _loading = true;
  String? _error;
  String _q = '';
  String _branchFilter = '';
  String _role = '';
  String? _userGodownId;

  bool get _isAdmin => _role == 'ADMIN';
  bool get _showBranchFilter => _isAdmin && _godowns.length > 1;

  List<String> get _branchOptions {
    final set = _godowns.map(godownBranch).toSet();
    final list = set.toList()..sort();
    return list;
  }

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final user = await AuthService.getUser();
    setState(() {
      _role = user?.role ?? '';
      _userGodownId = user?.godownId;
    });
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        GodownApi.listGodowns(),
        ReportApi.stockReport().catchError((_) => <StockRow>[]),
      ]);
      final stock = results[1] as List<StockRow>;
      final map = <String, int>{};
      for (final r in stock) {
        map[r.godownId] = (map[r.godownId] ?? 0) + r.qty;
      }
      var godowns = results[0] as List<GodownRow>;
      if (_role == 'GODOWN' && _userGodownId != null && _userGodownId!.isNotEmpty) {
        godowns = godowns.where((g) => g.id == _userGodownId).toList();
      }
      setState(() {
        _godowns = godowns;
        _stockByGodown = map;
      });
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('ApiException: ', '').replaceFirst('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _showAdd() async {
    final nameCtrl = TextEditingController();
    final codeCtrl = TextEditingController();
    final mobileCtrl = TextEditingController();
    final addressCtrl = TextEditingController();
    final locationCtrl = TextEditingController();
    final cityCtrl = TextEditingController();
    final passCtrl = TextEditingController(text: '123456');
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add godown'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name *')),
              TextField(controller: codeCtrl, decoration: const InputDecoration(labelText: 'Code *')),
              TextField(controller: mobileCtrl, decoration: const InputDecoration(labelText: 'Mobile *'), keyboardType: TextInputType.phone),
              TextField(controller: addressCtrl, decoration: const InputDecoration(labelText: 'Address')),
              TextField(controller: locationCtrl, decoration: const InputDecoration(labelText: 'Location')),
              TextField(controller: cityCtrl, decoration: const InputDecoration(labelText: 'City / branch')),
              TextField(controller: passCtrl, decoration: const InputDecoration(labelText: 'Password *'), obscureText: true),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Create'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await GodownApi.createGodown({
        'name': nameCtrl.text.trim(),
        'code': codeCtrl.text.trim(),
        'mobile': mobileCtrl.text.trim(),
        'address': addressCtrl.text.trim().isEmpty ? null : addressCtrl.text.trim(),
        'location': locationCtrl.text.trim().isEmpty ? null : locationCtrl.text.trim(),
        'city': cityCtrl.text.trim().isEmpty ? null : cityCtrl.text.trim(),
        'password': passCtrl.text,
      });
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  List<GodownRow> get _filtered {
    var list = _godowns;
    if (_branchFilter.isNotEmpty) {
      list = list.where((g) => godownBranch(g) == _branchFilter).toList();
    }
    final s = _q.trim().toLowerCase();
    if (s.isEmpty) return list;
    return list.where((g) {
      final hay = [g.name, g.code, g.address, g.mobile, g.city].whereType<String>().join(' ').toLowerCase();
      return hay.contains(s);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(
            children: [
              if (_showBranchFilter) ...[
                DropdownButtonFormField<String>(
                  value: _branchFilter.isEmpty ? null : _branchFilter,
                  decoration: const InputDecoration(labelText: 'Filter by branch / city'),
                  items: [
                    const DropdownMenuItem(value: '', child: Text('All branches')),
                    ..._branchOptions.map((b) => DropdownMenuItem(value: b, child: Text(b))),
                  ],
                  onChanged: (v) => setState(() => _branchFilter = v ?? ''),
                ),
                const SizedBox(height: 12),
              ],
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      decoration: const InputDecoration(
                        hintText: 'Search godowns…',
                        prefixIcon: Icon(Icons.search),
                      ),
                      onChanged: (v) => setState(() => _q = v),
                    ),
                  ),
                  if (_isAdmin) ...[
                    const SizedBox(width: 8),
                    IconButton.filled(onPressed: _showAdd, icon: const Icon(Icons.add)),
                  ],
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
              : _error != null
                  ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.red)))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemCount: _filtered.length,
                        itemBuilder: (_, i) {
                          final g = _filtered[i];
                          final stock = _stockByGodown[g.id] ?? 0;
                          return Card(
                            color: AppColors.card,
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              title: Text(g.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: Text('${g.code ?? ''} · ${godownBranch(g)} · Stock: $stock units'),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () => context.push('/godowns/${g.id}'),
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
