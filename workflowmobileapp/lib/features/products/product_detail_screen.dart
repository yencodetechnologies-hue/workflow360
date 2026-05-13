import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:workflow360_rfid_app/api/api_models.dart';
import 'package:workflow360_rfid_app/api/providers.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  final Product product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  ConsumerState<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  late final TextEditingController _tagIdController;
  bool _busy = false;
  String? _status;

  @override
  void initState() {
    super.initState();
    _tagIdController = TextEditingController(text: widget.product.tagId ?? '');
  }

  @override
  void dispose() {
    _tagIdController.dispose();
    super.dispose();
  }

  Future<void> _scanFromScanScreen() async {
    final epc = await context.push<String>('/scan');
    if (!mounted) return;
    if (epc == null || epc.trim().isEmpty) return;
    _tagIdController.text = epc.trim();
    setState(() => _status = 'Selected Tag ID: ${epc.trim()}');
  }

  Future<void> _assignTag() async {
    final tagId = _tagIdController.text.trim();
    if (tagId.isEmpty) {
      setState(() => _status = 'Tag ID is required');
      return;
    }
    setState(() {
      _busy = true;
      _status = null;
    });
    try {
      final api = ref.read(workflow360ApiProvider);
      await api.assignTag(AssignTagRequest(
        productId: widget.product.productId,
        tagId: tagId,
      ));
      if (!mounted) return;
      setState(() => _status = 'Tag assigned successfully');
    } catch (e) {
      if (!mounted) return;
      setState(() => _status = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    return Scaffold(
      appBar: AppBar(
        title: Text(p.name),
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('SKU: ${p.sku}', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          Text('Product ID: ${p.productId}'),
          const SizedBox(height: 16),
          TextField(
            controller: _tagIdController,
            decoration: const InputDecoration(
              labelText: 'Tag ID',
              hintText: 'Scan or enter Tag ID',
            ),
            textInputAction: TextInputAction.done,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: _busy ? null : _scanFromScanScreen,
                  icon: const Icon(Icons.rss_feed),
                  label: const Text('Scan Tag'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: _busy ? null : _assignTag,
                  child: const Text('Assign Tag'),
                ),
              ),
            ],
          ),
          if (_status != null) ...[
            const SizedBox(height: 16),
            Text(_status!,
                style: TextStyle(color: Theme.of(context).colorScheme.primary)),
          ],
        ],
      ),
    );
  }
}
