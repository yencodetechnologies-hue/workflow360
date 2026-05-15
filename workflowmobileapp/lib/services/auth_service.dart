// lib/services/auth_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class AuthUser {
  final String id;
  final String role;
  final String? email;
  final String? loginId;
  final String? godownId;
  final String? siteName;

  AuthUser({
    required this.id,
    required this.role,
    this.email,
    this.loginId,
    this.godownId,
    this.siteName,
  });

  factory AuthUser.fromJson(Map<String, dynamic> j) => AuthUser(
        id: j['id'] as String,
        role: j['role'] as String,
        email: j['email'] as String?,
        loginId: j['loginId'] as String?,
        godownId: j['godownId'] as String?,
        siteName: j['siteName'] as String?,
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
      'siteName': user.siteName,
    }));
    await p.setString(_roleKey, role);
  }

  static Future<void> clearSession() async {
    final p = await SharedPreferences.getInstance();
    await p.remove(_tokenKey);
    await p.remove(_userKey);
    await p.remove(_roleKey);
  }

  static Future<AuthUser> login({
    required String role,
    String? email,
    String? loginId,
    required String password,
  }) async {
    final body = <String, dynamic>{'password': password};
    if (loginId != null && loginId.trim().isNotEmpty) {
      body['loginId'] = loginId.trim();
    } else {
      body['email'] = email!.trim().toLowerCase();
    }

    final res = await http.post(
      Uri.parse('$kApiBaseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );

    if (res.statusCode != 200) {
      final err = jsonDecode(res.body);
      throw Exception(err['message'] ?? 'Login failed');
    }

    final data = jsonDecode(res.body) as Map<String, dynamic>;
    final user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
    if (user.role != role) {
      throw Exception('Account is not a $role user');
    }
    final token = data['token'] as String;
    await saveSession(token, user, role);
    return user;
  }
}
