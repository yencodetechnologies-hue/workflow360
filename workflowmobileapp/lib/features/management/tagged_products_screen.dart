import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:workflow360_rfid_app/api/api_models.dart';
import 'package:workflow360_rfid_app/features/products/product_detail_args.dart';
import 'package:workflow360_rfid_app/features/products/products_controller.dart';

class TaggedProductsScreen extends ConsumerWidget {
  const TaggedProductsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(productsProvider);
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tagged products'),
      ),
      body: productsAsync.when(
        data: (products) {
          final tagged = products.where((p) => p.tagId != null && p.tagId!.isNotEmpty).toList();

          if (tagged.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'No products with RFID tags yet.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: scheme.onSurfaceVariant,
                      ),
                ),
              ),
            );
          }

          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Material(
                color: scheme.primaryContainer,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline_rounded, color: scheme.onPrimaryContainer),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          '${tagged.length} product${tagged.length == 1 ? '' : 's'} with tags',
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                color: scheme.onPrimaryContainer,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () => ref.read(productsProvider.notifier).refresh(),
                  child: ListView.separated(
                    padding: const EdgeInsets.only(bottom: 24),
                    itemCount: tagged.length,
                    separatorBuilder: (context, index) =>
                        Divider(height: 1, color: scheme.outlineVariant),
                    itemBuilder: (context, index) {
                      final p = tagged[index];
                      return _TaggedProductTile(product: p);
                    },
                  ),
                ),
              ),
            ],
          );
        },
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text('Error: $e', textAlign: TextAlign.center),
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class _TaggedProductTile extends StatelessWidget {
  const _TaggedProductTile({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      title: Text(product.name, maxLines: 2, overflow: TextOverflow.ellipsis),
      subtitle: Text(
        'ID ${product.productId} · SKU ${product.sku}\n${product.tagId}',
        style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
      ),
      isThreeLine: true,
      trailing: Icon(Icons.chevron_right_rounded, color: scheme.primary),
      onTap: () => context.push(
        '/products/${product.productId}',
        extra: ProductDetailArgs(product: product),
      ),
    );
  }
}
