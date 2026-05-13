import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:workflow360_rfid_app/features/products/products_controller.dart';

class TaggedProductsScreen extends ConsumerWidget {
  const TaggedProductsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(productsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tagged Products'),
      ),
      body: productsAsync.when(
        data: (products) {
          final tagged = products.where((p) => p.tagId != null && p.tagId!.isNotEmpty).toList();
          
          if (tagged.isEmpty) {
            return const Center(child: Text('No products with RFID tags found.'));
          }

          return Column(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                color: Colors.blue.withOpacity(0.1),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: Colors.blue),
                    const SizedBox(width: 12),
                    Text(
                      'Total Assigned Tags: ${tagged.length}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView.separated(
                  itemCount: tagged.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final p = tagged[index];
                    return ListTile(
                      title: Text(p.name),
                      subtitle: Text('ID: ${p.productId} | SKU: ${p.sku}\nTag: ${p.tagId}'),
                      isThreeLine: true,
                      trailing: const Icon(Icons.link, color: Colors.green),
                    );
                  },
                ),
              ),
            ],
          );
        },
        error: (e, _) => Center(child: Text('Error: $e')),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}
