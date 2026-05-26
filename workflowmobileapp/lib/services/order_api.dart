// lib/services/order_api.dart

import 'api_client.dart';

class OrderRow {
  final String id;
  final String customerName;
  final String? siteName;
  final String? siteAddress;
  final DateTime deliveryAt;
  final String status;
  final String? fromGodownId;

  OrderRow({
    required this.id,
    required this.customerName,
    this.siteName,
    this.siteAddress,
    required this.deliveryAt,
    required this.status,
    this.fromGodownId,
  });

  factory OrderRow.fromJson(Map<String, dynamic> j) => OrderRow(
        id: j['id'] as String,
        customerName: j['customerName'] as String,
        siteName: j['siteName'] as String?,
        siteAddress: j['siteAddress'] as String?,
        deliveryAt: DateTime.parse(j['deliveryAt'] as String),
        status: j['status'] as String,
        fromGodownId: j['fromGodownId'] as String?,
      );
}

class OrderApi {
  static Future<List<OrderRow>> listOrders({int limit = 200}) async {
    final data = await ApiClient.get('/orders?limit=$limit');
    return (data as List).map((e) => OrderRow.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<String> createOrder({
    required String customerName,
    required String deliveryAt,
    required String fromGodownId,
    String? siteName,
  }) async {
    final data = await ApiClient.post('/orders', {
      'customerName': customerName,
      'deliveryAt': deliveryAt,
      'fromGodownId': fromGodownId,
      if (siteName != null) 'siteName': siteName,
      'lines': <dynamic>[],
    });
    return (data as Map<String, dynamic>)['id'] as String;
  }
}
