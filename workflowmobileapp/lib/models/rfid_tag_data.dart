// lib/models/rfid_tag_data.dart

import 'package:intl/intl.dart';
import 'product.dart';

class RfidTagRecord {
  final String epc;
  final String? assignedSku;
  final String? assignedProductName;
  final String rawHex;
  final DateTime timestamp;
  final int rssi;
  final String pc;

  /// Whether the underlying user-bank read succeeded (false = RF/read error).
  final bool memoryReadOk;

  RfidTagRecord({
    required this.epc,
    this.assignedSku,
    this.assignedProductName,
    required this.rawHex,
    required this.timestamp,
    required this.rssi,
    required this.pc,
    this.memoryReadOk = true,
  });

  bool get hasProduct => assignedSku != null && assignedSku!.isNotEmpty;

  Product? resolveProduct(List<Product> catalog) =>
      findProductBySku(catalog, assignedSku);

  String get formattedTime =>
      DateFormat('HH:mm:ss dd/MM/yyyy').format(timestamp);

  String get shortEpc =>
      epc.length > 16 ? '${epc.substring(0, 8)}…${epc.substring(epc.length - 4)}' : epc;

  RfidTagRecord copyWith({
    String? assignedSku,
    String? assignedProductName,
    String? rawHex,
    int? rssi,
    bool? memoryReadOk,
  }) =>
      RfidTagRecord(
        epc: epc,
        assignedSku: assignedSku ?? this.assignedSku,
        assignedProductName: assignedProductName ?? this.assignedProductName,
        rawHex: rawHex ?? this.rawHex,
        timestamp: timestamp,
        rssi: rssi ?? this.rssi,
        pc: pc,
        memoryReadOk: memoryReadOk ?? this.memoryReadOk,
      );
}

/// Bulk scan-tab operation type.
enum BulkOperationKind { read, write, identify }

/// One row in a bulk operation report.
class BulkTagResultRow {
  final String epc;
  final bool success;
  final String message;
  final OperationResult? readWriteResult;
  final RfidTagRecord? record;

  BulkTagResultRow({
    required this.epc,
    required this.success,
    required this.message,
    this.readWriteResult,
    this.record,
  });

  String get shortEpc =>
      epc.length > 16 ? '${epc.substring(0, 8)}…${epc.substring(epc.length - 4)}' : epc;
}

/// Summary returned after Read all / Write all / Identify all.
class BulkOperationReport {
  final BulkOperationKind kind;
  final List<BulkTagResultRow> rows;

  BulkOperationReport({required this.kind, required this.rows});

  int get total => rows.length;
  int get successCount => rows.where((r) => r.success).length;
}

/// Scan result from a single inventory sweep
class ScanResult {
  final String epc;
  final int rssi;
  final String pc;

  /// How many times this EPC was reported in the current session (list stays one row per EPC).
  final int inventoryHits;

  ScanResult({
    required this.epc,
    required this.rssi,
    required this.pc,
    this.inventoryHits = 1,
  });
}

/// Result of a read/write/kill operation
class OperationResult {
  final bool success;
  final String message;
  final String? hexData;
  final String? decodedData;
  final String? error;

  OperationResult({
    required this.success,
    required this.message,
    this.hexData,
    this.decodedData,
    this.error,
  });
}
