import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:workflow360_rfid_app/api/workflow360_api.dart';

final dioProvider = Provider<Dio>((ref) {
  return Dio();
});

final workflow360ApiProvider = Provider<Workflow360Api>((ref) {
  return Workflow360Api(dio: ref.watch(dioProvider));
});

