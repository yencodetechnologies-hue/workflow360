// lib/services/auth_service.dart

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class AuthUser {
  final String id;
  final String role;
  final String? email;
  final String? loginId;
  final String? godownId;
  final String? godownName;
  final String? siteName;
  final String? siteAddress;
  final String? contactPhone;
  final String? contactName;

  AuthUser({
    required this.id,
    required this.role,
    this.email,
    this.loginId,
    this.godownId,
    this.godownName,
    this.siteName,
    this.siteAddress,
    this.contactPhone,
    this.contactName,
  });

  factory AuthUser.fromJson(Map<String, dynamic> j) => AuthUser(
        id: j['id'] as String,
        role: j['role'] as String,
        email: j['email'] as String?,
        loginId: j['loginId'] as String?,
        godownId: j['godownId'] as String?,
        godownName: j['godownName'] as String?,
        siteName: j['siteName'] as String?,
        siteAddress: j['siteAddress'] as String?,
        contactPhone: j['contactPhone'] as String?,
        contactName: j['contactName'] as String?,
      );
}

class AuthService {
  static const _tokenKey = 'wf360_token';
  static const _userKey = 'wf360_user';
  static const _roleKey = 'wf360_role';

  static Future<String?> getToken() async {
    final p = await SharedPreferences.getInstance();
    return p.getString(_tokenKey);
  }

  static Future<AuthUser?> getUser() async {
    final p = await SharedPreferences.getInstance();
    final raw = p.getString(_userKey);
    if (raw == null) return null;
    return AuthUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  static Future<String?> getSavedRole() async {
    final p = await SharedPreferences.getInstance();
    return p.getString(_roleKey);
  }

  static Future<void> saveSession(String token, AuthUser user, String role) async {
    final p = await SharedPreferences.getInstance();
    await p.setString(_tokenKey, token);
    await p.setString(_userKey, jsonEncode({
      'id': user.id,
      'role': user.role,
      'email': user.email,
      'loginId': user.loginId,
      'godownId': user.godownId,
      'godownName': user.godownName,
      'siteName': user.siteName,
      'siteAddress': user.siteAddress,
      'contactPhone': user.contactPhone,
      'contactName': user.contactName,
    }));
    await p.setString(_roleKey, role);
  }

  static Future<void> updateCachedUser(AuthUser user) async {
    final token = await getToken();
    final role = await getSavedRole();
    if (token != null && role != null) {
      await saveSession(token, user, role);
    }
  }

  static Future<void> clearSession() async {
    final p = await SharedPreferences.getInstance();
    await p.remove(_tokenKey);
    await p.remove(_userKey);
    await p.remove(_roleKey);
  }

  static Future<AuthUser> login({
    required String role,
    String? identifier,
    String? email,
    String? loginId,
    required String password,
  }) async {
    final body = <String, dynamic>{'password': password};
    if (loginId != null && loginId.trim().isNotEmpty) {
      body['loginId'] = loginId.trim();
    } else {
      final raw = (identifier ?? email ?? '').trim();
      if (raw.isEmpty) {
        throw Exception('Email or mobile number is required');
      }
      body['identifier'] = raw.contains('@') ? raw.toLowerCase() : raw;
    }

    final uri = apiUri('/auth/login');
    debugPrint('[Login] POST $uri');
    debugPrint(
      '[Login] Request body (password hidden): ${jsonEncode({...body, 'password': '***'})}',
    );

    http.Response res;
    try {
      res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );
    } on Exception catch (e, st) {
      debugPrint('[Login] Network error — $e');
      debugPrint('[Login] Stack trace:\n$st');
      throw Exception(loginNetworkErrorMessage(e));
    } catch (e, st) {
      debugPrint('[Login] Network error — $e');
      debugPrint('[Login] Stack trace:\n$st');
      throw Exception(loginNetworkErrorMessage(e));
    }

    debugPrint('[Login] Response status=${res.statusCode}');
    debugPrint('[Login] Response body=${res.body}');

    if (res.statusCode != 200) {
      String message = 'Login failed (${res.statusCode})';
      try {
        final err = jsonDecode(res.body);
        if (err is Map && err['message'] != null) {
          message = err['message'] as String;
        }
      } catch (e) {
        debugPrint('[Login] Could not parse error JSON — $e');
      }
      debugPrint('[Login] API error — $message');
      throw Exception(message);
    }

    final data = jsonDecode(res.body) as Map<String, dynamic>;
    final user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
    if (user.role != role) {
      debugPrint('[Login] Role mismatch — expected=$role actual=${user.role}');
      throw Exception('Account is not a $role user');
    }
    final token = data['token'] as String;
    await saveSession(token, user, role);
    debugPrint('[Login] Session saved — userId=${user.id} role=${user.role}');
    return user;
  }

  /// User-facing message for http/socket failures (DNS, offline, wrong API URL).
  static String loginNetworkErrorMessage(Object error) {
    final text = error.toString();
    if (text.contains('Failed host lookup') ||
        text.contains('SocketException') ||
        text.contains('Network is unreachable') ||
        text.contains('Connection refused') ||
        text.contains('Connection timed out')) {
      return 'Cannot reach the server at $kApiBaseUrl.\n'
          '• Check Wi‑Fi or mobile data on this device\n'
          '• For local backend, use your PC IP (not 127.0.0.1):\n'
          '  flutter run --dart-define=API_BASE_URL=http://YOUR_PC_IP:5000/workflow360/api';
    }
    return 'Network error. Please try again.';
  }
}
