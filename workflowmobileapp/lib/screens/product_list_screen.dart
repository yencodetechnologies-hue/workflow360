// lib/screens/product_list_screen.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../services/app_state.dart';
import '../utils/app_theme.dart';
import '../widgets/shared_widgets.dart';

class ProductListScreen extends StatefulWidget {
  final String heading;
  final String description;

  const ProductListScreen({
    super.key,
    this.heading = 'Products',
    this.description =
        'Browse the catalog from the server. Tap a product to select it — open Scan new products to read or write tags.',
  });

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final state = context.read<AppState>();
      if (state.products.isEmpty && !state.productsLoading) {
        state.loadProducts();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, state, _) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ReaderStatusBar(state: state),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(widget.heading,
                  style: GoogleFonts.spaceGrotesk(
                      color: AppColors.text,
                      fontSize: 22,
                      fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(
                widget.description,
                style: GoogleFonts.inter(
                    color: AppColors.subtext, fontSize: 13),
              ),
              if (state.selectedProduct != null) ...[
                const SizedBox(height: 12),
                _SelectedBadge(product: state.selectedProduct!),
              ],
            ]),
          ),
          Expanded(child: _buildBody(context, state)),
        ],
      ),
    );
  }

  Widget _buildBody(BuildContext context, AppState state) {
    if (state.productsError != null && state.products.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                state.productsError!,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(color: AppColors.red, fontSize: 13),
              ),
              const SizedBox(height: 16),
              TextButton.icon(
                onPressed: () => state.loadProducts(),
                icon: const Icon(Icons.refresh, color: AppColors.cyan),
                label: Text('Retry',
                    style: GoogleFonts.inter(color: AppColors.cyan)),
              ),
            ],
          ),
        ),
      );
    }
    if (state.productsLoading && state.products.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (state.products.isEmpty) {
      return Center(
        child: Text(
          'No products loaded.',
          style: GoogleFonts.inter(color: AppColors.subtext, fontSize: 14),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () => state.loadProducts(silent: true),
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        itemCount: state.products.length,
        itemBuilder: (ctx, i) {
          final p = state.products[i];
          return _ProductCard(
            product: p,
            isSelected: state.selectedProduct?.id == p.id,
            onTap: () => state.selectProduct(p, openScanTab: true),
          );
        },
      ),
    );
  }
}

class _SelectedBadge extends StatelessWidget {
  final Product product;
  const _SelectedBadge({required this.product});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.green.withOpacity(0.1),
          border: Border.all(color: AppColors.green.withOpacity(0.4)),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.check_circle, color: AppColors.green, size: 14),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              'Selected: ${product.name}',
              style: GoogleFonts.inter(
                  color: AppColors.green,
                  fontWeight: FontWeight.w600,
                  fontSize: 12),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ]),
      );
}

class _ProductCard extends StatelessWidget {
  final Product product;
  final bool isSelected;
  final VoidCallback onTap;

  const _ProductCard({
    required this.product,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final accent = isSelected ? AppColors.cyan : AppColors.border;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.cyan.withOpacity(0.06)
              : AppColors.card,
          border: Border.all(color: accent, width: isSelected ? 1.5 : 1),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              clipBehavior: Clip.antiAlias,
              child: _thumb(product),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text(product.name,
                    style: GoogleFonts.spaceGrotesk(
                        color: isSelected ? AppColors.cyan : AppColors.text,
                        fontSize: 16,
                        fontWeight: FontWeight.bold)),
                const SizedBox(height: 3),
                Row(children: [
                  _tag(product.category),
                  const SizedBox(width: 6),
                  _tag(product.sku),
                ]),
                const SizedBox(height: 4),
                Text(product.description,
                    style: GoogleFonts.inter(
                        color: AppColors.subtext, fontSize: 11),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis),
              ]),
            ),
            const SizedBox(width: 10),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text(
                product.priceLabel,
                style: GoogleFonts.spaceGrotesk(
                    color: AppColors.green,
                    fontSize: 14,
                    fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isSelected ? AppColors.cyan : Colors.transparent,
                  border: Border.all(
                      color: isSelected ? AppColors.cyan : AppColors.border,
                      width: 2),
                ),
                child: isSelected
                    ? const Icon(Icons.check, size: 14, color: Colors.white)
                    : null,
              ),
            ]),
          ]),
        ),
      ),
    );
  }

  Widget _thumb(Product product) {
    final url = product.imageUrl;
    if (url != null && url.isNotEmpty) {
      return Image.network(
        url,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => Center(
          child: Text(product.emoji, style: const TextStyle(fontSize: 26)),
        ),
      );
    }
    return Center(
      child: Text(product.emoji, style: const TextStyle(fontSize: 26)),
    );
  }

  Widget _tag(String label) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(label,
            style: GoogleFonts.jetBrainsMono(
                color: AppColors.subtext, fontSize: 9)),
      );
}
