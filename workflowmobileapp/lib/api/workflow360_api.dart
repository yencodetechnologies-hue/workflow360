import 'package:dio/dio.dart';
import 'package:workflow360_rfid_app/api/api_config.dart';
import 'package:workflow360_rfid_app/api/api_models.dart';

class Workflow360Api {
  final Dio _dio;

  Workflow360Api({Dio? dio})
      : _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: ApiConfig.baseUrl,
                connectTimeout: const Duration(seconds: 15),
                receiveTimeout: const Duration(seconds: 30),
                sendTimeout: const Duration(seconds: 30),
                headers: {'Accept': 'application/json'},
              ),
            );

  Future<List<Product>> fetchProducts() async {
    final res = await _dio.get('/products');
    final list = _expectList(res.data);
    return list
        .whereType<Map>()
        .map((e) => Product.fromJson(e.map((k, v) => MapEntry(k.toString(), v))))
        .toList();
  }

  Future<AssignTagResult> assignTag(AssignTagRequest req) async {
    final res = await _dio.post('/products/assign-tag', data: req.toJson());
    final data = _expectMap(res.data);
    return AssignTagResult.fromJson(data);
  }

  Future<AssignTagResult> unassignTag(UnassignTagRequest req) async {
    final res = await _dio.post('/products/unassign-tag', data: req.toJson());
    final data = _expectMap(res.data);
    return AssignTagResult.fromJson(data);
  }

  Future<ScanResult> scan(ScanRequest req) async {
    final res = await _dio.post('/products/scan', data: req.toJson());
    final data = _expectMap(res.data);
    return ScanResult.fromJson(data);
  }

  Future<BulkAssignResult> bulkAssign(BulkAssignRequest req) async {
    final res = await _dio.post('/products/bulk-assign', data: req.toJson());
    final data = _expectMap(res.data);
    return BulkAssignResult.fromJson(data);
  }

  Future<List<ScanHistoryEntry>> fetchScanHistory() async {
    final res = await _dio.get('/products/scan-history');
    final list = _expectList(res.data);
    return list
        .whereType<Map>()
        .map((e) =>
            ScanHistoryEntry.fromJson(e.map((k, v) => MapEntry(k.toString(), v))))
        .toList();
  }
}

Map<String, dynamic> _expectMap(Object? value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) {
    return value.map((k, v) => MapEntry(k.toString(), v));
  }
  throw FormatException('Expected object, got ${value.runtimeType}');
}

List _expectList(Object? value) {
  if (value is List) return value;
  throw FormatException('Expected array, got ${value.runtimeType}');
}
