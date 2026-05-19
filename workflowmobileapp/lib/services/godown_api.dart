// lib/services/godown_api.dart

import 'api_client.dart';

class GodownRow {
  final String id;
  final String name;
  final String? code;
  final String? address;
  final String? mobile;
  final String? location;
  final String? city;
  final String? manager;

  GodownRow({
    required this.id,
    required this.name,
    this.code,
    this.address,
    this.mobile,
    this.location,
    this.city,
    this.manager,
  });

  factory GodownRow.fromJson(Map<String, dynamic> j) => GodownRow(
        id: j['id'] as String,
        name: j['name'] as String,
        code: j['code'] as String?,
        address: j['address'] as String?,
        mobile: j['mobile'] as String?,
        location: j['location'] as String?,
        city: j['city'] as String?,
        manager: j['manager'] as String?,
      );
}

class CatalogRow {
  final String productId;
  final bool enabled;
  final String? particulars;
  final String? sku;

  CatalogRow({
    required this.productId,
    required this.enabled,
    this.particulars,
    this.sku,
  });

  factory CatalogRow.fromJson(Map<String, dynamic> j) => CatalogRow(
        productId: j['productId'] as String,
        enabled: j['enabled'] as bool? ?? true,
        particulars: j['particulars'] as String?,
        sku: j['sku'] as String?,
      );
}

class QueueRow {
  final String id;
  final String deliveryNo;
  final String customerName;
  final String? siteName;
  final String? siteAddress;
  final String deliveryAt;
  final String? returnExpectedAt;
  final String status;
  final String fromGodownId;

  QueueRow({
    required this.id,
    required this.deliveryNo,
    required this.customerName,
    this.siteName,
    this.siteAddress,
    required this.deliveryAt,
    this.returnExpectedAt,
    required this.status,
    required this.fromGodownId,
  });

  factory QueueRow.fromJson(Map<String, dynamic> j) => QueueRow(
        id: j['id'] as String,
        deliveryNo: j['deliveryNo'] as String,
        customerName: j['customerName'] as String,
        siteName: j['siteName'] as String?,
        siteAddress: j['siteAddress'] as String?,
        deliveryAt: j['deliveryAt'] as String,
        returnExpectedAt: j['returnExpectedAt'] as String?,
        status: j['status'] as String,
        fromGodownId: j['fromGodownId'] as String,
      );
}

class GodownApi {
  static Future<List<GodownRow>> listGodowns() async {
    final data = await ApiClient.get('/godowns');
    return (data as List).map((e) => GodownRow.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<GodownRow> getGodown(String id) async {
    final data = await ApiClient.get('/godowns/$id');
    return GodownRow.fromJson(data as Map<String, dynamic>);
  }

  static Future<GodownRow> createGodown(Map<String, dynamic> body) async {
    final data = await ApiClient.post('/godowns', body: body);
    return GodownRow.fromJson(data as Map<String, dynamic>);
  }

  static Future<GodownRow> updateGodown(String id, Map<String, dynamic> body) async {
    final data = await ApiClient.patch('/godowns/$id', body: body);
    return GodownRow.fromJson(data as Map<String, dynamic>);
  }

  static Future<List<CatalogRow>> listProducts(String godownId) async {
    final data = await ApiClient.get('/godowns/$godownId/products');
    return (data as List).map((e) => CatalogRow.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<void> patchProduct(String godownId, String productId, bool enabled) async {
    await ApiClient.patch('/godowns/$godownId/products', body: {
      'productId': productId,
      'enabled': enabled,
    });
  }

  static Future<void> adjustInventory(String godownId, String productId, int qtyDelta, String? note) async {
    await ApiClient.post('/godowns/$godownId/inventory/adjust', body: {
      'productId': productId,
      'qtyDelta': qtyDelta,
      if (note != null && note.isNotEmpty) 'note': note,
    });
  }

  /// Enroll RFID tag and increase stock by 1 (atomic on server).
  static Future<Map<String, dynamic>> rfidIntake({
    required String godownId,
    required String tagId,
    required String productId,
    String? note,
  }) async {
    final data = await ApiClient.post('/godowns/$godownId/inventory/rfid-intake', body: {
      'tagId': tagId.trim(),
      'productId': productId,
      if (note != null && note.isNotEmpty) 'note': note,
    });
    return data as Map<String, dynamic>;
  }

  static Future<List<QueueRow>> queueByDate(String date) async {
    final data = await ApiClient.get('/godowns/queue?date=${Uri.encodeComponent(date)}');
    return (data as List).map((e) => QueueRow.fromJson(e as Map<String, dynamic>)).toList();
  }
}
