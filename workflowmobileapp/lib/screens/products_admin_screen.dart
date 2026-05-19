// lib/screens/products_admin_screen.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../models/product.dart';
import '../services/product_api.dart';
import '../utils/app_theme.dart';

class ProductsAdminScreen extends StatefulWidget {
  const ProductsAdminScreen({super.key});

  @override
  State<ProductsAdminScreen> createState() => _ProductsAdminScreenState();
}

class _ProductsAdminScreenState extends State<ProductsAdminScreen> {
  List<Product> _products = [];
  bool _loading = true;
  String? _error;
  String _q = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await fetchProducts();
      setState(() => _products = list);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  List<Product> get _filtered {
    final s = _q.trim().toLowerCase();
    if (s.isEmpty) return _products;
    return _products.where((p) {
      return p.name.toLowerCase().contains(s) ||
          p.sku.toLowerCase().contains(s) ||
          p.id.toLowerCase().contains(s);
    }).toList();
  }

  Future<void> _showEdit([Product? existing]) async {
    final nameCtrl = TextEditingController(text: existing?.name ?? '');
    final skuCtrl = TextEditingController(text: existing?.sku ?? '');
    final catCtrl = TextEditingController(text: existing?.category ?? '');
    final sNoCtrl = TextEditingController(text: existing?.id ?? '');
    String? imageUrl = existing?.imageUrl;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDlg) => AlertDialog(
          title: Text(existing == null ? 'Add product' : 'Edit product'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: sNoCtrl, decoration: const InputDecoration(labelText: 'S.No *')),
                TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Particulars *')),
                TextField(controller: skuCtrl, decoration: const InputDecoration(labelText: 'SKU')),
                TextField(controller: catCtrl, decoration: const InputDecoration(labelText: 'Category')),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: () async {
                    final picker = ImagePicker();
                    final file = await picker.pickImage(source: ImageSource.gallery);
                    if (file == null) return;
                    final bytes = await file.readAsBytes();
                    final url = await ProductAdminApi.uploadImage(bytes, file.name);
                    setDlg(() => imageUrl = url);
                  },
                  icon: const Icon(Icons.image),
                  label: Text(imageUrl == null ? 'Upload image' : 'Image uploaded'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Save')),
          ],
        ),
      ),
    );
    if (ok != true || !mounted) return;
    try {
      final sNo = sNoCtrl.text.trim().isNotEmpty
          ? sNoCtrl.text.trim()
          : '${DateTime.now().millisecondsSinceEpoch}';
      final body = {
        's_no': sNo,
        'particulars': nameCtrl.text.trim(),
        'sku': skuCtrl.text.trim().isNotEmpty ? skuCtrl.text.trim() : 'SKU-$sNo',
        'category': catCtrl.text.trim().isNotEmpty ? catCtrl.text.trim() : 'General',
        if (imageUrl != null) 'image_path': imageUrl,
      };
      if (existing == null) {
        await ProductAdminApi.createProduct(body);
      } else {
        await ProductAdminApi.updateProduct(existing.id, body);
      }
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _delete(Product p) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete product?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ProductAdminApi.deleteProduct(p.id);
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(hintText: 'Search products…', prefixIcon: Icon(Icons.search)),
                  onChanged: (v) => setState(() => _q = v),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(onPressed: () => _showEdit(), icon: const Icon(Icons.add)),
              IconButton.outlined(onPressed: () => context.push('/rfid'), icon: const Icon(Icons.nfc)),
            ],
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
              : _error != null
                  ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.red)))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        itemCount: _filtered.length,
                        itemBuilder: (_, i) {
                          final p = _filtered[i];
                          return Card(
                            color: AppColors.card,
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              title: Text(p.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: Text('${p.sku} · ${p.category}'),
                              trailing: PopupMenuButton(
                                itemBuilder: (_) => [
                                  const PopupMenuItem(value: 'edit', child: Text('Edit')),
                                  const PopupMenuItem(value: 'delete', child: Text('Delete')),
                                  const PopupMenuItem(value: 'rfid', child: Text('Assign RFID tag')),
                                ],
                                onSelected: (v) {
                                  if (v == 'edit') _showEdit(p);
                                  if (v == 'delete') _delete(p);
                                  if (v == 'rfid') context.push('/rfid');
                                },
                              ),
                            ),
                          );
                        },
                      ),
                    ),
        ),
      ],
    );
  }
}
