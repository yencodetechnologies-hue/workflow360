import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:workflow360_rfid_app/api/workflow360_api.dart';

import 'package:workflow360_rfid_app/api/api_config.dart';

final dioProvider = Provider<Dio>((ref) {
  return Dio(BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 30),
    sendTimeout: const Duration(seconds: 30),
    headers: {'Accept': 'application/json'},
  ));
});

final workflow360ApiProvider = Provider<Workflow360Api>((ref) {
  return Workflow360Api(dio: ref.watch(dioProvider));
});

