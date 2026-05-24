// lib/screens/assign_rfid_intake_screen.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../models/rfid_tag_data.dart';
import '../services/api_client.dart';
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

class _AssignRfidIntakeScreenState extends State<AssignRfidIntakeScreen>
    with SingleTickerProviderStateMixin {
  GodownRow? _godown;
  List<CatalogRow> _catalog = [];
  Map<String, int> _stockByProduct = {};
  List<Product> _allProducts = [];
  bool _loading = true;
  String? _error;

  String? _selectedProductId;

  bool _scanPhase = false;
  TabController? _tabController;
  final Set<String> _selectedEpcs = {};
  List<AssetTagRow> _assignedTags = [];
  final Map<String, TagLookupRow> _tagLookup = {};
  int _assignedCountAtEnter = 0;
  bool _loadingAssigned = false;
  String? _assignedTagsError;
  bool _assigning = false;
  bool _removing = false;
  String? _initialProductError;

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
    _tabController?.removeListener(_onAssignedTabSelected);
    _tabController?.dispose();
    final state = context.read<AppState>();
    if (state.isScanning) {
      state.stopScan();
    }
    super.dispose();
  }

  Set<String> get _assignedTagIds => _assignedTags.map((t) => t.tagId).toSet();

  List<CatalogRow> get _enabledCatalog =>
      _catalog.where((c) => c.enabled).toList()
        ..sort((a, b) => (a.particulars ?? '').compareTo(b.particulars ?? ''));

  CatalogRow? _catalogFor(String? productId) {
    if (productId == null) return null;
    for (final c in _enabledCatalog) {
      if (c.productId == productId) return c;
    }
    return null;
  }

  Product? _productFor(String productId) {
    for (final p in _allProducts) {
      if (p.id == productId) return p;
    }
    return null;
  }

  /// Global catalog first; fall back to godown catalog row (stock assign often has no global match).
  Product? _productForAssign(String productId) {
    final fromGlobal = _productFor(productId);
    if (fromGlobal != null) return fromGlobal;
    final catalog = _catalogFor(productId);
    if (catalog == null) return null;
    return Product(
      id: catalog.productId,
      sku: catalog.sku ?? catalog.productId,
      name: catalog.particulars ?? catalog.productId,
      category: '',
      price: 0,
      description: '',
      emoji: '📦',
      color: '#00BCD4',
    );
  }

  bool _isAssignedToCurrentProduct(String epc) =>
      _assignedTagIds.contains(epc) || (_tagLookup[epc]?.isCurrentProduct ?? false);

  TagLookupRow? _lookupElsewhere(String epc) {
    final row = _tagLookup[epc];
    if (row == null || row.isCurrentProduct) return null;
    return row;
  }

  List<ScanResult> _pendingTags(AppState state) => state.scanResults
      .where((s) => !_isAssignedToCurrentProduct(s.epc))
      .toList();

  List<ScanResult> _assignableTags(AppState state) => _pendingTags(state)
      .where((s) => _lookupElsewhere(s.epc) == null)
      .toList();

  int _pendingSelectedCount(List<ScanResult> pending) =>
      pending.where((s) => _selectedEpcs.contains(s.epc)).length;

  bool _allPendingSelected(List<ScanResult> pending) =>
      pending.isNotEmpty &&
      pending.every((s) => _selectedEpcs.contains(s.epc));

  bool? _selectAllValue(List<ScanResult> pending) {
    if (pending.isEmpty) return false;
    final n = _pendingSelectedCount(pending);
    if (n == 0) return false;
    if (n == pending.length) return true;
    return null;
  }

  void _toggleSelectAll(List<ScanResult> pending) {
    if (_allPendingSelected(pending)) {
      for (final s in pending) {
        _selectedEpcs.remove(s.epc);
      }
    } else {
      _selectedEpcs.addAll(pending.map((s) => s.epc));
    }
  }

  void _toggleEpc(String epc) {
    if (_selectedEpcs.contains(epc)) {
      _selectedEpcs.remove(epc);
    } else {
      _selectedEpcs.add(epc);
    }
  }

  void _dismissEpc(AppState state, String epc) {
    state.removeScanResult(epc);
    _selectedEpcs.remove(epc);
    _tagLookup.remove(epc);
  }

  void _onAssignedTabSelected() {
    if (_tabController?.indexIsChanging ?? true) return;
    if (_tabController?.index == 0) {
      _refreshAssignedTags();
    }
  }

  void _initTabController() {
    _tabController?.removeListener(_onAssignedTabSelected);
    _tabController?.dispose();
    _tabController = TabController(length: 2, vsync: this);
    _tabController!.addListener(_onAssignedTabSelected);
    if (mounted) setState(() {});
  }

  Future<void> _refreshAssignedTags() async {
    final productId = _selectedProductId;
    if (productId == null) return;
    setState(() {
      _loadingAssigned = true;
      _assignedTagsError = null;
    });
    try {
      final tags = await GodownApi.listProductAssetTags(
        godownId: widget.godownId,
        productId: productId,
      );
      if (!mounted) return;
      setState(() {
        _assignedTags = tags;
        _assignedTagsError = null;
      });
    } catch (e) {
      if (!mounted) return;
      final status = e is ApiException ? e.status : null;
      final message = e is ApiException
          ? e.message
          : e.toString().replaceFirst('ApiException: ', '').replaceFirst('Exception: ', '');
      final display = status == 404
          ? 'Assigned tags API is missing on the server. Deploy the latest backend and try again.'
          : (message.isNotEmpty ? message : 'Could not load assigned tags');
      setState(() {
        _assignedTags = [];
        _assignedTagsError = display;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(display)),
        );
      }
    } finally {
      if (mounted) setState(() => _loadingAssigned = false);
    }
  }

  Future<void> _syncTagLookup(AppState state) async {
    final productId = _selectedProductId;
    if (productId == null) return;
    final epcs = state.scanResults.map((s) => s.epc).toList();
    if (epcs.isEmpty) {
      setState(_tagLookup.clear);
      return;
    }
    try {
      final rows = await GodownApi.lookupAssetTags(
        godownId: widget.godownId,
        tagIds: epcs,
        productId: productId,
      );
      if (!mounted) return;
      setState(() {
        _tagLookup
          ..clear()
          ..addEntries(rows.map((r) => MapEntry(r.tagId, r)));
        for (final epc in _assignedTagIds) {
          _selectedEpcs.remove(epc);
        }
        for (final entry in _tagLookup.entries) {
          if (!entry.value.isCurrentProduct) {
            _selectedEpcs.remove(entry.key);
          }
        }
      });
    } catch (_) {}
  }

  Future<void> _enterScanPhaseAsync({bool silent = false}) async {
    if (!_enterScanPhase(silent: silent)) return;
    await _refreshAssignedTags();
    if (mounted) {
      setState(() => _assignedCountAtEnter = _assignedTags.length);
    }
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
      var enterScan = false;
      String? initialError;
      setState(() {
        _godown = results[0] as GodownRow;
        _catalog = results[1] as List<CatalogRow>;
        _stockByProduct = {for (final s in stock) s.productId: s.qty};
        _allProducts = results[3] as List<Product>;
        _initialProductError = null;
        if (_selectedProductId != null &&
            !_enabledCatalog.any((c) => c.productId == _selectedProductId)) {
          _selectedProductId = null;
        }
        if (widget.initialProductId != null) {
          if (_selectedProductId != widget.initialProductId) {
            initialError =
                'This product is not enabled in the godown catalog.';
          } else if (_productForAssign(_selectedProductId!) != null) {
            enterScan = true;
            _scanPhase = true;
            _selectedEpcs.clear();
          } else {
            initialError = 'Could not load product for assign.';
          }
          _initialProductError = initialError;
        }
      });
      if (enterScan && mounted) {
        final product = _productForAssign(_selectedProductId!)!;
        final state = context.read<AppState>();
        state.selectProduct(product);
        state.clearRecords();
        _selectedEpcs.clear();
        _tagLookup.clear();
        _initTabController();
        await _refreshAssignedTags();
        if (mounted) {
          setState(() => _assignedCountAtEnter = _assignedTags.length);
        }
      }
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('ApiException: ', '').replaceFirst('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  bool _enterScanPhase({bool silent = false}) {
    final productId = _selectedProductId;
    if (productId == null) {
      if (!silent) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Select a product')),
        );
      }
      return false;
    }
    if (_catalogFor(productId) == null) {
      if (!silent) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Product is not enabled in this godown catalog')),
        );
      }
      return false;
    }
    final product = _productForAssign(productId);
    if (product == null) {
      if (!silent) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Product not found in catalog')),
        );
      }
      return false;
    }

    final state = context.read<AppState>();
    state.selectProduct(product);
    state.clearRecords();
    setState(() {
      _scanPhase = true;
      _selectedEpcs.clear();
      _tagLookup.clear();
    });
    _initTabController();
    return true;
  }

  void _goToScanPhase() {
    _enterScanPhaseAsync();
  }

  Future<bool> _confirmCancel() async {
    final newlyAssigned = _assignedTags.length - _assignedCountAtEnter;
    if (newlyAssigned <= 0) return true;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Leave intake?'),
        content: Text(
          '$newlyAssigned tag(s) already assigned. Stock was increased for each. Leave anyway?',
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
      final state = context.read<AppState>();
      if (state.isScanning) await state.stopScan();
      _tabController?.dispose();
      _tabController = null;
      setState(() {
        _scanPhase = false;
        _selectedEpcs.clear();
        _tagLookup.clear();
      });
      if (widget.initialProductId != null) {
        if (!mounted) return;
        context.pop(_assignedTags.length > _assignedCountAtEnter);
        return;
      }
      return;
    }
    if (!mounted) return;
    context.pop(_assignedTags.length > _assignedCountAtEnter);
  }

  Future<void> _assignSelected(AppState state) async {
    if (_assigning || state.isBusy) return;
    final productId = _selectedProductId;
    if (productId == null) return;

    final toAssign = _selectedEpcs
        .where((e) => !_isAssignedToCurrentProduct(e) && _lookupElsewhere(e) == null)
        .toList();
    if (toAssign.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select at least one tag')),
      );
      return;
    }

    if (state.isScanning) await state.stopScan();

    setState(() => _assigning = true);
    var ok = 0;
    var failed = 0;
    String? lastError;
    try {
      for (final epc in toAssign) {
        if (!mounted) break;
        final result = await state.enrollTagAndIncreaseStock(
          epc: epc,
          godownId: widget.godownId,
          productId: productId,
        );
        if (!mounted) break;
        if (result.success) {
          ok++;
          setState(() {
            _selectedEpcs.remove(epc);
            state.removeScanResult(epc);
            _tagLookup.remove(epc);
            _stockByProduct[productId] = (_stockByProduct[productId] ?? 0) + 1;
          });
        } else {
          failed++;
          lastError = result.error ?? result.message;
        }
      }
      if (!mounted) return;
      if (ok > 0 && failed == 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(ok == 1 ? 'Tag updated successfully' : '$ok tags updated successfully'),
          ),
        );
      } else if (ok > 0 && failed > 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$ok assigned, $failed failed')),
        );
      } else if (failed > 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(lastError ?? 'Assign failed'),
            backgroundColor: AppColors.red,
          ),
        );
      }
      if (ok > 0) await _refreshAssignedTags();
    } finally {
      if (mounted) setState(() => _assigning = false);
    }
  }

  Future<void> _removeAssignedTag(AssetTagRow tag) async {
    final productId = _selectedProductId;
    if (productId == null || _removing) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove assigned tag?'),
        content: Text(
          'Remove ${_shortEpc(tag.tagId)} from this product and decrease stock by 1?',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Remove')),
        ],
      ),
    );
    if (ok != true || !mounted) return;

    setState(() => _removing = true);
    try {
      final result = await GodownApi.revokeRfidIntake(
        godownId: widget.godownId,
        tagId: tag.tagId,
        productId: productId,
      );
      if (!mounted) return;
      final balance = result['balanceAfter'];
      setState(() {
        _assignedTags.removeWhere((t) => t.tagId == tag.tagId);
        if (balance is num) {
          _stockByProduct[productId] = balance.toInt();
        } else {
          _stockByProduct[productId] = (_stockByProduct[productId] ?? 1) - 1;
        }
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tag removed from product')),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('ApiException: ', '').replaceFirst('Exception: ', '')),
            backgroundColor: AppColors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _removing = false);
    }
  }

  String _shortEpc(String epc) => epc.length > 20 ? '${epc.substring(0, 20)}…' : epc;

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
          title: Text(_scanPhase ? 'Assign stock' : 'RFID intake'),
          leading: BackButton(onPressed: _onBack),
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
            : _error != null
                ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.red)))
                : _scanPhase
                    ? _buildScanPhase()
                    : widget.initialProductId != null
                        ? _buildInitialProductError()
                        : _buildSetupPhase(),
      ),
    );
  }

  Widget _buildInitialProductError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: AppColors.red, size: 48),
            const SizedBox(height: 16),
            Text(
              _initialProductError ?? 'Could not open assign for this product.',
              style: const TextStyle(color: AppColors.red),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _onBack,
              child: const Text('Go back'),
            ),
          ],
        ),
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
          'Select a product. The next screen shows only that stock at the top, with scan and assign below.',
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
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: _goToScanPhase,
            icon: const Icon(Icons.nfc),
            label: const Text('Assign tag'),
          ),
        ],
      ],
    );
  }

  Widget _buildAssignedTab() {
    if (_loadingAssigned && _assignedTags.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: AppColors.cyan));
    }
    if (_assignedTagsError != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.cloud_off, color: AppColors.amber, size: 40),
              const SizedBox(height: 12),
              Text(
                _assignedTagsError!,
                style: const TextStyle(color: AppColors.red),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _loadingAssigned ? null : _refreshAssignedTags,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }
    if (_assignedTags.isEmpty) {
      return RefreshIndicator(
        onRefresh: _refreshAssignedTags,
        color: AppColors.cyan,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 120),
            Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'No tags assigned to this product yet',
                  style: TextStyle(color: AppColors.subtext),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _refreshAssignedTags,
      color: AppColors.cyan,
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        itemCount: _assignedTags.length,
        itemBuilder: (_, i) {
          final tag = _assignedTags[i];
          return Card(
            color: AppColors.surface,
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: const Icon(Icons.check_circle, color: AppColors.green),
              title: Text(
                _shortEpc(tag.tagId),
                style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
              ),
              subtitle: const Text(
                'Assigned to this product',
                style: TextStyle(color: AppColors.green, fontSize: 11),
              ),
              trailing: IconButton(
                icon: const Icon(Icons.close, color: AppColors.subtext),
                tooltip: 'Remove assignment',
                onPressed: _removing || _assigning ? null : () => _removeAssignedTag(tag),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildUnassignedTab(AppState state) {
    final pendingTags = _pendingTags(state);
    final assignable = _assignableTags(state);
    final selectedCount = assignable.where((s) => _selectedEpcs.contains(s.epc)).length;
    final canStart = state.isReady && !state.isScanning && !_assigning && !_removing;
    final canStop = state.isScanning && !_assigning && !_removing;
    final canAssign = !_assigning &&
        !_removing &&
        !state.isBusy &&
        _selectedEpcs.any((e) {
          if (_isAssignedToCurrentProduct(e)) return false;
          return _lookupElsewhere(e) == null;
        });
    final assignLabel = selectedCount > 1 ? 'Assign ($selectedCount)' : 'Assign';

    return Column(
      children: [
        if (pendingTags.isNotEmpty)
          Material(
            color: AppColors.surface,
            child: CheckboxListTile(
              tristate: true,
              value: _selectAllValue(assignable),
              onChanged: _assigning || _removing || assignable.isEmpty
                  ? null
                  : (_) => setState(() => _toggleSelectAll(assignable)),
              title: const Text('Select all', style: TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text(
                '$selectedCount of ${assignable.length} assignable · ${pendingTags.length} scanned',
                style: const TextStyle(color: AppColors.subtext, fontSize: 12),
              ),
              controlAffinity: ListTileControlAffinity.leading,
              activeColor: AppColors.cyan,
            ),
          ),
        Expanded(
          child: pendingTags.isEmpty
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Text(
                      'Tap Start scan to find tags',
                      style: TextStyle(color: AppColors.subtext),
                      textAlign: TextAlign.center,
                    ),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                  itemCount: pendingTags.length,
                  itemBuilder: (_, i) {
                    final scan = pendingTags[i];
                    final elsewhere = _lookupElsewhere(scan.epc);
                    final blocked = elsewhere != null;
                    final checked = !blocked && _selectedEpcs.contains(scan.epc);
                    return Card(
                      color: checked ? AppColors.card : AppColors.surface,
                      margin: const EdgeInsets.only(bottom: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                        side: BorderSide(
                          color: blocked
                              ? AppColors.border
                              : (checked ? AppColors.cyan : AppColors.border),
                          width: checked ? 2 : 1,
                        ),
                      ),
                      child: ListTile(
                        leading: Checkbox(
                          value: blocked ? false : checked,
                          onChanged: blocked || _assigning || _removing
                              ? null
                              : (_) => setState(() => _toggleEpc(scan.epc)),
                          activeColor: AppColors.cyan,
                        ),
                        title: Text(
                          _shortEpc(scan.epc),
                          style: TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 12,
                            color: blocked ? AppColors.subtext : null,
                          ),
                        ),
                        subtitle: Text(
                          blocked
                              ? 'Assigned to ${elsewhere.productName} — cannot reassign'
                              : 'RSSI ${scan.rssi}',
                          style: TextStyle(
                            color: blocked ? AppColors.amber : AppColors.subtext,
                            fontSize: 11,
                          ),
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.close, color: AppColors.subtext),
                          tooltip: 'Remove from list',
                          onPressed: _assigning || _removing
                              ? null
                              : () => setState(() => _dismissEpc(state, scan.epc)),
                        ),
                        onTap: blocked || _assigning || _removing
                            ? null
                            : () => setState(() => _toggleEpc(scan.epc)),
                      ),
                    );
                  },
                ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
            child: Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: canStart
                        ? () {
                            setState(() {
                              _selectedEpcs.clear();
                              _tagLookup.clear();
                            });
                            state.startScan();
                          }
                        : null,
                    icon: const Icon(Icons.play_arrow, size: 20),
                    label: const Text('Start'),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: canStop
                        ? () async {
                            await state.stopScan();
                            if (mounted) await _syncTagLookup(state);
                          }
                        : null,
                    icon: const Icon(Icons.stop, size: 20),
                    label: const Text('Stop'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                FilledButton.icon(
                  onPressed: canAssign ? () => _assignSelected(state) : null,
                  icon: _assigning
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.assignment_turned_in),
                  label: Text(_assigning ? '…' : assignLabel),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildScanPhase() {
    final catalog = _catalogFor(_selectedProductId);
    final productName = catalog?.particulars ?? _selectedProductId ?? '';
    final sku = catalog?.sku ?? _selectedProductId ?? '';
    final stock = _stockByProduct[_selectedProductId] ?? 0;

    final tabCtrl = _tabController;
    if (tabCtrl == null) {
      return const Center(child: CircularProgressIndicator(color: AppColors.cyan));
    }

    return Consumer<AppState>(
      builder: (context, state, _) {
        final assignableCount = _assignableTags(state).length;

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
                  const SizedBox(height: 4),
                  Text('$sku · In stock: $stock', style: const TextStyle(color: AppColors.subtext, fontSize: 13)),
                  if (state.statusMessage != null) ...[
                    const SizedBox(height: 4),
                    Text(state.statusMessage!, style: const TextStyle(color: AppColors.subtext, fontSize: 12)),
                  ],
                ],
              ),
            ),
            Material(
              color: AppColors.surface,
              child: TabBar(
                controller: tabCtrl,
                labelColor: AppColors.cyan,
                unselectedLabelColor: AppColors.subtext,
                indicatorColor: AppColors.cyan,
                tabs: [
                  Tab(text: 'Assigned (${_assignedTags.length})'),
                  Tab(text: 'Unassigned ($assignableCount)'),
                ],
              ),
            ),
            Expanded(
              child: TabBarView(
                controller: tabCtrl,
                children: [
                  _buildAssignedTab(),
                  _buildUnassignedTab(state),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}
