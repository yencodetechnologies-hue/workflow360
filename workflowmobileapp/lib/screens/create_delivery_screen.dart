// lib/screens/create_delivery_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../services/delivery_api.dart';
import '../services/godown_api.dart';
import '../services/report_api.dart';
import '../services/user_api.dart';
import '../utils/app_theme.dart';
import '../utils/delivery_wizard.dart';
import '../widgets/shared_widgets.dart';

class CreateDeliveryScreen extends StatefulWidget {
  const CreateDeliveryScreen({super.key});

  @override
  State<CreateDeliveryScreen> createState() => _CreateDeliveryScreenState();
}

class _CreateDeliveryScreenState extends State<CreateDeliveryScreen> {
  int _step = 1;
  String? _error;
  bool _busy = false;
  bool _productsLoading = false;

  List<UserRow> _billers = [];
  String? _billerId;
  bool _createBillerMode = false;
  final _newBillerSite = TextEditingController();
  final _newBillerContactName = TextEditingController();
  final _newBillerPhone = TextEditingController();
  final _newBillerAddress = TextEditingController();
  final _newBillerEmail = TextEditingController();

  List<GodownRow> _godowns = [];
  final Set<String> _selectedGodowns = {};
  String? _branchFilter;
  bool _createGodownOpen = false;
  final _newGodownName = TextEditingController();
  final _newGodownCode = TextEditingController();
  final _newGodownMobile = TextEditingController();
  final _newGodownPassword = TextEditingController(text: '123456');
  final _newGodownAddress = TextEditingController();
  final _newGodownLocation = TextEditingController();
  final _newGodownCity = TextEditingController();

  final Map<String, int> _lineQty = {};
  String? _activeGodown;
  Map<String, List<StockedProduct>> _godownProducts = {};
  String _productSearch = '';

  final _customerName = TextEditingController();
  final _siteName = TextEditingController();
  final _siteAddress = TextEditingController();
  final _contactPhone = TextEditingController();
  final _vehicleLabel = TextEditingController();
  DateTime _deliveryAt = DateTime.now().add(const Duration(hours: 2));
  DateTime? _returnAt;

  CreateDeliveryResult? _created;

  @override
  void initState() {
    super.initState();
    _loadBase();
  }

  @override
  void dispose() {
    _newBillerSite.dispose();
    _newBillerContactName.dispose();
    _newBillerPhone.dispose();
    _newBillerAddress.dispose();
    _newBillerEmail.dispose();
    _newGodownName.dispose();
    _newGodownCode.dispose();
    _newGodownMobile.dispose();
    _newGodownPassword.dispose();
    _newGodownAddress.dispose();
    _newGodownLocation.dispose();
    _newGodownCity.dispose();
    _customerName.dispose();
    _siteName.dispose();
    _siteAddress.dispose();
    _contactPhone.dispose();
    _vehicleLabel.dispose();
    super.dispose();
  }

  Future<void> _loadBase() async {
    try {
      final billers = await UserApi.listBillers();
      final godowns = await GodownApi.listGodowns();
      setState(() {
        _billers = billers;
        _createBillerMode = billers.isEmpty;
        if (billers.isNotEmpty) {
          _billerId = billers.first.id;
          _applyBillerFields(billers.first);
        }
        _godowns = godowns;
      });
    } catch (e) {
      setState(() => _error = '$e');
    }
  }

  void _applyBillerFields(UserRow b) {
    _siteName.text = b.siteName ?? '';
    _contactPhone.text = b.contactPhone ?? '';
    _customerName.text = b.siteName ?? b.contactName ?? b.email?.split('@').first ?? '';
    _siteAddress.text = b.siteAddress ?? '';
  }

  List<String> get _branchOptions {
    final set = _godowns.map(godownBranch).toSet();
    return set.toList()..sort();
  }

  Map<String, int> get _branchCounts {
    final map = <String, int>{};
    for (final g in _godowns) {
      final b = godownBranch(g);
      map[b] = (map[b] ?? 0) + 1;
    }
    return map;
  }

  List<GodownRow> get _godownsInBranch {
    final branch = _branchFilter?.trim();
    if (branch == null || branch.isEmpty) return _godowns;
    return _godowns.where((g) => godownBranch(g) == branch).toList();
  }

  int get _totalUnits => _lineQty.values.where((q) => q > 0).fold(0, (a, b) => a + b);

  Future<void> _loadGodownProducts(String godownId) async {
    if (_godownProducts.containsKey(godownId)) return;
    setState(() => _productsLoading = true);
    try {
      final catalog = await GodownApi.listProducts(godownId);
      final stock = await ReportApi.stockReport(godownId: godownId);
      final stockMap = {for (final s in stock) s.productId: s.qty};
      final stocked = catalog
          .where((c) => c.enabled && (stockMap[c.productId] ?? 0) > 0)
          .map((c) => StockedProduct(catalog: c, stockQty: stockMap[c.productId] ?? 0))
          .toList()
        ..sort((a, b) => (a.catalog.particulars ?? '').compareTo(b.catalog.particulars ?? ''));
      setState(() {
        _godownProducts[godownId] = stocked;
        _activeGodown ??= godownId;
      });
    } catch (e) {
      setState(() => _godownProducts[godownId] = []);
    } finally {
      setState(() => _productsLoading = false);
    }
  }

  void _toggleGodown(String id, bool? selected) {
    setState(() {
      if (selected == true) {
        _selectedGodowns.add(id);
        _activeGodown = id;
        _loadGodownProducts(id);
      } else {
        _selectedGodowns.remove(id);
        _lineQty.removeWhere((k, _) => k.startsWith('$id:'));
        _godownProducts.remove(id);
        if (_activeGodown == id) {
          _activeGodown = _selectedGodowns.isEmpty ? null : _selectedGodowns.first;
        }
      }
    });
  }

  Future<void> _createGodownInline() async {
    if (_newGodownName.text.trim().isEmpty ||
        _newGodownCode.text.trim().isEmpty ||
        _newGodownMobile.text.trim().isEmpty ||
        _newGodownPassword.text.length < 6) {
      setState(() => _error = 'Godown name, code, mobile, and password (min 6) are required');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final created = await GodownApi.createGodown({
        'name': _newGodownName.text.trim(),
        'code': _newGodownCode.text.trim(),
        'address': _newGodownAddress.text.trim().isEmpty ? null : _newGodownAddress.text.trim(),
        'mobile': _newGodownMobile.text.trim(),
        'location': _newGodownLocation.text.trim().isEmpty ? null : _newGodownLocation.text.trim(),
        'city': _newGodownCity.text.trim().isEmpty ? null : _newGodownCity.text.trim(),
        'password': _newGodownPassword.text,
      });
      setState(() {
        _godowns = [..._godowns, created]..sort((a, b) => a.name.compareTo(b.name));
        _branchFilter = godownBranch(created);
        _selectedGodowns.add(created.id);
        _activeGodown = created.id;
        _createGodownOpen = false;
        _newGodownName.clear();
        _newGodownCode.clear();
        _newGodownMobile.clear();
        _newGodownPassword.text = '123456';
        _newGodownAddress.clear();
        _newGodownLocation.clear();
        _newGodownCity.clear();
      });
      await _loadGodownProducts(created.id);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      setState(() => _busy = false);
    }
  }

  List<Map<String, dynamic>> get _linesPayload {
    final lines = <Map<String, dynamic>>[];
    for (final e in _lineQty.entries) {
      if (e.value <= 0) continue;
      final sep = e.key.indexOf(':');
      if (sep <= 0) continue;
      lines.add({
        'godownId': e.key.substring(0, sep),
        'productId': e.key.substring(sep + 1),
        'qty': e.value,
      });
    }
    return lines;
  }

  Future<void> _pickDateTime(DateTime initial, void Function(DateTime) onSet) async {
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time == null) return;
    onSet(DateTime(date.year, date.month, date.day, time.hour, time.minute));
  }

  Future<void> _next() async {
    setState(() => _error = null);
    if (_step == 1) {
      if ((_createBillerMode || _billers.isEmpty) && _billerId == null) {
        if (_newBillerSite.text.trim().isEmpty) {
          setState(() => _error = 'Site name required for new biller');
          return;
        }
        setState(() => _busy = true);
        try {
          final created = await UserApi.createBiller({
            'siteName': _newBillerSite.text.trim(),
            'siteAddress': _newBillerAddress.text.trim().isEmpty ? null : _newBillerAddress.text.trim(),
            'contactName': _newBillerContactName.text.trim().isEmpty ? null : _newBillerContactName.text.trim(),
            'contactPhone': _newBillerPhone.text.trim().isEmpty ? null : _newBillerPhone.text.trim(),
            'email': _newBillerEmail.text.trim().isEmpty ? null : _newBillerEmail.text.trim(),
            'password': '123456',
          });
          setState(() {
            _billers.add(created);
            _billerId = created.id;
            _createBillerMode = false;
            _applyBillerFields(created);
          });
        } catch (e) {
          setState(() => _error = '$e');
          return;
        } finally {
          setState(() => _busy = false);
        }
      }
      if (_billerId == null) {
        setState(() => _error = 'Select a biller');
        return;
      }
      setState(() => _step = 2);
      return;
    }
    if (_step == 2) {
      if (_selectedGodowns.isEmpty) {
        setState(() => _error = 'Select at least one godown');
        return;
      }
      for (final gid in _selectedGodowns) {
        await _loadGodownProducts(gid);
      }
      setState(() {
        _step = 3;
        _activeGodown ??= _selectedGodowns.first;
      });
      return;
    }
    if (_step == 3) {
      if (_linesPayload.isEmpty) {
        setState(() => _error = 'Add at least one product line');
        return;
      }
      setState(() => _step = 4);
      return;
    }
    if (_customerName.text.trim().isEmpty) {
      setState(() => _error = 'Customer name required');
      return;
    }
    setState(() => _busy = true);
    try {
      final res = await DeliveryApi.createDelivery({
        'billerUserId': _billerId,
        'fromGodownId': _selectedGodowns.first,
        'customerName': _customerName.text.trim(),
        'siteName': _siteName.text.trim().isEmpty ? null : _siteName.text.trim(),
        'siteAddress': _siteAddress.text.trim().isEmpty ? null : _siteAddress.text.trim(),
        'contactPhone': _contactPhone.text.trim().isEmpty ? null : _contactPhone.text.trim(),
        'deliveryAt': _deliveryAt.toUtc().toIso8601String(),
        'returnExpectedAt': _returnAt?.toUtc().toIso8601String(),
        'vehicleLabel': _vehicleLabel.text.trim().isEmpty ? null : _vehicleLabel.text.trim(),
        'lines': _linesPayload,
      });
      setState(() => _created = res);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      setState(() => _busy = false);
    }
  }

  void _copy(String? text) {
    if (text == null || text.isEmpty) return;
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copied')));
  }

  @override
  Widget build(BuildContext context) {
    if (_created != null) {
      final c = _created!;
      return Scaffold(
        appBar: AppBar(title: const Text('Delivery created')),
        body: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Icon(Icons.check_circle, size: 64, color: AppColors.green),
            const SizedBox(height: 16),
            Text('${c.deliveryNo} created', style: Theme.of(context).textTheme.titleLarge, textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(
              'Share the links below with your delivery person and biller.',
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            if (c.deliveryVerifyUrl != null)
              _LinkCard(
                label: 'Delivery verify link',
                description: 'For the delivery person to confirm handover',
                url: c.deliveryVerifyUrl!,
                onCopy: () => _copy(c.deliveryVerifyUrl),
              ),
            if (c.billerReturnUrl != null) ...[
              const SizedBox(height: 12),
              _LinkCard(
                label: 'Biller return link',
                description: 'For the biller to confirm equipment return',
                url: c.billerReturnUrl!,
                onCopy: () => _copy(c.billerReturnUrl),
              ),
            ],
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => context.go('/deliveries/${c.id}'),
              child: const Text('Open delivery details'),
            ),
            TextButton(onPressed: () => context.go('/deliveries'), child: const Text('Back to list')),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text('Create delivery · Step $_step/4')),
      body: Column(
        children: [
          LinearProgressIndicator(value: _step / 4, color: AppColors.cyan),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.all(12),
              child: Text(_error!, style: const TextStyle(color: AppColors.red)),
            ),
          Expanded(child: _buildStep()),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                TextButton(
                  onPressed: _step <= 1 ? () => context.pop() : () => setState(() => _step--),
                  child: Text(_step <= 1 ? 'Cancel' : 'Back'),
                ),
                const Spacer(),
                FilledButton(
                  onPressed: _busy ? null : _next,
                  child: Text(_busy ? 'Saving…' : _step == 4 ? 'Create' : 'Continue'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case 1:
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Select biller', style: TextStyle(fontWeight: FontWeight.w600)),
            if (_billers.isNotEmpty && !_createBillerMode)
              ..._billers.map((b) => RadioListTile<String>(
                    title: Text(b.siteName ?? b.email ?? b.id),
                    subtitle: b.contactPhone != null ? Text(b.contactPhone!) : null,
                    value: b.id,
                    groupValue: _billerId,
                    onChanged: (v) => setState(() {
                      _billerId = v;
                      final biller = _billers.firstWhere((x) => x.id == v);
                      _applyBillerFields(biller);
                    }),
                  )),
            if (_billers.isNotEmpty)
              TextButton(
                onPressed: () => setState(() => _createBillerMode = !_createBillerMode),
                child: Text(_createBillerMode ? 'Pick existing biller' : 'Register new biller'),
              ),
            if (_createBillerMode || _billers.isEmpty) ...[
              const Text('New biller (default password: 123456)', style: TextStyle(fontSize: 12, color: AppColors.subtext)),
              TextField(controller: _newBillerSite, decoration: const InputDecoration(labelText: 'Company / site name *')),
              TextField(controller: _newBillerContactName, decoration: const InputDecoration(labelText: 'Contact person')),
              TextField(controller: _newBillerPhone, decoration: const InputDecoration(labelText: 'Mobile number'), keyboardType: TextInputType.phone),
              TextField(controller: _newBillerAddress, decoration: const InputDecoration(labelText: 'Site address')),
              TextField(controller: _newBillerEmail, decoration: const InputDecoration(labelText: 'Email (optional login)')),
            ],
          ],
        );
      case 2:
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Select godown sources', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            BranchFilterPicker(
              label: 'Filter by branch / city',
              value: _branchFilter,
              options: _branchOptions,
              counts: _branchCounts,
              onChanged: (v) => setState(() => _branchFilter = v),
            ),
            const SizedBox(height: 8),
            ..._godownsInBranch.map((g) {
              final sel = _selectedGodowns.contains(g.id);
              return CheckboxListTile(
                title: Text(g.name),
                subtitle: Text('${g.code ?? ''} · ${godownBranch(g)}'),
                value: sel,
                onChanged: (v) => _toggleGodown(g.id, v),
              );
            }),
            const Divider(),
            TextButton.icon(
              onPressed: () => setState(() => _createGodownOpen = !_createGodownOpen),
              icon: Icon(_createGodownOpen ? Icons.expand_less : Icons.add),
              label: Text(_createGodownOpen ? 'Hide new godown form' : 'Add new godown'),
            ),
            if (_createGodownOpen) ...[
              TextField(controller: _newGodownName, decoration: const InputDecoration(labelText: 'Name *')),
              TextField(controller: _newGodownCode, decoration: const InputDecoration(labelText: 'Code *')),
              TextField(controller: _newGodownMobile, decoration: const InputDecoration(labelText: 'Mobile *'), keyboardType: TextInputType.phone),
              TextField(controller: _newGodownPassword, decoration: const InputDecoration(labelText: 'Password *'), obscureText: true),
              TextField(controller: _newGodownAddress, decoration: const InputDecoration(labelText: 'Address')),
              TextField(controller: _newGodownLocation, decoration: const InputDecoration(labelText: 'Location')),
              TextField(controller: _newGodownCity, decoration: const InputDecoration(labelText: 'City / branch')),
              FilledButton(
                onPressed: _busy ? null : _createGodownInline,
                child: Text(_busy ? 'Creating…' : 'Create godown'),
              ),
            ],
          ],
        );
      case 3:
        final gid = _activeGodown;
        final products = gid == null ? <StockedProduct>[] : (_godownProducts[gid] ?? []);
        final q = _productSearch.trim().toLowerCase();
        final filtered = q.isEmpty
            ? products
            : products.where((p) {
                final c = p.catalog;
                return (c.particulars?.toLowerCase().contains(q) ?? false) ||
                    (c.sku?.toLowerCase().contains(q) ?? false);
              }).toList();
        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Row(
                children: [
                  Expanded(child: Text('Total units: $_totalUnits', style: const TextStyle(fontWeight: FontWeight.w600))),
                  if (_productsLoading) const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                ],
              ),
            ),
            SizedBox(
              height: 48,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                children: _selectedGodowns.map((id) {
                  final g = _godowns.firstWhere((x) => x.id == id);
                  final units = _lineQty.entries
                      .where((e) => e.key.startsWith('$id:') && e.value > 0)
                      .fold(0, (a, e) => a + e.value);
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text('${g.name}${units > 0 ? ' ($units)' : ''}'),
                      selected: _activeGodown == id,
                      onSelected: (_) => setState(() {
                        _activeGodown = id;
                        _productSearch = '';
                        _loadGodownProducts(id);
                      }),
                    ),
                  );
                }).toList(),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: TextField(
                decoration: const InputDecoration(
                  hintText: 'Search products…',
                  prefixIcon: Icon(Icons.search),
                  isDense: true,
                ),
                onChanged: (v) => setState(() => _productSearch = v),
              ),
            ),
            Expanded(
              child: filtered.isEmpty
                  ? Center(
                      child: Text(
                        _productsLoading ? 'Loading products…' : 'No in-stock products at this godown',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    )
                  : ListView.builder(
                      itemCount: filtered.length,
                      itemBuilder: (_, i) {
                        final p = filtered[i];
                        final c = p.catalog;
                        if (gid == null) return const SizedBox.shrink();
                        final key = lineKey(gid, c.productId);
                        final max = p.stockQty;
                        final qty = _lineQty[key] ?? 0;
                        return ListTile(
                          title: Text(c.particulars ?? c.productId),
                          subtitle: Text('In stock: $max'),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.remove),
                                onPressed: qty > 0 ? () => setState(() => _lineQty[key] = qty - 1) : null,
                              ),
                              Text('$qty', style: const TextStyle(fontWeight: FontWeight.bold)),
                              IconButton(
                                icon: const Icon(Icons.add),
                                onPressed: qty < max ? () => setState(() => _lineQty[key] = qty + 1) : null,
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        );
      default:
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextField(controller: _customerName, decoration: const InputDecoration(labelText: 'Customer name *')),
            TextField(controller: _siteName, decoration: const InputDecoration(labelText: 'Site name')),
            TextField(controller: _siteAddress, decoration: const InputDecoration(labelText: 'Site address')),
            TextField(controller: _contactPhone, decoration: const InputDecoration(labelText: 'Contact phone')),
            TextField(controller: _vehicleLabel, decoration: const InputDecoration(labelText: 'Vehicle label')),
            ListTile(
              title: const Text('Delivery date & time'),
              subtitle: Text(_deliveryAt.toString()),
              trailing: const Icon(Icons.schedule),
              onTap: () => _pickDateTime(_deliveryAt, (dt) => setState(() => _deliveryAt = dt)),
            ),
            ListTile(
              title: const Text('Return expected (optional)'),
              subtitle: Text(_returnAt?.toString() ?? 'Not set'),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_returnAt != null)
                    IconButton(icon: const Icon(Icons.clear), onPressed: () => setState(() => _returnAt = null)),
                  const Icon(Icons.event),
                ],
              ),
              onTap: () => _pickDateTime(_returnAt ?? _deliveryAt.add(const Duration(days: 1)), (dt) => setState(() => _returnAt = dt)),
            ),
          ],
        );
    }
  }
}

class _LinkCard extends StatelessWidget {
  final String label;
  final String description;
  final String url;
  final VoidCallback onCopy;

  const _LinkCard({
    required this.label,
    required this.description,
    required this.url,
    required this.onCopy,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppColors.card,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
            Text(description, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 8),
            Text(url, style: const TextStyle(fontSize: 12)),
            const SizedBox(height: 8),
            OutlinedButton.icon(onPressed: onCopy, icon: const Icon(Icons.copy, size: 18), label: const Text('Copy link')),
          ],
        ),
      ),
    );
  }
}
