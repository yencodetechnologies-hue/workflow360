class ApiEnvelope<T> {
  final bool success;
  final T data;
  final String message;

  const ApiEnvelope({
    required this.success,
    required this.data,
    required this.message,
  });
}

class Product {
  final String id;
  final String productId;
  final String name;
  final String sku;
  final String? tagId;

  const Product({
    required this.id,
    required this.productId,
    required this.name,
    required this.sku,
    this.tagId,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      productId: (json['productId'] ?? '').toString(),
      name: (json['particulars'] ?? json['name'] ?? '').toString(),
      sku: (json['sku'] ?? '').toString(),
      tagId: json['tagId']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'productId': productId,
        'particulars': name,
        'sku': sku,
        'tagId': tagId,
      };
}

class AssignTagRequest {
  final String productId;
  final String tagId;

  const AssignTagRequest({required this.productId, required this.tagId});

  Map<String, dynamic> toJson() => {
        'productId': productId,
        'tagId': tagId,
      };
}

class UnassignTagRequest {
  final String tagId;

  const UnassignTagRequest({required this.tagId});

  Map<String, dynamic> toJson() => {
        'tagId': tagId,
      };
}

class AssignTagResult {
  final String status;
  final String message;
  final Product? product;

  const AssignTagResult({
    required this.status,
    required this.message,
    this.product,
  });

  factory AssignTagResult.fromJson(Map<String, dynamic> json) {
    return AssignTagResult(
      status: (json['status'] ?? '').toString(),
      message: (json['message'] ?? '').toString(),
      product: json['product'] != null ? Product.fromJson(json['product']) : null,
    );
  }
}

class ScanRequest {
  final String tagId;

  const ScanRequest({
    required this.tagId,
  });

  Map<String, dynamic> toJson() => {
        'tagId': tagId,
      };
}

class ScanResult {
  final String status;
  final Product? product;

  const ScanResult({required this.status, this.product});

  factory ScanResult.fromJson(Map<String, dynamic> json) {
    return ScanResult(
      status: (json['status'] ?? '').toString(),
      product: json['product'] != null ? Product.fromJson(json['product']) : null,
    );
  }
}

class BulkAssignItem {
  final String productId;
  final String tagId;

  const BulkAssignItem({required this.productId, required this.tagId});

  Map<String, dynamic> toJson() => {'productId': productId, 'tagId': tagId};
}

class BulkAssignRequest {
  final List<BulkAssignItem> items;

  const BulkAssignRequest({required this.items});

  Map<String, dynamic> toJson() => items.map((e) => e.toJson()).toList();
}

class BulkAssignResult {
  final String status;
  final int? count;

  const BulkAssignResult({required this.status, this.count});

  factory BulkAssignResult.fromJson(Map<String, dynamic> json) {
    return BulkAssignResult(
      status: (json['status'] ?? '').toString(),
      count: (json['count'] as num?)?.toInt(),
    );
  }
}

class ScanHistoryEntry {
  final String id;
  final String productId;
  final String tagId;
  final String particulars;
  final String? rate;
  final DateTime createdAt;

  const ScanHistoryEntry({
    required this.id,
    required this.productId,
    required this.tagId,
    required this.particulars,
    this.rate,
    required this.createdAt,
  });

  factory ScanHistoryEntry.fromJson(Map<String, dynamic> json) {
    final tsRaw = (json['createdAt'] ?? '').toString();
    final ts = DateTime.tryParse(tsRaw) ?? DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
    return ScanHistoryEntry(
      id: (json['_id'] ?? '').toString(),
      productId: (json['productId'] ?? '').toString(),
      tagId: (json['tagId'] ?? '').toString(),
      particulars: (json['particulars'] ?? '').toString(),
      rate: json['rate']?.toString(),
      createdAt: ts,
    );
  }
}
