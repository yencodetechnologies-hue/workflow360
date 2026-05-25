// lib/services/product_api.dart

import '../models/product.dart';
import 'api_client.dart';

class ProductApiException implements Exception {
  ProductApiException(this.message);
  final String message;
  @override
  String toString() => message;
}

Future<void> assignTag({
  required String productId,
  required String tagId,
}) async {
  try {
    final data = await ApiClient.post('/products/assign-tag', body: {
      'productId': productId,
      'tagId': tagId.trim(),
    });
    if (data is Map) {
      final status = data['status'] as String?;
      if (status == 'error' || status == 'not_found' || status == 'conflict') {
        throw ProductApiException(
          data['message'] as String? ?? 'Assign tag failed',
        );
      }
    }
  } on ApiException catch (e) {
    throw ProductApiException(e.message);
  }
}

Future<List<Product>> fetchProducts() async {
  try {
    final data = await ApiClient.get('/products');
    if (data is! List) throw ProductApiException('Expected JSON array from /products');
    final list = <Product>[];
    for (final item in data) {
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
  } on ApiException catch (e) {
    throw ProductApiException(e.message);
  }
}

class ProductAdminApi {
  static Future<Product> createProduct(Map<String, dynamic> body) async {
    final data = await ApiClient.post('/products', body: body);
    return Product.fromWorkflow360Json(data as Map<String, dynamic>);
  }

  static Future<Product> updateProduct(String id, Map<String, dynamic> body) async {
    final data = await ApiClient.put('/products/$id', body: body);
    return Product.fromWorkflow360Json(data as Map<String, dynamic>);
  }

  static Future<void> deleteProduct(String id) async {
    await ApiClient.delete('/products/$id');
  }

  static Future<String> uploadImage(List<int> bytes, String filename) async {
    return ApiClient.uploadProductImage(bytes, filename);
  }
}
