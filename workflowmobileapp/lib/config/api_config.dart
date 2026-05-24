// lib/config/api_config.dart

/// Workflow360 API root (no trailing slash).
/// Override (physical device — use your PC LAN IP, not 127.0.0.1):
/// flutter run --dart-define=API_BASE_URL=http://192.168.1.10:5000/workflow360/api
const String kApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://workflow360.octosofttechnologies.in/workflow360/api',
);

Uri apiUri(String path) {
  final p = path.startsWith('/') ? path : '/$path';
  return Uri.parse('$kApiBaseUrl$p');
}

Uri get productsUri => apiUri('/products');
Uri get assignTagUri => apiUri('/products/assign-tag');
