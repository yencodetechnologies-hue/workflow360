// lib/services/delivery_api.dart

import 'api_client.dart';
import '../config/api_config.dart';

class DeliveryRow {
  final String id;
  final String deliveryNo;
  final String customerName;
  final String status;
  final String? vehicleLabel;
  final String? siteName;
  final String? siteAddress;
  final DateTime deliveryAt;
  final String? fromGodownId;

  DeliveryRow({
    required this.id,
    required this.deliveryNo,
    required this.customerName,
    required this.status,
    this.vehicleLabel,
    this.siteName,
    this.siteAddress,
    required this.deliveryAt,
    this.fromGodownId,
  });

  factory DeliveryRow.fromJson(Map<String, dynamic> j) => DeliveryRow(
        id: j['id'] as String,
        deliveryNo: j['deliveryNo'] as String,
        customerName: j['customerName'] as String,
        status: j['status'] as String,
        vehicleLabel: j['vehicleLabel'] as String?,
        siteName: j['siteName'] as String?,
        siteAddress: j['siteAddress'] as String?,
        deliveryAt: DateTime.parse(j['deliveryAt'] as String),
        fromGodownId: j['fromGodownId'] as String?,
      );
}

class DeliveryLine {
  final String productId;
  final String? godownId;
  final String? godownName;
  final int qty;
  final String? particulars;
  final String? sku;
  final String? rate;
  final String? unit;

  DeliveryLine({
    required this.productId,
    this.godownId,
    this.godownName,
    required this.qty,
    this.particulars,
    this.sku,
    this.rate,
    this.unit,
  });

  factory DeliveryLine.fromJson(Map<String, dynamic> j) => DeliveryLine(
        productId: j['productId'] as String,
        godownId: j['godownId'] as String?,
        godownName: j['godownName'] as String?,
        qty: (j['qty'] as num).toInt(),
        particulars: j['particulars'] as String?,
        sku: j['sku'] as String?,
        rate: j['rate'] as String?,
        unit: j['unit'] as String?,
      );
}

class DeliveryFull {
  final String id;
  final String deliveryNo;
  final String customerName;
  final String status;
  final String? vehicleLabel;
  final String? siteName;
  final String? siteAddress;
  final String? contactPhone;
  final String? billerUserId;
  final String fromGodownId;
  final String deliveryAt;
  final String? returnExpectedAt;
  final List<DeliveryLine> lines;
  final String? deliveryVerifierName;
  final String? deliveryVerifiedAt;
  final String? billerReturnSubmittedAt;
  final num? damageTotal;
  final num? missingTotal;
  final String? deliveryVerifyUrl;
  final String? billerReturnUrl;

  DeliveryFull({
    required this.id,
    required this.deliveryNo,
    required this.customerName,
    required this.status,
    this.vehicleLabel,
    this.siteName,
    this.siteAddress,
    this.contactPhone,
    this.billerUserId,
    required this.fromGodownId,
    required this.deliveryAt,
    this.returnExpectedAt,
    required this.lines,
    this.deliveryVerifierName,
    this.deliveryVerifiedAt,
    this.billerReturnSubmittedAt,
    this.damageTotal,
    this.missingTotal,
    this.deliveryVerifyUrl,
    this.billerReturnUrl,
  });

  factory DeliveryFull.fromJson(Map<String, dynamic> j) => DeliveryFull(
        id: j['id'] as String,
        deliveryNo: j['deliveryNo'] as String,
        customerName: j['customerName'] as String,
        status: j['status'] as String,
        vehicleLabel: j['vehicleLabel'] as String?,
        siteName: j['siteName'] as String?,
        siteAddress: j['siteAddress'] as String?,
        contactPhone: j['contactPhone'] as String?,
        billerUserId: j['billerUserId'] as String?,
        fromGodownId: j['fromGodownId'] as String,
        deliveryAt: j['deliveryAt'] as String,
        returnExpectedAt: j['returnExpectedAt'] as String?,
        lines: (j['lines'] as List?)
                ?.map((e) => DeliveryLine.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [],
        deliveryVerifierName: j['deliveryVerifierName'] as String?,
        deliveryVerifiedAt: j['deliveryVerifiedAt'] as String?,
        billerReturnSubmittedAt: j['billerReturnSubmittedAt'] as String?,
        damageTotal: j['damageTotal'] as num?,
        missingTotal: j['missingTotal'] as num?,
        deliveryVerifyUrl: j['deliveryVerifyUrl'] as String?,
        billerReturnUrl: j['billerReturnUrl'] as String?,
      );
}

class DeliveryDetail {
  final String id;
  final String deliveryNo;
  final String customerName;
  final String status;
  final String? vehicleLabel;
  final bool vehicleVerified;
  final int dispatched;
  final int pickedUp;
  final int delivered;
  final int returned;
  final int totalRequired;

  DeliveryDetail({
    required this.id,
    required this.deliveryNo,
    required this.customerName,
    required this.status,
    this.vehicleLabel,
    required this.vehicleVerified,
    required this.dispatched,
    required this.pickedUp,
    required this.delivered,
    required this.returned,
    required this.totalRequired,
  });

  factory DeliveryDetail.fromJson(Map<String, dynamic> j) {
    final sp = j['scanProgress'] as Map<String, dynamic>?;
    final dispatch = sp?['dispatch'] as Map<String, dynamic>?;
    final pickup = sp?['pickup'] as Map<String, dynamic>?;
    final deliver = sp?['deliver'] as Map<String, dynamic>?;
    final ret = sp?['return'] as Map<String, dynamic>?;
    return DeliveryDetail(
      id: j['id'] as String,
      deliveryNo: j['deliveryNo'] as String,
      customerName: j['customerName'] as String,
      status: j['status'] as String,
      vehicleLabel: j['vehicleLabel'] as String?,
      vehicleVerified: j['vehicleVerifiedAt'] != null,
      dispatched: (dispatch?['scanned'] as num?)?.toInt() ?? (j['dispatchedTagIds'] as List?)?.length ?? 0,
      pickedUp: (pickup?['scanned'] as num?)?.toInt() ?? (j['pickedUpTagIds'] as List?)?.length ?? 0,
      delivered: (deliver?['scanned'] as num?)?.toInt() ?? (j['deliveredTagIds'] as List?)?.length ?? 0,
      returned: (ret?['scanned'] as num?)?.toInt() ?? (j['returnedTagIds'] as List?)?.length ?? 0,
      totalRequired: (dispatch?['totalRequired'] as num?)?.toInt() ?? 0,
    );
  }
}

class CreateDeliveryResult {
  final String id;
  final String deliveryNo;
  final String? deliveryVerifyUrl;
  final String? billerReturnUrl;

  CreateDeliveryResult({
    required this.id,
    required this.deliveryNo,
    this.deliveryVerifyUrl,
    this.billerReturnUrl,
  });

  factory CreateDeliveryResult.fromJson(Map<String, dynamic> j) => CreateDeliveryResult(
        id: j['id'] as String,
        deliveryNo: j['deliveryNo'] as String,
        deliveryVerifyUrl: j['deliveryVerifyUrl'] as String?,
        billerReturnUrl: j['billerReturnUrl'] as String?,
      );
}

class DeliveryApi {
  static Future<List<DeliveryRow>> listDeliveries({int limit = 200}) async {
    final data = await ApiClient.get('/deliveries?limit=$limit');
    return (data as List).map((e) => DeliveryRow.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<DeliveryDetail> getDelivery(String id) async {
    final data = await ApiClient.get('/deliveries/$id');
    return DeliveryDetail.fromJson(data as Map<String, dynamic>);
  }

  static Future<DeliveryFull> getDeliveryFull(String id) async {
    final data = await ApiClient.get('/deliveries/$id');
    return DeliveryFull.fromJson(data as Map<String, dynamic>);
  }

  static Future<CreateDeliveryResult> createDelivery(Map<String, dynamic> body) async {
    final data = await ApiClient.post('/deliveries', body: body);
    return CreateDeliveryResult.fromJson(data as Map<String, dynamic>);
  }

  static Future<void> scan(String deliveryId, String action, String tagId) async {
    final path = switch (action) {
      'dispatch' => 'dispatch-scan',
      'pickup' => 'pickup-scan',
      'deliver' => 'deliver-scan',
      'return' => 'return-scan',
      _ => 'dispatch-scan',
    };
    await ApiClient.post('/deliveries/$deliveryId/$path', body: {'tagId': tagId.trim()});
  }

  static Future<void> vehicleVerify(String deliveryId, String vehicleNumber) async {
    await ApiClient.post('/deliveries/$deliveryId/vehicle-verify', body: {
      'vehicleNumber': vehicleNumber.trim(),
    });
  }

  static Future<void> closeReturn(String deliveryId) async {
    await ApiClient.post('/deliveries/$deliveryId/close-return');
  }

  static Future<Map<String, dynamic>> regenerateTokens(String deliveryId) async {
    final data = await ApiClient.post('/deliveries/$deliveryId/regenerate-tokens');
    return data as Map<String, dynamic>;
  }

  static String challanPdfUrl(String deliveryId) => '${apiUri('/deliveries/$deliveryId/challan.pdf')}';

  static Future<void> enrollAssetTag({
    required String tagId,
    required String productId,
    String? godownId,
  }) async {
    await ApiClient.post('/deliveries/asset-tags/enroll', body: {
      'tagId': tagId.trim(),
      'productId': productId,
      if (godownId != null) 'godownId': godownId,
    });
  }
}
