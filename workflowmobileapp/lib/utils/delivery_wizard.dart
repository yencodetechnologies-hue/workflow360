import '../services/godown_api.dart';

String godownBranch(GodownRow g) {
  final city = g.city?.trim();
  if (city != null && city.isNotEmpty) return city;
  final loc = g.location?.trim();
  if (loc != null && loc.isNotEmpty) return loc;
  return 'Other';
}

String lineKey(String godownId, String productId) => '$godownId:$productId';

class StockedProduct {
  final CatalogRow catalog;
  final int stockQty;

  StockedProduct({required this.catalog, required this.stockQty});
}
