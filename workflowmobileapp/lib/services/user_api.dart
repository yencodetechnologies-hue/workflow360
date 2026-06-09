// lib/services/user_api.dart

import 'api_client.dart';

class UserRow {
  final String id;
  final String? email;
  final String role;
  final String? siteName;
  final String? siteAddress;
  final String? contactName;
  final String? contactPhone;
  final bool? active;

  UserRow({
    required this.id,
    this.email,
    required this.role,
    this.siteName,
    this.siteAddress,
    this.contactName,
    this.contactPhone,
    this.active,
  });

  factory UserRow.fromJson(Map<String, dynamic> j) => UserRow(
        id: j['id'] as String,
        email: j['email'] as String?,
        role: j['role'] as String,
        siteName: j['siteName'] as String?,
        siteAddress: j['siteAddress'] as String?,
        contactName: j['contactName'] as String?,
        contactPhone: j['contactPhone'] as String?,
        active: j['active'] as bool?,
      );
}

class UserApi {
  static Future<List<UserRow>> listUsers() async {
    final data = await ApiClient.get('/users');
    return (data as List).map((e) => UserRow.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<List<UserRow>> listBillers() async {
    final data = await ApiClient.get('/users/billers');
    return (data as List).map((e) => UserRow.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<UserRow> createBiller(Map<String, dynamic> body) async {
    final data = await ApiClient.post('/users/billers', body: body);
    return UserRow.fromJson(data as Map<String, dynamic>);
  }

  static Future<UserRow> createUser(Map<String, dynamic> body) async {
    final data = await ApiClient.post('/users', body: body);
    return UserRow.fromJson(data as Map<String, dynamic>);
  }

  static Future<void> resetPassword(String id, String password) async {
    await ApiClient.post('/users/$id/reset-password', body: {'password': password});
  }

  static Future<void> setActive(String id, bool active) async {
    await ApiClient.patch('/users/$id/active', body: {'active': active});
  }

  static Future<UserRow> updateUser(String id, Map<String, dynamic> body) async {
    final data = await ApiClient.patch('/users/$id', body: body);
    return UserRow.fromJson(data as Map<String, dynamic>);
  }

  static Future<Map<String, dynamic>> getMyProfile() async {
    final data = await ApiClient.get('/users/me');
    return data as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> updateMyProfile(Map<String, dynamic> body) async {
    final data = await ApiClient.put('/users/me', body: body);
    return data as Map<String, dynamic>;
  }
}
