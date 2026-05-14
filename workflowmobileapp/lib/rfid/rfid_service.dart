import 'dart:async';

import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:workflow360_rfid_app/rfid/rfid_models.dart';

final rfidServiceProvider = Provider<RfidService>((ref) => RfidService._());

class RfidService {
  static const MethodChannel _method = MethodChannel('workflow360/rfid/methods');
  static const EventChannel _events = EventChannel('workflow360/rfid/events');

  /// Newland handbook: native `SCAN_TIMEOUT` is 1–9s; app uses 9s + small margin for Flutter.
  static const Duration defaultScanTimeout = Duration(seconds: 10);

  StreamSubscription? _sub;
  final _controller = StreamController<RfidTag>.broadcast();
  bool _initialized = false;

  RfidService._();

  Stream<RfidTag> get onTagRead => _controller.stream;

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;
    _sub = _events.receiveBroadcastStream().listen((event) {
      if (event is Map) {
        final map = event.map((k, v) => MapEntry(k.toString(), v));
        final epc = (map['epc'] ?? '').toString();
        if (epc.isEmpty) return;
        final rssiNum = map['rssi'];
        final rssi = rssiNum is num ? rssiNum.toInt() : null;
        _controller.add(RfidTag(epc: epc, rssi: rssi));
      }
    });
    await _method.invokeMethod('init');
  }

  Future<void> startInventory() async {
    await init();
    await _method.invokeMethod('startInventory');
  }

  Future<void> stopInventory() async {
    await init();
    await _method.invokeMethod('stopInventory');
  }

  Future<void> setPower(int power) async {
    await init();
    await _method.invokeMethod('setPower', {'power': power});
  }

  /// Starts UHF inventory, returns the first decoded tag, or `null` on timeout.
  /// Always stops inventory in a `finally` block.
  Future<RfidTag?> scanSingle({Duration? timeout}) async {
    final t = timeout ?? defaultScanTimeout;
    await init();
    try {
      await startInventory();
      final tag = await onTagRead.first.timeout(t);
      return tag;
    } on TimeoutException {
      return null;
    } finally {
      await stopInventory();
    }
  }

  Future<void> dispose() async {
    await _sub?.cancel();
    await _controller.close();
  }
}
