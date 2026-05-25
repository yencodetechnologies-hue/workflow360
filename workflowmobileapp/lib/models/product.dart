// lib/models/product.dart

class Product {
  /// MongoDB `_id` — required for godown inventory / RFID intake APIs.
  final String mongoId;
  /// Business id (`productId` field) or mongo id when no business id exists.
  final String id;
  final String sku;
  final String name;
  final String category;
  final double price;
  final String description;
  final String emoji;
  final String color;
  final String? imageUrl;
  /// Raw `rate` from API (e.g. `60/50/45`) for display.
  final String rateDisplay;

  const Product({
    this.mongoId = '',
    required this.id,
    required this.sku,
    required this.name,
    required this.category,
    required this.price,
    required this.description,
    required this.emoji,
    required this.color,
    this.imageUrl,
    this.rateDisplay = '',
  });

  factory Product.fromWorkflow360Json(Map<String, dynamic> json) {
    final mongoId = _idFromJson(json['_id']);
    final businessId = json['productId'] as String? ?? '';
    final id = businessId.isNotEmpty ? businessId : mongoId;
    final sku = json['sku'] as String? ?? '';
    final name = json['particulars'] as String? ?? '';
    final category = json['category'] as String? ?? '';
    final specification = json['specification'] as String? ?? '';
    final rateStr = json['rate']?.toString() ?? '';
    final price = _parseRateFirstNumber(rateStr);
    final rawImage = json['image_url'] as String?;
    final imageUrl =
        (rawImage != null && rawImage.isNotEmpty) ? rawImage : null;
    return Product(
      mongoId: mongoId,
      id: id.isNotEmpty ? id : sku,
      sku: sku,
      name: name,
      category: category,
      price: price,
      description: specification,
      emoji: '📦',
      color: _colorHexFromString(id.isNotEmpty ? id : sku),
      imageUrl: imageUrl,
      rateDisplay: rateStr,
    );
  }

  static String _idFromJson(dynamic value) {
    if (value == null) return '';
    if (value is String) return value;
    if (value is Map) {
      final oid = value[r'$oid'] ?? value['oid'];
      if (oid is String) return oid;
    }
    return value.toString();
  }

  static double _parseRateFirstNumber(String rate) {
    if (rate.isEmpty) return 0;
    final first = rate.split('/').first.trim();
    return double.tryParse(first) ?? 0;
  }

  static String _colorHexFromString(String key) {
    var h = 0x1a1a2e;
    for (var i = 0; i < key.length; i++) {
      h = ((h * 31) + key.codeUnitAt(i)) & 0xffffff;
    }
    return '#${h.toRadixString(16).padLeft(6, '0')}';
  }

  /// Typical Gen2 USER bank is 32–64 bytes; keep payload within a safe limit.
  static const int maxUserPayloadChars = 40;

  /// Encode product into a compact hex string to write onto RFID user memory.
  /// Format: SKU|NAME (ASCII → hex, padded to word boundary)
  String toHex() {
    var payload = '$sku|$name';
    if (payload.length > maxUserPayloadChars) {
      final maxName = (maxUserPayloadChars - sku.length - 1).clamp(0, name.length);
      payload = '$sku|${name.substring(0, maxName)}';
    }
    final bytes = payload.codeUnits;
    var hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    while (hex.length % 4 != 0) {
      hex += '00';
    }
    return hex.toUpperCase();
  }

  /// Decode a hex string back to the SKU for product lookup.
  static String hexToSku(String hex) {
    try {
      final bytes = <int>[];
      for (var i = 0; i < hex.length - 1; i += 2) {
        final b = int.parse(hex.substring(i, i + 2), radix: 16);
        if (b == 0) break;
        bytes.add(b);
      }
      final decoded = String.fromCharCodes(bytes);
      return decoded.contains('|') ? decoded.split('|').first : decoded;
    } catch (_) {
      return '';
    }
  }

  /// Decode hex to full payload string.
  static String hexToString(String hex) {
    try {
      final bytes = <int>[];
      for (var i = 0; i < hex.length - 1; i += 2) {
        final b = int.parse(hex.substring(i, i + 2), radix: 16);
        if (b == 0) break;
        bytes.add(b);
      }
      return String.fromCharCodes(bytes);
    } catch (_) {
      return hex;
    }
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'sku': sku,
        'name': name,
        'category': category,
        'price': price,
        'description': description,
        'emoji': emoji,
        'color': color,
        if (imageUrl != null) 'imageUrl': imageUrl,
        if (rateDisplay.isNotEmpty) 'rateDisplay': rateDisplay,
      };

  /// Id to send to godown / inventory APIs (always Mongo `_id` when known).
  String get apiProductId => mongoId.isNotEmpty ? mongoId : id;

  @override
  String toString() => 'Product($sku — $name)';

  /// UI: prefer API `rate` string when present.
  String get priceLabel =>
      rateDisplay.isNotEmpty ? rateDisplay : '\$${price.toStringAsFixed(2)}';
}

Product? findProductBySku(Iterable<Product> catalog, String? sku) {
  if (sku == null || sku.isEmpty) return null;
  for (final p in catalog) {
    if (p.sku == sku) return p;
  }
  return null;
}
