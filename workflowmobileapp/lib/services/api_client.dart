// lib/services/api_client.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'auth_service.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.status});
  final String message;
  final int? status;

  @override
  String toString() => message;
}

class ApiClient {
  static Future<Map<String, String>> _headers({bool json = true}) async {
    final token = await AuthService.getToken();
    final h = <String, String>{};
    if (json) h['Content-Type'] = 'application/json';
    if (token != null) h['Authorization'] = 'Bearer $token';
    return h;
  }

  static Never _throw(http.Response res) {
    try {
      final data = jsonDecode(res.body);
      if (data is Map && data['message'] != null) {
        throw ApiException(data['message'] as String, status: res.statusCode);
      }
    } on ApiException {
      rethrow;
    } catch (_) {}
    throw ApiException(res.reasonPhrase ?? 'Request failed', status: res.statusCode);
  }

  static Future<dynamic> get(String path) async {
    final res = await http.get(apiUri(path), headers: await _headers());
    if (res.statusCode == 401) await AuthService.clearSession();
    if (res.statusCode != 200) _throw(res);
    return res.body.isEmpty ? null : jsonDecode(res.body);
  }

  static Future<dynamic> post(String path, {Object? body}) async {
    final res = await http.post(
      apiUri(path),
      headers: await _headers(),
      body: body == null ? null : jsonEncode(body),
    );
    if (res.statusCode == 401) await AuthService.clearSession();
    if (res.statusCode != 200 && res.statusCode != 201) _throw(res);
    return res.body.isEmpty ? null : jsonDecode(res.body);
  }

  static Future<dynamic> patch(String path, {Object? body}) async {
    final res = await http.patch(
      apiUri(path),
      headers: await _headers(),
      body: body == null ? null : jsonEncode(body),
    );
    if (res.statusCode == 401) await AuthService.clearSession();
    if (res.statusCode != 200) _throw(res);
    return res.body.isEmpty ? null : jsonDecode(res.body);
  }

  static Future<dynamic> put(String path, {Object? body}) async {
    final res = await http.put(
      apiUri(path),
      headers: await _headers(),
      body: body == null ? null : jsonEncode(body),
    );
    if (res.statusCode == 401) await AuthService.clearSession();
    if (res.statusCode != 200) _throw(res);
    return res.body.isEmpty ? null : jsonDecode(res.body);
  }

  static Future<void> delete(String path) async {
    final res = await http.delete(apiUri(path), headers: await _headers());
    if (res.statusCode == 401) await AuthService.clearSession();
    if (res.statusCode != 200 && res.statusCode != 204) _throw(res);
  }

  static Future<String> uploadProductImage(List<int> bytes, String filename) async {
    final token = await AuthService.getToken();
    final req = http.MultipartRequest('POST', apiUri('/products/upload'));
    if (token != null) req.headers['Authorization'] = 'Bearer $token';
    req.files.add(http.MultipartFile.fromBytes('file', bytes, filename: filename));
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    if (res.statusCode != 200) _throw(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['url'] as String? ?? data['imageUrl'] as String? ?? '';
  }
}
