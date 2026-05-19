// lib/config/api_config.dart

/// Workflow360 API root (no trailing slash).
/// Override: flutter run --dart-define=API_BASE_URL=http://127.0.0.1:5001/workflow360/api
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
