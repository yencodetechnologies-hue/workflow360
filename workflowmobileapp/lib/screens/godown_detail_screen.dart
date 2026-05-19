// lib/screens/godown_detail_screen.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/auth_service.dart';
import '../services/delivery_api.dart';
import '../services/godown_api.dart';
import '../services/report_api.dart';
import '../utils/app_theme.dart';

class _StockDisplay {
  final String productId;
  final int qty;
  final String name;
  final String sku;

  _StockDisplay({
    required this.productId,
    required this.qty,
    required this.name,
    required this.sku,
  });
}

class GodownDetailScreen extends StatefulWidget {
  final String godownId;

  const GodownDetailScreen({super.key, required this.godownId});

  @override
  State<GodownDetailScreen> createState() => _GodownDetailScreenState();
}

class _GodownDetailScreenState extends State<GodownDetailScreen> with SingleTickerProviderStateMixin {
  GodownRow? _godown;
  List<CatalogRow> _catalog = [];
  List<StockRow> _stock = [];
  List<DeliveryRow> _deliveries = [];
  bool _loading = true;
  String? _error;
  String _role = '';
  String? _userGodownId;
  TabController? _tabs;

  final _editName = TextEditingController();
  final _editCode = TextEditingController();
  final _editAddress = TextEditingController();
  final _editMobile = TextEditingController();
  final _editLocation = TextEditingController();
  final _editPassword = TextEditingController();
  bool _editSaving = false;

  bool get _canEditGodown =>
      _role == 'ADMIN' || (_role == 'GODOWN' && _userGodownId == widget.godownId);

  bool get _canAssignRfid => _canEditGodown;

  void _openAssignRfid(String productId) {
    context.push('/godowns/${widget.godownId}/assign-rfid?productId=${Uri.encodeComponent(productId)}')
        .then((result) {
      if (result == true && mounted) _load();
    });
  }

  List<_StockDisplay> get _stockDisplay {
    final catalogById = {for (final c in _catalog) c.productId: c};
    return _stock.map((s) {
      final p = catalogById[s.productId];
      return _StockDisplay(
        productId: s.productId,
        qty: s.qty,
        name: p?.particulars ?? s.particulars ?? s.productId,
        sku: p?.sku ?? s.sku ?? '—',
      );
    }).toList()
      ..sort((a, b) => a.name.compareTo(b.name));
  }

  int get _tabCount => _canEditGodown ? 4 : 3;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final user = await AuthService.getUser();
    final role = user?.role ?? 'ADMIN';
    setState(() {
      _role = role;
      _userGodownId = user?.godownId;
    });
    _syncTabController();
    await _load();
  }

  void _syncTabController() {
    final count = _tabCount;
    if (_tabs != null && _tabs!.length == count) return;
    _tabs?.dispose();
    _tabs = TabController(length: count, vsync: this);
  }

  @override
  void dispose() {
    _tabs?.dispose();
    _editName.dispose();
    _editCode.dispose();
    _editAddress.dispose();
    _editMobile.dispose();
    _editLocation.dispose();
    _editPassword.dispose();
    super.dispose();
  }

  void _fillEditForm(GodownRow g) {
    _editName.text = g.name;
    _editCode.text = g.code ?? '';
    _editAddress.text = g.address ?? '';
    _editMobile.text = g.mobile ?? '';
    _editLocation.text = g.location ?? '';
    _editPassword.clear();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final g = await GodownApi.getGodown(widget.godownId);
      final catalogFuture = GodownApi.listProducts(widget.godownId);
      final stockFuture = ReportApi.stockReport(godownId: widget.godownId);
      final deliveriesFuture = DeliveryApi.listDeliveries(limit: 50);

      final catalog = await catalogFuture;
      List<StockRow> stock;
      List<DeliveryRow> allDel;
      try {
        stock = await stockFuture;
      } catch (_) {
        stock = [];
      }
      try {
        allDel = await deliveriesFuture;
      } catch (_) {
        allDel = [];
      }

      catalog.sort((a, b) => (a.particulars ?? '').compareTo(b.particulars ?? ''));
      if (!mounted) return;
      setState(() {
        _godown = g;
        _catalog = catalog;
        _stock = stock;
        _deliveries = allDel.where((d) => d.fromGodownId == widget.godownId).take(20).toList();
        _fillEditForm(g);
      });
      _syncTabController();
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString().replaceFirst('ApiException: ', '').replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _saveGodown() async {
    if (!_canEditGodown || _godown == null) return;
    setState(() => _editSaving = true);
    try {
      final body = <String, dynamic>{
        'name': _editName.text.trim(),
        'code': _editCode.text.trim(),
        'address': _editAddress.text.trim(),
        'mobile': _editMobile.text.trim(),
        'location': _editLocation.text.trim(),
      };
      if (_editPassword.text.isNotEmpty) body['password'] = _editPassword.text;
      await GodownApi.updateGodown(widget.godownId, body);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Godown updated')));
        _load();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _editSaving = false);
    }
  }

  Future<void> _toggleCatalog(CatalogRow c) async {
    if (!_canEditGodown) return;
    try {
      await GodownApi.patchProduct(widget.godownId, c.productId, !c.enabled);
      await _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _adjustStock(String productId, {String? label}) async {
    if (!_canEditGodown) return;
    final deltaCtrl = TextEditingController();
    final noteCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(label != null ? 'Adjust stock — $label' : 'Adjust stock'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: deltaCtrl,
              decoration: const InputDecoration(labelText: 'Delta (+/- units)'),
              keyboardType: const TextInputType.numberWithOptions(signed: true),
            ),
            TextField(
              controller: noteCtrl,
              decoration: const InputDecoration(labelText: 'Note (optional)'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Apply')),
        ],
      ),
    );
    if (ok != true) return;
    final delta = int.tryParse(deltaCtrl.text.trim()) ?? 0;
    if (delta == 0) return;
    try {
      await GodownApi.adjustInventory(
        widget.godownId,
        productId,
        delta,
        noteCtrl.text.trim().isEmpty ? 'Mobile adjust' : noteCtrl.text.trim(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Stock updated')));
        await _load();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Widget _refreshable(Widget child) {
    return RefreshIndicator(
      onRefresh: _load,
      color: AppColors.cyan,
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _tabs == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppColors.cyan)));
    }
    if (_error != null || _godown == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Godown')),
        body: Center(child: Text(_error ?? 'Not found', style: const TextStyle(color: AppColors.red))),
      );
    }
    final g = _godown!;
    final stockRows = _stockDisplay;
    final tabs = <Tab>[
      const Tab(text: 'Catalog'),
      const Tab(text: 'Stock'),
      const Tab(text: 'Deliveries'),
      if (_canEditGodown) const Tab(text: 'Edit'),
    ];
    final views = <Widget>[
      _refreshable(
        _catalog.isEmpty
            ? ListView(children: const [SizedBox(height: 120), Center(child: Text('No products in catalog'))])
            : ListView.builder(
                physics: const AlwaysScrollableScrollPhysics(),
                itemCount: _catalog.length,
                itemBuilder: (_, i) {
                  final c = _catalog[i];
                  return SwitchListTile(
                    title: Text(c.particulars ?? c.productId),
                    subtitle: Text('${c.sku ?? c.productId} · ${c.enabled ? 'On' : 'Off'}'),
                    value: c.enabled,
                    onChanged: _canEditGodown ? (_) => _toggleCatalog(c) : null,
                    secondary: c.enabled && _canAssignRfid
                        ? TextButton(
                            onPressed: () => _openAssignRfid(c.productId),
                            child: const Text('Assign RFID'),
                          )
                        : null,
                  );
                },
              ),
      ),
      _refreshable(
        stockRows.isEmpty
            ? ListView(children: const [SizedBox(height: 120), Center(child: Text('No stock records'))])
            : ListView.builder(
                physics: const AlwaysScrollableScrollPhysics(),
                itemCount: stockRows.length,
                itemBuilder: (_, i) {
                  final s = stockRows[i];
                  var productEnabled = false;
                  for (final c in _catalog) {
                    if (c.productId == s.productId) {
                      productEnabled = c.enabled;
                      break;
                    }
                  }
                  return ListTile(
                    title: Text(s.name),
                    subtitle: Text(s.sku),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('${s.qty}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.cyan)),
                        if (_canAssignRfid && productEnabled)
                          TextButton(
                            onPressed: () => _openAssignRfid(s.productId),
                            child: const Text('Assign RFID'),
                          ),
                        if (_canEditGodown)
                          IconButton(
                            icon: const Icon(Icons.edit),
                            onPressed: () => _adjustStock(s.productId, label: s.name),
                          ),
                      ],
                    ),
                  );
                },
              ),
      ),
      _refreshable(
        _deliveries.isEmpty
            ? ListView(children: const [SizedBox(height: 120), Center(child: Text('No deliveries'))])
            : ListView.builder(
                physics: const AlwaysScrollableScrollPhysics(),
                itemCount: _deliveries.length,
                itemBuilder: (_, i) {
                  final d = _deliveries[i];
                  return ListTile(
                    title: Text(d.deliveryNo),
                    subtitle: Text('${d.customerName} · ${d.status}'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/deliveries/${d.id}'),
                  );
                },
              ),
      ),
      if (_canEditGodown)
        _refreshable(
          ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            children: [
              TextField(controller: _editName, decoration: const InputDecoration(labelText: 'Name')),
              TextField(controller: _editCode, decoration: const InputDecoration(labelText: 'Code')),
              TextField(controller: _editAddress, decoration: const InputDecoration(labelText: 'Address')),
              TextField(controller: _editMobile, decoration: const InputDecoration(labelText: 'Mobile'), keyboardType: TextInputType.phone),
              TextField(controller: _editLocation, decoration: const InputDecoration(labelText: 'Location')),
              TextField(
                controller: _editPassword,
                decoration: const InputDecoration(labelText: 'New password (optional)'),
                obscureText: true,
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _editSaving ? null : _saveGodown,
                child: Text(_editSaving ? 'Saving…' : 'Save changes'),
              ),
            ],
          ),
        ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(g.name),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
        bottom: TabBar(
          controller: _tabs!,
          isScrollable: tabs.length > 3,
          tabs: tabs,
        ),
      ),
      body: TabBarView(
        controller: _tabs!,
        children: views,
      ),
    );
  }
}
