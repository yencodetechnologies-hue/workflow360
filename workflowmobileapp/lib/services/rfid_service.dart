// lib/services/rfid_service.dart
//
// Real reader: native UHF via android/app/libs/*.aar (Newland URM-500 SDK).
// Place the vendor .aar inside android/app/libs/ and rebuild — the Gradle build
// automatically switches from the stub to the real SDK bridge (see build.gradle.kts).

import 'dart:async';
import 'package:flutter/services.dart';
import '../models/product.dart';
import '../models/rfid_tag_data.dart';

class RfidService {
  // Singleton
  static final RfidService _i = RfidService._();
  factory RfidService() => _i;
  RfidService._();

  static const _method = MethodChannel('com.example.rfid/method');
  static const _event  = EventChannel('com.example.rfid/event');

  // ── Mock Logic ──────────────────────────────────────────────
  static const bool _mock = bool.fromEnvironment('RFID_MOCK', defaultValue: false);
  Timer? _mockTimer;
  final Map<String, String> _mockMemory = {}; // EPC -> HexData

  // ── State ──────────────────────────────────────────────────
  bool _open     = false;
  bool _scanning = false;
  StreamSubscription? _eventSub;
  bool _nativeSessionOpen = false;

  final _tagCtrl = StreamController<ScanResult>.broadcast();

  Stream<ScanResult> get tagStream => _tagCtrl.stream;
  bool get isOpen    => _open;
  bool get isScanning => _scanning;

  /// Set when the last [openReader] failed.
  String? _readerInitError;
  String? get readerInitError => _readerInitError;

  // ── Lifecycle ──────────────────────────────────────────────

  Future<bool> openReader() async {
    _readerInitError = null;
    if (_mock) {
      _log('Mock mode enabled via --dart-define=RFID_MOCK=true');
      _open = true;
      return true;
    }

    _log('Opening real reader...');
    try {
      final ok = await _method.invokeMethod<bool>('openReader') ?? false;
      if (ok) {
        _log('Reader opened successfully');
        _open = true;
        _nativeSessionOpen = true;
        _subscribeEvents();
        return true;
      }
      _log('Reader open returned false');
      _readerInitError =
          'UHF reader did not open. Ensure the vendor .aar/.jar is in android/app/libs/ and the device supports UHF.';
      return false;
    } on PlatformException catch (e) {
      _log('openReader platform error: ${e.code} ${e.message}');
      _readerInitError = e.code == 'NO_SDK'
          ? 'RFID SDK not installed.\n\nPlace the Newland URM-500 .aar/.jar inside android/app/libs/ and rebuild the app.'
          : _platformMessage(e);
      return false;
    } catch (e) {
      _log('openReader unexpected error: $e');
      _readerInitError =
          'Reader not available. Place the Newland URM-500 SDK in android/app/libs/ and rebuild.';
      return false;
    }
  }

  static String _platformMessage(PlatformException e) {
    final msg = e.message?.trim();
    if (msg != null && msg.isNotEmpty) return msg;
    return e.code;
  }

  Future<void> closeReader() async {
    _log('Closing reader');
    _stopMockInventory();
    _eventSub?.cancel();
    if (_nativeSessionOpen) {
      try {
        await _method.invokeMethod('closeReader');
      } catch (_) {}
      _nativeSessionOpen = false;
    }
    _open = false;
    _scanning = false;
  }

  void _subscribeEvents() {
    _eventSub?.cancel();
    _eventSub = _event.receiveBroadcastStream().listen((event) {
      if (event is Map && event['type'] == 'tag') {
        _tagCtrl.add(ScanResult(
          epc:  event['epc']  as String? ?? '',
          rssi: event['rssi'] as int?    ?? -60,
          pc:   event['pc']   as String? ?? '3000',
        ));
      }
    });
  }

  // ── Inventory ──────────────────────────────────────────────

  Future<bool> startInventory() async {
    _log('startInventory called (open=$_open, scanning=$_scanning)');
    if (!_open) return false;
    _scanning = true;

    if (_mock) {
      _log('Starting mock inventory');
      _startMockInventory();
      return true;
    }

    try {
      _log('Starting real inventory...');
      return await _method.invokeMethod<bool>('startInventory') ?? false;
    } on PlatformException catch (e) {
      _log('startInventory error: ${e.message}');
      return false;
    }
  }

  Future<bool> stopInventory() async {
    _scanning = false;
    if (_mock) {
      _stopMockInventory();
      return true;
    }

    try {
      return await _method.invokeMethod<bool>('stopInventory') ?? false;
    } on PlatformException {
      return false;
    }
  }

  void _startMockInventory() {
    _mockTimer?.cancel();
    _mockTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      // Simulate 1-2 tags
      final tags = [
        {'epc': 'E28011912000762E', 'rssi': -55, 'pc': '3000'},
        {'epc': 'E28011912000AABB', 'rssi': -62, 'pc': '3000'},
      ];
      for (var t in tags) {
        _tagCtrl.add(ScanResult(
          epc: t['epc'] as String,
          rssi: t['rssi'] as int,
          pc: t['pc'] as String,
        ));
      }
    });
  }

  void _stopMockInventory() {
    _mockTimer?.cancel();
    _mockTimer = null;
  }

  // ── Read ───────────────────────────────────────────────────

  Future<OperationResult> readTag({
    required String epc,
    int bank      = 3, // user bank
    int startAddr = 0,
    int length    = 8,
    String password = '00000000',
  }) async {
    if (!_open) {
      return OperationResult(success: false, message: 'Reader not open');
    }

    if (_mock) {
      final hex = _mockMemory[epc] ?? '';
      return OperationResult(
        success: true,
        message: 'Mock Read OK',
        hexData: hex,
        decodedData: Product.hexToString(hex),
      );
    }

    try {
      final res = await _method.invokeMapMethod<String, dynamic>('readTag', {
        'epc': epc, 'bank': bank,
        'startAddr': startAddr, 'length': length, 'password': password,
      });
      final hex = res?['data'] as String? ?? '';
      return OperationResult(
        success: res?['success'] as bool? ?? false,
        message: 'Read OK',
        hexData: hex,
        decodedData: Product.hexToString(hex),
      );
    } on PlatformException catch (e) {
      return OperationResult(success: false, message: 'Read failed', error: e.message);
    }
  }

  // ── Write ──────────────────────────────────────────────────

  Future<OperationResult> writeTag({
    required String epc,
    required String hexData,
    int bank      = 3,
    int startAddr = 0,
    String password = '00000000',
  }) async {
    if (!_open) {
      return OperationResult(success: false, message: 'Reader not open');
    }

    if (_mock) {
      _mockMemory[epc] = hexData;
      return OperationResult(
        success: true,
        message: 'Mock Write OK',
        hexData: hexData,
      );
    }

    try {
      final res = await _method.invokeMapMethod<String, dynamic>('writeTag', {
        'epc': epc, 'bank': bank,
        'startAddr': startAddr, 'data': hexData, 'password': password,
      });
      return OperationResult(
        success: res?['success'] as bool? ?? false,
        message: 'Write OK',
        hexData: hexData,
      );
    } on PlatformException catch (e) {
      return OperationResult(success: false, message: 'Write failed', error: e.message);
    }
  }

  /// Write a Product's data to a tag.
  Future<OperationResult> writeProduct({
    required String epc,
    required Product product,
    String password = '00000000',
  }) =>
      writeTag(epc: epc, hexData: product.toHex(), password: password);

  // ── Fetch / Identify ───────────────────────────────────────

  Future<RfidTagRecord> fetchAndIdentify({
    required String epc,
    required int rssi,
    required String pc,
    required List<Product> catalog,
    String password = '00000000',
  }) async {
    final read = await readTag(epc: epc, password: password);
    final hex = read.hexData ?? '';
    final sku = Product.hexToSku(hex);
    final product = findProductBySku(catalog, sku);

    return RfidTagRecord(
      epc: epc,
      assignedSku: product?.sku,
      assignedProductName: product?.name,
      rawHex: hex,
      timestamp: DateTime.now(),
      rssi: rssi,
      pc: pc,
      memoryReadOk: read.success,
    );
  }

  // ── Clear (soft delete) ────────────────────────────────────

  Future<OperationResult> clearTag({
    required String epc,
    int wordCount = 16,
    String password = '00000000',
  }) {
    final zeros = '00' * (wordCount * 2);
    return writeTag(epc: epc, hexData: zeros, password: password);
  }

  // ── Kill ───────────────────────────────────────────────────

  Future<OperationResult> killTag({
    required String epc,
    required String killPassword,
  }) async {
    if (!_open) {
      return OperationResult(success: false, message: 'Reader not open');
    }

    if (_mock) {
      _mockMemory.remove(epc);
      return OperationResult(success: true, message: 'Mock Kill OK');
    }

    try {
      final res = await _method.invokeMapMethod<String, dynamic>('killTag', {
        'epc': epc, 'killPassword': killPassword,
      });
      return OperationResult(
        success: res?['success'] as bool? ?? false,
        message: 'Kill ${res?['success'] == true ? 'OK' : 'failed'}',
      );
    } on PlatformException catch (e) {
      return OperationResult(success: false, message: 'Kill failed', error: e.message);
    }
  }

  void _log(String msg) {
    // ignore: avoid_print
    print('[RfidService] $msg');
  }

  void dispose() {
    closeReader();
    _tagCtrl.close();
  }
}
