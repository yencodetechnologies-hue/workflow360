import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:workflow360_rfid_app/api/workflow360_api.dart';

import 'package:workflow360_rfid_app/api/api_config.dart';

InterceptorsWrapper _userFacingErrorInterceptor() {
  return InterceptorsWrapper(
    onError: (DioException err, ErrorInterceptorHandler handler) {
      final body = err.response?.data;
      if (body is Map) {
        final m = body['message']?.toString();
        if (m != null && m.isNotEmpty) {
          handler.next(
            DioException(
              requestOptions: err.requestOptions,
              response: err.response,
              type: err.type,
              error: err.error,
              stackTrace: err.stackTrace,
              message: m,
            ),
          );
          return;
        }
      }
      if (err.type == DioExceptionType.connectionTimeout ||
          err.type == DioExceptionType.receiveTimeout ||
          err.type == DioExceptionType.sendTimeout) {
        handler.next(
          DioException(
            requestOptions: err.requestOptions,
            response: err.response,
            type: err.type,
            error: err.error,
            stackTrace: err.stackTrace,
            message: 'Request timed out. Check your network.',
          ),
        );
        return;
      }
      if (err.type == DioExceptionType.connectionError) {
        handler.next(
          DioException(
            requestOptions: err.requestOptions,
            response: err.response,
            type: err.type,
            error: err.error,
            stackTrace: err.stackTrace,
            message: 'Could not reach the server. Check your connection.',
          ),
        );
        return;
      }
      handler.next(err);
    },
  );
}

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
      headers: {'Accept': 'application/json'},
    ),
  );
  dio.interceptors.add(_userFacingErrorInterceptor());
  return dio;
});

final workflow360ApiProvider = Provider<Workflow360Api>((ref) {
  return Workflow360Api(dio: ref.watch(dioProvider));
});

