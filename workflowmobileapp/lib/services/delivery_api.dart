// lib/services/delivery_api.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'auth_service.dart';

class DeliveryRow {
  final String id;
  final String deliveryNo;
  final String customerName;
  final String status;
  final String? vehicleLabel;
  final DateTime deliveryAt;

  DeliveryRow({
    required this.id,
    required this.deliveryNo,
    required this.customerName,
    required this.status,
    this.vehicleLabel,
    required this.deliveryAt,
  });

  factory DeliveryRow.fromJson(Map<String, dynamic> j) => DeliveryRow(
        id: j['id'] as String,
        deliveryNo: j['deliveryNo'] as String,
        customerName: j['customerName'] as String,
        status: j['status'] as String,
        vehicleLabel: j['vehicleLabel'] as String?,
        deliveryAt: DateTime.parse(j['deliveryAt'] as String),
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
    required this.totalRequired,
  });

  factory DeliveryDetail.fromJson(Map<String, dynamic> j) {
    final sp = j['scanProgress'] as Map<String, dynamic>?;
    final dispatch = sp?['dispatch'] as Map<String, dynamic>?;
    final pickup = sp?['pickup'] as Map<String, dynamic>?;
    final deliver = sp?['deliver'] as Map<String, dynamic>?;
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
      totalRequired: (dispatch?['totalRequired'] as num?)?.toInt() ?? 0,
    );
  }
}

class DeliveryApi {
  static Future<Map<String, String>> _headers() async {
    final token = await AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<List<DeliveryRow>> listDeliveries() async {
    final res = await http.get(
      Uri.parse('$kApiBaseUrl/deliveries?limit=100'),
      headers: await _headers(),
    );
    if (res.statusCode != 200) {
      final err = jsonDecode(res.body);
      throw Exception(err['message'] ?? 'Failed to load deliveries');
    }
    final list = jsonDecode(res.body) as List;
    return list.map((e) => DeliveryRow.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<DeliveryDetail> getDelivery(String id) async {
    final res = await http.get(
      Uri.parse('$kApiBaseUrl/deliveries/$id'),
      headers: await _headers(),
    );
    if (res.statusCode != 200) {
      final err = jsonDecode(res.body);
      throw Exception(err['message'] ?? 'Failed to load delivery');
    }
    return DeliveryDetail.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  static Future<void> scan(String deliveryId, String action, String tagId) async {
    final path = switch (action) {
      'dispatch' => 'dispatch-scan',
      'pickup' => 'pickup-scan',
      'deliver' => 'deliver-scan',
      'return' => 'return-scan',
      _ => 'dispatch-scan',
    };
    final res = await http.post(
      Uri.parse('$kApiBaseUrl/deliveries/$deliveryId/$path'),
      headers: await _headers(),
      body: jsonEncode({'tagId': tagId.trim()}),
    );
    if (res.statusCode != 200) {
      final err = jsonDecode(res.body);
      throw Exception(err['message'] ?? 'Scan failed');
    }
  }

  static Future<void> vehicleVerify(String deliveryId, String vehicleNumber) async {
    final res = await http.post(
      Uri.parse('$kApiBaseUrl/deliveries/$deliveryId/vehicle-verify'),
      headers: await _headers(),
      body: jsonEncode({'vehicleNumber': vehicleNumber.trim()}),
    );
    if (res.statusCode != 200) {
      final err = jsonDecode(res.body);
      throw Exception(err['message'] ?? 'Vehicle verify failed');
    }
  }
}
