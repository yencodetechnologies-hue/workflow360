import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:workflow360_rfid_app/api/api_models.dart';
import 'package:workflow360_rfid_app/api/providers.dart';

final productsProvider =
    AsyncNotifierProvider<ProductsController, List<Product>>(ProductsController.new);

class ProductsController extends AsyncNotifier<List<Product>> {
  @override
  Future<List<Product>> build() async {
    final api = ref.watch(workflow360ApiProvider);
    return api.fetchProducts();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(build);
  }
}

