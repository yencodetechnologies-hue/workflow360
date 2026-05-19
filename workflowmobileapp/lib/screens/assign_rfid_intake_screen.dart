// lib/screens/assign_rfid_intake_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../services/app_state.dart';
import '../services/godown_api.dart';
import '../services/product_api.dart';
import '../services/report_api.dart';
import '../utils/app_theme.dart';

class AssignRfidIntakeScreen extends StatefulWidget {
  final String godownId;
  final String? initialProductId;

  const AssignRfidIntakeScreen({
    super.key,
    required this.godownId,
    this.initialProductId,
  });

  @override
  State<AssignRfidIntakeScreen> createState() => _AssignRfidIntakeScreenState();
}

class _AssignRfidIntakeScreenState extends State<AssignRfidIntakeScreen> {
  GodownRow? _godown;
  List<CatalogRow> _catalog = [];
  Map<String, int> _stockByProduct = {};
  List<Product> _allProducts = [];
  bool _loading = true;
  String? _error;

  String? _selectedProductId;
  final _qtyCtrl = TextEditingController(text: '1');

  bool _scanPhase = false;
  int _targetQty = 0;
  int _assignedCount = 0;
  final Set<String> _enrolledEpcs = {};
  String? _processingEpc;
  bool _scanListening = false;

  @override
  void initState() {
    super.initState();
    _selectedProductId = widget.initialProductId;
    _load();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<AppState>().initReader();
    });
  }

  @override
  void dispose() {
    _stopScanListening();
    _qtyCtrl.dispose();
    super.dispose();
  }

  void _onScanUpdate() {
    if (!_scanPhase || !mounted || _processingEpc != null) return;
    if (_assignedCount >= _targetQty) return;
    final state = context.read<AppState>();
    for (final scan in state.scanResults) {
      if (_enrolledEpcs.contains(scan.epc)) continue;
      _enrollTag(state, scan.epc);
      return;
    }
  }

  Future<void> _startScanListening() async {
    final state = context.read<AppState>();
    if (!state.isReady) await state.initReader();
    if (!mounted) return;
    state.clearRecords();
    state.addListener(_onScanUpdate);
    setState(() => _scanListening = true);
    if (state.isReady) await state.startScan();
  }

  Future<void> _stopScanListening() async {
    if (!_scanListening) return;
    final state = context.read<AppState>();
    state.removeListener(_onScanUpdate);
    if (state.isScanning) await state.stopScan();
    _scanListening = false;
  }

  List<CatalogRow> get _enabledCatalog =>
      _catalog.where((c) => c.enabled).toList()
        ..sort((a, b) => (a.particulars ?? '').compareTo(b.particulars ?? ''));

  Product? _productFor(String productId) {
    for (final p in _allProducts) {
      if (p.id == productId) return p;
    }
    return null;
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        GodownApi.getGodown(widget.godownId),
        GodownApi.listProducts(widget.godownId),
        ReportApi.stockReport(godownId: widget.godownId),
        fetchProducts(),
      ]);
      final stock = results[2] as List<StockRow>;
      setState(() {
        _godown = results[0] as GodownRow;
        _catalog = results[1] as List<CatalogRow>;
        _stockByProduct = {for (final s in stock) s.productId: s.qty};
        _allProducts = results[3] as List<Product>;
        if (_selectedProductId != null &&
            !_enabledCatalog.any((c) => c.productId == _selectedProductId)) {
          _selectedProductId = null;
        }
      });
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('ApiException: ', '').replaceFirst('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  void _startAssign() {
    final productId = _selectedProductId;
    if (productId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select a product')),
      );
      return;
    }
    CatalogRow? catalog;
    for (final c in _enabledCatalog) {
      if (c.productId == productId) {
        catalog = c;
        break;
      }
    }
    if (catalog == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Product is not enabled in this godown catalog')),
      );
      return;
    }
    final product = _productFor(productId);
    if (product == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Product not found in catalog')),
      );
      return;
    }
    final qty = int.tryParse(_qtyCtrl.text.trim()) ?? 0;
    if (qty < 1 || qty > 500) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter quantity between 1 and 500')),
      );
      return;
    }

    context.read<AppState>().selectProduct(product);
    setState(() {
      _scanPhase = true;
      _targetQty = qty;
      _assignedCount = 0;
      _enrolledEpcs.clear();
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _startScanListening();
    });
  }

  Future<bool> _confirmCancel() async {
    if (_assignedCount == 0) return true;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Leave intake?'),
        content: Text(
          '$_assignedCount of $_targetQty tag(s) already enrolled. Stock was increased for each. Leave anyway?',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Stay')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Leave')),
        ],
      ),
    );
    return ok == true;
  }

  Future<void> _onBack() async {
    if (_scanPhase) {
      final leave = await _confirmCancel();
      if (!leave || !mounted) return;
      await _stopScanListening();
      setState(() => _scanPhase = false);
      return;
    }
    if (!mounted) return;
    context.pop(true);
  }

  Future<void> _enrollTag(AppState state, String epc) async {
    if (_processingEpc != null || _enrolledEpcs.contains(epc)) return;
    if (_assignedCount >= _targetQty) return;
    final productId = _selectedProductId;
    if (productId == null) return;

    setState(() => _processingEpc = epc);
    try {
      final result = await state.enrollTagAndIncreaseStock(
        epc: epc,
        godownId: widget.godownId,
        productId: productId,
      );
      if (!mounted) return;
      if (result.success) {
        setState(() {
          _enrolledEpcs.add(epc);
          _assignedCount++;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Assigned $_assignedCount / $_targetQty')),
        );
        if (_assignedCount >= _targetQty) {
          await _stopScanListening();
          await _showComplete();
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.message), backgroundColor: AppColors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _processingEpc = null);
        if (_scanPhase && _assignedCount < _targetQty) {
          WidgetsBinding.instance.addPostFrameCallback((_) => _onScanUpdate());
        }
      }
    }
  }

  Future<void> _showComplete() async {
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Intake complete'),
        content: Text('Assigned $_targetQty RFID sticker(s). Stock increased by $_targetQty.'),
        actions: [
          FilledButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Done'),
          ),
        ],
      ),
    );
    if (mounted) context.pop(true);
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        await _onBack();
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(_scanPhase ? 'Assign RFID' : 'RFID intake'),
          leading: BackButton(onPressed: _onBack),
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
            : _error != null
                ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.red)))
                : _scanPhase
                    ? _buildScanPhase()
                    : _buildSetupPhase(),
      ),
    );
  }

  Widget _buildSetupPhase() {
    final g = _godown!;
    final enabled = _enabledCatalog;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(g.name, style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        const Text(
          'Select product and how many stickers to assign. Each successful scan adds 1 unit to stock.',
          style: TextStyle(color: AppColors.subtext),
        ),
        const SizedBox(height: 20),
        if (enabled.isEmpty)
          const Text('No enabled products in catalog. Enable products on the Catalog tab first.')
        else ...[
          const Text('Product', style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          ...enabled.map((c) {
            final stock = _stockByProduct[c.productId] ?? 0;
            final selected = _selectedProductId == c.productId;
            return Card(
              color: selected ? AppColors.card : AppColors.surface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
                side: BorderSide(
                  color: selected ? AppColors.cyan : AppColors.border,
                ),
              ),
              child: ListTile(
                title: Text(c.particulars ?? c.productId),
                subtitle: Text('${c.sku ?? c.productId} · In stock: $stock'),
                trailing: selected ? const Icon(Icons.check_circle, color: AppColors.cyan) : null,
                onTap: () => setState(() => _selectedProductId = c.productId),
              ),
            );
          }),
          const SizedBox(height: 20),
          TextField(
            controller: _qtyCtrl,
            decoration: const InputDecoration(
              labelText: 'Quantity to assign',
              hintText: 'e.g. 5',
            ),
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: _startAssign,
            icon: const Icon(Icons.nfc),
            label: const Text('Assign'),
          ),
        ],
      ],
    );
  }

  Widget _buildScanPhase() {
    CatalogRow? catalog;
    for (final c in _enabledCatalog) {
      if (c.productId == _selectedProductId) {
        catalog = c;
        break;
      }
    }
    final productName = catalog?.particulars ?? _selectedProductId ?? '';

    return Consumer<AppState>(
      builder: (context, state, _) {
        final tags = state.scanResults;
        return Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              color: AppColors.surface,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(productName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                    value: _targetQty > 0 ? _assignedCount / _targetQty : 0,
                    backgroundColor: AppColors.border,
                    color: AppColors.cyan,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Assigned $_assignedCount / $_targetQty',
                    style: const TextStyle(color: AppColors.cyan, fontWeight: FontWeight.bold),
                  ),
                  if (state.statusMessage != null) ...[
                    const SizedBox(height: 4),
                    Text(state.statusMessage!, style: const TextStyle(color: AppColors.subtext, fontSize: 12)),
                  ],
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                children: [
                  Icon(
                    state.isScanning ? Icons.sensors : Icons.sensors_off,
                    color: state.isScanning ? AppColors.cyan : AppColors.subtext,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      state.isScanning
                          ? 'Scanning — hold each sticker to the reader'
                          : (state.isBusy ? 'Writing tag…' : 'Reader idle'),
                      style: const TextStyle(color: AppColors.subtext, fontSize: 13),
                    ),
                  ),
                  if (!state.isScanning && !state.isBusy && _assignedCount < _targetQty)
                    TextButton(
                      onPressed: () => state.startScan(),
                      child: const Text('Resume'),
                    ),
                ],
              ),
            ),
            Expanded(
              child: tags.isEmpty
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Text(
                          'Scan each RFID sticker — assignment runs automatically',
                          style: TextStyle(color: AppColors.subtext),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      itemCount: tags.length,
                      itemBuilder: (_, i) {
                        final scan = tags[i];
                        final done = _enrolledEpcs.contains(scan.epc);
                        final busy = _processingEpc == scan.epc;
                        return Card(
                          color: AppColors.card,
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            title: Text(
                              scan.epc.length > 16 ? '${scan.epc.substring(0, 16)}…' : scan.epc,
                              style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
                            ),
                            subtitle: Text(
                              done
                                  ? 'Assigned ✓'
                                  : busy
                                      ? 'Writing & enrolling…'
                                      : 'Detected · RSSI ${scan.rssi}',
                            ),
                            trailing: done
                                ? const Icon(Icons.check_circle, color: AppColors.green)
                                : busy
                                    ? const SizedBox(
                                        width: 22,
                                        height: 22,
                                        child: CircularProgressIndicator(strokeWidth: 2),
                                      )
                                    : const Icon(Icons.hourglass_empty, color: AppColors.subtext),
                          ),
                        );
                      },
                    ),
            ),
          ],
        );
      },
    );
  }
}
