// lib/screens/godowns_list_screen.dart

import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/godown_api.dart';
import '../services/report_api.dart';
import '../utils/app_theme.dart';
import '../utils/delivery_wizard.dart';
import '../widgets/shared_widgets.dart';
import '../widgets/godown_sheets.dart';

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
  String? _branchFilter;
  String _role = '';
  String? _userGodownId;

  bool get _isAdmin => _role == 'ADMIN';
  bool get _showBranchFilter => _isAdmin && _godowns.length > 1;

  List<String> get _branchOptions {
    final set = _godowns.map(godownBranch).toSet();
    final list = set.toList()..sort();
    return list;
  }

  Map<String, int> get _branchCounts {
    final map = <String, int>{};
    for (final g in _godowns) {
      final b = godownBranch(g);
      map[b] = (map[b] ?? 0) + 1;
    }
    return map;
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
    final created = await showGodownCreateSheet(context);
    if (created != null && mounted) _load();
  }

  List<GodownRow> get _filtered {
    var list = _godowns;
    final branch = _branchFilter?.trim();
    if (branch != null && branch.isNotEmpty) {
      list = list.where((g) => godownBranch(g) == branch).toList();
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
                BranchFilterPicker(
                  label: 'Filter by branch / city',
                  value: _branchFilter,
                  options: _branchOptions,
                  counts: _branchCounts,
                  onChanged: (v) => setState(() => _branchFilter = v),
                ),
                const SizedBox(height: 12),
              ],
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      decoration: const InputDecoration(
                        hintText: 'Search godowns…',
                        prefixIcon: Icon(Icons.search, color: AppColors.subtext),
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
                          final branch = godownBranch(g);
                          return Card(
                            color: AppColors.card,
                            margin: const EdgeInsets.only(bottom: 10),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(16),
                              onTap: () => showGodownPreviewSheet(
                                    context,
                                    godown: g,
                                    stock: stock,
                                  ),
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 44,
                                      height: 44,
                                      decoration: BoxDecoration(
                                        gradient: AppGradients.brandIcon,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: const Icon(
                                        Icons.warehouse_outlined,
                                        color: Colors.white,
                                        size: 24,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            g.name,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w600,
                                              fontSize: 15,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            [
                                              if (g.code != null && g.code!.isNotEmpty) g.code,
                                              branch,
                                            ].join(' · '),
                                            style: const TextStyle(
                                              color: AppColors.subtext,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Text(
                                          '$stock',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w700,
                                            fontSize: 16,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                        const Text(
                                          'units',
                                          style: TextStyle(
                                            color: AppColors.subtext,
                                            fontSize: 10,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(width: 4),
                                    const Icon(
                                      Icons.chevron_right,
                                      color: AppColors.subtext,
                                    ),
                                  ],
                                ),
                              ),
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
