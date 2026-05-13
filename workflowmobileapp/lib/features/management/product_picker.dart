import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:workflow360_rfid_app/api/api_models.dart';
import 'package:workflow360_rfid_app/features/products/products_controller.dart';

class ProductPicker extends ConsumerStatefulWidget {
  const ProductPicker({super.key});

  static Future<Product?> pick(BuildContext context) {
    return showModalBottomSheet<Product>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => const ProductPicker(),
    );
  }

  @override
  ConsumerState<ProductPicker> createState() => _ProductPickerState();
}

class _ProductPickerState extends ConsumerState<ProductPicker> {
  String _q = '';

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(productsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Product'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search product...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: (v) => setState(() => _q = v.trim().toLowerCase()),
            ),
          ),
        ),
      ),
      body: productsAsync.when(
        data: (products) {
          final filtered = products.where((p) {
            if (_q.isEmpty) return true;
            return p.name.toLowerCase().contains(_q) ||
                p.productId.toLowerCase().contains(_q) ||
                p.sku.toLowerCase().contains(_q);
          }).toList();

          if (filtered.isEmpty) {
            return const Center(child: Text('No products found'));
          }

          return ListView.separated(
            itemCount: filtered.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final p = filtered[index];
              return ListTile(
                title: Text(p.name),
                subtitle: Text('ID: ${p.productId} | SKU: ${p.sku}'),
                onTap: () => Navigator.pop(context, p),
              );
            },
          );
        },
        error: (e, _) => Center(child: Text('Error: $e')),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}
