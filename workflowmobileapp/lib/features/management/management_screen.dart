import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:workflow360_rfid_app/api/api_models.dart';
import 'package:workflow360_rfid_app/api/providers.dart';
import 'package:workflow360_rfid_app/features/management/product_picker.dart';
import 'package:workflow360_rfid_app/features/products/products_controller.dart';
import 'package:workflow360_rfid_app/rfid/rfid_service.dart';

class ManagementScreen extends ConsumerStatefulWidget {
  const ManagementScreen({super.key});

  @override
  ConsumerState<ManagementScreen> createState() => _ManagementScreenState();
}

class _ManagementScreenState extends ConsumerState<ManagementScreen> {
  bool _busy = false;

  Future<void> _assignProduct() async {
    final product = await ProductPicker.pick(context);
    if (product == null) return;

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Please scan an RFID tag...')),
    );

    final rfid = ref.read(rfidServiceProvider);
    final tag = await rfid.scanSingle();
    if (tag == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Scan timed out or failed')),
        );
      }
      return;
    }

    setState(() => _busy = true);
    try {
      final api = ref.read(workflow360ApiProvider);
      final result = await api.assignTag(AssignTagRequest(
        productId: product.productId,
        tagId: tag.epc,
      ));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Success: ${result.message}')),
        );
        ref.invalidate(productsProvider);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _unassignTag() async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Please scan the RFID tag to unassign...')),
    );

    final rfid = ref.read(rfidServiceProvider);
    final tag = await rfid.scanSingle();
    if (tag == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Scan timed out or failed')),
        );
      }
      return;
    }

    setState(() => _busy = true);
    try {
      final api = ref.read(workflow360ApiProvider);
      final result = await api.unassignTag(UnassignTagRequest(tagId: tag.epc));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Success: ${result.message}')),
        );
        ref.invalidate(productsProvider);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _fetchProductTag() async {
    final product = await ProductPicker.pick(context);
    if (product == null) return;

    if (mounted) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(product.name),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Product ID: ${product.productId}'),
              const SizedBox(height: 8),
              Text('Tag ID: ${product.tagId ?? "Not Assigned"}'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        ),
      );
    }
  }

  Future<void> _identifyTag() async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Scanning tag to identify product...')),
    );

    final rfid = ref.read(rfidServiceProvider);
    final tag = await rfid.scanSingle();
    if (tag == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Scan timed out or failed')),
        );
      }
      return;
    }

    setState(() => _busy = true);
    try {
      final api = ref.read(workflow360ApiProvider);
      final result = await api.scan(ScanRequest(tagId: tag.epc));

      if (mounted) {
        if (result.product != null) {
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Matched Product'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Name: ${result.product!.name}'),
                  Text('ID: ${result.product!.productId}'),
                  Text('SKU: ${result.product!.sku}'),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Close'),
                ),
              ],
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No product matched this tag')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Management'),
        actions: [
          IconButton(
            onPressed: () => context.go('/products'),
            icon: const Icon(Icons.inventory),
            tooltip: 'Products',
          ),
        ],
      ),
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: GridView.count(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              children: [
                _ManagementButton(
                  icon: Icons.add_link,
                  label: 'Assign Product',
                  onTap: _assignProduct,
                  color: Colors.blue,
                ),
                _ManagementButton(
                  icon: Icons.link_off,
                  label: 'Delete Product ID\nfrom Tag',
                  onTap: _unassignTag,
                  color: Colors.red,
                ),
                _ManagementButton(
                  icon: Icons.search,
                  label: 'Fetch Product Tag',
                  onTap: _fetchProductTag,
                  color: Colors.green,
                ),
                _ManagementButton(
                  icon: Icons.rfid_fixed,
                  label: 'Identify Tag',
                  onTap: _identifyTag,
                  color: Colors.orange,
                ),
              ],
            ),
          ),
          if (_busy)
            const Center(
              child: Card(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ManagementButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;

  const _ManagementButton({
    required this.icon,
    required this.label,
    required this.onTap,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: color),
            const SizedBox(height: 12),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
