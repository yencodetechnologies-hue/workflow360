// lib/services/app_state.dart

import 'dart:async';
import 'package:flutter/foundation.dart';
import '../app_tabs.dart';
import '../models/product.dart';
import '../models/rfid_tag_data.dart';
import 'product_api.dart';
import 'rfid_service.dart';

enum ReaderStatus { disconnected, connecting, ready, scanning, busy, error }

class AppState extends ChangeNotifier {
  final RfidService _rfid = RfidService();
  StreamSubscription? _tagSub;

  ReaderStatus _status = ReaderStatus.disconnected;
  ReaderStatus get status => _status;

  String? _statusMessage;
  String? get statusMessage => _statusMessage;

  Product? _selectedProduct;
  Product? get selectedProduct => _selectedProduct;

  List<Product> _products = [];
  bool _productsLoading = false;
  String? _productsError;

  List<Product> get products => List.unmodifiable(_products);
  bool get productsLoading => _productsLoading;
  String? get productsError => _productsError;

  Product? productBySku(String? sku) => findProductBySku(_products, sku);

  /// Shell tab index (0=Products, 1=Assign products, 2=Scan new products, 3=History). Consumed by [takePendingMainTabIfAny].
  int? _pendingMainTabIndex;

  // Tags discovered in current scan
  final Map<String, ScanResult> _scanResults = {};
  List<ScanResult> get scanResults => _scanResults.values.toList();

  /// Sum of [ScanResult.inventoryHits] — can exceed [scanResults.length] when the reader reports the same EPC many times.
  int get totalInventoryDetections =>
      scanResults.fold<int>(0, (sum, s) => sum + s.inventoryHits);

  // Identified/fetched tag records
  final List<RfidTagRecord> _tagRecords = [];
  List<RfidTagRecord> get tagRecords => List.unmodifiable(_tagRecords);

  // Last operation result
  OperationResult? _lastOperation;
  OperationResult? get lastOperation => _lastOperation;

  bool get isReady    => _status == ReaderStatus.ready;
  bool get isScanning => _status == ReaderStatus.scanning;
  bool get isBusy     => _status == ReaderStatus.busy;

  // ── Product catalog (API) ───────────────────────────────────

  Future<void> loadProducts({bool silent = false}) async {
    if (!silent || _products.isEmpty) {
      _productsLoading = true;
      _productsError = null;
      notifyListeners();
    }
    try {
      final next = await fetchProducts();
      final prevId = _selectedProduct?.id;
      _products = next;
      _productsError = null;
      if (prevId != null) {
        Product? match;
        for (final p in _products) {
          if (p.id == prevId) {
            match = p;
            break;
          }
        }
        _selectedProduct = match;
      }
    } catch (e) {
      _productsError = e.toString();
    } finally {
      _productsLoading = false;
      notifyListeners();
    }
  }

  // ── Init ────────────────────────────────────────────────────

  Future<void> initReader() async {
    _setStatus(ReaderStatus.connecting, 'Opening UHF reader…');
    _tagSub?.cancel();
    final ok = await _rfid.openReader();
    if (ok) {
      _setStatus(ReaderStatus.ready, 'NLS-MT95L UHF reader ready ✓');
      _tagSub = _rfid.tagStream.listen(_onTagFound);
    } else {
      final detail = _rfid.readerInitError;
      _setStatus(
        ReaderStatus.error,
        detail ?? 'Failed to open reader',
      );
    }
  }

  Future<void> retryInitReader() => initReader();

  void _onTagFound(ScanResult tag) {
    final prev = _scanResults[tag.epc];
    if (prev == null) {
      _scanResults[tag.epc] = tag;
    } else {
      _scanResults[tag.epc] = ScanResult(
        epc: tag.epc,
        rssi: tag.rssi,
        pc: tag.pc,
        inventoryHits: prev.inventoryHits + 1,
      );
    }
    notifyListeners();
  }

  // ── Product selection ───────────────────────────────────────

  void selectProduct(Product? product, {bool openScanTab = false}) {
    _selectedProduct = product;
    if (openScanTab && product != null) {
      _pendingMainTabIndex = MainTabs.scan;
    }
    notifyListeners();
  }

  /// Returns pending bottom-nav index once, then clears it. Used by app shell only.
  int? takePendingMainTabIfAny() {
    if (_pendingMainTabIndex == null) return null;
    final i = _pendingMainTabIndex!;
    _pendingMainTabIndex = null;
    return i;
  }

  // ── Inventory ───────────────────────────────────────────────

  Future<void> startScan() async {
    if (!isReady) return;
    _scanResults.clear();
    _setStatus(ReaderStatus.scanning, 'Scanning for tags…');
    await _rfid.startInventory();
    notifyListeners();
  }

  Future<void> stopScan() async {
    await _rfid.stopInventory();
    _setStatus(ReaderStatus.ready,
        '${_scanResults.length} tag(s) found');
    final tags = List<ScanResult>.from(scanResults);
    if (tags.isEmpty) return;
    // Resolve product names from user memory (default access password).
    await identifyAllTags(password: '00000000');
  }

  // ── Write product to tag ────────────────────────────────────

  Future<OperationResult> writeProductToTag({
    required String epc,
    String password = '00000000',
  }) async {
    final product = _selectedProduct;
    if (product == null) {
      return OperationResult(
          success: false, message: 'No product selected');
    }
    _setStatus(ReaderStatus.busy, 'Writing ${product.name}…');
    final result = await _rfid.writeProduct(
        epc: epc, product: product, password: password);

    if (result.success) {
      String backendNote = '';
      try {
        await assignTag(productId: product.id, tagId: epc);
        backendNote = ' · Assigned in DB ✓';
      } catch (_) {
        backendNote = ' · DB assign failed';
      }
      _lastOperation = OperationResult(
        success: true,
        message: 'Written to tag$backendNote',
        hexData: result.hexData,
        decodedData: result.decodedData,
      );
      _setStatus(ReaderStatus.ready, 'Write OK ✓$backendNote');
    } else {
      _lastOperation = result;
      _setStatus(ReaderStatus.ready, 'Write failed: ${result.error}');
    }

    notifyListeners();
    return _lastOperation!;
  }

  // ── Read tag ────────────────────────────────────────────────

  Future<OperationResult> readTag({
    required String epc,
    String password = '00000000',
  }) async {
    _setStatus(ReaderStatus.busy, 'Reading tag…');
    final result = await _rfid.readTag(epc: epc, password: password);
    _lastOperation = result;
    _setStatus(ReaderStatus.ready,
        result.success ? 'Read OK ✓' : 'Read failed');
    notifyListeners();
    return result;
  }

  // ── Fetch + identify tag ────────────────────────────────────

  Future<RfidTagRecord> fetchAndIdentify({
    required ScanResult scan,
    String password = '00000000',
  }) async {
    _setStatus(ReaderStatus.busy, 'Identifying ${scan.epc.substring(0, 8)}…');
    final record = await _rfid.fetchAndIdentify(
      epc: scan.epc,
      rssi: scan.rssi,
      pc: scan.pc,
      password: password,
      catalog: _products,
    );
    // Upsert in records list
    _tagRecords.removeWhere((r) => r.epc == record.epc);
    _tagRecords.insert(0, record);
    _setStatus(ReaderStatus.ready,
        record.hasProduct
            ? 'Found: ${record.assignedProductName}'
            : 'Tag identified — no product assigned');
    notifyListeners();
    return record;
  }

  // ── Bulk operations (all tags in current scan list) ───────────

  Future<void> _ensureInventoryStopped() async {
    if (_status != ReaderStatus.scanning) return;
    await _rfid.stopInventory();
    _setStatus(ReaderStatus.ready, '${_scanResults.length} tag(s) found');
  }

  /// Returns null if there are no tags to process.
  Future<BulkOperationReport?> readAllTags({required String password}) async {
    final targets = List<ScanResult>.from(scanResults);
    if (targets.isEmpty) return null;
    await _ensureInventoryStopped();
    _setStatus(ReaderStatus.busy, 'Reading tags…');
    final rows = <BulkTagResultRow>[];
    for (var i = 0; i < targets.length; i++) {
      final scan = targets[i];
      _statusMessage = '${i + 1}/${targets.length} · Reading…';
      notifyListeners();
      final result = await _rfid.readTag(epc: scan.epc, password: password);
      final detail = result.success
          ? ((result.decodedData != null && result.decodedData!.isNotEmpty)
              ? result.decodedData!
              : (result.hexData != null && result.hexData!.isNotEmpty
                  ? result.hexData!
                  : result.message))
          : (result.error ?? result.message);
      rows.add(BulkTagResultRow(
        epc: scan.epc,
        success: result.success,
        message: detail,
        readWriteResult: result,
      ));
    }
    final ok = rows.where((r) => r.success).length;
    _setStatus(ReaderStatus.ready, 'Read all: $ok/${rows.length} OK');
    return BulkOperationReport(kind: BulkOperationKind.read, rows: rows);
  }

  /// Returns null if no product is selected or no tags.
  Future<BulkOperationReport?> writeProductToAllTags({
    required String password,
  }) async {
    final product = _selectedProduct;
    final targets = List<ScanResult>.from(scanResults);
    if (product == null || targets.isEmpty) return null;
    await _ensureInventoryStopped();
    _setStatus(ReaderStatus.busy, 'Writing ${product.name}…');
    final rows = <BulkTagResultRow>[];
    for (var i = 0; i < targets.length; i++) {
      final scan = targets[i];
      _statusMessage = '${i + 1}/${targets.length} · Writing…';
      notifyListeners();
      final result = await _rfid.writeProduct(
        epc: scan.epc,
        product: product,
        password: password,
      );
      String msg = result.success
          ? result.message
          : (result.error ?? result.message);
      if (result.success) {
        try {
          await assignTag(productId: product.id, tagId: scan.epc);
          msg = 'Written + DB assigned ✓';
        } catch (_) {
          msg = 'Written (DB assign failed)';
        }
      }
      rows.add(BulkTagResultRow(
        epc: scan.epc,
        success: result.success,
        message: msg,
        readWriteResult: result,
      ));
    }
    final ok = rows.where((r) => r.success).length;
    _setStatus(ReaderStatus.ready, 'Write all: $ok/${rows.length} OK');
    return BulkOperationReport(kind: BulkOperationKind.write, rows: rows);
  }

  /// Returns null if there are no tags to process.
  Future<BulkOperationReport?> identifyAllTags({required String password}) async {
    final targets = List<ScanResult>.from(scanResults);
    if (targets.isEmpty) return null;
    await _ensureInventoryStopped();
    _setStatus(ReaderStatus.busy, 'Identifying tags…');
    final rows = <BulkTagResultRow>[];
    for (var i = 0; i < targets.length; i++) {
      final scan = targets[i];
      _statusMessage = '${i + 1}/${targets.length} · Identifying…';
      notifyListeners();
      final record = await _rfid.fetchAndIdentify(
        epc: scan.epc,
        rssi: scan.rssi,
        pc: scan.pc,
        password: password,
        catalog: _products,
      );
      _tagRecords.removeWhere((r) => r.epc == record.epc);
      _tagRecords.insert(0, record);
      final message = !record.memoryReadOk
          ? 'User memory read failed'
          : (record.hasProduct
              ? record.assignedProductName!
              : 'No product in memory');
      rows.add(BulkTagResultRow(
        epc: record.epc,
        success: record.memoryReadOk,
        message: message,
        record: record,
      ));
    }
    final ok = rows.where((r) => r.success).length;
    _setStatus(ReaderStatus.ready, 'Identify all: $ok/${rows.length} OK');
    return BulkOperationReport(kind: BulkOperationKind.identify, rows: rows);
  }

  // ── Clear tag ───────────────────────────────────────────────

  Future<OperationResult> clearTag({
    required String epc,
    String password = '00000000',
  }) async {
    _setStatus(ReaderStatus.busy, 'Clearing tag memory…');
    final result = await _rfid.clearTag(epc: epc, password: password);
    _lastOperation = result;
    if (result.success) {
      _tagRecords.removeWhere((r) => r.epc == epc);
    }
    _setStatus(ReaderStatus.ready,
        result.success ? 'Memory cleared ✓' : 'Clear failed');
    notifyListeners();
    return result;
  }

  // ── Kill tag ────────────────────────────────────────────────

  Future<OperationResult> killTag({
    required String epc,
    required String killPassword,
  }) async {
    _setStatus(ReaderStatus.busy, 'Killing tag…');
    final result = await _rfid.killTag(epc: epc, killPassword: killPassword);
    if (result.success) {
      _scanResults.remove(epc);
      _tagRecords.removeWhere((r) => r.epc == epc);
    }
    _lastOperation = result;
    _setStatus(ReaderStatus.ready,
        result.success ? 'Tag killed ✓' : 'Kill failed');
    notifyListeners();
    return result;
  }

  void clearRecords() {
    _tagRecords.clear();
    _scanResults.clear();
    notifyListeners();
  }

  // ── Helper ──────────────────────────────────────────────────

  void _setStatus(ReaderStatus s, String msg) {
    _status = s;
    _statusMessage = msg;
    notifyListeners();
  }

  @override
  void dispose() {
    _tagSub?.cancel();
    _rfid.dispose();
    super.dispose();
  }
}
