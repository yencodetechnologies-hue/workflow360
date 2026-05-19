// lib/services/report_api.dart

import 'api_client.dart';

class StockRow {
  final String godownId;
  final String productId;
  final int qty;
  final String? particulars;
  final String? sku;

  StockRow({
    required this.godownId,
    required this.productId,
    required this.qty,
    this.particulars,
    this.sku,
  });

  factory StockRow.fromJson(Map<String, dynamic> j) => StockRow(
        godownId: j['godownId'] as String,
        productId: j['productId'] as String,
        qty: (j['qty'] as num?)?.toInt() ?? 0,
        particulars: j['particulars'] as String?,
        sku: j['sku'] as String?,
      );
}

class ReportApi {
  static Future<Map<String, dynamic>> dailyReport(String date) async {
    final data = await ApiClient.get('/reports/daily?date=${Uri.encodeComponent(date)}');
    return data as Map<String, dynamic>;
  }

  static Future<List<dynamic>> missingItems({int limit = 100}) async {
    final data = await ApiClient.get('/reports/missing?limit=$limit');
    return data as List;
  }

  static Future<List<StockRow>> stockReport({String? godownId}) async {
    final path = godownId != null
        ? '/reports/stock?godownId=${Uri.encodeComponent(godownId)}'
        : '/reports/stock';
    final data = await ApiClient.get(path);
    return (data as List).map((e) => StockRow.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<List<dynamic>> customerHistory(String q) async {
    final data = await ApiClient.get('/reports/customer-history?q=${Uri.encodeComponent(q)}');
    return data as List;
  }
}
