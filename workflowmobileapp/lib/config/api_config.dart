// lib/config/api_config.dart

/// Workflow360 API root (no trailing slash).
const String kApiBaseUrl =
    'https://workflow360.octosofttechnologies.in/workflow360/api';

Uri get productsUri => Uri.parse('$kApiBaseUrl/products');
Uri get assignTagUri => Uri.parse('$kApiBaseUrl/products/assign-tag');
