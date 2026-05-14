import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:workflow360_rfid_app/features/products/product_detail_args.dart';
import 'package:workflow360_rfid_app/features/products/products_controller.dart';

class ProductsScreen extends ConsumerStatefulWidget {
  const ProductsScreen({super.key});

  @override
  ConsumerState<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends ConsumerState<ProductsScreen> {
  String _q = '';

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(productsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Products'),
        actions: [
          IconButton(
            onPressed: () => context.go('/management'),
            icon: const Icon(Icons.settings),
            tooltip: 'Management',
          ),
          IconButton(
            onPressed: () => context.go('/scan'),
            icon: const Icon(Icons.rss_feed),
            tooltip: 'Scan',
          ),
          IconButton(
            onPressed: () => context.go('/history'),
            icon: const Icon(Icons.history),
            tooltip: 'History',
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: const InputDecoration(
                labelText: 'Search',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (v) => setState(() => _q = v.trim().toLowerCase()),
            ),
          ),
          Expanded(
            child: productsAsync.when(
              data: (products) {
                final filtered = products.where((p) {
                  if (_q.isEmpty) return true;
                  return p.name.toLowerCase().contains(_q) ||
                      p.sku.toLowerCase().contains(_q) ||
                      (p.tagId ?? '').toLowerCase().contains(_q);
                }).toList();
                if (filtered.isEmpty) {
                  return const Center(child: Text('No products found'));
                }
                return RefreshIndicator(
                  onRefresh: () => ref.read(productsProvider.notifier).refresh(),
                  child: ListView.separated(
                    itemCount: filtered.length,
                    separatorBuilder: (context, index) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final p = filtered[index];
                      return ListTile(
                        title: Text(p.name),
                        subtitle: Text('SKU: ${p.sku}'
                            '${p.tagId == null || p.tagId!.isEmpty ? '' : '\nTag ID: ${p.tagId}'}'),
                        isThreeLine: p.tagId != null && p.tagId!.isNotEmpty,
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push(
                          '/products/${p.productId}',
                          extra: ProductDetailArgs(product: p),
                        ),
                      );
                    },
                  ),
                );
              },
              error: (e, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('Failed to load products:\n$e'),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: () => ref.read(productsProvider.notifier).refresh(),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
          ),
        ],
      ),
    );
  }
}

