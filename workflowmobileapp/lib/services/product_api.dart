// lib/services/product_api.dart

import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/product.dart';

// Sends { productId, tagId } to POST /products/assign-tag.
// Throws [ProductApiException] on non-200 responses.
Future<void> assignTag({
  required String productId,
  required String tagId,
}) async {
  final response = await http
      .post(
        assignTagUri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'productId': productId, 'tagId': tagId}),
      )
      .timeout(const Duration(seconds: 30));
  if (response.statusCode == 200) return;
  final body = jsonDecode(response.body);
  final msg = (body is Map ? body['message'] : null) as String?;
  throw ProductApiException(msg ?? 'Assign failed (${response.statusCode})');
}

class ProductApiException implements Exception {
  ProductApiException(this.message);
  final String message;

  @override
  String toString() => message;
}

Future<List<Product>> fetchProducts() async {
  final response = await http
      .get(productsUri)
      .timeout(const Duration(seconds: 45));
  if (response.statusCode != 200) {
    throw ProductApiException(
        'Products request failed (${response.statusCode})');
  }
  final decoded = jsonDecode(response.body);
  if (decoded is! List) {
    throw ProductApiException('Expected JSON array from /products');
  }
  final list = <Product>[];
  for (final item in decoded) {
    if (item is! Map) continue;
    list.add(Product.fromWorkflow360Json(Map<String, dynamic>.from(item)));
  }
  int sortKey(Product p) {
    final tail = RegExp(r'(\d+)\s*$').firstMatch(p.id.trim());
    if (tail != null) return int.tryParse(tail.group(1)!) ?? 0;
    final skuNum = RegExp(r'(\d+)\s*$').firstMatch(p.sku.trim());
    if (skuNum != null) return int.tryParse(skuNum.group(1)!) ?? 0;
    return 0;
  }

  list.sort((a, b) => sortKey(a).compareTo(sortKey(b)));
  return list;
}
